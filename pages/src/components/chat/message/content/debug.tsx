import { component$, useTask$ } from '@builder.io/qwik';
import type { IDBMessageContent } from '../../../../IDB/schemas/v3';

export default component$<{ action?: IDBMessageContent }>(({ action }) => {
	useTask$(async ({ track }) => {
		track(() => action);
	});

	if (action) {
		return (
			<>
				<p class="whitespace-pre-wrap text-balance font-mono text-sm font-normal text-gray-900 dark:text-white">{JSON.stringify(action, null, '\t')}</p>
				<hr />
			</>
		);
	} else {
		return <></>;
	}
});
