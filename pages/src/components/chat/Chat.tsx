import { $, component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Form, server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { AiTextToImageInput, AiTextToImageOutput } from '@cloudflare/ai/dist/ai/tasks/text-to-image';
import { FaPaperPlaneRegular, FaPaperclipSolid } from '@qwikest/icons/font-awesome';
import { addMetadata } from 'meta-png';
import { Buffer } from 'node:buffer';
import { IDBMessages } from '../../IDB/messages';
import { MessageProcessing } from '../../aiBrain/messageProcessing.mjs';
import { useConversationId, useLocalEdgeCheck, useUserLocale, useUserUpdateConversation } from '../../routes/layout';
import type { EnvVars, IDBMessage, IDBMessageContent } from '../../types';
import Message from './Message';

const aiResponse = server$(async function* (model: Parameters<Ai['run']>[0], messages: RoleScopedChatInput[]) {
	const stream = await (new Ai((this.platform.env as EnvVars).AI).run(model, { messages, stream: true }) as Promise<ReadableStream>);

	const eventField = 'data';
	const contentPrefix = `${eventField}: `;

	let accumulatedData = '';
	// @ts-expect-error
	for await (const chunk of stream) {
		const decodedChunk = new TextDecoder('utf-8').decode(chunk, { stream: true });
		accumulatedData += decodedChunk;

		let newlineIndex;
		while ((newlineIndex = accumulatedData.indexOf('\n')) >= 0) {
			// Found a newline
			const line = accumulatedData.slice(0, newlineIndex);
			accumulatedData = accumulatedData.slice(newlineIndex + 1); // Remove the processed line from the accumulated data

			if (line.startsWith(contentPrefix)) {
				const decodedString = line.substring(contentPrefix.length);
				try {
					// See if it's JSON
					const decodedJson: Exclude<AiTextGenerationOutput, ReadableStream> = JSON.parse(decodedString);
					// Return JSON
					yield decodedJson.response;
				} catch (error) {
					// Not valid JSON - just ignore and move on
				}
			}
		}
	}
});
const aiPreProcess = server$(function (message: Parameters<MessageProcessing['preProcess']>[0]) {
	return new MessageProcessing(this.platform).preProcess(message);
});
const aiImageGenerate = server$(async function (prompt: AiTextToImageInput['prompt']) {
	try {
		const imageGeneration: AiTextToImageOutput = await new Ai((this.platform.env as EnvVars).AI).run('@cf/stabilityai/stable-diffusion-xl-base-1.0', { prompt, num_steps: 20 });
		return {
			raw: Buffer.from(addMetadata(imageGeneration, 'Software', 'stabilityai/stable-diffusion-xl-base-1.0').buffer).toString('base64'),
			model: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
		};
	} catch (error) {
		try {
			const imageGeneration: AiTextToImageOutput = await new Ai((this.platform.env as EnvVars).AI).run('@cf/bytedance/stable-diffusion-xl-lightning', { prompt, num_steps: 20 });
			return {
				raw: Buffer.from(addMetadata(imageGeneration, 'Software', 'runwayml/stable-diffusion-v1-5').buffer).toString('base64'),
				model: '@cf/runwayml/stable-diffusion-v1-5',
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
});

const serverConversationId = server$(function () {
	const id = this.params['conversationId'] ?? '';
	return isNaN(Number(id)) ? undefined : Number(id);
});

export default component$(() => {
	const isLocal = useLocalEdgeCheck();
	const userLocale = useUserLocale();
	const conversationId = useConversationId();
	const createConversation = useUserUpdateConversation();
	const formRef = useSignal<HTMLFormElement>();

	const newMessageHistory = useStore<Record<IDBMessage['id'], IDBMessage>>({}, { deep: true });

	useVisibleTask$(async ({ track }) => {
		track(() => conversationId.value);

		if (!conversationId.value || isNaN(Number(conversationId.value))) {
			return;
		}

		Object.keys(newMessageHistory).forEach((key) => {
			delete newMessageHistory[Number(key)];
		});
		const initialConversation = await new IDBMessages().getMessagesForConversation(Number(conversationId.value));
		initialConversation.forEach((item) => {
			newMessageHistory[item.id] = item;
		});
	});

	const sendMessage = $(
		(message: string) =>
			new Promise<IDBMessage>(async (mainResolve, mainReject) => {
				let convId = conversationId.value.length > 0 ? Number(conversationId.value) : await serverConversationId();
				if (convId && convId < 1) convId++;

				// Run it in a `.all()` so that the promise chain stays alive until all finish, but don't wait to return promise
				new IDBMessages()
					.saveMessage({
						/**
						 * @todo fall back to server$ conversation id because signal isn't being updated
						 */
						conversation_id: convId,
						role: 'user',
						status: true,
						content: [
							{
								text: message,
								model_used: null,
							},
						],
					})
					.then((fullMessage) => {
						newMessageHistory[fullMessage.id] = fullMessage;
						mainResolve(fullMessage);

						new IDBMessages()
							.saveMessage({
								/**
								 * @todo fall back to server$ conversation id because signal isn't being updated
								 */
								conversation_id: convId,
								role: 'assistant',
								status: false,
							})
							.then((fullMessage) => {
								// Add placeholder
								newMessageHistory[fullMessage.id] = fullMessage;

								/**
								 * @todo Update status to
								 * `status: ['typing', 'deciding'],`
								 */
								newMessageHistory[fullMessage.id]!.status = ['typing', 'deciding'];

								Promise.all([
									aiResponse('@cf/meta/llama-2-7b-chat-fp16', [{ role: 'user', content: message }]).then(async (chatResponse) => {
										// @ts-expect-error
										newMessageHistory[fullMessage.id]!.status = newMessageHistory[fullMessage.id]!.status.filter((str) => str.toLowerCase() !== 'typing'.toLowerCase());

										const composedInsert: IDBMessageContent = {
											text: '',
											model_used: '@cf/meta/llama-2-7b-chat-fp16',
										};

										const previousText = newMessageHistory[fullMessage.id]!.content.findIndex((record) => 'text' in record);
										if (previousText >= 0) {
											newMessageHistory[fullMessage.id]!.content[previousText] = composedInsert;
										} else {
											newMessageHistory[fullMessage.id]!.content.push(composedInsert);
										}

										for await (const chatResponseChunk of chatResponse) {
											composedInsert.text += chatResponseChunk ?? '';
											newMessageHistory[fullMessage.id]!.content[previousText] = composedInsert;
										}

										if (Array.isArray(newMessageHistory[fullMessage.id]!.status)) {
											// @ts-expect-error
											newMessageHistory[fullMessage.id]!.status.filter((item) => item !== 'typing');
										}

										// Save to local db
										await new IDBMessages().updateMessage({
											id: fullMessage.id,
											content: [composedInsert],
										});
									}),
									aiPreProcess(message).then(({ action, modelUsed }) => {
										// @ts-expect-error
										newMessageHistory[fullMessage.id]!.status = newMessageHistory[fullMessage.id]!.status.filter((str) => str.toLowerCase() !== 'deciding'.toLowerCase());

										const composedInsert: IDBMessageContent = {
											action,
											model_used: modelUsed,
										};

										const previousAction = newMessageHistory[fullMessage.id]!.content.findIndex((record) => 'action' in record);
										if (previousAction >= 0) {
											newMessageHistory[fullMessage.id]!.content[previousAction] = composedInsert;
										} else {
											newMessageHistory[fullMessage.id]!.content.push(composedInsert);
										}

										if (Array.isArray(newMessageHistory[fullMessage.id]!.status)) {
											// @ts-expect-error
											newMessageHistory[fullMessage.id]!.status.filter((item) => item !== 'deciding');
										}
										console.debug(1);

										const actions: Promise<any>[] = [
											new IDBMessages().updateMessage({
												id: fullMessage.id,
												content: [composedInsert],
											}),
										];
										if (action.imageGenerate) {
											// @ts-expect-error
											newMessageHistory[fullMessage.id]!.status.push('imageGenerating');

											actions.push(
												aiImageGenerate(action.imageGenerate)
													.then(({ raw, model }) => {
														const image = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0));
														console.debug(2, raw, image);

														const composedInsert: IDBMessageContent = {
															image,
															model_used: model as Parameters<Ai['run']>[0],
														};

														const previousImage = newMessageHistory[fullMessage.id]!.content.findIndex((record) => 'image' in record);
														if (previousImage >= 0) {
															newMessageHistory[fullMessage.id]!.content[previousImage] = composedInsert;
														} else {
															newMessageHistory[fullMessage.id]!.content.push(composedInsert);
														}

														new IDBMessages().updateMessage({
															id: fullMessage.id,
															content: [composedInsert],
														});
													})
													// @ts-expect-error
													.finally(() => (newMessageHistory[fullMessage.id]!.status = newMessageHistory[fullMessage.id]!.status.filter((str) => str.toLowerCase() !== 'imageGenerating'.toLowerCase()))),
											);
										}
										return Promise.all([actions]).catch(mainReject);
									}),
								]).catch(mainReject);
							})
							.catch(mainReject);
					})
					.catch(mainReject);
			}),
	);

	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<div id="messageList" class="grid grid-cols-12 gap-y-2">
							<div class="text-3xl text-white">{conversationId.value}</div>
							{Object.entries(newMessageHistory).map(([messageId, message]) => {
								return <Message key={`message-${messageId}`} message={message} userLocale={userLocale.value ?? undefined} />;
							})}
						</div>
					</div>
				</div>
				<Form
					action={createConversation}
					ref={formRef}
					spaReset={true}
					onSubmitCompleted$={(event, form) =>
						new Promise<void>((resolve, reject) => {
							if (createConversation.status && createConversation.status >= 200 && createConversation.status < 300) {
								if (createConversation.value && createConversation.value.sanitizedMessage) {
									sendMessage(createConversation.value.sanitizedMessage)
										.then((message) => {
											window.history.replaceState({}, '', `/${['c', message.conversation_id].join('/')}`);
											resolve();
										})
										.catch(reject);
								} else {
									reject();
									// Bad form
								}
							} else {
								// Failed turnstile
								reject();
							}
						})
					}
					class="flex h-16 w-full flex-row items-center bg-white p-2 dark:bg-slate-800">
					<div>
						<button class="flex cursor-not-allowed items-center justify-center text-gray-400 hover:text-gray-600" disabled>
							<FaPaperclipSolid />
						</button>
					</div>
					<div class="ml-4 flex-grow">
						<div class="relative flex w-full flex-row flex-nowrap">
							<input type="text" id="floating_outlined" class="border-1 peer mt-3 block h-10 w-full appearance-none rounded-xl border-gray-300 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500" placeholder=" " />
							<label for="floating_outlined" class="absolute start-1 top-2 z-10 mt-3 origin-[0] -translate-y-3 scale-75 transform bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/3 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4 dark:bg-gray-800 dark:text-gray-400 peer-focus:dark:text-blue-500">
								Ask me anything
							</label>
							{isLocal.value ? <div class="cf-turnstile flex h-16 flex-none" data-sitekey="1x00000000000000000000BB" data-action="send-chat-message" data-appearance="interaction-only"></div> : <div class="cf-turnstile flex h-16 flex-none" data-sitekey="0x4AAAAAAAQ34m_klLCEVN51" data-action="send-chat-message" data-appearance="interaction-only"></div>}
						</div>
					</div>
					<div class="ml-4">
						<button type="submit" class="flex h-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 text-white hover:bg-indigo-600">
							<span class="relative left-[-2px]">
								<FaPaperPlaneRegular />
							</span>
						</button>
					</div>
				</Form>
			</div>
		</>
	);
});
