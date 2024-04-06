import { IDBMessageIndexes, deepMerge } from '../extras';
import type { IDBConversation, IDBMessage } from '../types';
import { IDBBase } from './base';

type MessageSaveGuarantee = 'role';
type FullMessageGuarantee = Pick<IDBMessage, MessageSaveGuarantee> & Omit<Partial<IDBMessage>, MessageSaveGuarantee>;
type InternalMessageGuarantee = Pick<IDBMessage, 'key'> & Omit<Partial<IDBMessage>, 'key'>;

export class IDBMessages extends IDBBase {
	public getMessagesForConversation(cid: number) {
		return new Promise<IDBMessage[]>((resolve, reject) =>
			this.db
				.then((db) => {
					const transaction = db.transaction('messages', 'readonly', { durability: 'relaxed' });
					transaction.onerror = reject;

					const latestMessages: Record<number, IDBMessage> = {};
					transaction.oncomplete = () => resolve(Object.values(latestMessages));

					const store = transaction.objectStore(transaction.objectStoreNames[0]!);
					const index = store.index(IDBMessageIndexes.conversationIdMessageIdContentVersion).openCursor(IDBKeyRange.bound([cid], [cid, [], []]), 'next');
					index.onerror = reject;
					index.onsuccess = (event) => {
						const cursorEvent = event.target as ReturnType<IDBIndex['openCursor']>;
						const cursor = cursorEvent.result;

						if (cursor) {
							const message: IDBMessage = cursor.value;

							if (!latestMessages[message.message_id] || (latestMessages[message.message_id] && latestMessages[message.message_id]!.content_version < message.content_version)) {
								latestMessages[message.message_id] = message;
							}

							cursor.continue();
						} else {
							transaction.commit();
						}
					};
				})
				.catch(reject),
		);
	}

	public getMessage(message: InternalMessageGuarantee) {
		return new Promise<IDBMessage>((resolve, reject) =>
			this.db
				.then((db) => {
					const transaction = db.transaction('messages', 'readonly', { durability: 'relaxed' });
					transaction.onerror = reject;

					const select = transaction.objectStore(transaction.objectStoreNames[0]!).get(message.id);
					select.onerror = reject;
					select.onsuccess = () => resolve(select.result);

					transaction.commit();
				})
				.catch(reject),
		);
	}

	public updateMessage(message: InternalMessageGuarantee) {
		return new Promise<IDBMessage>((mainResolve, mainReject) =>
			this.db
				.then((db) =>
					this.getMessage(message)
						.then((originalMessage) => {
							const transaction = db.transaction('messages', 'readwrite');
							transaction.done.catch(mainReject);

							const insertMessage = deepMerge(originalMessage, message);

							const insert = transaction.objectStore(transaction.objectStoreNames[0]!).put(insertMessage);
							insert.onerror = mainReject;
							insert.onsuccess = () => mainResolve(insertMessage);

							transaction.commit();
						})
						.catch(mainReject),
				)
				.catch(mainReject),
		);
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
