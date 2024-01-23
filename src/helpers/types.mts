import type { randomUUID } from 'node:crypto';
import type { EnvVars } from '../types';

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
