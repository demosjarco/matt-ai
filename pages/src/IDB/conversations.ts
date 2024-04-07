import { IDBBase } from './base';
import { IDBConversationIndexes, type IDBConversation } from './schemas/v1';

export class IDBConversations extends IDBBase {
	public get conversations() {
		return new Promise<IDBConversation[]>((resolve, reject) =>
			this.db
				.then((db) => {
					const transaction = db.transaction('conversations', 'readonly', { durability: 'relaxed' });
					transaction.onerror = reject;

					const conversations: IDBConversation[] = [];
					transaction.oncomplete = () => resolve(conversations);

					const store = transaction.objectStore(transaction.objectStoreNames[0]!);
					const index = store.index(IDBConversationIndexes.modifiedTime).openCursor(null, 'prev');
					index.onerror = reject;
					index.onsuccess = (event) => {
						const cursorEvent = event.target as ReturnType<IDBIndex['openCursor']>;
						const cursor = cursorEvent.result;

						if (cursor) {
							conversations.push(cursor.value as IDBConversation);

							cursor.continue();
						} else {
							transaction.commit();
						}
					};
				})
				.catch(reject),
		);
	}
}
