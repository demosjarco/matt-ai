import { component$ } from '@builder.io/qwik';
import { faGears } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';

export default component$(() => (
	<ul class="mt-4 space-y-2 pt-4 font-medium">
		<li>
			<a href="#" class="group flex items-center rounded-lg p-2 text-gray-900 transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
				<FaIcon icon={faGears} />
				<span class="ms-3">Controls area</span>
			</a>
		</li>
	</ul>
));
