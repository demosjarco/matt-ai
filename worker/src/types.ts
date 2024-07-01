import type { BrowserWorker } from '@cloudflare/puppeteer';
import type { QueueCallbackHandler } from '../../do/QueueCallbackHandler.mjs';
import type { workersAiCatalog } from '../../shared/workers-ai-catalog';

export interface EnvVars extends Bindings, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: Ai;
	QUEUE_CALLBACK_HANDLER: DurableObjectNamespace<QueueCallbackHandler>;
	BROWSER?: BrowserWorker;
}

export type modelTypes = keyof typeof workersAiCatalog.modelGroups;
export type modelPossibilities<M extends modelTypes = modelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number]['name'];
