import { component$ } from '@builder.io/qwik';
import type { IDBMessage } from '../../types';
import Avatar from './Avatar';

export default component$((props: { message: IDBMessage }) => {
	const isMe = props.message.role === 'user' ? true : false;

	return (
		<>
			<div class={`${isMe ? 'col-start-1 col-end-13 sm:col-start-6' : 'col-start-1 col-end-13 sm:col-end-8'} rounded-lg p-3`}>
				<div class={`${isMe ? 'flex flex-row-reverse justify-start' : 'flex flex-row items-center'}`}>
					<div class={`${isMe ? 'ml-2' : ' mr-2'}`}>
						<Avatar />
					</div>

					<div class="flex w-full flex-col gap-1">
						<div class={`flex items-center space-x-2 rtl:space-x-reverse ${isMe ? 'justify-end' : ''}`}>
							<span class="text-sm font-semibold text-gray-900 dark:text-white">Bonnie Green</span>
							<span class="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
						</div>
						<div class={`leading-1.5 flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
							<p class="whitespace-pre-wrap text-balance text-sm font-normal text-gray-900 dark:text-white">
								<pre class="whitespace-pre-wrap text-balance">{JSON.stringify(props, null, '\t')}</pre>
							</p>
						</div>
						{isMe ? undefined : <span class={`flex text-sm font-normal text-gray-500 dark:text-gray-400 ${isMe ? 'justify-end' : ''}`}>Delivered</span>}
					</div>
				</div>
			</div>
		</>
	);
});
