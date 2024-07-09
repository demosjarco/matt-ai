import type { IDBMessageContent as IDBMessageContentV2, IDBMessage as IDBMessageV2 } from './v2';

export { AiLocal, IDBConversationIndexes, IDBMessageIndexes } from './v2';
export type { AiLocalSchema, IDBConversation, IDBMessageContentCard, IDBMessageContentChips, IDBMessageContentImage, IDBMessageContentReferences, IDBMessageContentText } from './v2';

export interface IDBMessage extends Omit<IDBMessageV2, 'role'> {
	role: IDBMessageV2['role'] | 'tool';
}
export interface IDBMessageContent extends Omit<IDBMessageContentV2, 'action'> {}
