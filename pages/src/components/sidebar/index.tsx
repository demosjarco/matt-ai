import { component$ } from '@builder.io/qwik';
import Banner from './banner';
import Controls from './controls';
import History from './history';

export default component$(() => (
	<aside id="default-sidebar" class="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full transition-transform sm:translate-x-0" aria-label="Sidebar">
		<button type="button" data-drawer-hide="default-sidebar" aria-controls="default-sidebar" class="absolute end-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white">
			<svg class="h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
				<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
			</svg>
			<span class="sr-only">Close menu</span>
		</button>
		<div class="flex h-full flex-col justify-between overflow-y-auto bg-gray-50 px-3 py-4 dark:bg-gray-800">
			<History />
			<div>
				<Banner />
				<Controls />
			</div>
		</div>
	</aside>
));
