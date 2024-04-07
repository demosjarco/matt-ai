import { deepMerge } from '../extras';
import { IDBBase } from './base';
import { IDBConversations } from './conversations';
import { IDBMessageIndexes, type IDBMessage } from './schemas/v2';

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
						.get('messages', message.key!)
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
					Promise.all([
						new Promise<IDBMessage['conversation_id']>((resolve, reject) => {
							// IDB has 1-based autoincrement
							db.add('conversations', {
								// Always insert to avoid edge case of being on a conversation page already
								key: 'conversation_id' in message && !isNaN(message.conversation_id!) && message.conversation_id! > 0 ? message.conversation_id! : undefined,
								name: crypto.randomUUID(),
								atime: new Date(),
								btime: new Date(),
								ctime: new Date(),
								mtime: new Date(),
							})
								.then(resolve)
								.catch((reason) => {
									if (reason instanceof DOMException) {
										switch (reason.name) {
											case 'ConstraintError':
												new IDBConversations()
													.updateConversation({
														key: message.conversation_id!,
														mtime: new Date(),
													})
													.then((newConversation) => resolve(newConversation.key!))
													.catch(reject);
												break;

											default:
												reject(reason);
												break;
										}
									} else {
										reject(reason);
									}
								});
						}),
						// eslint-disable-next-line no-async-promise-executor
						new Promise<IDBMessage['message_id']>(async (resolve, reject) => {
							const transaction = db.transaction('messages', 'readonly');
							transaction.done.catch(reject);

							const index = transaction.store.index(IDBMessageIndexes.messageId);
							let highestValue = 0;

							for await (const cursor of index.iterate(null, 'prev')) {
								const currentValue = cursor.value.message_id;

								if (currentValue > highestValue) {
									highestValue = currentValue;
								}

								resolve(highestValue + 1);
								break;
							}
							resolve(highestValue);
						}),
					])
						.then(([conversation_id, message_id]) => {
							const insertMessage: IDBMessage = {
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

							db.add('messages', insertMessage)
								.then((result) => {
									insertMessage.key = result;
									mainResolve(insertMessage);
								})
								.catch(mainReject);
						})
						.catch(mainReject),
				)
				.catch(mainReject),
		);
	}
}
