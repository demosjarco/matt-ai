import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { IDBConversationIndexes } from '../../extras';
import type { IDBConversation } from '../../types';
import Item from './item';

export default component$(() => {
	const conversations = useSignal<IDBConversation[]>([]);

	useVisibleTask$(() => {
		const DBOpenRequest = indexedDB.open('ailocal', 1);

		DBOpenRequest.onerror = console.error;

		DBOpenRequest.onsuccess = async () => {
			const db = DBOpenRequest.result;

			function getConversations() {
				const transaction = db.transaction('conversations', 'readonly', { durability: 'relaxed' });
				const store = transaction.objectStore(transaction.objectStoreNames[0]!);

				return new Promise<IDBConversation[]>((resolve, reject) => {
					const myIndex = store.index(IDBConversationIndexes.modifiedTime).openCursor(null, 'prev');
					myIndex.onerror = reject;

					const conversations: IDBConversation[] = [];
					myIndex.onsuccess = (event) => {
						const cursorEvent = event.target as ReturnType<IDBIndex['openCursor']>;
						const cursor = cursorEvent.result;

						if (cursor) {
							conversations.push(cursor.value as IDBConversation);

							cursor.continue();
						} else {
							transaction.commit();
							resolve(conversations);
						}
					};
				});
			}

			const conversationData = await getConversations();

			conversations.value = conversationData;

			console.debug(conversations);
		};
	});

	return (
		<ul class="space-y-2 overflow-y-scroll font-medium">
			{conversations.value.map((conversation) => (
				<Item key={conversation.id} title={conversation.name} />
			))}
		</ul>
	);
});
