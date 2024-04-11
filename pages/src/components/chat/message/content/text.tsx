import { component$ } from '@builder.io/qwik';
import type { IDBMessageContentText } from '../../../../IDB/schemas/v2';

export default component$((props: { text?: IDBMessageContentText }) => {
	if (props.text) {
		return <p class="whitespace-pre-wrap text-balance text-sm font-normal text-gray-900 dark:text-white">{props.text.trim()}</p>;
	} else {
		return (
			<div role="status" class="w-full animate-pulse space-y-2.5">
				<div class="flex w-full items-center">
					<div class="h-2.5 w-1/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-11/12 items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-4/5 items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-11/12 items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-5/6 items-center">
					<div class="ms-2 h-2.5 w-1/4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
				</div>
				<div class="flex w-2/3 items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-11/12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<span class="sr-only">Loading...</span>
			</div>
		);
	}
});
