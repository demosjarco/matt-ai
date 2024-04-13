import { $, component$, useSignal, useStore, useTask$ } from '@builder.io/qwik';
import { Form, server$, useLocation } from '@builder.io/qwik-city';
import { IDBMessages } from '../../../IDB/messages';
import type { IDBMessage, IDBMessageContent } from '../../../IDB/schemas/v2';
import { MessageProcessing } from '../../../aiBrain/messageProcessing.mjs';
import { useUserUpdateConversation } from '../../../routes/layout';
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

export default component$((props: { messageHistory: Record<NonNullable<IDBMessage['key']>, IDBMessage> }) => {
	const loc = useLocation();

	const formRef = useSignal<HTMLFormElement>();
	const createConversation = useUserUpdateConversation();
	const messageContext = useStore<MessageContext>({}, { deep: true });

	useTask$(({ track, cleanup }) => {
		track(() => formRef.value);

		// Prevent memory leak
		cleanup(() => {
			Object.keys(messageContext).forEach((message) => {
				delete messageContext[parseInt(message)];
			});
		});
	});

	const sendMessage = $(
		(message: string) =>
			new Promise<IDBMessage>((mainResolve, mainReject) =>
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
						props.messageHistory[userMessage.key!] = userMessage;
						mainResolve(userMessage);

						new IDBMessages()
							.saveMessage({
								// Can't compute to a variable otherwise it will return original conv id, not current one
								conversation_id: loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : undefined,
								role: 'assistant',
								status: false,
							})
							.then((aiMessage) => {
								// Add placeholder to UI
								props.messageHistory[aiMessage.key!] = aiMessage;
								props.messageHistory[aiMessage.key!]!.status = ['filtering'];

								let continueHumanMessage: boolean = false;
								// Check human message
								messageGuard(message)
									.then(async (userMessageGuard) => {
										// For process chain
										continueHumanMessage = userMessageGuard;
										// For UI
										props.messageHistory[userMessage.key!]!.safe = userMessageGuard;
										// Save to db
										await new IDBMessages().updateMessage({
											key: userMessage.key,
											safe: userMessageGuard,
										});
									})
									.catch(async (reason) => {
										// For process chain
										continueHumanMessage = true;
										// For UI
										props.messageHistory[userMessage.key!]!.safe = null;
										// Save to db
										await new IDBMessages().updateMessage({
											key: userMessage.key,
											safe: null,
										});
										console.warn('llamaguard', null, reason);
									})
									.finally(async () => {
										// Remove guard status
										if (Array.isArray(props.messageHistory[aiMessage.key!]!.status)) {
											props.messageHistory[aiMessage.key!]!.status = (props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str.toLowerCase() !== 'filtering'.toLowerCase());
										}

										if (continueHumanMessage) {
											// Add typechat status
											(props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('deciding');

											messageActionDecide(message)
												.then(async (userMessageAction) => {
													// Remove typechat status
													if (Array.isArray(props.messageHistory[aiMessage.key!]!.status)) {
														props.messageHistory[aiMessage.key!]!.status = (props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str.toLowerCase() !== 'deciding'.toLowerCase());
													}

													const actions: Promise<any>[] = [];

													const actionInsert: IDBMessageContent = {
														action: userMessageAction.action,
														model_used: userMessageAction.modelUsed,
													};

													// Add to UI
													props.messageHistory[aiMessage.key!]!.content.push(actionInsert);
													// Add to storage
													actions.push(
														new IDBMessages().updateMessage({
															key: aiMessage.key!,
															content: [actionInsert],
														}),
													);

													// Setup message context
													if (userMessageAction.action.previousMessageSearch || userMessageAction.action.webSearchTerms) {
														messageContext[aiMessage.key!] = {};
													}

													/**
													 * @todo typechat actions
													 */
													if (userMessageAction.action.webSearchTerms) {
														// Add web search status
														(props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('webSearching');

														actions.push(
															messageActionDdg(userMessageAction.action.webSearchTerms).then((ddg) => {
																// Remove web search status
																if (Array.isArray(props.messageHistory[aiMessage.key!]!.status)) {
																	props.messageHistory[aiMessage.key!]!.status = (props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str.toLowerCase() !== 'webSearching'.toLowerCase());
																}

																messageContext[aiMessage.key!]!.webSearchInfo = ddg;
															}),
														);
													}

													Promise.all(actions)
														.catch(mainReject)
														.finally(() => {
															// Add typing status
															(props.messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('typing');

															messageText('@cf/meta/llama-2-7b-chat-fp16', message, messageContext[aiMessage.key!])
																.then(async (chatResponse) => {
																	/**
																	 * @todo text generate
																	 */
																	const composedInsert: IDBMessageContent = {
																		text: '',
																		model_used: '@cf/meta/llama-2-7b-chat-fp16',
																	};
																	// Add to UI
																	const previousText = props.messageHistory[aiMessage.key!]!.content.findIndex((record) => 'text' in record);
																	if (previousText >= 0) {
																		props.messageHistory[aiMessage.key!]!.content[previousText] = composedInsert;
																	} else {
																		props.messageHistory[aiMessage.key!]!.content.push(composedInsert);
																	}

																	for await (const chatResponseChunk of chatResponse) {
																		composedInsert.text += chatResponseChunk ?? '';
																		// Add to UI
																		props.messageHistory[aiMessage.key!]!.content[props.messageHistory[aiMessage.key!]!.content.findIndex((record) => 'text' in record)] = composedInsert;
																	}

																	// Remove typing status
																	props.messageHistory[aiMessage.key!]!.status = true;

																	// Add to storage
																	await new IDBMessages().updateMessage({
																		key: aiMessage.key!,
																		content: [composedInsert],
																		status: true,
																	});
																})
																.catch(mainReject);
														});
												})
												.catch(mainReject);
										} else {
											props.messageHistory[aiMessage.key!]!.status = true;
											await new IDBMessages().updateMessage({
												key: aiMessage.key,
												status: true,
											});
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
			action={createConversation}
			ref={formRef}
			spaReset={true}
			onSubmitCompleted$={() =>
				new Promise<void>((resolve, reject) => {
					if (createConversation.status && createConversation.status >= 200 && createConversation.status < 300) {
						if (createConversation.value && createConversation.value.sanitizedMessage) {
							sendMessage(createConversation.value.sanitizedMessage)
								.then((message) => {
									window.history.replaceState({}, '', `/${['c', message.conversation_id].join('/')}`);
									resolve();
								})
								.catch(reject);
						} else {
							// Bad form
							props.messageHistory[Number.MAX_SAFE_INTEGER] = {
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
							reject();
						}
					} else {
						// Failed turnstile
						props.messageHistory[Number.MAX_SAFE_INTEGER] = {
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
						reject();
					}
				})
			}
			class="flex h-16 w-full flex-row items-center bg-gray-50 p-2 dark:bg-slate-800">
			<ChatBox />
			<Submit />
		</Form>
	);
});
