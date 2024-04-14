import type { randomUUID } from 'node:crypto';
import type { MessageAction } from '../../worker/aiTypes/MessageAction';
import type Helper from '../../worker/src/index';
import type { IDBMessage } from './IDB/schemas/v2';

export interface EnvVars extends Bindings, Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';

	TURNSTILE_SECRET_KEY: string;
}

interface Bindings {
	AI: any;
	BACKEND_WORKER: Service<Helper>;
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}

export interface CustomContext {
	req: {
		raw: Parameters<ExportedHandlerFetchHandler<EnvVars, unknown>>[0];
	};
	env: EnvVars;
	executionCtx: ExecutionContext;
}

export interface UuidExport {
	utf8: ReturnType<typeof randomUUID>;
	hex: string;
	blob: Buffer;
}

export interface ChatFormSubmit {
	message: string;
	'cf-turnstile-response': string;
}

export type MessageContext = Record<NonNullable<IDBMessage['key']>, MessageContextValue>;

export type MessageActionTaken = Record<keyof MessageAction, boolean>;

export interface MessageContextValue {
	previousMessages?: IDBMessage[];
	webSearchInfo?: Record<string, any>;
}
