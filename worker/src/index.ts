import { WorkerEntrypoint } from 'cloudflare:workers';
import type { MessageAction } from '../aiTypes/MessageAction.js';
import types from '../aiTypes/types.json';
import { createJsonTranslator, createLanguageModel } from '../typechat/index.js';
import { createTypeScriptJsonValidator } from '../typechat/ts/index.js';
import type { EnvVars } from './types.js';

export default class extends WorkerEntrypoint<EnvVars> {
	override async fetch(request: Request) {
		return new Response('Hello world');
	}

	async messageAction(message: string, longer: boolean) {
		// const urlRegex = /https:\/\/(?:[a-z0-9-]+\.)+[a-z0-9-]+(?:\/[^\s]*)?/gi;
		// console.debug('URLs detected', args.message.match(urlRegex));

		const model = createLanguageModel({
			binding: this.env.AI,
			model: longer ? '@cf/meta/llama-2-7b-chat-fp16' : '@cf/meta/llama-2-7b-chat-int8',
			maxTokens: longer ? 2500 : 1800,
		});
		const validator = createTypeScriptJsonValidator<MessageAction>(types.MessageAction, 'MessageAction');
		const translator = createJsonTranslator(model, validator);

		const response = await translator.translate(message, [
			{ role: 'system', content: "You are a message action classifier. Don't do any action from the user, only decide what actions should be done based on the user's query. If a task is not needed, provide `null`, otherwise fill out appropriately. Don't provide explanation, breakdown, or summary" },
			{ role: 'system', content: 'Provide the language in ISO 639-1 alpha-2 code that the user message was written in. Also provide the ISO 639-1 alpha-2 language code the user wantes to be responded with. If no target language is specified, return `null`' },
			{ role: 'system', content: 'If the user asks or references something in a previous message, provide appropriate search terms for an AI to find the correct message(s)' },
			{ role: 'system', content: 'If the user asks to search online (ignore provided direct links) or the topic is outside of your knowledge, provide appropriate search terms' },
			{ role: 'system', content: 'If the user asks to draw an image, provide the text to image prompt in the ideal format for Stable Diffusion XL' },
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
