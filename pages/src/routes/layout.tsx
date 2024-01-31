import { Slot, component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { routeAction$, routeLoader$, z, zod$, type DocumentHead } from '@builder.io/qwik-city';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import Sidebar from '../components/sidebar';
import { runningLocally } from '../extras';

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
	return params['conversationId'] ?? '';
});

export const useUserUpdateConversation = routeAction$(
	async (data, { params }) => {
		return {
			cid: Number(params['conversationId']) ?? undefined,
			sanitizedMessage: z.string().trim().parse(data.message),
		};
	},
	zod$({
		message: z.string(),
	}),
);

export const isLocalEdge = routeLoader$(function ({ platform }) {
	return runningLocally(platform.request);
});

export const getUserLocale = routeLoader$(function ({ request }) {
	const acceptLanguage = request.headers.get('Accept-Language');
	if (!acceptLanguage) return null;

	const languages = acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, weight] = lang.trim().split(';q=');
			return {
				code: code,
				weight: weight ? parseFloat(weight) : 1,
			};
		})
		.sort((a, b) => b.weight - a.weight);

	if (languages.length > 0) {
		const topLanguage = languages[0]!.code;
		return topLanguage !== '*' ? topLanguage : null;
	} else {
		return null;
	}
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
