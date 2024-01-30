import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Form, type DocumentHead } from '@builder.io/qwik-city';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import { isLocalEdge, useConversationId, useUserUpdateConversation } from '../../routes/layout';
import Message from './Message';

export default component$(() => {
	const isLocal = isLocalEdge();
	const conversationId = useConversationId();
	const createConversation = useUserUpdateConversation();
	const formRef = useSignal<HTMLFormElement>();

	const messages = useSignal<
		{
			type: 'me' | 'other';
			text: string;
		}[]
	>([]);

	useVisibleTask$(({ track }) => {
		track(() => conversationId.value);

		if (!conversationId.value) {
			return;
		}

		messages.value = [];

		console.debug(conversationId.value);
	});

	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<div class="grid grid-cols-12 gap-y-2">
							<div class="text-3xl text-white">{conversationId.value}</div>
							{messages.value.map((message, index) => {
								return <Message key={`message-${index}`} type={message.type} text={message.text} />;
							})}
						</div>
					</div>
				</div>
				<Form
					action={createConversation}
					ref={formRef}
					onSubmitCompleted$={(event) => {
						console.log('ASU DUDE', event);
						window.history.replaceState({}, '', '/c/123');
						if (formRef.value) {
							formRef.value.reset();
						}
					}}
					class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
					<div>
						<button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
							<FaIcon icon={faPaperclip} />
						</button>
					</div>
					<div class="ml-4 flex-grow">
						<div class="relative w-full">
							<input
								name="message"
								placeholder="Ask me anything"
								type="text"
								spellcheck={true}
								autoCapitalize="on"
								// @ts-ignore
								autocorrect="on"
								enterKeyHint="send"
								class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
							/>
							{isLocal.value ? <div class="cf-turnstile" data-sitekey="1x00000000000000000000BB"></div> : <div class="cf-turnstile" data-sitekey="0x4AAAAAAAQ34m_klLCEVN51"></div>}
						</div>
					</div>
					<div class="ml-4">
						<button type="submit" class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
							<span class="relative left-[-2px]">
								<FaIcon icon={faPaperPlane} />
							</span>
						</button>
					</div>
				</Form>
			</div>
		</>
	);
});

export const head: DocumentHead = {
	title: 'M.A.T.T. AI',
	meta: [
		{
			name: 'description',
			content: 'Qwik site description',
		},
	],
};
