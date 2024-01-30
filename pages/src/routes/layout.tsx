import { Slot, component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { routeAction$, routeLoader$, server$, type DocumentHead } from '@builder.io/qwik-city';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import type { MessageAction } from '../../../worker/aiTypes/MessageAction';
import Sidebar from '../components/sidebar';
import { runningLocally } from '../extras';
import type { ChatFormSubmit, EnvVars } from '../types';

export const onGet: RequestHandler = async ({ cacheControl }) => {
	// Control caching for this request for best performance and to reduce hosting costs:
	// https://qwik.builder.io/docs/caching/
	cacheControl({
		// Always serve a cached response by default, up to a week stale
		staleWhileRevalidate: 60 * 60 * 24 * 7,
		// Max once every 5 seconds, revalidate on the server to get a fresh version of this page
		maxAge: 5,
	});
};

export const useConversationId = routeLoader$<string>(({ params }) => {
	return params['conversationId'] || '';
});

export const useUserUpdateConversation = routeAction$(async (data, { params, request, platform }) => {
	const cid: Number | undefined = Number(params['conversationId']) ?? undefined;
	const incomingFormData = data as unknown as ChatFormSubmit;
	console.debug('Incoming Form Data', incomingFormData, 'for conversation', cid);

	if (incomingFormData.message) {
		const graphqlUrl = new URL('/graphql', request.url);
		const response = await (platform.env as EnvVars).BACKEND_WORKER.fetch(graphqlUrl.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			// @ts-expect-error
			cf: request.cf ?? {},
			body: JSON.stringify({
				query: 'query ($message: NonEmptyString!, $longer: Boolean!) { messageAction(message: $message, longer: $longer) }',
				variables: {
					message: incomingFormData.message,
					longer: false,
				},
			}),
		});
		const json = await response.json<{ data: { messageAction: MessageAction } }>();
		console.log('I should do:', JSON.stringify(json, null, '\t'));
	} else {
		throw new Error('Message is required');
	}
});

export const sendMessage = server$(function (message: string) {
	console.log(1, 'send message', message);
});

export const isLocalEdge = routeLoader$(function ({ platform }) {
	return runningLocally(platform.request);
});

export default component$(() => {
	return (
		<>
			<div class="absolute top-0 w-full">
				<button data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" class="ms-3 mt-2 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
					<span class="sr-only">Open sidebar</span>
					<FaIcon icon={faBars} />
				</button>
			</div>

			<Sidebar />

			<div class="bg-slate-100 sm:ml-64 dark:bg-gray-900">
				<Slot />
			</div>
		</>
	);
});

export const head: DocumentHead = {
	title: 'M.A.T.T. AI',
	meta: [
		{
			name: 'description',
			content: 'M.A.T.T.',
		},
	],
};
