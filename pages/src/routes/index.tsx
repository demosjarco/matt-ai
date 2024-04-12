import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import Chat from '../components/chat';
import { useConversationId, useUserLocale } from './layout';

export default component$(() => {
	const conversationId = useConversationId();
	const userLocale = useUserLocale();
	console.debug('GETTING LOCALE', 0, userLocale.value);

	return (
		<>
			<Chat userLocale={JSON.stringify(userLocale.value)} initialConversationId={conversationId.value} />
		</>
	);
});

export const head: DocumentHead = ({ url }) => {
	const title = 'M.A.T.T. AI';
	const description = 'Magically All The Things AI';

	return {
		title,
		meta: [
			{
				name: 'description',
				content: description,
			},
			{
				name: 'theme-color',
				media: '#1E293B',
			},
			/**
			 * OpenGraph
			 * @url https://ogp.me/
			 */
			{
				property: 'og:title',
				content: title,
			},
			{
				property: 'og:type',
				content: 'website',
			},
			{
				property: 'og:url',
				content: url.toString(),
			},
			{
				name: 'og:description',
				content: description,
			},
			{
				name: 'og:locale',
				content: 'en_US',
			},
			{
				name: 'og:site_name ',
				content: title,
			},
		],
	};
};
