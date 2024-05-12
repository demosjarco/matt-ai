import type { modelMappings } from '@cloudflare/ai';
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { MessageAction } from '../aiTypes/MessageAction.js';
import types from '../aiTypes/types.json';
import { createJsonTranslator, createLanguageModel } from '../typechat/index.js';
import { createTypeScriptJsonValidator } from '../typechat/ts/index.js';
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

	async messageAction(message: string, model: (typeof modelMappings)['text-generation']['models'][number]) {
		// const urlRegex = /https:\/\/(?:[a-z0-9-]+\.)+[a-z0-9-]+(?:\/[^\s]*)?/gi;
		// console.debug('URLs detected', args.message.match(urlRegex));

		const lModel = createLanguageModel({
			binding: this.env.AI,
			// @ts-expect-error todo: specify that it is text only
			model: model,
		});
		const validator = createTypeScriptJsonValidator<MessageAction>(types.MessageAction, 'MessageAction');
		const translator = createJsonTranslator(lModel, validator);

		const response = await translator.translate(message, [
			{ role: 'system', content: "You are a message action classifier. Don't do any action from the user, only decide what actions should be done based on the user's query. If a task is not needed, provide `null`, otherwise fill out appropriately. Don't provide explanation, breakdown, or summary" },
			{ role: 'system', content: 'Provide the language in ISO 639-1 alpha-2 code that the user message was written in. Also provide the ISO 639-1 alpha-2 language code the user wantes to be responded with. If no target language is specified, return `null`' },
			{ role: 'system', content: 'If the user asks or references something in a previous message, provide appropriate search keywords for an AI to find the correct message(s)' },
			{ role: 'system', content: 'If the user asks to search online (ignore any provided direct links), the message contains the word "latest" (or similar adjectives) or the user wants up to date information about a (topic, subject, product, company or object), or you do not directly know the answer or the topic is outside of your knowledge, provide search terms to find the requested info in an array of keywords and search terms' },
			{ role: 'system', content: 'If the user asks to draw an image, provide the text to image prompt in the ideal format for Stable Diffusion' },
		]);
		if (response.success) {
			return response.data;
		} else {
			const error = new Error('TypeChat Error', { cause: response.message });
			console.error(error);
			throw error;
		}
	}
}
