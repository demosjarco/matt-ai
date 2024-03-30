import { $, component$, useSignal, type Signal } from '@builder.io/qwik';
import { Form } from '@builder.io/qwik-city';
import { useUserUpdateConversation } from '../../../routes/layout';
import type { IDBMessage } from '../../../types';
import ChatBox from './chatBox';
import Submit from './submit';

export default component$((conversationId: Readonly<Signal<string>>, messageHistory: Record<IDBMessage['id'], IDBMessage>) => {
	const formRef = useSignal<HTMLFormElement>();
	const createConversation = useUserUpdateConversation();

	const sendMessage = $((message: string) => {});

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
							messageHistory[Number.MAX_SAFE_INTEGER] = {
								id: Number.MAX_SAFE_INTEGER,
								message_id: Number.MAX_SAFE_INTEGER,
								conversation_id: parseInt(conversationId.value),
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
						messageHistory[Number.MAX_SAFE_INTEGER] = {
							id: Number.MAX_SAFE_INTEGER,
							message_id: Number.MAX_SAFE_INTEGER,
							conversation_id: parseInt(conversationId.value),
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
			class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
			<ChatBox />
			<Submit />
		</Form>
	);
});
