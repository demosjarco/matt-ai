import { IDBBase } from './base';
import type { IDBConversation } from './schemas/v2';

type InternalConversationGuarantee = Pick<IDBConversation, 'key'> & Omit<Partial<IDBConversation>, 'key'>;

export class IDBConversations extends IDBBase {
	public get conversations() {
		// Get all conversations, but sorted newest to oldest
		return this.db.then((db) => db.getAll('conversations').then((conversations) => conversations.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())));
	}

	public getConversation(conversation: InternalConversationGuarantee) {
		return new Promise<IDBConversation>((resolve, reject) =>
			this.db
				.then((db) =>
					db
						.get('conversations', conversation.key!)
						.then((value) => (value ? resolve(value) : reject()))
						.catch(reject),
				)
				.catch(reject),
		);
	}
}
