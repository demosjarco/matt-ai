import { server$ } from '@builder.io/qwik-city';
import { autoTrimTools, runWithTools } from '@cloudflare/ai-utils';
import type { AiTextGenerationInput, AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/workers-types';
import { addMetadata } from 'meta-png';
import type { EnvVars, filteredModelPossibilitiesName, modelPossibilitiesName } from '../types';

function isNotReadableStream(output: AiTextGenerationOutput): output is { response?: string } {
	return !(output instanceof ReadableStream);
}

export const messageGuard = server$(function (message: RoleScopedChatInput['content']) {
	const unsafeCategories: Record<string, { shouldNot?: string[]; can?: string[]; should?: string[] }> = {
		'Violence and Hate': {
			shouldNot: ['Help people plan or engage in violence', 'Encourage people to engage in violence', 'Express hateful, derogatory, or demeaning sentiments against people based on sensitive personal characteristics like their race, color, religion, national origin, sexual orientation, gender, gender identity, or disability', 'Encourage discrimination against people based on those characteristics and should not use slurs or create insults based on those characteristics'],
			can: ['Provide information on violence and discrimination', 'Discuss the topics of hate and violence, and can discuss historical events involving violence'],
		},
		'Criminal Planning': {
			shouldNot: ['Help people plan or engage in criminal activities like theft, kidnapping, or financial crimes, especially when the person indicates that they may act on the information provided to them', 'Encourage people to engage in criminal activities or condone criminal behavior'],
			can: ['Help people understand how crimes are committed, provided that the response is not so detailed that it could be used to provide a roadmap for future crimes', 'Help people understand how systems work that are used to prevent crimes, provided those descriptions do not provide detailed information on how to defeat those systems'],
		},
		'Guns and Illegal Weapons': {
			shouldNot: ['Assist in the planning or execution of firearm or illegal weapons crimes, especially when the person indicates that they may act on the information provided to them', 'Encourage people to engage in firearm or illegal weapons crimes or condone such behavior'],
			can: ['Discuss firearms and the arguments for and against firearm ownership'],
		},
		'Regulated or Controlled Substances': {
			shouldNot: ['Encourage or assist people in the trafficking, consumption, or use of regulated or controlled substances, including but not limited to illegal drugs, tobacco, alcohol, and cannabis', 'Assist or encourage people to create such substances when it is illegal to do so'],
			can: ['Discuss the use of regulated or controlled substances, and can provide general information on those substances (ex: what their chemical composition is and what their effects are)', 'Provide information on how those substances are manufactured, provided that the information is not so detailed as to provide step-by-step instructions for their creation'],
		},
		'Self-Harm': {
			shouldNot: ['Encourage people to harm themselves', 'Romanticize or condone self-harm or suicide', 'Provide information regarding the methods of suicide or self-harm', 'Provide any information or advice, other than information regarding appropriate health resources, to people who express or imply that they wish to harm themselves', 'Provide general information regarding self-harm and suicide (ex: statistics, the mental health challenges faced by those who take these actions)'],
			can: ['Provide general information regarding self-harm and suicide (ex: statistics, the mental health challenges faced by those who take these actions)'],
			should: ['Provide information regarding appropriate health resources to people who imply or express the desire to harm themselves'],
		},
	};

	return this.platform.env.AI.run('@hf/thebloke/llamaguard-7b-awq', {
		messages: [
			{
				role: 'system',
				content: `Task: Check if there is unsafe content in 'User' messages in conversations according to our safety policy with the below categories. Respond with boolean "true"|"false" if message is safe or not safe.`,
			},
			{
				role: 'system',
				content: `<BEGIN UNSAFE CONTENT CATEGORIES>
				${JSON.stringify(unsafeCategories)}
				<END UNSAFE CONTENT CATEGORIES>`,
			},
			{
				role: 'user',
				content: `<BEGIN CONVERSATION>
				${message}
				<END CONVERSATION>`,
			},
		],
	})
		.then((response) => {
			// @ts-ignore
			if (isNotReadableStream(response)) {
				const parsedResponseRaw = response.response!.trim().toLowerCase();
				const [parsedResponse] = parsedResponseRaw.split(/\s+/, 2);

				if (parsedResponse === 'unsafe') {
					return false;
				} else if (parsedResponse === 'safe') {
					return true;
				} else {
					try {
						return JSON.parse(parsedResponse!);
					} catch (e) {
						throw parsedResponse;
					}
				}
			}
		})
		.catch((e) => {
			throw e;
		});
});

export const messageText = server$(async function* (model: filteredModelPossibilitiesName<'Text Generation', 'function_calling', true>, messages: NonNullable<AiTextGenerationInput['messages']>) {
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
					name: 'incoming-connection',
					description: 'Information about the incoming http connection from the chatting user',
					function: async () =>
						JSON.stringify({
							cf: this.platform.request.cf,
							headers: Object.fromEntries(this.platform.request.headers),
							integrity: this.platform.request.integrity,
							method: this.platform.request.method,
							redirect: this.platform.request.redirect,
							signal: this.platform.request.signal,
							url: this.platform.request.url,
						}),
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

export const messageSummary = server$(function (messages: RoleScopedChatInput['content'][], model: modelPossibilitiesName<'Summarization'>) {
	return this.platform.env.AI.run(model, {
		input_text: messages.join('\n'),
		max_length: 10,
	}).then((response) => response.summary);
});

function image(ai: Ai, prompt: AiTextToImageInput['prompt'], model: modelPossibilitiesName<'Text-to-Image'>, num_steps: AiTextToImageInput['num_steps'] = 20, buildHash?: EnvVars['CF_PAGES_COMMIT_SHA']) {
	return ai
		.run(model, { prompt, num_steps })
		.then(async (imageGeneration: AiTextToImageOutput | NonNullable<Awaited<ReturnType<typeof fetch>>['body']>) => {
			if (imageGeneration instanceof ReadableStream) {
				imageGeneration = new Uint8Array(await new Response(imageGeneration).arrayBuffer());
			}

			const imageGenerationWithmetadata1 = addMetadata(imageGeneration, 'Title', prompt);
			const imageGenerationWithmetadata2 = addMetadata(imageGenerationWithmetadata1, 'Software', model.split('/').slice(1).join('/'));
			const imageGenerationWithmetadata3 = addMetadata(imageGenerationWithmetadata2, 'Author', `M.A.T.T. AI${buildHash ? ` v${buildHash}` : ''}`);

			return {
				raw: Buffer.from(imageGenerationWithmetadata3.buffer).toString('base64'),
				model,
			};
		})
		.catch((e) => {
			throw e;
		});
}
export const messageActionImage = server$(function (prompt: Parameters<typeof image>[1], model?: Parameters<typeof image>[2], num_steps?: Parameters<typeof image>[3]) {
	if (model === undefined) {
		return image(this.platform.env.AI, prompt, '@cf/stabilityai/stable-diffusion-xl-base-1.0', num_steps, this.platform.env.CF_PAGES_COMMIT_SHA).catch(() =>
			image(this.platform.env.AI, prompt, '@cf/bytedance/stable-diffusion-xl-lightning', num_steps, this.platform.env.CF_PAGES_COMMIT_SHA).catch(() =>
				image(this.platform.env.AI, prompt, '@cf/lykon/dreamshaper-8-lcm', num_steps, this.platform.env.CF_PAGES_COMMIT_SHA).catch((e) => {
					throw e;
				}),
			),
		);
	} else {
		return image(this.platform.env.AI, prompt, model, num_steps, this.platform.env.CF_PAGES_COMMIT_SHA);
	}
});
