import { component$ } from '@builder.io/qwik';
import type { IDBMessageContent } from '../../../../IDB/schemas/v2';

export default component$<{ action: IDBMessageContent }>(({ action }) => (
	<>
		<p class="whitespace-pre-wrap text-balance font-mono text-sm font-normal text-gray-900 dark:text-white">{JSON.stringify(action, null, '\t')}</p>
		<hr />
	</>
));
