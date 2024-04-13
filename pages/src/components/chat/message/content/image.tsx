import { component$, useContext } from '@builder.io/qwik';
import { FaDownloadSolid, FaImageSolid } from '@qwikest/icons/font-awesome';
import type { IDBMessage } from '../../../../IDB/schemas/v2';
import { MessagesContext } from '../../../../extras/context';

export default component$<{ id: IDBMessage['key'] }>((props) => {
	const messageHistory = useContext(MessagesContext);
	const message = messageHistory[props.id!]!;
	const actionIndex = message.content.findIndex((record) => 'action' in record);
	const imageContentIndex = message.content.findIndex((record) => 'image' in record);

	const imageAction = message.content[actionIndex]?.action?.imageGenerate ?? undefined;
	const image = message.content[imageContentIndex]?.image;

	if (image) {
		return (
			<div class="group relative my-2.5">
				<div class="absolute flex h-full w-full items-center justify-center rounded-lg bg-gray-900/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<a href={URL.createObjectURL(new Blob([image.buffer], { type: 'image/png' }))} download={`${imageAction}.png`} class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 focus:outline-none focus:ring-4 focus:ring-gray-50 dark:text-white">
						<FaDownloadSolid />
					</a>
				</div>
				<img src={URL.createObjectURL(new Blob([image.buffer], { type: 'image/png' }))} class="rounded-lg" alt={imageAction ?? undefined} />
			</div>
		);
	} else {
		return (
			<div role="status" class="animate-pulse space-y-8 pb-4 md:flex md:items-center md:space-x-8 md:space-y-0 rtl:space-x-reverse">
				<div class="flex h-48 w-full items-center justify-center rounded bg-gray-300 sm:w-96 dark:bg-gray-600">
					<FaImageSolid />
				</div>
				<span class="sr-only">Loading...</span>
			</div>
		);
	}
});
