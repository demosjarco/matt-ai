import { $, component$, useVisibleTask$ } from '@builder.io/qwik';
import { server$, type DocumentHead } from '@builder.io/qwik-city';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { initDrawers } from 'flowbite';
import { FaIcon } from 'qwik-fontawesome';
import Message from '../components/chat/Message';
import Sidebar from '../components/sidebar';

const performTask = server$(function () {
	console.log('Firing!', this.platform);
});

export default component$(() => {
	useVisibleTask$(() => {
		initDrawers();
	});

	const sendRequest = $(() => {
		console.log('sendRequest');
		performTask();
	});

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
				<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
					<div class="flex flex-col overflow-x-auto">
						<div class="flex flex-col">
							<div class="grid grid-cols-12 gap-y-2">
								<Message type="me" text="Hey, how are you today?" />
								<Message type="other" text="Good, and you?" />
							</div>
						</div>
					</div>
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
									onKeyDown$={async (event) => {
										if (event.key === 'Enter') {
											console.log('Enter');
											sendRequest();
										}
									}}
									placeholder="Ask me anything"
									type="text"
									class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
								/>
							</div>
						</div>
						<div class="ml-4">
							<button
								onClick$={async () => {
									console.log('Click');
									sendRequest();
								}}
								class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
								<span class="relative left-[-2px]">
									<FaIcon icon={faPaperPlane} />
								</span>
							</button>
						</div>
					</div>
				</div>
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
