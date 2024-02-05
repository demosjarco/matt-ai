import type { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput } from '@cloudflare/ai/dist/tasks/text-generation';
import type { MessageAction } from '../../worker/aiTypes/MessageAction';

export interface EnvVars extends Bindings, Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';

	TURNSTILE_SECRET_KEY: string;
}

interface Bindings {
	AI: any;
	BACKEND_WORKER: Fetcher;
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}

export interface ChatFormSubmit {
	message: string;
	'cf-turnstile-response': string;
}

export interface IDBConversation {
	id: number;
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

export interface IDBMessage {
	id: number;
	message_id: number;
	conversation_id: number;
	content_version: number;
	btime: Date;
	role: 'system' | 'user' | 'assistant';
	status: boolean | ('typing' | 'deciding' | 'translating' | 'historySearching' | 'webSearching' | 'imageGenerating')[];
	content: IDBMessageContent[];
	content_chips: IDBMessageContentChips[];
	content_references: IDBMessageContentReferences[];
}
export interface IDBMessageContentChips extends Record<string, any> {}
export interface IDBMessageContentReferences extends Record<string, any> {}

export interface IDBMessageContent {
	action?: MessageAction;
	text?: IDBMessageContentText;
	image?: IDBMessageContentImage;
	card?: IDBMessageContentCard;
	model_used: Parameters<Ai['run']>[0] | null;
}
export type IDBMessageContentText = string;
export interface IDBMessageContentCard extends Record<string, any> {}
export type IDBMessageContentImage = AiTextGenerationOutput;
