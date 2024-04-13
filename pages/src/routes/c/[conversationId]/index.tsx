import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import Chat from '../../../components/chat';

export default component$(() => {
	return (
		<>
			<Chat />
		</>
	);
});

export const head: DocumentHead = ({ head, params }) => {
	const title = `${head.title} - ${params['conversationId']}`;

	return {
		title,
		meta: [
			...head.meta,
			{
				property: 'og:title',
				content: title,
			},
		],
	};
};
