import { $, component$, useContext, useStore, useTask$ } from '@builder.io/qwik';
import { Form, server$, useLocation } from '@builder.io/qwik-city';
import { IDBConversations } from '../../../IDB/conversations';
import { IDBMessages } from '../../../IDB/messages';
import type { IDBMessage, IDBMessageContent } from '../../../IDB/schemas/v2';
import { MessageProcessing } from '../../../aiBrain/messageProcessing.mjs';
import { calculateActionTaken, retryWithSelectiveRemoval } from '../../../extras';
import { ConversationsContext, MessagesContext } from '../../../extras/context';
import { useFormSubmissionWithTurnstile } from '../../../routes/layout';
import type { MessageContext } from '../../../types';
import ChatBox from './chatBox';
import Submit from './submit';

const messageGuard = server$(function (...args: Parameters<MessageProcessing['guard']>) {
	return new MessageProcessing(this.platform).guard(...args);
});
const messageActionDecide = server$(function (...args: Parameters<MessageProcessing['actionDecide']>) {
	return new MessageProcessing(this.platform).actionDecide(...args);
});
const messageActionDdg = server$(function (...args: Parameters<MessageProcessing['ddg']>) {
	return new MessageProcessing(this.platform).ddg(...args);
});
const messageText = server$(async function* (...args: Parameters<MessageProcessing['textResponse']>) {
	for await (const chunk of new MessageProcessing(this.platform).textResponse(...args)) {
		yield chunk;
	}
});
const messageActionImage = server$(function (...args: Parameters<MessageProcessing['imageGenerate']>) {
	return new MessageProcessing(this.platform).imageGenerate(...args);
});

