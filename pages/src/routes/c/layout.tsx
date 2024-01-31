import { type RequestHandler } from '@builder.io/qwik-city';
import type { ChatFormSubmit, EnvVars } from '../../types';

export const onPost: RequestHandler = async ({ platform, request, parseBody, send }) => {
	const incomingFormData = (await parseBody()) as ChatFormSubmit;

	if (incomingFormData) {
		if (incomingFormData['cf-turnstile-response']) {
			const ip = request.headers.get('CF-Connecting-IP');

			const formData = new FormData();
			formData.append('secret', (platform.env as EnvVars).TURNSTILE_SECRET_KEY);
			formData.append('response', incomingFormData['cf-turnstile-response']);
			if (ip) formData.append('remoteip', ip);

			let turnstileSuccess: boolean = false;

			try {
				const result = await fetch(new URL('https://challenges.cloudflare.com/turnstile/v0/siteverify'), {
					method: 'POST',
					body: formData,
				});
				const outcome: { success: boolean } = await result.json();
				turnstileSuccess = outcome.success;
			} catch (error) {
				console.error('Turnstile verify fail', error);
				throw send(500, 'Internal Server Error');
			}

			if (!turnstileSuccess) {
				throw send(403, 'Forbidden');
			}
		} else {
			// Turnstile not present
			console.error('No turnstile present', incomingFormData['cf-turnstile-response']);
			throw send(403, 'Forbidden');
		}
	} else {
		// Not valid form
		console.error('Bad form data', incomingFormData);
		throw send(400, 'Bad Request');
	}
};
