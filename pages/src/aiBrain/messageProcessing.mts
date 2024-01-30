import { MessageAction } from '../../../worker/aiTypes/MessageAction';
import { CFBase } from '../helpers/base.mjs';

export class MessageProcessing extends CFBase {
	public preProcess(message: string) {
		return new Promise<void>((resolve, reject) => {
			function onSuccess(messageAction: MessageAction) {
				console.log('I should do:', JSON.stringify(messageAction, null, '\t'));
				resolve();
			}

			const query = 'query ($message: NonEmptyString!, $longer: Boolean!) { messageAction(message: $message, longer: $longer) }';
			this.fetchBackend({
				query,
				variables: {
					message: message,
					longer: true,
				},
			})
				.then((response) => onSuccess((response as { messageAction: MessageAction }).messageAction))
				.catch(() =>
					this.fetchBackend({
						query,
						variables: {
							message: message,
							longer: false,
						},
					})
						.then((response) => onSuccess((response as { messageAction: MessageAction }).messageAction))
						.catch(reject),
				);
		});
	}
}
