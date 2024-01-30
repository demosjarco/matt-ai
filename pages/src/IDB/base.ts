import { IDBConversationIndexes, IDBMessageIndexes } from '../extras';

export abstract class IDBBase {
	protected get db() {
		const DBOpenRequest = indexedDB.open('ailocal', 1);

		return new Promise<IDBDatabase>(async (resolve, reject) => {
			DBOpenRequest.onerror = reject;

			DBOpenRequest.onupgradeneeded = await this.upgradeDB;

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
		table.createIndex(IDBConversationIndexes.accessTime, 'atime', { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.birthTime, 'btime', { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.changeTime, 'ctime', { unique: false, multiEntry: false });
		table.createIndex(IDBConversationIndexes.modifiedTime, 'mtime', { unique: false, multiEntry: false });

		// For safety
		table.createIndex(IDBConversationIndexes.conversationId, 'id', { unique: true });

		// For speed

		// Other columns
		// table.createIndex('name', 'name', { unique: false, multiEntry: false });
	}
	private createMessagesTable(db: IDBDatabase) {
		const table = db.createObjectStore('messages', {
			keyPath: 'id',
			autoIncrement: true,
		});

		// For search
		table.createIndex(IDBMessageIndexes.conversationId, 'conversation_id', { unique: false, multiEntry: false });
		table.createIndex(IDBMessageIndexes.contentVersion, 'content_version', { unique: false, multiEntry: false });
		table.createIndex(IDBMessageIndexes.birthTime, 'btime', { unique: false, multiEntry: false });

		// For safety
		table.createIndex(IDBMessageIndexes.conversationIdMessageIdContentVersion, ['conversation_id', 'id', 'content_version'], { unique: true });

		// For speed
		table.createIndex(IDBMessageIndexes.conversationIdMessageId, ['conversation_id', 'id'], { unique: false });

		// Other columns
		// table.createIndex('role', 'role', { unique: false, multiEntry: true });
		// table.createIndex('model_used', 'model_used', { unique: false, multiEntry: false });
		// table.createIndex('content', 'content', { unique: false, multiEntry: true });
		// table.createIndex('content_cards', 'content_cards', { unique: false, multiEntry: true });
		// table.createIndex('content_chips', 'content_chips', { unique: false, multiEntry: true });
		// table.createIndex('content_references', 'content_references', { unique: false, multiEntry: true });
	}
}
