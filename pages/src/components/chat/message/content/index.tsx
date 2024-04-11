import { component$ } from '@builder.io/qwik';
import type { IDBMessage } from '../../../../IDB/schemas/v2';
import Image from './image';
import Text from './text';

export default component$((props: { message: IDBMessage }) => {
	const isMe = props.message.role === 'user' ? true : false;

	// const textContentIndex = props.message.content.findIndex((record) => 'text' in record);
	// const imageContentIndex = props.message.content.findIndex((record) => 'image' in record);

	return (
		<div class={`leading-1.5 flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
			{/* {textContentIndex >= 0 ? <Text /> : undefined} */}
			<Text />
			{/* {imageContentIndex >= 0 ? <Image /> : undefined} */}
			<Image />
		</div>
	);
});
