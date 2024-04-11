import { Slot, component$ } from '@builder.io/qwik';
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city';
import { routeAction$, routeLoader$, z, zod$ } from '@builder.io/qwik-city';
import { FaBarsSolid } from '@qwikest/icons/font-awesome';
import Sidebar from '../components/sidebar';
import { runningLocally } from '../extras';

export const useConversationId = routeLoader$(({ params }) => {
	const conversationId = Number(params['conversationId']);
	return isNaN(conversationId) ? undefined : conversationId;
});

export const useUserUpdateConversation = routeAction$(
	(data, { params }) => {
		return {
			cid: params['conversationId'] ? parseInt(params['conversationId']) : undefined,
			sanitizedMessage: z.string().trim().parse(data.message),
		};
	},
	zod$({
		message: z.string(),
	}),
);

export const useLocalEdgeCheck = routeLoader$(function ({ platform }) {
	return runningLocally(platform.request);
});

export const useUserLocale = routeLoader$(function ({ locale }) {
	return locale();
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

/**
 * @link https://qwik.dev/docs/middleware/#locale
 */
export const onRequest: RequestHandler = async ({ locale, request }) => {
	const acceptLanguage = request.headers.get('accept-language');
	const [languages] = acceptLanguage?.split(';') || ['?', '?'];
	const [preferredLanguage] = languages!.split(',');
	locale(preferredLanguage);
};

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

export default component$(() => {
	return (
		<>
			<div class="absolute top-0 w-full">
				<button data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" class="ms-3 mt-2 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:hidden dark:text-gray-400 dark:hover:bg-slate-700 dark:focus:ring-gray-600">
					<span class="sr-only">Open sidebar</span>
					<FaBarsSolid />
				</button>
			</div>

			<Sidebar />

			<div class="bg-slate-100 sm:ml-64 dark:bg-slate-900">
				<Slot />
			</div>
		</>
	);
});
