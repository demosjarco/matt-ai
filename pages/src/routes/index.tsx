import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import Chat from '../components/chat/Chat';

export default component$(() => {
	return (
		<>
			<Chat />
		</>
	);
});

export const head: DocumentHead = {
	title: 'M.A.T.T. AI',
	meta: [
		{
			name: 'description',
			content: 'Qwik site description',
		},
	],
};
