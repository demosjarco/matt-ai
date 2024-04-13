import { component$ } from '@builder.io/qwik';
import type { IDBMessage } from '../../../../IDB/schemas/v2';
import Card from './card';
import Image from './image';
import SafetyBanner from './safetyBanner';
import Text from './text';

export default component$((props: { message: IDBMessage }) => {
	const isMe = props.message.role === 'user' ? true : false;

	const actionIndex = props.message.content.findIndex((record) => 'action' in record);
	const textContentIndex = props.message.content.findIndex((record) => 'text' in record);
	const imageContentIndex = props.message.content.findIndex((record) => 'image' in record);
	const cardContentIndex = props.message.content.findIndex((record) => 'card' in record);

	if (props.message.status === false || (Array.isArray(props.message.status) && ((props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('filtering') > -1 || (props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('deciding') > -1 || (props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('webSearching') > -1))) {
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
				{(Array.isArray(props.message.status) && (props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('typing') > -1) || textContentIndex > -1 ? <Text key={`messageContentText-${props.message.key}`} text={props.message.content[textContentIndex]?.text} /> : undefined}
				{(Array.isArray(props.message.status) && (props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('imageGenerating') > -1) || imageContentIndex >= 0 ? <Image key={`messageContentImage-${props.message.key}`} imageAction={props.message.content[actionIndex]?.action?.imageGenerate ?? undefined} image={props.message.content[imageContentIndex]?.image} /> : undefined}
				{cardContentIndex >= 0 ? <Card key={`messageContentCard-${props.message.key}`} card={props.message.content[cardContentIndex]?.card} /> : undefined}
				{props.message.safe !== undefined && props.message.safe !== true ? <SafetyBanner key={`messageContentSafetyBanner-${props.message.key}`} knownBad={props.message.safe !== null} /> : undefined}
			</div>
		);
	}
});
