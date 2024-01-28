import { component$ } from '@builder.io/qwik';

export default component$(() => (
	<div id="dropdown-cta" class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900" role="alert">
		<div class="mb-3 flex items-center">
			<span class="me-2 rounded bg-orange-100 px-2.5 py-0.5 text-sm font-semibold text-orange-800 dark:bg-orange-200 dark:text-orange-900">Beta</span>
			{/* <button type="button" class="-mx-1.5 -my-1.5 ms-auto inline-flex h-6 h-6 w-6 w-6 items-center justify-center rounded-lg bg-blue-50 p-1 text-blue-900 hover:bg-blue-200 focus:ring-2 focus:ring-blue-400 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800" data-dismiss-target="#dropdown-cta" aria-label="Close">
				<span class="sr-only">Close</span>
				<svg class="h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
					<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
				</svg>
			</button> */}
		</div>
		<p class="mb-3 text-sm text-blue-800 dark:text-blue-400">M.A.T.T. (Magically All The Things) is currently in a BETA phase. This open source is meant to provide an exemplar scalable way to create AIs that can perform complex tasks.</p>
	</div>
));
