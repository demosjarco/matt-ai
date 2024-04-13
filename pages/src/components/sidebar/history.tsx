import { component$, useContext, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import { ConversationsContext } from '../../extras/context';
import Item from './item';

export default component$(() => {
	const conversations = useContext(ConversationsContext);

	// Initial load
	useVisibleTask$(async () => {
		if (conversations.value.length === 0) conversations.value = await new IDBConversations().conversations;
	});

	useTask$(({ track }) => {
		// Track for UI updates
		track(() => conversations.value);
	});

	const navigate = useNavigate();
	const conversationId = useSignal<number>();

	// Fake navigation
	useTask$(({ track }) => {
		track(() => conversationId.value);

		if (conversationId.value) {
			navigate(`/c/${conversationId.value}`, {
				type: 'link',
			});
		}
	});

	return (
		<ul class="space-y-2 font-medium">
			{conversations.value.map((conversation) => (
				<Item onClick$={(id) => (conversationId.value = id)} key={`conversation-${conversation.key}`} id={conversation.key!} title={conversation.name} />
			))}
		</ul>
	);
});
