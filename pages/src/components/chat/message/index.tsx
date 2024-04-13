import { component$, useContext } from '@builder.io/qwik';
import type { IDBMessage } from '../../../IDB/schemas/v2';
import { MessagesContext } from '../../../extras/context';
import Avatar from '../Avatar';
import Content from './content';

export default component$<{ id: IDBMessage['key'] }>((props) => {
	const messageHistory = useContext(MessagesContext);
	const message = messageHistory[props.id!]!;
	const isMe = message.role === 'user' ? true : false;

	return (
		<>
			<div class={`${isMe ? 'col-start-1 col-end-13 sm:col-start-6' : 'col-start-1 col-end-13 sm:col-end-8'} rounded-lg p-3`}>
				<div class={`${isMe ? 'flex flex-row-reverse justify-start' : 'flex flex-row items-center'}`}>
					<div class={`${isMe ? 'ml-2' : ' mr-2'}`}>
						<Avatar username={message.role} />
					</div>

					<div class="flex w-full flex-col gap-1">
						<div class={`flex items-center space-x-2 rtl:space-x-reverse ${isMe ? 'justify-end' : ''}`}>
							<span class="text-sm font-semibold text-gray-900 dark:text-white">{message.role}</span>
							<span class="text-sm font-normal text-gray-500 dark:text-gray-400">{message.btime.toLocaleString(navigator.language || navigator.languages[0])}</span>
						</div>
						<Content key={`messageContent-${message.key}`} id={message.key} />
						{isMe ? undefined : <span class={`flex text-sm font-normal text-gray-500 dark:text-gray-400`}>{Array.isArray(message.status) ? message.status.join(', ') : message.status ? 'Done' : 'Received'}</span>}
					</div>
				</div>
			</div>
		</>
	);
});
