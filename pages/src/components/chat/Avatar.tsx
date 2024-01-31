import { component$ } from '@builder.io/qwik';

export default component$((props: { username: string }) => {
	return (
		<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500">
			{props.username
				.split(' ')
				.map((word) => word.charAt(0).toUpperCase())
				.join('')}
		</div>
	);
});
