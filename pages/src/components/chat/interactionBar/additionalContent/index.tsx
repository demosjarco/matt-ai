import { component$ } from '@builder.io/qwik';
import { FaFileAudioRegular, FaFileImageRegular, FaPaperclipSolid } from '@qwikest/icons/font-awesome';

export default component$(() => (
	<div>
		<div data-dial-init class="group fixed bottom-6 end-6">
			<div id="speed-dial-menu-click" class="mb-4 flex hidden flex-col items-center space-y-2">
				<button type="button" data-tooltip-target="tooltip-audio" data-tooltip-placement="left" class="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-400">
					<FaFileAudioRegular />
					<span class="sr-only">Audio</span>
				</button>
				<div id="tooltip-audio" role="tooltip" class="tooltip invisible absolute z-10 inline-block w-auto rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700">
					Audio
					<div class="tooltip-arrow" data-popper-arrow></div>
				</div>
				<button type="button" data-tooltip-target="tooltip-image" data-tooltip-placement="left" class="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-400">
					<FaFileImageRegular />
					<span class="sr-only">Image</span>
				</button>
				<div id="tooltip-image" role="tooltip" class="tooltip invisible absolute z-10 inline-block w-auto rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700">
					Image
					<div class="tooltip-arrow" data-popper-arrow></div>
				</div>
			</div>
			<button type="button" data-dial-toggle="speed-dial-menu-click" data-dial-trigger="click" aria-controls="speed-dial-menu-click" aria-expanded="false" class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
				<FaPaperclipSolid />
				<span class="sr-only">Add addtional content</span>
			</button>
		</div>
	</div>
));
