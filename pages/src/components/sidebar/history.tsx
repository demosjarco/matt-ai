import { component$, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import type { IDBConversation } from '../../IDB/schemas/v2';
import Item from './item';

export default component$(() => {
	const conversations = useSignal<IDBConversation[]>([]);

	useVisibleTask$(async () => {
		conversations.value = await new IDBConversations().conversations;
	});

	const loc = useLocation();
	const navigate = useNavigate();
	const conversationId = useSignal<number>();

	useTask$(({ track }) => {
		track(() => loc.params['conversationId']);

		conversationId.value = loc.params['conversationId'] ? parseInt(loc.params['conversationId']) : undefined;
	});

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
				<Item
					onClick$={(id) => {
						conversationId.value = id;
					}}
					key={`conversation-${conversation.key}`}
					id={conversation.key!}
					title={conversation.name}
				/>
			))}
		</ul>
	);
});
