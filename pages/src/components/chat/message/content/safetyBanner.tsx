import { component$ } from '@builder.io/qwik';
import { FaCircleExclamationSolid, FaTriangleExclamationSolid } from '@qwikest/icons/font-awesome';

export default component$((props: { knownBad: boolean }) => {
	if (props.knownBad) {
		return (
			<div class="mt-4 flex items-center rounded-lg border border-red-300 bg-transparent p-3 text-sm text-red-600 dark:border-red-600 dark:text-red-400" role="alert">
				<FaCircleExclamationSolid />
				<span class="sr-only">Error</span>
				<span class="ml-1">Message violates content policy.</span>
			</div>
		);
	} else {
		return (
			<div class="mt-4 flex items-center rounded-lg border border-yellow-300 bg-transparent p-3 text-sm text-yellow-600 dark:border-yellow-600 dark:text-yellow-300" role="alert">
				<FaTriangleExclamationSolid />
				<span class="sr-only">Warning</span>
				<span class="ml-1">Message potentially violates content policy.</span>
			</div>
		);
	}
});
