import { IDBBase } from './base';
import type { IDBConversation } from './schemas/v2';

type FullConversationGuarantee = Partial<IDBConversation>;
type InternalConversationGuarantee = Pick<IDBConversation, 'key'> & Omit<Partial<IDBConversation>, 'key'>;

export class IDBConversations extends IDBBase {
	public addConversation(conversation: FullConversationGuarantee = {}) {
		return new Promise<IDBConversation>((resolve, reject) =>
			this.db
				.then((db) => {
					const insertConversation: IDBConversation = {
						...conversation,
						name: IDBConversations.randomText(16),
						atime: new Date(),
						btime: new Date(),
						ctime: new Date(),
						mtime: new Date(),
					};

					db.add('conversations', insertConversation)
						.then((key) => resolve({ ...insertConversation, key }))
						.catch(reject);
				})
				.catch(reject),
		);
	}

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

	public updateConversation(conversation: InternalConversationGuarantee) {
		return new Promise<IDBConversation>((resolve, reject) =>
			this.getConversation({
				key: conversation.key!,
			})
				.then((originalConversation) =>
					this.db.then((db) => {
						const updatedConversation: IDBConversation = {
							...originalConversation,
							...conversation,
							// Make sure it doesn't accidentally get overwritten
							key: originalConversation.key,
						};

						db.put('conversations', updatedConversation)
							.then(() => resolve(updatedConversation))
							.catch(reject);
					}),
				)
				.catch(reject),
		);
	}
}
