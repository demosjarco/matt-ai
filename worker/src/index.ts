import type { EnvVars } from './types.js';

export default {
	async fetch(request: Request, env: EnvVars, ctx: ExecutionContext): Promise<Response> {
		return new Response('Hello World!');
	},
};
