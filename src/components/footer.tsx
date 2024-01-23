import { component$ } from '@builder.io/qwik';

export default component$(() => (
	<footer class="fixed bottom-0 left-0 z-20 w-full border-t border-gray-200 bg-white p-4 shadow md:flex md:items-center md:justify-between md:p-6 dark:border-gray-600 dark:bg-gray-800">
		<span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">
			© 2023{' '}
			<a href="https://flowbite.com/" class="hover:underline">
				Flowbite™
			</a>
			. All Rights Reserved.
		</span>
		<ul class="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-500 sm:mt-0 dark:text-gray-400">
			<li>
				<a href="#" class="me-4 hover:underline md:me-6">
					About
				</a>
			</li>
		</ul>
	</footer>
));
