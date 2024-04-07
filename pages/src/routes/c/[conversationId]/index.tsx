import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import Chat from '../../../components/chat';
import { useConversationId } from '../../layout';

export default component$(() => {
	const conversationId = useConversationId();

	return (
		<>
			<Chat initialConversationId={conversationId.value} />
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
