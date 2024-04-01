import { useDeferStream } from '@graphql-yoga/plugin-defer-stream';
import { createYoga } from 'graphql-yoga';
import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { timing } from 'hono/timing';
import { ApiSchema } from './gql/index.mjs';
import type { EnvVars } from './types.js';

export default <ExportedHandler<EnvVars>>{
	async fetch(request, env, ctx): Promise<Response> {
		const app = new Hono<{ Bindings: EnvVars }>();
		const validApiMethods = ['POST', 'GET'];

		app.use('*', etag());

		app.use('*', timing());

		app.use('*', async (c, next) => {
			/**
			 * Dev debug injection point
			 */
			if (c.env.NODE_ENV === 'development') {
			}

			return next();
		});

		app.on(validApiMethods, '/graphql/*', async (c) =>
			createYoga<EnvVars & ExecutionContext>({
				maskedErrors: c.env.NODE_ENV !== 'production',
				landingPage: false,
				graphiql: {
					title: 'API',
				},
				schema: await new ApiSchema({ c }).schema(),
				plugins: [useDeferStream()],
			}).fetch(c.req.raw, c.env, c.executionCtx),
		);

		return app.fetch(request, env, ctx);
	},
};
