import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Form, server$, type DocumentHead } from '@builder.io/qwik-city';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import { IDBMessages } from '../../IDB/messages';
import { MessageProcessing } from '../../aiBrain/messageProcessing.mjs';
import { getUserLocale, isLocalEdge, useConversationId, useUserUpdateConversation } from '../../routes/layout';
import type { IDBMessage } from '../../types';
import Message from './Message';

const preProcess = server$(function (message: Parameters<MessageProcessing['preProcess']>[0]) {
	return new MessageProcessing(this.platform).preProcess(message);
});

const serverConversationId = server$(function () {
	const id = this.params['conversationId'] ?? '';
	return isNaN(Number(id)) ? undefined : Number(id);
});

export default component$(() => {
	const isLocal = isLocalEdge();
	const userLocale = getUserLocale();
	const conversationId = useConversationId();
	const createConversation = useUserUpdateConversation();
	const formRef = useSignal<HTMLFormElement>();

	const messageHistory = useSignal<IDBMessage[]>([]);

	useVisibleTask$(async ({ track }) => {
		track(() => conversationId.value);

		if (!conversationId.value || isNaN(Number(conversationId.value))) {
			return;
		}

		const initialConversation = await new IDBMessages().getMessagesForConversation(Number(conversationId.value));
		console.debug('messages for convo', initialConversation);

		messageHistory.value = initialConversation;
	});

	const sendMessage = $(
		(message: string) =>
			new Promise<IDBMessage>(async (mainResolve, mainReject) => {
				// Run it in a `.all()` so that the promise chain stays alive until all finish, but don't wait to return promise
				Promise.all([
					new IDBMessages()
						.saveMessage({
							/**
							 * @todo fall back to server$ conversation id because signal isn't being updated
							 */
							conversation_id: conversationId.value.length > 0 ? Number(conversationId.value) : await serverConversationId(),
							role: 'user',
							content: [
								{
									text: message,
									model_used: null,
								},
							],
						})
						.then((fullMessage) => {
							messageHistory.value.push(fullMessage);
							mainResolve(fullMessage);
						})
						.catch(mainReject),
					new Promise<void>((resolve, reject) =>
						preProcess(message)
							.then(async (messageAction) =>
								new IDBMessages()
									.saveMessage({
										/**
										 * @todo fall back to server$ conversation id because signal isn't being updated
										 */
										conversation_id: conversationId.value.length > 0 ? Number(conversationId.value) : await serverConversationId(),
										role: 'system',
										content: [
											{
												action: messageAction.action,
												model_used: messageAction.modelUsed,
											},
										],
									})
									.then((fullMessage) => {
										messageHistory.value.push(fullMessage);
										resolve();
									})
									.catch(reject),
							)
							.catch(reject),
					),
				]);
			}),
	);

	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<div class="grid grid-cols-12 gap-y-2">
							<div class="text-3xl text-white">{conversationId.value}</div>
							{messageHistory.value.map((message, index) => {
								return <Message key={`message-${index}`} message={message} userLocale={userLocale.value ?? undefined} />;
							})}
						</div>
					</div>
				</div>
				<Form
					action={createConversation}
					ref={formRef}
					spaReset={true}
					onSubmitCompleted$={(event, form) =>
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
									reject();
									// Bad form
								}
							} else {
								// Failed turnstile
								reject();
							}
						})
					}
					class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
					<div>
						<button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
							<FaIcon icon={faPaperclip} />
						</button>
					</div>
					<div class="ml-4 flex-grow">
						<div class="relative w-full">
							<input
								name="message"
								placeholder="Ask me anything"
								type="text"
								spellcheck={true}
								autoCapitalize="on"
								// @ts-ignore
								autocorrect="on"
								enterKeyHint="send"
								class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
							/>
							{isLocal.value ? <div class="cf-turnstile" data-sitekey="1x00000000000000000000BB"></div> : <div class="cf-turnstile" data-sitekey="0x4AAAAAAAQ34m_klLCEVN51"></div>}
						</div>
					</div>
					<div class="ml-4">
						<button type="submit" class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
							<span class="relative left-[-2px]">
								<FaIcon icon={faPaperPlane} />
							</span>
						</button>
					</div>
				</Form>
			</div>
		</>
	);
});

export const head: DocumentHead = {
	title: 'M.A.T.T. AI',
	meta: [
		{
			name: 'description',
			content: 'Qwik site description',
		},
	],
};
