import { Slot, component$, useContextProvider, useStore } from '@builder.io/qwik';
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city';
import { routeAction$, routeLoader$, server$, z, zod$ } from '@builder.io/qwik-city';
import { FaBarsSolid } from '@qwikest/icons/font-awesome';
import Sidebar from '../components/sidebar';
import { runningLocally } from '../extras';
import { ConversationsContext, MessagesContext } from '../extras/context';
import { TurnstileDummySecretkey, TurnstileDummySitekey, type ChatFormSubmit, type TurnstileResponse } from '../types';

export const useSetTurnstileIdempotency = routeAction$(
	(data, { sharedMap }) => {
		sharedMap.set('turnstileIdempotency', data.idempotencyKey);
	},
	zod$({
		idempotencyKey: z.string().uuid(),
	}),
);

export const useFormSubmissionWithTurnstile = routeAction$(
	(data, { params, fail, status }) => {
		if (status() >= 200 && status() < 300) {
			return {
				cid: params['conversationId'] ? parseInt(params['conversationId']) : undefined,
				sanitizedMessage: z.string().trim().parse(data.message),
			};
		} else {
			return fail(status(), {
				cid: params['conversationId'] ? parseInt(params['conversationId']) : undefined,
			});
		}
	},
	zod$({
		message: z.string(),
	}),
);

export const useTurnstileKey = routeLoader$(({ platform, request }) => {
	if (runningLocally(request)) {
		return TurnstileDummySitekey.Invisible.passes;
	} else {
		return platform.env.TURNSTILE_SITE_KEY;
	}
});
export const useLocalEdgeCheck = routeLoader$(({ request }) => {
	return runningLocally(request);
});
export const serverNodeEnv = server$(function () {
	return this.platform.env.NODE_ENV;
});

export const serverParams = server$(function () {
	return this.params;
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

export const onPost: RequestHandler = async ({ platform, request, parseBody, status, sharedMap }) => {
	const incomingFormData = (await parseBody()) as ChatFormSubmit | null;

	if (incomingFormData) {
		if (incomingFormData['cf-turnstile-response']) {
			const ip = request.headers.get('CF-Connecting-IP');

			const formData = new FormData();
			if (runningLocally(request)) {
				formData.set('secret', TurnstileDummySecretkey.passes);
			} else {
				formData.set('secret', platform.env.TURNSTILE_SECRET_KEY);
			}
			formData.set('response', incomingFormData['cf-turnstile-response']);
			if (ip) formData.set('remoteip', ip);
			if (sharedMap.has('turnstileIdempotency')) formData.set('idempotency_key', sharedMap.get('turnstileIdempotency'));

			let turnstileSuccess: boolean = false;

			try {
				const result = await fetch(new URL('https://challenges.cloudflare.com/turnstile/v0/siteverify'), {
					method: 'POST',
					body: formData,
				});
				if (result.ok) {
					const outcome = await result.json<TurnstileResponse>();
					turnstileSuccess = outcome.success;
				} else {
					status(result.status);
				}
			} catch (error) {
				console.error('Turnstile verify fail', error);
				status(500);
			}

			status(turnstileSuccess ? 200 : 403);
		} else {
			// Turnstile not present
			console.error('No turnstile present', incomingFormData['cf-turnstile-response']);
			status(401);
		}
	} else {
		// Not valid form
		console.error('Bad form data', incomingFormData);
		status(400);
	}
};

export default component$(() => {
	// Setup contexts
	useContextProvider(ConversationsContext, useStore([], { deep: true }));
	useContextProvider(MessagesContext, useStore({}, { deep: true }));

	// UI
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
