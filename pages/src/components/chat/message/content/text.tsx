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
				<div class="flex w-full max-w-[480px] items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-full max-w-[400px] items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-80 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-full max-w-[480px] items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-full max-w-[440px] items-center">
					<div class="ms-2 h-2.5 w-32 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
				</div>
				<div class="flex w-full max-w-[360px] items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-80 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<span class="sr-only">Loading...</span>
			</div>
		);
	}
});
