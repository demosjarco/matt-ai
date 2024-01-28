export interface EnvVars extends Bindings, Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: any;
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
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
	conversation_id: number;
	content_version: number;
	btime: Date;
	role: 'system' | 'user' | 'assistant';
	model_used: string;
	content: Record<string, any>[];
	content_cards: Record<string, any>[];
	content_chips: Record<string, any>[];
	content_references: Record<string, any>[];
}
