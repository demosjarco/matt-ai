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

	return (
		<div class={`leading-1.5 relative flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
			{(props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('typing') > -1 || textContentIndex >= 0 ? <Text text={props.message.content[textContentIndex]?.text} /> : undefined}
			{(props.message.status as Exclude<IDBMessage['status'], boolean>).indexOf('imageGenerating') > -1 || imageContentIndex >= 0 ? <Image imageAction={props.message.content[actionIndex]?.action?.imageGenerate ?? undefined} image={props.message.content[imageContentIndex]?.image} /> : undefined}
			{cardContentIndex >= 0 ? <Card card={props.message.content[cardContentIndex]?.card} /> : undefined}
			{props.message.safe !== undefined && props.message.safe !== true ? <SafetyBanner knownBad={props.message.safe !== null} /> : undefined}
		</div>
	);
});
