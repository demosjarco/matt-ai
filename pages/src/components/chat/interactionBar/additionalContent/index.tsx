import { component$ } from '@builder.io/qwik';
import { FaPaperclipSolid } from '@qwikest/icons/font-awesome';

export default component$(() => (
	<div>
		<button class="flex cursor-not-allowed items-center justify-center text-gray-400 hover:text-gray-600">
			<FaPaperclipSolid />
		</button>
	</div>
));
