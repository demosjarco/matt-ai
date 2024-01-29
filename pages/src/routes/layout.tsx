import { Slot, component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { routeAction$, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import Sidebar from '../components/sidebar';

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

export const useSendMessage = routeAction$(async (data, { params, redirect }) => {
	console.log(data);

	if (params['conversationId']) {
		return;
	}

	throw redirect(307, '/c/123');
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
	title: 'Welcome to M.A.T.T.',
	meta: [
		{
			name: 'description',
			content: 'M.A.T.T.',
		},
	],
};
