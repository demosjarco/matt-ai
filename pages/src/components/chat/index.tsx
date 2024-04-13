import { component$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import { IDBMessages } from '../../IDB/messages';
import { MessagesContext } from '../../extras/context';
import { serverParams } from '../../routes/layout';
import InteractionBar from './interactionBar';
import Message from './message';

export default component$(() => {
	const loc = useLocation();
	const messageHistory = useContext(MessagesContext);

	// Initial load
	useVisibleTask$(async ({ track, cleanup }) => {
		track(() => loc.params);
		let conversationId: number | undefined = undefined;
		if (loc.params['conversationId']) {
			conversationId = parseInt(loc.params['conversationId']);
		} else {
			const params = await serverParams();

			if (params['conversationId']) {
				conversationId = parseInt(params['conversationId']);
			}
		}

		if (conversationId) {
			const savedMessages = await new IDBMessages().getMessagesForConversation(conversationId);

			console.debug('Found', savedMessages.length, 'messages for conversation id', conversationId);

			const potentialPromise: ReturnType<IDBConversations['updateConversation']>[] = [];
			if (savedMessages.length) {
				potentialPromise.push(
					new IDBConversations().updateConversation({
						key: conversationId,
						atime: new Date(),
					}),
				);
			}

			// Turn into promise to not block
			await Promise.all([
				...potentialPromise,
				new Promise<void>(() =>
					savedMessages.forEach((savedMessage) => {
						// Only add if doesn't exist
						if (!messageHistory[savedMessage.key!]) messageHistory[savedMessage.key!] = savedMessage;
					}),
				),
			]);
		} else {
			console.warn('conversation id', conversationId, 'empty');
		}

		cleanup(() => {
			const messageKeys = Object.keys(messageHistory);

			// Only cleanup if there are items
			if (messageKeys.length > 0) {
				const newConversationId = loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : undefined;

				// Only cleanup if conversation is different
				if (messageHistory[parseInt(messageKeys[0]!)]!.conversation_id !== newConversationId) {
					Object.keys(messageHistory).forEach((message) => {
						delete messageHistory[parseInt(message)];
					});
				}
			}
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
				<InteractionBar />
			</div>
		</>
	);
});
