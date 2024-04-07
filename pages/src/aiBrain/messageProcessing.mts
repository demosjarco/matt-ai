import type { RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import type { IDBMessageContent } from '../IDB/schemas/v1';
import { CFBase } from '../helpers/base.mjs';

export class MessageProcessing extends CFBase {
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
}
