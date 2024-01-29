import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Form, type DocumentHead } from '@builder.io/qwik-city';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import { sendMessage, useConversationId, useCreateConversation } from '../../routes/layout';
import Message from './Message';

export default component$(() => {
	const conversationId = useConversationId();
	const createConversation = useCreateConversation();
	const message = useSignal('');
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

		console.debug(conversationId.value);
	});

	const send = $((message: string) => {
		console.log('send message', message);
		sendMessage(message);

		messages.value = [...messages.value, { type: 'me', text: message }];
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
				{conversationId.value ? (
					<div class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
						<div>
							<button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
								</svg>
							</button>
						</div>
						<div class="ml-4 flex-grow">
							<div class="relative w-full">
								<input
									name="message"
									placeholder="Ask me anything"
									type="text"
									bind:value={message}
									class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
									onKeyDown$={async (event) => {
										if (event.key === 'Enter') {
											send(message.value);
										}
									}}
								/>
							</div>
						</div>
						<div class="ml-4">
							<button
								onClick$={() => {
									send(message.value);
								}}
								class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
								<span class="relative left-[-2px]">
									<FaIcon icon={faPaperPlane} />
								</span>
							</button>
						</div>
					</div>
				) : (
					<Form action={createConversation} class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
						<div>
							<button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
								</svg>
							</button>
						</div>
						<div class="ml-4 flex-grow">
							<div class="relative w-full">
								<input
									name="message"
									placeholder="Ask me anything"
									type="text"
									class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
									onKeyDown$={async (event) => {
										if (event.key === 'Enter') {
											createConversation.submit();
										}
									}}
								/>
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
				)}
			</div>
		</>
	);
});

export const head: DocumentHead = {
	title: 'Welcome to Qwik',
	meta: [
		{
			name: 'description',
			content: 'Qwik site description',
		},
	],
};
