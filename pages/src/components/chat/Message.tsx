import { component$ } from '@builder.io/qwik';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from 'qwik-fontawesome';
import type { IDBMessage } from '../../types';
import Avatar from './Avatar';

export default component$((props: { message: IDBMessage; userLocale?: string }) => {
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
						<div class={`leading-1.5 flex flex-col border-gray-200 bg-gray-100 p-4 dark:bg-gray-700 ${isMe ? 'rounded-xl rounded-se-none' : 'rounded-e-xl rounded-es-xl'}`}>
							<p class="whitespace-pre-wrap text-balance text-sm font-normal text-gray-900 dark:text-white">
								{/* <pre class="whitespace-pre-wrap text-balance">{JSON.stringify(props.message, null, '\t')}</pre> */}
								{props.message.content[props.message.content.findIndex((record) => 'text' in record)]?.text?.trim() ?? ''}
							</p>
							{props.message.content.findIndex((record) => 'image' in record) >= 0 ? (
								<div class="group relative my-2.5">
									<div class="absolute flex h-full w-full items-center justify-center rounded-lg bg-gray-900/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
										<button data-tooltip-target="download-image" class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 focus:outline-none focus:ring-4 focus:ring-gray-50 dark:text-white">
											<FaIcon icon={faDownload} />
										</button>
										<div id="download-image" role="tooltip" class="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700">
											Download image
											<div class="tooltip-arrow" data-popper-arrow></div>
										</div>
									</div>
									<img src={URL.createObjectURL(new Blob([props.message.content[props.message.content.findIndex((record) => 'image' in record)]!.image!], { type: 'image/png' }))} class="rounded-lg" />
								</div>
							) : undefined}
						</div>
						{isMe ? undefined : <span class={`flex text-sm font-normal text-gray-500 dark:text-gray-400 ${isMe ? 'justify-end' : ''}`}>{Array.isArray(props.message.status) ? props.message.status.join(', ') : props.message.status ? 'Delivered' : 'Sent'}</span>}
					</div>
				</div>
			</div>
		</>
	);
});
