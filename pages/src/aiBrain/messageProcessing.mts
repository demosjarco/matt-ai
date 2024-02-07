import { Ai } from '@cloudflare/ai';
import type { RoleScopedChatInput } from '@cloudflare/ai/dist/tasks/text-generation';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import { CFBase } from '../helpers/base.mjs';
import type { IDBMessageContent } from '../types';

export class MessageProcessing extends CFBase {
	public preProcess(message: RoleScopedChatInput['content']) {
		return new Promise<{
			action: MessageAction;
			modelUsed: IDBMessageContent['model_used'];
		}>((resolve, reject) => {
			const query = 'query ($message: NonEmptyString!, $longer: Boolean!) { messageAction(message: $message, longer: $longer) }';
			this.fetchBackend({
				query,
				variables: {
					message: message,
					longer: true,
				},
			})
				.then((response) =>
					resolve({
						action: (response as { messageAction: MessageAction }).messageAction,
						modelUsed: '@cf/meta/llama-2-7b-chat-fp16',
					}),
				)
				.catch(() =>
					this.fetchBackend({
						query,
						variables: {
							message: message,
							longer: false,
						},
					})
						.then((response) =>
							resolve({
								action: (response as { messageAction: MessageAction }).messageAction,
								modelUsed: '@cf/meta/llama-2-7b-chat-int8',
							}),
						)
						.catch(reject),
				);
		});
	}

	public async *generateResponse(model: Parameters<Ai['run']>[0], messages: RoleScopedChatInput[]) {
		const stream = await (new Ai(this.helpers.c.env.AI).run(model, { messages, stream: true }) as Promise<ReadableStream>);

		const eventField = 'data';
		const contentPrefix = `${eventField}: `;

		let accumulatedData = '';
		// @ts-expect-error
		for await (const chunk of stream) {
			const decodedChunk = new TextDecoder('utf-8').decode(chunk, { stream: true });
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

	public process(message: string) {
		return new Promise<Awaited<ReturnType<typeof this.preProcess>>>((resolve, reject) =>
			this.preProcess(message)
				.then(({ action, modelUsed }) => resolve({ action, modelUsed }))
				.catch(reject),
		);
	}
}
