import { component$, useContext, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import { IDBMessages } from '../../IDB/messages';
import { MessagesContext } from '../../extras/context';
import { serverParams } from '../../routes/layout';
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

		cleanup(async () => {
			const messageKeys = Object.keys(messageHistory);

			// Only cleanup if there are items
			if (messageKeys.length > 0) {
				let newConversationId: number | undefined = undefined;
				if (loc.params['conversationId']) {
					newConversationId = parseInt(loc.params['conversationId']);
				} else {
					const params = await serverParams();

					if (params['conversationId']) {
						newConversationId = parseInt(params['conversationId']);
					}
				}

				// Only cleanup if conversation is different
				if (messageHistory[parseInt(messageKeys[0]!)]!.conversation_id !== newConversationId) {
					Object.keys(messageHistory).forEach((message) => {
						delete messageHistory[parseInt(message)];
					});
				}
			}
		});
	});

	const messageList = useSignal<HTMLDivElement>();
	const messageListShouldScroll = useSignal<boolean>(true);
	const messageListWasProgramaticScroll = useSignal<boolean>(true);
	// Auto scroll to bottom
	useVisibleTask$(({ track }) => {
		track(() => messageList.value);
		track(() => messageListShouldScroll.value);

		if (messageList.value && messageListShouldScroll.value === true) {
			const { scrollHeight } = messageList.value;

			messageListWasProgramaticScroll.value = true;
			messageList.value.scrollTop = scrollHeight;
			messageListWasProgramaticScroll.value = false;
		}
	});

	return (
		<div
			id="messageList"
			class="grid grid-cols-12 gap-y-2"
			// Stop auto scrolling if user scrolls
			onScroll$={() => {
				if (messageListWasProgramaticScroll.value === false) {
					messageListShouldScroll.value = false;
				}
			}}
			// If the user has scrolled all the way to the bottom, then enable it again
			onScrollend$={() => {
				if (messageList.value) {
					const { scrollTop, scrollHeight, clientHeight } = messageList.value;

					if (messageListShouldScroll.value === false && scrollHeight === scrollTop + clientHeight) {
						messageListShouldScroll.value = true;
					}
				}
			}}>
			{Object.entries(messageHistory).map(([messageId, message]) => {
				return <Message key={`message-${messageId}`} message={message} />;
			})}
		</div>
	);
});