export default component$(() => {
	const loc = useLocation();
	const submitMessageWithTurnstile = useFormSubmissionWithTurnstile();

	const conversations = useContext(ConversationsContext);
	const messageHistory = useContext(MessagesContext);

	const messageContext = useStore<MessageContext>({}, { deep: true });

	useTask$(({ cleanup }) => {
		cleanup(() => {
			Object.keys(messageContext).forEach((message) => {
				delete messageContext[parseInt(message)];
			});
		});
	});

	const sendMessage = $(
		(message: string, cb: (conversation_id: IDBMessage['conversation_id']) => void) =>
			new Promise<void>((mainResolve, mainReject) =>
				// Can't `Promise.all()` `saveMessage()` because race condition on auto increment key
				new IDBMessages()
					.saveMessage({
						// Can't compute to a variable otherwise it will return original conv id, not current one
						conversation_id: loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : undefined,
						role: 'user',
						status: true,
						content: [
							{
								text: message,
								model_used: null,
							},
						],
					})
					.then((userMessage) => {
						messageHistory[userMessage.key!] = userMessage;
						cb(userMessage.conversation_id);

						Promise.all([
							new IDBConversations().getConversation({ key: userMessage.conversation_id }),
							new IDBMessages().saveMessage({
								// Can't compute to a variable otherwise it will return original conv id, not current one
								conversation_id: userMessage.conversation_id,
								role: 'assistant',
								status: false,
							}),
						])
							.then(([newConversation, aiMessage]) => {
								// Add new conversation to UI
								if (conversations.indexOf(newConversation) < 0) conversations.unshift(newConversation);

								// Add placeholder to UI
								messageHistory[aiMessage.key!] = aiMessage;
								messageHistory[aiMessage.key!]!.status = ['filtering'];

								// Check human message
								new Promise<void>((resolve1, reject1) =>
									messageGuard(message)
										.then((userMessageGuard) => {
											// For UI
											messageHistory[userMessage.key!]!.safe = userMessageGuard;
											// Save to db
											new IDBMessages()
												.updateMessage({
													key: userMessage.key,
													safe: userMessageGuard,
													status: messageHistory[aiMessage.key!]!.status,
												})
												.then(() => (userMessageGuard ? resolve1() : reject1()))
												.catch(mainReject);
										})
										.catch((reason) => {
											console.warn('llamaguard', null, reason);

											// For UI
											messageHistory[userMessage.key!]!.safe = null;
											// Save to db
											new IDBMessages()
												.updateMessage({
													key: userMessage.key,
													safe: null,
													status: messageHistory[aiMessage.key!]!.status,
												})
												.then(() => resolve1())
												.catch(mainReject);
										}),
								)
									// llamaguard pass
									.then(() => {
										// Add typechat status
										(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('deciding');

										messageActionDecide(message)
											.then((userMessageAction) => {
												// Remove typechat status
												if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
													messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'deciding');
												}

												const actions: Promise<any>[] = [];

												const actionInsert: IDBMessageContent = {
													action: userMessageAction.action,
													model_used: userMessageAction.modelUsed,
												};

												// Add to UI
												messageHistory[aiMessage.key!]!.content.push(actionInsert);
												// Add to storage
												actions.push(
													new IDBMessages().updateMessage({
														key: aiMessage.key!,
														content: [actionInsert],
														status: messageHistory[aiMessage.key!]!.status,
													}),
												);

												// Setup message context
												if (userMessageAction.action.previousMessageKeywordSearch || userMessageAction.action.webSearchTerms) {
													messageContext[aiMessage.key!] = {};
												}

												const previousMessages: Parameters<typeof messageText>[1] = [];
												if (userMessageAction.action.previousMessageKeywordSearch) {
													// Add history search status
													(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('historySearching');

													// Convert all search terms to lowercase for case-insensitive matching
													const normalizedSearchTerms = userMessageAction.action.previousMessageKeywordSearch.map((term) => term.toLowerCase());

													// Filter messages that match any of the search terms in their text content

													previousMessages.push(
														...Object.values(messageHistory)
															.filter((historyMessage) => historyMessage.message_id !== userMessage.message_id)
															.filter((historyMessage) => {
																// Assuming that 'content' can have multiple entries, we check each content entry if it's of type text
																return historyMessage.content.some((contentItem) => {
																	if (contentItem.text) {
																		// Normalize the text for case-insensitive search
																		const normalizedText = contentItem.text.toLowerCase();
																		// Check if any of the search terms are included in the text
																		return normalizedSearchTerms.some((term) => normalizedText.includes(term));
																	}
																	return false;
																});
															})
															.sort((a, b) => b.btime.getTime() - a.btime.getTime())
															// Reverse so that the oldest are first as chat conventions
															.reverse()
															.map((message) => {
																// Find the first text content item in the message
																const textContent = message.content.find((contentItem) => contentItem.text)?.text ?? 'Content not found';
																return {
																	role: message.role,
																	content: textContent,
																};
															}),
													);

													// Remove history search status
													if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
														messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'historySearching');
													}
												}

												if (userMessageAction.action.webSearchTerms) {
													// Add web search status
													(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('webSearching');

													actions.push(
														messageActionDdg(userMessageAction.action.webSearchTerms).then((ddg) => {
															// Remove web search status
															if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
																messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'webSearching');
															}

															messageContext[aiMessage.key!]!.webSearchInfo = ddg;
														}),
													);
												}
												/**
												 * @todo url browsing
												 * @link https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
												 * @link https://developers.cloudflare.com/workers/examples/websockets/#write-a-websocket-client
												 * @link https://github.com/cloudflare/workers-chat-demo/blob/master/src/chat.mjs
												 */
												/**
												 * @todo typechat translation
												 */

												Promise.all(actions)
													.catch(mainReject)
													.finally(() => {
														const finalActions: Promise<void>[] = [
															// Text write
															new Promise<void>((resolve, reject) => {
																// Add typing status
																(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('typing');

																const model: Parameters<typeof messageText>[0] = '@hf/thebloke/llama-2-13b-chat-awq';

																retryWithSelectiveRemoval(messageText, model, [...previousMessages, { role: 'user', content: message }], calculateActionTaken(userMessageAction.action), messageContext[aiMessage.key!])
																	.then(async (chatResponse) => {
																		/**
																		 * @todo text generate
																		 */
																		const composedInsert: IDBMessageContent = {
																			text: '',
																			model_used: model,
																		};

																		// Add to UI
																		// push() returns new length and since it's the last item, just subtract 1
																		const previousText = messageHistory[aiMessage.key!]!.content.push(composedInsert) - 1;

																		for await (const chatResponseChunk of chatResponse) {
																			composedInsert.text += chatResponseChunk ?? '';
																			// Add to UI
																			messageHistory[aiMessage.key!]!.content[previousText] = composedInsert;
																		}

																		// Cleanup whitespace
																		composedInsert.text = composedInsert.text?.trim();
																		messageHistory[aiMessage.key!]!.content[previousText] = composedInsert;

																		// Remove typing status
																		if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
																			messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'typing');
																		}

																		// Add to storage
																		new IDBMessages()
																			.updateMessage({
																				key: aiMessage.key!,
																				content: [composedInsert],
																				status: messageHistory[aiMessage.key!]!.status,
																			})
																			.then(() => resolve())
																			.catch(reject);
																	})
																	.catch(reject);
															}),
														];

														if (userMessageAction.action.imageGenerate) {
															finalActions.push(
																new Promise<void>((resolve, reject) => {
																	// Add image generating status
																	(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('imageGenerating');

																	messageActionImage(userMessageAction.action.imageGenerate!).then(({ raw, model }) => {
																		// Remove image generating status
																		if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
																			messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'imageGenerating');
																		}

																		// Parse back from `base64` (required as part of server <-serialization-> client)
																		const image = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));

																		const imageInsert: IDBMessageContent = {
																			image,
																			model_used: model as Parameters<Ai['run']>[0],
																		};
																		// Add to UI
																		messageHistory[aiMessage.key!]!.content.push(imageInsert);
																		// Add to storage
																		new IDBMessages()
																			.updateMessage({
																				key: aiMessage.key!,
																				content: [imageInsert],
																				status: messageHistory[aiMessage.key!]!.status,
																			})
																			.then(() => resolve())
																			.catch(reject);
																	});
																}),
															);
														}

														// Finally done with everything
														Promise.all(finalActions)
															.catch(mainReject)
															.finally(() => {
																// Remove all status
																messageHistory[aiMessage.key!]!.status = true;

																// Final save
																new IDBMessages()
																	.updateMessage({
																		key: aiMessage.key!,
																		status: true,
																	})
																	.then(() => mainResolve())
																	.catch(mainReject);
															});
													});
											})
											.catch(mainReject);
									})
									// llamaguard fail
									.catch(() => {
										messageHistory[aiMessage.key!]!.status = true;
										new IDBMessages()
											.updateMessage({
												key: aiMessage.key,
												status: true,
											})
											.then(() => mainResolve())
											.catch(mainReject);
									})
									.finally(() => {
										// Remove guard status
										if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
											messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'filtering');
										}
									});
							})
							.catch(mainReject);
					})
					.catch(mainReject),
			),
	);

	return (
		<Form
			action={submitMessageWithTurnstile}
			spaReset={true}
			onSubmitCompleted$={() =>
				new Promise<void>((resolve, reject) => {
					if (submitMessageWithTurnstile.status && submitMessageWithTurnstile.status >= 200 && submitMessageWithTurnstile.status < 300) {
						// Turnstile has been consumed, reset manually (doesn't automatically get reset due to SPA)
						window.turnstile.reset();

						if (submitMessageWithTurnstile.value && submitMessageWithTurnstile.value.sanitizedMessage) {
							sendMessage(submitMessageWithTurnstile.value.sanitizedMessage, (conversation_id) => {
								window.history.replaceState({}, '', `/${['c', conversation_id].join('/')}`);
							})
								.then(resolve)
								.catch(reject);
						} else {
							// Bad form
							messageHistory[Number.MAX_SAFE_INTEGER] = {
								key: Number.MAX_SAFE_INTEGER,
								message_id: Number.MAX_SAFE_INTEGER,
								// Can't compute to a variable otherwise it will return original conv id, not current one
								conversation_id: loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : 0,
								content_version: 1,
								btime: new Date(),
								role: 'system',
								status: true,
								content: [
									{
										text: 'Something went wrong with the bot verification. Humans, please refresh page. Bots, please go away',
										model_used: null,
									},
								],
								content_chips: [],
								content_references: [],
							};
						}
					} else {
						// Failed turnstile
						messageHistory[Number.MAX_SAFE_INTEGER] = {
							key: Number.MAX_SAFE_INTEGER,
							message_id: Number.MAX_SAFE_INTEGER,
							// Can't compute to a variable otherwise it will return original conv id, not current one
							conversation_id: loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : 0,
							content_version: 1,
							btime: new Date(),
							role: 'system',
							status: true,
							content: [
								{
									text: 'Bot verifcation failed. Humans, please refresh page. Bots, please go away',
									model_used: null,
								},
							],
							content_chips: [],
							content_references: [],
						};
					}
				})
			}
			class="flex h-16 w-full flex-row items-center bg-gray-50 p-2 dark:bg-slate-800">
			<ChatBox />
			<Submit />
		</Form>
	);
});
