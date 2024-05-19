import type { QRL } from '@builder.io/qwik';
import { component$ } from '@builder.io/qwik';

export default component$<{ id: number; title: string; onClick$: QRL<(id: number) => void> }>(({ id, title, onClick$ }) => {
	return (
		<li
			onClick$={() => {
				onClick$(id);
			}}>
			<div class="group flex items-center rounded-lg py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-slate-700">
				<span class="ms-3">{title}</span>
			</div>
		</li>
	);
});
