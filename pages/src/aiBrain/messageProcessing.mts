import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import type { IDBMessage, IDBMessageContent } from '../IDB/schemas/v2';
import { CFBase } from '../helpers/base.mjs';

export class MessageProcessing extends CFBase {
	static isNotReadableStream(output: AiTextGenerationOutput): output is { response?: string } {
		return !(output instanceof ReadableStream);
	}

	public async preProcess(message: RoleScopedChatInput['content']): Promise<{
		action: MessageAction;
		modelUsed: IDBMessageContent['model_used'];
	}> {
		try {
			return {
				action: await this.helpers.c.env.BACKEND_WORKER.messageAction(message, true),
				modelUsed: '@cf/meta/llama-2-7b-chat-fp16',
			};
		} catch (error) {
			return {
				action: await this.helpers.c.env.BACKEND_WORKER.messageAction(message, false),
				modelUsed: '@cf/meta/llama-2-7b-chat-int8',
			};
		}
	}

	private guard(message: Parameters<typeof this.messageActionChain>[0]) {
		return new Promise<true | undefined>((resolve, reject) => {
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
							content: '<BEGIN UNSAFE CONTENT CATEGORIES>\n' + `${JSON.stringify(unsafeCategories)}\n` + '<END UNSAFE CONTENT CATEGORIES>',
						},
						{
							role: 'user',
							content: '<BEGIN CONVERSATION>\n' + `${message}\n` + '<END CONVERSATION>',
						},
					],
				})
				.then((response: AiTextGenerationOutput) => {
					if (MessageProcessing.isNotReadableStream(response)) {
						const parsedResponse = response.response?.trim().toLowerCase();

						if (parsedResponse === 'safe') {
							resolve(true);
						} else if (parsedResponse === 'unsafe') {
							reject(false);
						} else {
							try {
								JSON.parse(parsedResponse!) ? resolve(true) : reject(false);
							} catch (error) {
								console.debug('llamaguard', 'unknown response', parsedResponse);
								resolve(undefined);
							}
						}
					}
				})
				.catch(reject);
		});
	}

	public messageActionChain(message: RoleScopedChatInput['content'], uiMessage: IDBMessage) {
		return new Promise((resolve, reject) => {
			uiMessage.status = ['filtering'];

			Promise.all([this.guard(message)])
				.then(resolve)
				.catch(reject);
		});
	}
}
