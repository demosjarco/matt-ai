import { server$ } from '@builder.io/qwik-city';
import { autoTrimTools, runWithTools } from '@cloudflare/ai-utils';
import type { AiTextGenerationInput, AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/workers-types';
import type { filteredModelPossibilitiesName } from '../types';

export const newMessageText = server$(async function* (model: filteredModelPossibilitiesName<'Text Generation', 'function_calling', true>, messages: NonNullable<AiTextGenerationInput['messages']>) {
	const systemMessages: RoleScopedChatInput[] = [{ role: 'system', content: `You are a helpful assistant` }];

	const stream = await runWithTools(
		// @ts-expect-error
		this.platform.env.AI,
		model,
		{
			messages: [...systemMessages, ...messages],
			tools: [
				{
					name: 'get-datetime',
					description: 'Returns the current UTC date & time as ISO 8601',
					function: async () => new Date().toISOString(),
				},
				{
					name: 'translate',
					description: 'Multilingual translation',
					parameters: {
						type: 'object',
						properties: {
							text: {
								type: 'string',
								description: 'The text to translate',
							},
							source_lang: {
								type: 'string',
								description: 'The current language of the text, defined as ISO 639-1 alpha-2 language code. Defaults to `en`',
							},
							target_lang: {
								type: 'string',
								description: 'The language to translate the text to, defined as ISO 639-1 alpha-2 language code',
							},
						},
						required: ['text', 'target_lang'],
					},
					function: (parameters) => this.platform.env.AI.run('@cf/meta/m2m100-1.2b', parameters).then(({ translated_text }) => translated_text),
				},
				{
					name: 'web-search',
					description: 'Searches online using DuckDuckGo Instant Answer. Use if the message contains the word "latest" (or similar adjectives) or the user wants up to date information about a (topic, subject, product, company or object), or you do not directly know the answer or the topic is outside of your knowledge',
					parameters: {
						type: 'object',
						properties: {
							searchTerms: {
								type: 'string',
								description: 'Keywords and search terms',
							},
						},
						required: ['searchTerms'],
					},
					function: ({ searchTerms }) => {
						const ddgApi = new URL('https://api.duckduckgo.com');
						ddgApi.searchParams.set('format', 'json');
						ddgApi.searchParams.set('no_html', Number(true).toString());
						ddgApi.searchParams.set('no_redirect', Number(true).toString());
						ddgApi.searchParams.set('skip_disambig', Number(true).toString());
						ddgApi.searchParams.set('q', searchTerms);

						// Don't do direct `.text()` in order to trim whitespace better
						return fetch(ddgApi).then((response) => response.json().then((json) => JSON.stringify(json)));
					},
				},
			],
		},
		{
			strictValidation: true,
			maxRecursiveToolRuns: 1,
			streamFinalResponse: true,
			trimFunction: autoTrimTools,
			verbose: this.platform.env.NODE_ENV !== 'production',
		},
	);
	const decoder = new TextDecoder('utf-8');

	const eventField = 'data';
	const contentPrefix = `${eventField}: `;

	let accumulatedData = '';
	let newlineCounter = 0;
	let streamError = false;
	// @ts-expect-error
	for await (const chunk of stream) {
		const decodedChunk = decoder.decode(chunk, { stream: true });
		accumulatedData += decodedChunk;

		let newlineIndex;
		while ((newlineIndex = accumulatedData.indexOf('\n')) >= 0) {
			// Found a newline
			const line = accumulatedData.slice(0, newlineIndex);
			accumulatedData = accumulatedData.slice(newlineIndex + 1); // Remove the processed line from the accumulated data

			if (line.startsWith(contentPrefix)) {
				const decodedString = line.substring(contentPrefix.length);
				try {
					// See if it's JSON
					const decodedJson: Exclude<AiTextGenerationOutput, ReadableStream> = JSON.parse(decodedString);
					// Sometimes the models just dump whitespace forever
					// @ts-ignore
					if (decodedJson.response === '\n') {
						newlineCounter++; // Increment for each newline found
						if (newlineCounter >= 5) {
							// Stop processing line
							streamError = true;
							break;
						}
					} else {
						newlineCounter = 0;
					}

					// Return JSON
					// @ts-ignore
					yield decodedJson.response;
				} catch (error) {
					// Not valid JSON - just ignore and move on
				}
			}
		}

		// Stop processing response all together
		if (streamError) break;
	}
});
