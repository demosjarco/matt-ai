import { $, component$, useSignal, type Signal } from '@builder.io/qwik';
import { Form, server$ } from '@builder.io/qwik-city';
import { IDBMessages } from '../../../IDB/messages';
import type { IDBMessage, IDBMessageContent } from '../../../IDB/schemas/v2';
import { MessageProcessing } from '../../../aiBrain/messageProcessing.mjs';
import { useUserUpdateConversation } from '../../../routes/layout';
import ChatBox from './chatBox';
import Submit from './submit';

const messageGuard = server$(function (...args: Parameters<MessageProcessing['guard']>) {
	return new MessageProcessing(this.platform).guard(...args);
});
const messageActionDecide = server$(function (...args: Parameters<MessageProcessing['actionDecide']>) {
	return new MessageProcessing(this.platform).actionDecide(...args);
});

export default component$((props: { conversationId: Signal<number | undefined>; messageHistory: Record<NonNullable<IDBMessage['key']>, IDBMessage> }) => {
	const formRef = useSignal<HTMLFormElement>();
	const createConversation = useUserUpdateConversation();

	const sendMessage = $(
		(message: string) =>
			new Promise<IDBMessage>((mainResolve, mainReject) =>
				// Can't `Promise.all()` `saveMessage()` because race condition on auto increment key
				new IDBMessages()
					.saveMessage({
						conversation_id: props.conversationId.value,
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
								conversation_id: props.conversationId.value,
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
									.finally(() => {
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

													/**
													 * @todo typechat actions
													 */

													await Promise.all(actions).catch(mainReject);
												})
												.catch(mainReject);
										} else {
											props.messageHistory[aiMessage.key!]!.status = true;
											new IDBMessages().updateMessage({
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
									props.conversationId.value = message.conversation_id;
									resolve();
								})
								.catch(reject);
						} else {
							// Bad form
							props.messageHistory[Number.MAX_SAFE_INTEGER] = {
								key: Number.MAX_SAFE_INTEGER,
								message_id: Number.MAX_SAFE_INTEGER,
								conversation_id: props.conversationId.value ?? 0,
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
							conversation_id: props.conversationId.value ?? 0,
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
