import { component$, useServerData, useVisibleTask$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister, server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput } from '@cloudflare/ai/dist/tasks/text-generation';
import { initFlowbite } from 'flowbite';
import { FaStylesheet } from 'qwik-fontawesome';
import type { ExcludeType } from '../../worker/typechat/model';
import { RouterHead } from './components/router-head/router-head';
import { IDBConversationIndexes, IDBMessageIndexes } from './extras';
import type { EnvVars, IDBConversation, IDBMessage } from './types';

import './global.less';

const chatGenerator = server$(function () {
	const { AI } = this.platform.env as EnvVars;

	const ai = new Ai(AI);

	console.debug('Generating dummy chat message');
	return new Promise<{ created: Date; response: string }>((resolve, reject) =>
		ai
			.run('@cf/meta/llama-2-7b-chat-fp16', {
				max_tokens: 2500,
				messages: [{ role: 'system', content: 'You are a dev helper to simulate chat messages. Generate a sample chat message' }],
			})
			.then((staticResponse: ExcludeType<AiTextGenerationOutput, ReadableStream>) => {
				if (staticResponse.response) {
					const output: { created: Date; response: string } = {
						created: new Date(),
						response: staticResponse.response,
					};

					console.debug('Done generating dummy chat message');
					resolve(output);
				} else {
					console.debug('Failed generating dummy chat message');
					reject(staticResponse.response);
				}
			})
			.catch(reject),
	);
});

export default component$(() => {
	const nonce = useServerData<string | undefined>('nonce');

	useVisibleTask$(() => {
		initFlowbite();
	});

	return (
		<QwikCityProvider>
			<head>
				<meta charSet="utf-8" />
				<link rel="manifest" href="/manifest.json" />
				<RouterHead />
				<FaStylesheet />
			</head>
			<body lang="en">
				<RouterOutlet />
				<ServiceWorkerRegister nonce={nonce} />
				<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
			</body>
		</QwikCityProvider>
	);
});
