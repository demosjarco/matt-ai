import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { FaPaperPlaneRegular } from '@qwikest/icons/font-awesome';
import { useTurnstileKey } from '../../../routes/layout';

export default component$(() => {
	const turnstileSiteKey = useTurnstileKey();
	const turnstileWidget = useSignal<HTMLDivElement>();

	useVisibleTask$(({ track, cleanup }) => {
		track(() => turnstileWidget.value);

		if (turnstileWidget.value) {
			window.turnstile.render(turnstileWidget.value, {
				sitekey: turnstileSiteKey.value,
				action: 'send-chat-message',
				'error-callback': (errorCode) => {
					console.error('turnstile', 'error-callback', errorCode);
					window.turnstile.reset(turnstileWidget.value);
				},
			});
		}

		cleanup(() => window.turnstile.remove(turnstileWidget.value));
	});

	return (
		<div class="ml-4">
			<div ref={turnstileWidget}></div>
			<button type="submit" class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
				<span class="relative left-[-2px]">
					<FaPaperPlaneRegular />
				</span>
				<span class="sr-only">Send message</span>
			</button>
		</div>
	);
});
