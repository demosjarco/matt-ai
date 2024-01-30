import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { IDBConversations } from '../../IDB/conversations';
import type { IDBConversation } from '../../types';
import Item from './item';

export default component$(() => {
	const conversations = useSignal<IDBConversation[]>([]);

	useVisibleTask$(
		() =>
			new Promise<void>((resolve, reject) =>
				new IDBConversations().conversations
					.then((conversationData) => {
						conversations.value = conversationData;

						resolve();
					})
					.catch(reject),
			),
	);

	const navigate = useNavigate();

	const conversationId = useSignal<number | undefined>(undefined);

	useVisibleTask$(({ track }) => {
		track(() => conversationId.value);

		if (!conversationId.value) {
			return;
		}

		navigate(`/c/${conversationId.value}`, {
			type: 'link',
		});
	});

	return (
		<ul class="h-full space-y-2 overflow-y-auto font-medium">
			{conversations.value.map((conversation) => (
				<Item
					onClick$={(id) => {
						conversationId.value = id;
					}}
					key={conversation.id}
					id={conversation.id}
					title={conversation.name}
				/>
			))}
		</ul>
	);
});
