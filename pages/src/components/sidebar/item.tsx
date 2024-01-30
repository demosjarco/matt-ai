import type { QRL } from '@builder.io/qwik';
import { component$ } from '@builder.io/qwik';

export default component$((props: { id: number; title: string; onClick$: QRL<(id: number) => void> }) => {
	return (
		<li
			onClick$={() => {
				props.onClick$(props.id);
			}}>
			<div class="group flex items-center rounded-lg py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
				<span class="ms-3">{props.title}</span>
			</div>
		</li>
	);
});
