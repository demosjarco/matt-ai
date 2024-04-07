import { $, component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Form, server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { AiTextToImageInput, AiTextToImageOutput } from '@cloudflare/ai/dist/ai/tasks/text-to-image';
import { addMetadata } from 'meta-png';
import { Buffer } from 'node:buffer';
import { IDBMessages } from '../../IDB/messages';
import type { IDBMessage, IDBMessageContent } from '../../IDB/schemas/v1';
import { MessageProcessing } from '../../aiBrain/messageProcessing.mjs';
import { serverConversationId, useConversationId, useUserLocale, useUserUpdateConversation } from '../../routes/layout';
import type { EnvVars } from '../../types';
import Message from './Message';
import ChatBox from './interactionBar/chatBox';
import Submit from './interactionBar/submit';

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
		let imageGeneration: AiTextToImageOutput | Awaited<ReturnType<typeof fetch>>['body'] = await new Ai((this.platform.env as EnvVars).AI).run('@cf/stabilityai/stable-diffusion-xl-base-1.0', { prompt, num_steps: 20 });
		if (imageGeneration instanceof ReadableStream) {
			imageGeneration = new Uint8Array(await new Response(imageGeneration).arrayBuffer());
		}

		return {
			raw: Buffer.from(addMetadata(imageGeneration, 'Software', 'stabilityai/stable-diffusion-xl-base-1.0').buffer).toString('base64'),
			model: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
		};
	} catch (error) {
		try {
			let imageGeneration: AiTextToImageOutput | Awaited<ReturnType<typeof fetch>>['body'] = await new Ai((this.platform.env as EnvVars).AI).run('@cf/bytedance/stable-diffusion-xl-lightning', { prompt, num_steps: 20 });
			if (imageGeneration instanceof ReadableStream) {
				imageGeneration = new Uint8Array(await new Response(imageGeneration).arrayBuffer());
			}

			return {
				raw: Buffer.from(addMetadata(imageGeneration, 'Software', 'bytedance/stable-diffusion-xl-lightning').buffer).toString('base64'),
				model: '@cf/bytedance/stable-diffusion-xl-lightning',
			};
		} catch (error) {
			try {
				let imageGeneration: AiTextToImageOutput | Awaited<ReturnType<typeof fetch>>['body'] = await new Ai((this.platform.env as EnvVars).AI).run('@cf/lykon/dreamshaper-8-lcm', { prompt, num_steps: 20 });
				if (imageGeneration instanceof ReadableStream) {
					imageGeneration = new Uint8Array(await new Response(imageGeneration).arrayBuffer());
				}

				return {
					raw: Buffer.from(addMetadata(imageGeneration, 'Software', 'lykon/dreamshaper-8-lcm').buffer).toString('base64'),
					model: '@cf/lykon/dreamshaper-8-lcm',
				};
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}
});

export default component$(() => {
	const userLocale = useUserLocale();
	const conversationId = useConversationId();
	const createConversation = useUserUpdateConversation();
	const formRef = useSignal<HTMLFormElement>();

	const newMessageHistory = useStore<Record<IDBMessage['id'], IDBMessage>>({}, { deep: true });

	useVisibleTask$(async ({ track }) => {
		track(() => conversationId.value);

		if (!conversationId.value) {
			return;
		}
	});

	const sendMessage = $(
		(message: string) =>
			// eslint-disable-next-line no-async-promise-executor
			new Promise<IDBMessage>(async (mainResolve, mainReject) => {
				let convId = conversationId.value ?? (await serverConversationId());
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
					onSubmitCompleted$={() =>
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
					class="flex h-16 w-full flex-row items-center bg-gray-50 p-2 dark:bg-slate-800">
					<ChatBox />
					<Submit />
				</Form>
			</div>
		</>
	);
});
