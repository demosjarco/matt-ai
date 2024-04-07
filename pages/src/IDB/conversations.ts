import { IDBBase } from './base';

export class IDBConversations extends IDBBase {
	public get conversations() {
		// Get all conversations, but sorted newest to oldest
		return this.db.then((db) => db.getAll('conversations').then((conversations) => conversations.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())));
	}
}
