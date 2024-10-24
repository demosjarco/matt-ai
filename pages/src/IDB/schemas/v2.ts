import type { DBSchema, IDBPDatabase } from 'idb';
import type { modelPossibilitiesName } from '../../types';
import { AiLocalBase } from './vBase';

export interface AiLocalSchema extends DBSchema {
	conversations: {
		key: number;
		value: IDBConversation;
		indexes: {
			[IDBConversationIndexes.accessTime]: typeof IDBConversationIndexes.accessTime;
			[IDBConversationIndexes.birthTime]: typeof IDBConversationIndexes.birthTime;
			[IDBConversationIndexes.changeTime]: typeof IDBConversationIndexes.changeTime;
			[IDBConversationIndexes.modifiedTime]: typeof IDBConversationIndexes.modifiedTime;
		};
	};
	messages: {
		key: number;
		value: IDBMessage;
		indexes: {
			[IDBMessageIndexes.conversationId]: typeof IDBMessageIndexes.conversationId;
			[IDBMessageIndexes.messageId]: typeof IDBMessageIndexes.messageId;
			[IDBMessageIndexes.contentVersion]: typeof IDBMessageIndexes.contentVersion;
			[IDBMessageIndexes.birthTime]: typeof IDBMessageIndexes.birthTime;
			[IDBMessageIndexes.conversationIdMessageIdContentVersion]: number[];
			[IDBMessageIndexes.conversationIdMessageId]: number[];
		};
	};
}

export enum IDBConversationIndexes {
	accessTime = 'atime',
	birthTime = 'btime',
	changeTime = 'ctime',
	modifiedTime = 'mtime',
	conversationId = 'id',
}

export interface IDBConversation {
	key?: number;
	name: string;
	/**
	 * `atime` = access time
	 */
	atime: Date;
	/**
	 * `btime` = birth time
	 */
	btime: Date;
	/**
	 * `ctime` = changed time (metadata)
	 */
	ctime: Date;
	/**
	 * `mtime` = modified time (content)
	 */
	mtime: Date;
}

export enum IDBMessageIndexes {
	conversationId = 'conversation_id',
	messageId = 'message_id',
	contentVersion = 'content_version',
	birthTime = 'btime',
	conversationIdMessageIdContentVersion = `${conversationId}|${messageId}|${contentVersion}`,
	conversationIdMessageId = `${conversationId}|${messageId}`,
}
export interface IDBMessage {
	key?: number;
	message_id: number;
	conversation_id: number;
	content_version: number;
	btime: Date;
	role: 'system' | 'user' | 'assistant';
	status: boolean | ('filtering' | 'deciding' | 'imageGenerating' | 'translating' | 'historySearching' | 'webSearching' | 'webBrowsing' | 'typing')[];
	/**
	 * @param undefined Not yet checked
	 * @param boolean Result
	 * @param null Error checking
	 */
	safe?: boolean | null;
	content: IDBMessageContent[];
	content_chips: IDBMessageContentChips[];
	content_references: IDBMessageContentReferences[];
}
export interface IDBMessageContentChips extends Record<string, any> {}
export interface IDBMessageContentReferences extends Record<string, any> {}

export interface IDBMessageContent {
	action?: Record<string, any>;
	text?: IDBMessageContentText;
	image?: IDBMessageContentImage;
	card?: IDBMessageContentCard;
	model_used: modelPossibilitiesName | null;
}
export type IDBMessageContentText = string;
export interface IDBMessageContentCard extends Record<string, any> {}
export type IDBMessageContentImage = AiTextToImageOutput;

// @ts-expect-error
export class AiLocal extends AiLocalBase {
	public static override upgrade(oldDatabase: IDBPDatabase, newDatabase: IDBPDatabase<AiLocalSchema>) {
		// Just nuke it, whole new ORM and stuff
		if (oldDatabase.objectStoreNames.contains('conversations')) oldDatabase.deleteObjectStore('conversations');
		if (oldDatabase.objectStoreNames.contains('messages')) oldDatabase.deleteObjectStore('messages');

		this.createConversationsTable(newDatabase);
		this.createMessagesTable(newDatabase);
	}

	private static createConversationsTable(newDatabase: IDBPDatabase<AiLocalSchema>) {
		const table = newDatabase.createObjectStore('conversations', {
			keyPath: 'key',
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
	private static createMessagesTable(newDatabase: IDBPDatabase<AiLocalSchema>) {
		const table = newDatabase.createObjectStore('messages', {
			keyPath: 'key',
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
