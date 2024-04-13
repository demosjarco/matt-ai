import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { IDBMessageContentText } from '../../../../IDB/schemas/v2';

export default component$((props: { text?: IDBMessageContentText }) => {
	const divRef = useSignal<HTMLDivElement>();
	const pRef = useSignal<HTMLParagraphElement>();

	useTask$(async ({ track, cleanup }) => {
		track(() => divRef.value);
		track(() => pRef.value);
		track(() => props.text);

		console.debug('TextElement', props.text);

		if (props.text) {
			if (divRef.value) {
				try {
					const markdownHtml = await marked.parse(props.text.trim(), { async: true, breaks: true });
					divRef.value.innerHTML = DOMPurify.sanitize(markdownHtml);
				} catch (error) {
					divRef.value.hidden = true;
					if (pRef.value) {
						pRef.value.hidden = false;
						pRef.value.innerText = props.text.trim();
					}
				}
			} else if (pRef.value) {
				pRef.value.hidden = false;
				pRef.value.innerText = props.text.trim();
			}
		}

		cleanup(() => {
			if (divRef.value) divRef.value.childNodes.forEach((child) => divRef.value?.removeChild(child));
		});
	});

	if (props.text) {
		return (
			<>
				<div ref={divRef} class="text-balance text-gray-900 dark:text-white"></div>
				<p ref={pRef} hidden={true} class="whitespace-pre-wrap text-balance text-sm font-normal text-gray-900 dark:text-white"></p>
			</>
		);
	} else {
		return (
			<div role="status" class="w-full animate-pulse space-y-2.5 pb-4">
				<div class="flex w-full items-center">
					<div class="h-2.5 w-1/4 rounded-full bg-gray-200 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
				</div>
				<div class="flex w-11/12 items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-500"></div>
				</div>
				<div class="flex w-4/5 items-center">
					<div class="h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
				</div>
				<div class="flex w-11/12 items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-500"></div>
				</div>
				<div class="flex w-5/6 items-center">
					<div class="ms-2 h-2.5 w-1/4 rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-1/5 rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-600"></div>
				</div>
				<div class="flex w-2/3 items-center">
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
					<div class="ms-2 h-2.5 w-11/12 rounded-full bg-gray-200 dark:bg-gray-600"></div>
					<div class="ms-2 h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-500"></div>
				</div>
				<span class="sr-only">Loading...</span>
			</div>
		);
	}
});
