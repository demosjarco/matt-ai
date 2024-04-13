import { component$, useContext } from '@builder.io/qwik';
import type { IDBMessage } from '../../../../IDB/schemas/v2';
import { MessagesContext } from '../../../../extras/context';
import Card from './card';
import Image from './image';
import SafetyBanner from './safetyBanner';
import Text from './text';

export default component$<{ id: IDBMessage['key'] }>((props) => {
	const messageHistory = useContext(MessagesContext);
	const message = messageHistory[props.id!]!;

	const isMe = message.role === 'user' ? true : false;

	const actionIndex = message.content.findIndex((record) => 'action' in record);
	const textContentIndex = message.content.findIndex((record) => 'text' in record);
	const imageContentIndex = message.content.findIndex((record) => 'image' in record);
	const cardContentIndex = message.content.findIndex((record) => 'card' in record);

	if (message.status === false || (Array.isArray(message.status) && ((message.status as Exclude<IDBMessage['status'], boolean>).indexOf('filtering') > -1 || (message.status as Exclude<IDBMessage['status'], boolean>).indexOf('deciding') > -1 || (message.status as Exclude<IDBMessage['status'], boolean>).indexOf('webSearching') > -1))) {
		return (
			<div class={`leading-1.5 relative flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
				<div role="status" class="w-full animate-pulse">
					<div class="mb-4 h-2.5 w-1/2 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<div class="mb-2.5 h-2 w-11/12 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<div class="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<div class="mb-2.5 h-2 w-5/6 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<div class="mb-2.5 h-2 w-4/5 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<div class="h-2 w-11/12 rounded-full bg-gray-200 dark:bg-gray-500"></div>
					<span class="sr-only">Loading...</span>
				</div>
			</div>
		);
	} else {
		return (
			<div class={`leading-1.5 relative flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
				{(Array.isArray(message.status) && (message.status as Exclude<IDBMessage['status'], boolean>).indexOf('typing') > -1) || textContentIndex > -1 ? <Text key={`messageContentText-${message.key}`} id={message.key} /> : undefined}
				{(Array.isArray(message.status) && (message.status as Exclude<IDBMessage['status'], boolean>).indexOf('imageGenerating') > -1) || imageContentIndex >= 0 ? <Image key={`messageContentImage-${message.key}`} id={message.key} /> : undefined}
				{cardContentIndex >= 0 ? <Card card={message.content[cardContentIndex]?.card} /> : undefined}
				{message.safe !== undefined && message.safe !== true ? <SafetyBanner knownBad={message.safe !== null} /> : undefined}
			</div>
		);
	}
});
