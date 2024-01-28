import { component$ } from '@builder.io/qwik';
import Banner from './banner';
import Controls from './controls';
import History from './history';

export default component$(() => (
	<aside id="separator-sidebar" class="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full transition-transform sm:translate-x-0" aria-label="Sidebar">
		<div class="h-full overflow-y-auto bg-gray-50 px-3 py-4 dark:bg-gray-800">
			<History />
			<Banner />
			<Controls />
		</div>
	</aside>
));
