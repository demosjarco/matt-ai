import { connect, launch, sessions, type Browser, type BrowserWorker } from '@cloudflare/puppeteer';
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { EnvVars } from './types.js';

// Re-export since workerd can only find from from `wrangler.toml`'s `main` file
export { QueueCallbackHandler } from '../../do/QueueCallbackHandler.mjs';

export default class extends WorkerEntrypoint<EnvVars> {
	// Dummy entry point, crashes without it
	override async fetch(request: Request) {
		return new Response('Hello world');
	}

	override queue(batch: MessageBatch<unknown>) {
		if (batch.queue.startsWith('mattai-deferred-tasks-dlq')) {
			/**
			 * @todo
			 * Connect to ws
			 * Tell the client "yea, it ain't happening"
			 * End all WS and DO
			 */
		} else if (batch.queue.startsWith('mattai-deferred-tasks')) {
			/**
			 * @todo
			 * Do Browser rendering stuff
			 * @link https://platform.openai.com/docs/plugins/bot Follow similar practices
			 * @link https://developers.cloudflare.com/bots/reference/verified-bots-policy/ eventually (once used enough) verify bot
			 * Ws content back
			 */
		}
	}

	private getRandomSession(endpoint: BrowserWorker) {
		return sessions(endpoint).then((sessions) => {
			console.log(`Sessions: ${JSON.stringify(sessions)}`);
			const sessionsIds = sessions
				// remove sessions with workers connected to them
				.filter((v) => !v.connectionId)
				.map((v) => v.sessionId);
			if (sessionsIds.length === 0) {
				return;
			}

			const sessionId = sessionsIds[Math.floor(Math.random() * sessionsIds.length)];

			return sessionId!;
		});
	}
	public webBrowse(url: string | URL) {
		if (this.env.BROWSER) {
			/**
			 * @todo 1.1.1.1 secure resolver lookup (and possibly block if bad site)
			 * @todo check robots.txt to see if allowed to visit in first place
			 * @todo add toggle between raw mode and summary (`bart-large-cnn`) mode
			 */
			return this.getRandomSession(this.env.BROWSER).then(async (sessionId) => {
				let browser: Browser | undefined;

				if (sessionId) {
					try {
						browser = await connect(this.env.BROWSER!, sessionId);
					} catch (e) {
						// another worker may have connected first
						console.error(`Failed to connect to ${sessionId}. Error ${e}`);
					}
				}
				if (!browser) {
					// No open sessions, launch new session
					browser = await launch(this.env.BROWSER!);
				}

				return (
					browser
						.newPage()
						/**
						 * @todo Check header if json and do .json() wrapped by JSON.stringify to remove whitespace
						 */
						.then((page) => page.goto(new URL(url).toString()).then((response) => response!.text()))
						.finally(() => browser.disconnect())
				);
			});
		} else {
			throw new Error('Browser Rendering not available');
		}
	}
}
