import { component$ } from '@builder.io/qwik';

export default component$(() => (
	<div id="dropdown-cta" class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900" role="alert">
		<div class="mb-3 flex items-center">
			<span class="me-2 rounded bg-orange-100 px-2.5 py-0.5 text-sm font-semibold text-orange-800 dark:bg-orange-200 dark:text-orange-900">Beta</span>
		</div>
		<p class="mb-3 text-sm text-blue-800 dark:text-blue-400">This open source project is meant to showcase everything possible with Cloudflare Workers AI, but in a seamless single natural conversation.</p>
		<a class="pr-1 text-sm font-medium text-blue-800 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" href="https://github.com/demosjarco/matt-ai" target="_blank">
			GitHub
		</a>
		<a class="pl-1 text-sm font-medium text-orange-800 underline hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300" href="https://ai.cloudflare.com" target="_blank">
			Workers AI
		</a>
		<p class="mt-3 text-sm text-blue-800 dark:text-blue-400">
			Made with love in my spare time at
			<a class="pl-1 text-sm font-medium text-blue-800 underline hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" href="https://chainfuse.ai/" target="_blank">
				Chainfuse
			</a>
		</p>
	</div>
));
