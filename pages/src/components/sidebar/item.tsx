import type { QRL } from '@builder.io/qwik';
import { component$, useContext, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import { FlCheckOutline, FlCloseOutline, FlEditOutline } from '@qwikest/icons/flowbite';
import { IDBConversations } from '../../IDB/conversations';
import { ConversationsContext } from '../../extras/context';

export default component$<{ id: number; title: string; onClick$: QRL<(id: number) => void> }>(({ id, title, onClick$ }) => {
	const conversations = useContext(ConversationsContext);

	// Always show buttons on touch screen
	const touchScreen = useSignal<boolean>(navigator.maxTouchPoints && navigator.maxTouchPoints > 0 ? true : false);
	useTask$(({ track }) => {
		track(() => navigator.maxTouchPoints);

		touchScreen.value = navigator.maxTouchPoints && navigator.maxTouchPoints > 0 ? true : false;
	});
	const mouseOver = useSignal<boolean>(false);

	useTask$(({ track }) => {
		track(() => mouseOver.value);
	});

	const editState = useSignal<boolean>(false);
	const editButton = useSignal<HTMLButtonElement>();
	const editBox = useSignal<HTMLInputElement>();
	const editConfirmButton = useSignal<HTMLButtonElement>();
	const editCancelButton = useSignal<HTMLButtonElement>();
	const editStateLayout = (
		<>
			<input ref={editBox} class="ms-2 block max-h-5 w-full appearance-none rounded-t-lg border-x-0 border-b border-t-0 border-b-gray-100 bg-transparent px-0 text-sm text-white shadow-inner outline-none ring-0 placeholder:text-white placeholder:opacity-65 focus:appearance-none focus:border-x-0 focus:border-b focus:border-t-0 focus:border-b-gray-100 focus:outline-none focus:ring-0 dark:border-b-gray-300 dark:placeholder:text-white focus:dark:border-b-gray-300" type="text" value={title} enterKeyHint="done" autoCapitalize="sentences" autocomplete="on" autoCorrect="on" autoFocus={true} />
			{/* Spacer to allow button to go all the way to the right */}
			<div class={`grow`}></div>
			<button ref={editConfirmButton} class={`p-2`}>
				<FlCheckOutline />
			</button>
			<button ref={editCancelButton} class={`p-2`}>
				<FlCloseOutline />
			</button>
		</>
	);
	const toEdit = useSignal<string>();
	useVisibleTask$(({ track }) => {
		track(() => toEdit.value);
	});

	const deleteState = useSignal<boolean>(false);
	const deleteButton = useSignal<HTMLButtonElement>();
	const deleteConfirmButton = useSignal<HTMLButtonElement>();
	const deleteCancelButton = useSignal<HTMLButtonElement>();
	const deleteStateLayout = (
		<>
			<span class="ms-2 py-1.5 text-sm text-red-500">Are you sure?</span>
			{/* Spacer to allow button to go all the way to the right */}
			<div class={`grow`}></div>
			<button ref={deleteConfirmButton} class={`p-2`}>
				<FlCheckOutline />
			</button>
			<button ref={deleteCancelButton} class={`p-2`}>
				<FlCloseOutline />
			</button>
		</>
	);

	return (
		<li
			onClick$={async (event) => {
				if (event.target) {
					if (editButton.value?.contains(event.target as Element)) {
						editState.value = true;
					} else if (deleteButton.value?.contains(event.target as Element)) {
						deleteState.value = true;
					} else if (editConfirmButton.value?.contains(event.target as Element)) {
						const conversation = conversations.find((conversation) => conversation.key === id);

						if (conversation && editBox.value) {
							const newName = editBox.value.value.trim();

							// Only run if actual name change
							if (newName !== title) {
								// Change UI
								conversation.name = newName;
								// Change in storage
								await new IDBConversations().updateConversation({
									key: id,
									name: newName,
									ctime: new Date(),
								});
							} else {
								// Reset box if nothing changed
								// Useful if only change was leading/trailing whitespace
								editBox.value.value = title;
							}
							// Conversation not found - how did we get here???
							// Just reset and go on...
						} else if (editBox.value) {
							editBox.value.value = title;
						}

						editState.value = false;
					} else if (editCancelButton.value?.contains(event.target as Element)) {
						if (editBox.value) editBox.value.value = title;
						editState.value = false;
					} else if (deleteConfirmButton.value?.contains(event.target as Element)) {
						const conversation = conversations.find((conversation) => conversation.key === id);

						if (conversation) {
							/**
							 * @todo
							 */
						}

						deleteState.value = false;
					} else if (deleteCancelButton.value?.contains(event.target as Element)) {
						deleteState.value = false;
					} else {
						onClick$(id);
					}
				}
			}}
			onMouseOver$={() => (mouseOver.value = true)}
			onMouseLeave$={() => (mouseOver.value = false)}>
			<div class="group flex items-center rounded-lg py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-slate-700">
				{editState.value ? editStateLayout : undefined}
				{deleteState.value ? deleteStateLayout : undefined}
				{editState.value || deleteState.value ? undefined : (
					<>
						<span class="ms-2 py-1.5 text-sm">{title}</span>
						{touchScreen.value || mouseOver.value ? (
							<>
								{/* Spacer to allow button to go all the way to the right */}
								<div class={`grow`}></div>
								<button ref={editButton} class={`p-2`}>
									<FlEditOutline />
								</button>
								{/* Disable for now until functionaly coded */}
								{/* <button ref={deleteButton} class={`p-2`}>
									<FlTrashBinOutline />
								</button> */}
							</>
						) : undefined}
					</>
				)}
			</div>
		</li>
	);
});
