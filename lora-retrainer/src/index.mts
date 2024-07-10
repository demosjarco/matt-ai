import { serve, type HttpBindings } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { showRoutes } from 'hono/dev';
import { etag } from 'hono/etag';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

class HTTPResponder {
	private validApiMethods = ['GET', 'POST'];
	private server = new Hono<{ Bindings: HttpBindings }>();

	constructor() {
		// Dev debug injection point
		this.server.use('*', async (c, next) => {
			await next();
		});

		// Security
		this.server.use('*', secureHeaders());
		// this.server.use('*', csrf());
		this.server.use(
			'*',
			cors({
				origin: '*',
				allowMethods: [...new Set([...this.validApiMethods, 'OPTIONS'])],
				maxAge: 300,
			}),
		);

		// Performance
		this.server.use('*', compress());
		this.server.use('*', etag());
		// JSON with 2 fields is really tiny
		this.server.use('*', bodyLimit({ maxSize: 1 * 1024 }));

		// Debug
		this.server.use('*', prettyJSON());
		this.server.use('*', timing());

		const status = new Hono();
		status.get('/', (c) =>
			promisify(exec)(`conda run --no-capture-output -p env /bin/bash -c "autotrain --help"`, { cwd: '..' }).then(({ stdout, stderr }) => {
				console.log(stdout);
				console.error(stderr);

				return c.text('OK', 200);
			}),
		);
		this.server.route('/ready', status);
		this.server.route('/status', status);

		showRoutes(this.server, { colorize: true, verbose: true });
	}

	public listen(port: number = 8080) {
		serve(
			{
				fetch: this.server.fetch,
				port,
			},
			(info) => console.log(`Server running at ${new URL(`http://${info.address}:${info.port}`).toString()}`),
		);
	}
}

new HTTPResponder().listen();
