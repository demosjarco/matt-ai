import { $, component$, useContext, useStore, useTask$ } from '@builder.io/qwik';
import { Form, useLocation } from '@builder.io/qwik-city';
import { IDBConversations } from '../../../IDB/conversations';
import { IDBMessages } from '../../../IDB/messages';
import type { IDBMessage, IDBMessageContent } from '../../../IDB/schemas/v3';
import { messageGuard, messageSummary, messageText } from '../../../aiBrain/messageProcessing';
import { ConversationsContext, MessagesContext } from '../../../extras/context';
import { useFormSubmissionWithTurnstile } from '../../../routes/layout';
import type { MessageContext } from '../../../types';
import ChatBox from './chatBox';
import Submit from './submit';

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
									.then(async () => {
										// Add typing status
										(messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).push('typing');

										const model: Parameters<typeof messageText>[0] = '@hf/nousresearch/hermes-2-pro-mistral-7b';
										messageText(model, [{ role: 'user', content: message }])
											.then(async (chatResponse) => {
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
												// Cleanup artifacts
												composedInsert.text = composedInsert.text?.replaceAll('<|im_start|>', '');
												composedInsert.text = composedInsert.text?.replaceAll('<|im_end|>', '');
												// Cleanup whitespace
												composedInsert.text = composedInsert.text?.trim();
												messageHistory[aiMessage.key!]!.content[previousText] = composedInsert;
												// Remove typing status
												if (Array.isArray(messageHistory[aiMessage.key!]!.status)) {
													messageHistory[aiMessage.key!]!.status = (messageHistory[aiMessage.key!]!.status as Exclude<IDBMessage['status'], boolean>).filter((str) => str !== 'typing');
												}
												// Add to storage
												return new IDBMessages().updateMessage({
													key: aiMessage.key!,
													content: [composedInsert],
													status: messageHistory[aiMessage.key!]!.status,
												});
											})
											.catch(mainReject)
											.finally(() => {
												// Remove all status
												messageHistory[aiMessage.key!]!.status = true;
												const messagesToSummary: string[] = [];
												const userTextContentIndex = messageHistory[userMessage.key!]!.content.findIndex((record) => 'text' in record);
												if (userTextContentIndex > -1) messagesToSummary.push(messageHistory[userMessage.key!]!.content[userTextContentIndex]!.text!);
												const aiTextContentIndex = messageHistory[aiMessage.key!]!.content.findIndex((record) => 'text' in record);
												if (aiTextContentIndex > -1) messagesToSummary.push(messageHistory[aiMessage.key!]!.content[aiTextContentIndex]!.text!);
												const savingPromises: Promise<any>[] = [
													new IDBMessages().updateMessage({
														key: aiMessage.key!,
														status: true,
													}),
												];
												if (messagesToSummary.length > 0) {
													savingPromises.push(
														messageSummary(messagesToSummary, '@cf/facebook/bart-large-cnn')
															.then((summary) => {
																const newName = summary.trim();
																const conversation = conversations.find((conversation) => conversation.key === (userMessage.conversation_id || aiMessage.conversation_id));
																if (conversation) {
																	// Change UI
																	conversation.name = newName;
																}
																// Change in storage
																return new IDBConversations().updateConversation({
																	key: userMessage.conversation_id || aiMessage.conversation_id,
																	name: summary,
																	ctime: new Date(),
																});
															})
															.catch(console.error),
													);
												}
												// Final save
												return Promise.allSettled(savingPromises)
													.then(() => mainResolve())
													.catch(mainReject);
											});
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
