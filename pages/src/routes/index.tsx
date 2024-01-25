import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import Sidebar from '../components/sidebar';

export default component$(() => {
	return (
		<>
			<button data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" class="ms-3 mt-2 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
				<span class="sr-only">Open sidebar</span>
				<svg class="h-6 w-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
					<path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
				</svg>
			</button>

			<Sidebar />

			<div class="sm:ml-64">
				<div class="h-screen rounded-lg">
					<div class="flex h-full flex-auto flex-col">
						<div class="flex h-full flex-auto flex-shrink-0 flex-col rounded-2xl bg-gray-100">
							<div class="mb-4 flex h-full flex-col overflow-x-auto">
								<div class="flex h-full flex-col">
									<div class="grid grid-cols-12 gap-y-2">
										<div class="col-start-1 col-end-8 rounded-lg p-3">
											<div class="flex flex-row items-center">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
													<div>Hey How are you today?</div>
												</div>
											</div>
										</div>
										<div class="col-start-1 col-end-8 rounded-lg p-3">
											<div class="flex flex-row items-center">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
													<div>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel ipsa commodi illum saepe numquam maxime asperiores voluptate sit, minima perspiciatis.</div>
												</div>
											</div>
										</div>
										<div class="col-start-6 col-end-13 rounded-lg p-3">
											<div class="flex flex-row-reverse items-center justify-start">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative mr-3 rounded-xl bg-indigo-100 px-4 py-2 text-sm shadow">
													<div>I'm ok what about you?</div>
												</div>
											</div>
										</div>
										<div class="col-start-6 col-end-13 rounded-lg p-3">
											<div class="flex flex-row-reverse items-center justify-start">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative mr-3 rounded-xl bg-indigo-100 px-4 py-2 text-sm shadow">
													<div>Lorem ipsum dolor sit, amet consectetur adipisicing. ?</div>
												</div>
											</div>
										</div>
										<div class="col-start-1 col-end-8 rounded-lg p-3">
											<div class="flex flex-row items-center">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
													<div>Lorem ipsum dolor sit amet !</div>
												</div>
											</div>
										</div>
										<div class="col-start-6 col-end-13 rounded-lg p-3">
											<div class="flex flex-row-reverse items-center justify-start">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative mr-3 rounded-xl bg-indigo-100 px-4 py-2 text-sm shadow">
													<div>Lorem ipsum dolor sit, amet consectetur adipisicing. ?</div>
													<div class="absolute bottom-0 right-0 -mb-5 mr-2 text-xs text-gray-500">Seen</div>
												</div>
											</div>
										</div>
										<div class="col-start-1 col-end-8 rounded-lg p-3">
											<div class="flex flex-row items-center">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
													<div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis, in.</div>
												</div>
											</div>
										</div>
										<div class="col-start-1 col-end-8 rounded-lg p-3">
											<div class="flex flex-row items-center">
												<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">A</div>
												<div class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
													<div class="flex flex-row items-center">
														<button class="flex h-8 w-10 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-800">
															<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
															</svg>
														</button>
														<div class="ml-4 flex flex-row items-center space-x-px">
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-4 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-10 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-10 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-12 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-10 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-6 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-5 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-4 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-3 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-10 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-10 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-1 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-1 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-8 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-2 w-1 rounded-lg bg-gray-500"></div>
															<div class="h-4 w-1 rounded-lg bg-gray-500"></div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="flex h-16 w-full flex-row items-center rounded-xl bg-white px-4">
								<div>
									<button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
										</svg>
									</button>
								</div>
								<div class="ml-4 flex-grow">
									<div class="relative w-full">
										<input type="text" class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none" />
										<button class="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-gray-400 hover:text-gray-600">
											<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</button>
									</div>
								</div>
								<div class="ml-4">
									<button class="flex flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 py-1 text-white hover:bg-indigo-600">
										<span>Send</span>
										<span class="ml-2">
											<svg class="-mt-px h-4 w-4 rotate-45 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
											</svg>
										</span>
									</button>
								</div>
							</div>
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
