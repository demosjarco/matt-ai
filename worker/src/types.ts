import type { QueueCallbackHandler } from '../../do/QueueCallbackHandler.mjs';

export interface EnvVars extends Bindings, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: Ai;
	QUEUE_CALLBACK_HANDLER: DurableObjectNamespace<QueueCallbackHandler>;
}
