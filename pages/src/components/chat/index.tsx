import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import { IDBMessages } from '../../IDB/messages';
import type { IDBMessage } from '../../IDB/schemas/v2';
import InteractionBar from './interactionBar';
import Message from './message';

export default component$(() => {
	const loc = useLocation();
	const messageHistory = useStore<Record<NonNullable<IDBMessage['key']>, IDBMessage>>({}, { deep: true });

	useVisibleTask$(async ({ track, cleanup }) => {
		track(() => loc.params['conversationId']);
		const conversationId = loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : undefined;

		if (conversationId) {
			new IDBConversations().updateConversation({
				key: conversationId,
				atime: new Date(),
			});

			const existingMessages = await new IDBMessages().getMessagesForConversation(conversationId);
			console.debug('Found', existingMessages.length, 'messages for conversation id', conversationId);
			existingMessages.forEach((existingMessage) => {
				messageHistory[existingMessage.key!] = existingMessage;
			});
		} else {
			console.warn('conversation id', conversationId);
		}

		cleanup(() => {
			Object.keys(messageHistory).forEach((message) => {
				delete messageHistory[parseInt(message)];
			});
		});
	});

	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<div id="messageList" class="grid grid-cols-12 gap-y-2">
							{Object.entries(messageHistory).map(([messageId, message]) => {
								return <Message key={`message-${messageId}`} message={message} />;
							})}
						</div>
					</div>
				</div>
				<InteractionBar messageHistory={messageHistory} />
			</div>
		</>
	);
});
