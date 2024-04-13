import { component$, useTask$ } from '@builder.io/qwik';
import type { IDBMessageContentCard } from '../../../../IDB/schemas/v2';

export default component$((props: { card?: IDBMessageContentCard }) => {
	useTask$(({ track }) => {
		// Needs to be retracked
		track(() => props.card);
	});

	if (props.card) {
		return <></>;
	} else {
		return (
			<div role="status" class="w-full animate-pulse space-y-4 divide-y divide-gray-200 rounded border border-gray-200 p-4 pb-4 shadow md:p-6 dark:divide-gray-700 dark:border-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<div class="mb-2.5 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-500"></div>
						<div class="h-2 w-1/4 rounded-full bg-gray-200 dark:bg-gray-600"></div>
					</div>
					<div class="h-2.5 w-1/12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
				</div>
				<span class="sr-only">Loading...</span>
			</div>
		);
	}
});
