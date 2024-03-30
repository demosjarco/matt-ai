import { component$ } from '@builder.io/qwik';
import { FaPaperPlaneRegular } from '@qwikest/icons/font-awesome';
import { useLocalEdgeCheck } from '../../../routes/layout';

export default component$(() => {
	const isLocal = useLocalEdgeCheck();

	return (
		<div class="ml-4">
			{isLocal.value ? <div class="cf-turnstile" data-sitekey="1x00000000000000000000BB" data-action="send-chat-message"></div> : <div class="cf-turnstile" data-sitekey="0x4AAAAAAAQ34m_klLCEVN51" data-action="send-chat-message"></div>}
			<button type="submit" class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
				<span class="relative left-[-2px]">
					<FaPaperPlaneRegular />
				</span>
			</button>
		</div>
	);
});
