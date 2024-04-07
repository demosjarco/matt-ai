import { deepMerge } from '../extras';
import { IDBBase } from './base';
import { IDBMessageIndexes, type IDBConversation, type IDBMessage } from './schemas/v1';

type MessageSaveGuarantee = 'role';
type FullMessageGuarantee = Pick<IDBMessage, MessageSaveGuarantee> & Omit<Partial<IDBMessage>, MessageSaveGuarantee>;
type InternalMessageGuarantee = Pick<IDBMessage, 'key'> & Omit<Partial<IDBMessage>, 'key'>;

export class IDBMessages extends IDBBase {
	public getMessagesForConversation(cid: number) {
		return this.db.then((db) => db.getAllFromIndex('messages', IDBMessageIndexes.conversationIdMessageIdContentVersion, IDBKeyRange.bound([cid], [cid, [], []])));
	}

	public getMessage(message: InternalMessageGuarantee) {
		return new Promise<IDBMessage>((resolve, reject) =>
			this.db
				.then((db) =>
					db
						.get('messages', message.key)
						.then((value) => (value ? resolve(value) : reject()))
						.catch(reject),
				)
				.catch(reject),
		);
	}

	public updateMessage(message: InternalMessageGuarantee) {
		return this.getMessage(message).then((originalMessage) => this.db.then((db) => db.put('messages', deepMerge(originalMessage, message))));
	}

	public saveMessage(message: FullMessageGuarantee) {
		return new Promise<IDBMessage>((mainResolve, mainReject) =>
			this.db
				.then((db) =>
					new Promise<IDBMessage['conversation_id']>((resolve, reject) => {
						console.debug(19, message.conversation_id!, 'conversation_id' in message, !isNaN(message.conversation_id!), message.conversation_id! > 0);
						// IDB has 1-based autoincrement
						if ('conversation_id' in message && !isNaN(message.conversation_id!) && message.conversation_id! > 0) {
							console.debug(20, message.conversation_id!);
							resolve(message.conversation_id!);
						} else {
							const transaction = db.transaction('conversations', 'readwrite');
							transaction.done.catch(reject);

							const newConversation: Partial<IDBConversation> = {
								name: crypto.randomUUID(),
								atime: new Date(),
								btime: new Date(),
								ctime: new Date(),
								mtime: new Date(),
							};

							const insert = transaction.objectStore(transaction.objectStoreNames[0]!).add(newConversation);
							insert.onerror = reject;
							insert.onsuccess = () => {
								console.debug(21, insert.result);
								resolve(Number(insert.result));
							};

							transaction.commit();
						}
					})
						.then((conversation_id) =>
							Promise.all([
								new Promise<IDBMessage['message_id']>((resolve, reject) => {
									console.debug(22, conversation_id);
									const transaction = db.transaction('messages', 'readonly');
									transaction.done.catch(reject);

									const store = transaction.objectStore(transaction.objectStoreNames[0]!);
									const index = store.index(IDBMessageIndexes.messageId).openCursor(null, 'prev');
									index.onerror = reject;
									let highestValue = 0;

									index.onsuccess = (event) => {
										const cursorEvent = event.target as ReturnType<IDBIndex['openCursor']>;
										const cursor = cursorEvent.result;

										if (cursor) {
											const currentValue = cursor.value[IDBMessageIndexes.messageId];

											if (currentValue > highestValue) {
												highestValue = currentValue;
											}

											resolve(highestValue + 1);
										} else {
											resolve(highestValue);
										}
									};
								}),
							])
								.then(([message_id]) => {
									console.debug(23, conversation_id, message_id);
									const transaction = db.transaction('messages', 'readwrite');
									transaction.done.catch(mainReject);

									const insertMessage: Omit<IDBMessage, 'id'> & Pick<Partial<IDBMessage>, 'id'> = {
										content_version: 0,
										btime: new Date(),
										status: false,
										content: [],
										content_chips: [],
										content_references: [],
										...message,
										message_id,
										conversation_id,
									};

									const insert = transaction.objectStore(transaction.objectStoreNames[0]!).add(insertMessage);
									insert.onerror = mainReject;
									insert.onsuccess = () => {
										insertMessage.id = Number(insert.result);
										mainResolve(insertMessage as IDBMessage);
									};

									transaction.commit();
								})
								.catch(mainReject),
						)
						.catch(mainReject),
				)
				.catch(mainReject),
		);
	}
}
