import { IDBConversationIndexes, IDBMessageIndexes } from '../extras';

export abstract class IDBBase {
	protected get db() {
		const DBOpenRequest = indexedDB.open('ailocal', 1);

		return new Promise<IDBDatabase>(async (resolve, reject) => {
			DBOpenRequest.onerror = reject;

			DBOpenRequest.onupgradeneeded = async (event) => await this.upgradeDB(event);

			DBOpenRequest.onsuccess = (event) => resolve(DBOpenRequest.result);
		});
	}

	protected upgradeDB(event: IDBVersionChangeEvent) {
		const target = event.target as IDBOpenDBRequest;
		const db = target.result;

		return new Promise<void>((resolve, reject) => {
			db.onerror = reject;

			this.createConversationsTable(db);
			this.createMessagesTable(db);

			resolve();
		});
	}
	private createConversationsTable(db: IDBDatabase) {
		const table = db.createObjectStore('conversations', {
			keyPath: 'id',
			autoIncrement: true,
		});

		// For search
		table.createIndex(IDBConversationIndexes.accessTime, IDBConversationIndexes.accessTime, { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.birthTime, IDBConversationIndexes.birthTime, { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.changeTime, IDBConversationIndexes.changeTime, { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.modifiedTime, IDBConversationIndexes.modifiedTime, { unique: false, multiEntry: false });

		// For safety

		// For speed
	}
	private createMessagesTable(db: IDBDatabase) {
		const table = db.createObjectStore('messages', {
			keyPath: 'id',
			autoIncrement: true,
		});

		// For search
		table.createIndex(IDBMessageIndexes.conversationId, IDBMessageIndexes.conversationId, { unique: false, multiEntry: false });
		table.createIndex(IDBMessageIndexes.messageId, IDBMessageIndexes.messageId, { unique: false, multiEntry: false });
		table.createIndex(IDBMessageIndexes.contentVersion, IDBMessageIndexes.contentVersion, { unique: false, multiEntry: false });
		table.createIndex(IDBMessageIndexes.birthTime, IDBMessageIndexes.birthTime, { unique: false, multiEntry: false });

		// For safety
		table.createIndex(IDBMessageIndexes.conversationIdMessageIdContentVersion, [IDBMessageIndexes.conversationId, IDBMessageIndexes.messageId, IDBMessageIndexes.contentVersion], { unique: true });

		// For speed
		table.createIndex(IDBMessageIndexes.conversationIdMessageId, [IDBMessageIndexes.conversationId, IDBMessageIndexes.messageId], { unique: false });
	}
}
