import type { RoleScopedChatInput } from '@cloudflare/ai/dist/tasks/text-generation';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import { CFBase } from '../helpers/base.mjs';
import type { IDBMessageContent } from '../types';

export class MessageProcessing extends CFBase {
	protected preProcess(message: RoleScopedChatInput['content']) {
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

	public process(message: string) {
		return new Promise<Awaited<ReturnType<typeof this.preProcess>>>((resolve, reject) =>
			this.preProcess(message)
				.then(({ action, modelUsed }) => resolve({ action, modelUsed }))
				.catch(reject),
		);
	}
}
