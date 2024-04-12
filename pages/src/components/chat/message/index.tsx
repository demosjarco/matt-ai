import { component$ } from '@builder.io/qwik';
import type { IDBMessage } from '../../../IDB/schemas/v2';
import Avatar from '../Avatar';
import Content from './content';

export default component$((props: { userLocale: string; message: IDBMessage }) => {
	console.debug('props.userLocale', props.userLocale);

	const isMe = props.message.role === 'user' ? true : false;

	return (
		<>
			<div class={`${isMe ? 'col-start-1 col-end-13 sm:col-start-6' : 'col-start-1 col-end-13 sm:col-end-8'} rounded-lg p-3`}>
				<div class={`${isMe ? 'flex flex-row-reverse justify-start' : 'flex flex-row items-center'}`}>
					<div class={`${isMe ? 'ml-2' : ' mr-2'}`}>
						<Avatar username={props.message.role} />
					</div>

					<div class="flex w-full flex-col gap-1">
						<div class={`flex items-center space-x-2 rtl:space-x-reverse ${isMe ? 'justify-end' : ''}`}>
							<span class="text-sm font-semibold text-gray-900 dark:text-white">{props.message.role}</span>
							<span class="text-sm font-normal text-gray-500 dark:text-gray-400">{props.message.btime.toLocaleString(props.userLocale)}</span>
						</div>
						<Content message={props.message} />
						{isMe ? undefined : <span class={`flex text-sm font-normal text-gray-500 dark:text-gray-400`}>{Array.isArray(props.message.status) ? props.message.status.join(', ') : props.message.status ? 'Done' : 'Received'}</span>}
					</div>
				</div>
			</div>
		</>
	);
});
