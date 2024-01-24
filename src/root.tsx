import { component$, useServerData, useVisibleTask$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister, server$ } from '@builder.io/qwik-city';
import { initFlowbite } from 'flowbite';
import { FaStylesheet } from 'qwik-fontawesome';
import { RouterHead } from './components/router-head/router-head';

import './global.less';
import { TypeChatTest } from './typechatTest.mjs';

export const simpleServerCall = server$(async function () {
	await new TypeChatTest(this.platform).testing();
});

export default component$(() => {
	const nonce = useServerData<string | undefined>('nonce');

	useVisibleTask$(() => {
		initFlowbite();
	});

	useVisibleTask$(async () => {
		await simpleServerCall();
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
			</body>
		</QwikCityProvider>
	);
});
