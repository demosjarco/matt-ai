import { component$, noSerialize, useSignal, useStore, useTask$, useVisibleTask$, type NoSerialize } from '@builder.io/qwik';
import { FaArrowsRotateSolid, FaChevronDownSolid } from '@qwikest/icons/font-awesome';
import { Dropdown } from 'flowbite';
import { workersAiCatalog } from '../../../../../shared/workers-ai-catalog';
import type { IDBMessage } from '../../../IDB/schemas/v3';
import { serverNodeEnv } from '../../../routes/layout';
import type { modelPossibilitiesName, modelTypes } from '../../../types';
import Avatar from '../Avatar';
import Content from './content';

export default component$<{ message: IDBMessage }>(({ message }) => {
	const nodeEnv = useSignal<Awaited<ReturnType<typeof serverNodeEnv>>>();

	useTask$(async () => {
		nodeEnv.value = await serverNodeEnv();
	});

	const isMe = message.role === 'user' ? true : false;

	const originalModels = (['Text Generation', 'Text-to-Image'] as modelTypes[]).reduce(
		(acc, type) => {
			acc[type] = workersAiCatalog.modelGroups['Text Generation'].models.map((model) => model.name);
			return acc;
		},
		{} as Record<modelTypes, modelPossibilitiesName[]>,
	);
	// Must use `structuredClone()` to deep copy or else search issues
	const modelSelection = useStore<Record<modelTypes, modelPossibilitiesName[]>>(structuredClone(originalModels), { deep: true });
	const modelSearchText = useSignal<string>('');

	useTask$(({ track }) => {
		track(() => modelSearchText.value);

		Object.keys(originalModels).map((originalKey) => {
			if (originalKey in modelSelection) {
				// Must use `structuredClone()` to deep copy or else search issues
				modelSelection[originalKey as modelTypes] = structuredClone(originalModels[originalKey as modelTypes].filter((item) => item.toLowerCase().includes(modelSearchText.value!.toLowerCase())));
			}
		});
	});

	const dropdownButton = useSignal<HTMLButtonElement>();
	const dropdownMenu = useSignal<HTMLDivElement>();
	const dropdown = useSignal<NoSerialize<Dropdown>>();

	useVisibleTask$(({ track, cleanup }) => {
		track(() => dropdownButton.value);
		track(() => dropdownMenu.value);

		if (dropdownButton.value && dropdownMenu.value) {
			dropdown.value = noSerialize(new Dropdown(dropdownMenu.value, dropdownButton.value));
		}

		cleanup(() => dropdown.value?.destroyAndRemoveInstance());
	});

	return (
		<>
			<div class={`${isMe ? 'col-start-1 col-end-13 sm:col-start-6' : 'col-start-1 col-end-13 sm:col-end-8'} rounded-lg p-3`}>
				<div class={`${isMe ? 'flex flex-row-reverse justify-start' : 'flex flex-row items-center'}`}>
					<div class={`${isMe ? 'ml-2' : 'mr-2'}`}>
						<Avatar username={message.role} />
					</div>

					<div class="flex w-full flex-col gap-1">
						<div class={`flex items-center space-x-2 rtl:space-x-reverse ${isMe ? 'justify-end' : ''}`}>
							<span class="text-sm font-semibold text-gray-900 dark:text-white">{message.role}</span>
							<span class="text-sm font-normal text-gray-500 dark:text-gray-400">{message.btime.toLocaleString(navigator.language || navigator.languages[0])}</span>
							{nodeEnv.value === 'development' ? (
								isMe ? undefined : (
									<>
										{/* Spacer to allow button to go all the way to the right */}
										<div class={`grow`}></div>
										<div class={`ml-auto space-x-0`}>
											<button type="button" class={`h-7 rounded-l-lg border border-green-700 bg-green-700 px-1.5 py-1 text-sm font-medium text-white hover:border-green-800 hover:bg-green-800 dark:border-green-600 dark:bg-green-600 dark:hover:border-green-700 dark:hover:bg-green-700`}>
												<FaArrowsRotateSolid class="inline" /> Regenerate
											</button>
											<button ref={dropdownButton} type="button" class={`h-7 rounded-r-lg border border-green-700 px-1.5 py-1 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white dark:border-green-600 dark:text-green-500 dark:hover:bg-green-700 dark:hover:text-white`} id="dropdownButton" data-dropdown-toggle="dropdown">
												<FaChevronDownSolid />
											</button>
											<div ref={dropdownMenu} id="dropdown" class={`z-10 hidden w-48 divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-green-700 to-green-600 shadow-lg shadow-gray-900 dark:divide-gray-600`}>
												<input class="block w-full appearance-none rounded-t-lg border-x-0 border-b border-t-0 border-b-gray-100 bg-green-800 px-2.5 pb-2.5 pt-4 text-sm text-white shadow-inner outline-none ring-0 placeholder:text-white placeholder:opacity-65 focus:appearance-none focus:border-x-0 focus:border-b focus:border-t-0 focus:border-b-gray-100 focus:outline-none focus:ring-0 dark:border-b-gray-300 dark:placeholder:text-white focus:dark:border-b-gray-300" type="search" placeholder="search" enterKeyHint="search" autoCapitalize="off" autocomplete="off" autoCorrect="off" autoFocus={true} onInput$={(_event, element) => (modelSearchText.value = element.value.trim())} />
												<ul class={`max-h-48 overflow-y-auto text-sm text-gray-700 dark:text-gray-200`} aria-labelledby="dropdownButton">
													{Object.entries(modelSelection).map(([type, models]) => (
														<>
															<li key={`${type}-label`} class="disabled border-b p-2 font-bold">
																{type}
															</li>
															<ul key={`${type}-list`} class="py-2">
																{models.map((model) => (
																	<li key={model}>
																		<a href="#" class="block p-2 hover:bg-green-100 dark:hover:bg-green-900 dark:hover:text-white">
																			{model}
																		</a>
																	</li>
																))}
															</ul>
														</>
													))}
												</ul>
											</div>
										</div>
									</>
								)
							) : undefined}
						</div>
						<Content key={`messageContent-${message.key}`} message={message} />
						{isMe ? undefined : <span class={`flex text-sm font-normal text-gray-500 dark:text-gray-400`}>{Array.isArray(message.status) ? message.status.join(', ') : message.status ? 'Done' : 'Received'}</span>}
					</div>
				</div>
			</div>
		</>
	);
});
