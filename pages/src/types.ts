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
	atime: Date;
	btime: Date;
	ctime: Date;
}

export interface IDBMessage {
	id: number;
	conversation_id: number;
	content_version: number;
	btime: Date;
	role: 'system' | 'user' | 'assistant';
	model_used: string;
	content_message: string;
	content_supplemental: Record<string, any>[];
	content_cards: Record<string, any>[];
	content_chips: Record<string, any>[];
	content_references: Record<string, any>[];
}
