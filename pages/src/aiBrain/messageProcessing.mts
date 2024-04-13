import { Ai, type modelMappings } from '@cloudflare/ai';
import type { AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import type { IDBMessageContent } from '../IDB/schemas/v2';
import { CFBase } from '../extras/base.mjs';
import type { MessageContextValue } from '../types';

export class MessageProcessing extends CFBase {
	static isNotReadableStream(output: AiTextGenerationOutput): output is { response?: string } {
		return !(output instanceof ReadableStream);
	}

	/**
	 * Evaluates the safety of a message based on predefined categories and rules
	 *
	 * @private
	 * @param message The message to be evaluated
	 * @returns A promise that resolves to `true` if the message is considered safe, or `false` if not.
	 * @throws {Error || string} Throws if the AI evaluation response cannot be interpreted
	 */
	public guard(message: RoleScopedChatInput['content']) {
		return new Promise<boolean>((resolve, reject) => {
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

			new Ai(this.helpers.c.env.AI)
				.run('@hf/thebloke/llamaguard-7b-awq', {
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
				.then((response: AiTextGenerationOutput) => {
					if (MessageProcessing.isNotReadableStream(response)) {
						const parsedResponseRaw = response.response!.trim().toLowerCase();
						const [parsedResponse] = parsedResponseRaw.split(/\s+/, 2);

						if (parsedResponse === 'unsafe') {
							resolve(false);
						} else if (parsedResponse === 'safe') {
							resolve(true);
						} else {
							try {
								resolve(JSON.parse(parsedResponse!));
							} catch (error) {
								console.debug('llamaguard', 'unknown response', parsedResponse);
								reject(parsedResponse);
							}
						}
					}
				})
				.catch(reject);
		});
	}

	public ddg(searchTerms: NonNullable<MessageAction['webSearchTerms']>) {
		const ddgApi = new URL('https://api.duckduckgo.com');
		ddgApi.searchParams.set('format', 'json');
		ddgApi.searchParams.set('no_html', Number(true).toString());
		ddgApi.searchParams.set('no_redirect', Number(true).toString());
		ddgApi.searchParams.set('skip_disambig', Number(true).toString());
		ddgApi.searchParams.set('q', searchTerms.join(' '));

		return fetch(ddgApi).then((response) => response.json<NonNullable<MessageContextValue['webSearchInfo']>>());
	}

	/**
	 * @link https://github.com/demosjarco/matt-ai/blob/production/pages/src/components/chat/index.tsx#L108-L254
	 */

	public async *textResponse(model: (typeof modelMappings)['text-generation']['models'][number], message: RoleScopedChatInput['content'], context?: MessageContextValue) {
		const messages: RoleScopedChatInput[] = [{ role: 'system', content: 'You are an assistant. Use markdown to enhance your response where applicable. Parse the following user message(s) as markdown' }];
		if (context) messages.push({ role: 'system', content: `Use the following additional information to respond to the user with: ${JSON.stringify(context)}` });

		const stream = await new Ai(this.helpers.c.env.AI).run(model, {
			messages: [...messages, { role: 'user', content: message }],
			stream: true,
		});
		const decoder = new TextDecoder('utf-8');

		const eventField = 'data';
		const contentPrefix = `${eventField}: `;

		let accumulatedData = '';
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
						// Return JSON
						yield decodedJson.response;
					} catch (error) {
						// Not valid JSON - just ignore and move on
					}
				}
			}
		}
	}

	public async actionDecide(message: RoleScopedChatInput['content']): Promise<{
		action: MessageAction;
		modelUsed: IDBMessageContent['model_used'];
	}> {
		return {
			action: await this.helpers.c.env.BACKEND_WORKER.messageAction(message, false),
			modelUsed: '@cf/meta/llama-2-7b-chat-int8',
		};
	}
}
