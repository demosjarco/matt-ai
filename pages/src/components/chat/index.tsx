import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput, RoleScopedChatInput } from '@cloudflare/ai/dist/ai/tasks/text-generation';
import type { AiTextToImageInput, AiTextToImageOutput } from '@cloudflare/ai/dist/ai/tasks/text-to-image';
import { addMetadata } from 'meta-png';
import { Buffer } from 'node:buffer';
import { IDBMessages } from '../../IDB/messages';
import type { IDBMessage } from '../../IDB/schemas/v2';
import { MessageProcessing } from '../../aiBrain/messageProcessing.mjs';
import { useUserLocale } from '../../routes/layout';
import type { EnvVars } from '../../types';
import Message from './Message';
import InteractionBar from './interactionBar';

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
	const messageHistory = useStore<Record<NonNullable<IDBMessage['key']>, IDBMessage>>({}, { deep: true });

	useVisibleTask$(async ({ track, cleanup }) => {
		track(() => conversationId.value);

		if (conversationId.value) {
			const existingMessages = await new IDBMessages().getMessagesForConversation(conversationId.value);
			console.debug('Found', existingMessages, 'messages for conversation id', conversationId.value);
			existingMessages.forEach((item) => {
				messageHistory[item.key!] = item;
			});
		} else {
			console.warn('conversationId', conversationId.value);
		}

		cleanup(() => {
			Object.keys(messageHistory).forEach((key) => {
				delete messageHistory[parseInt(key)];
			});
		});
	});

	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<div id="messageList" class="grid grid-cols-12 gap-y-2">
							{Object.entries(messageHistory).map(([messageId, message]) => {
								return <Message key={`message-${messageId}`} message={message} userLocale={userLocale.value ?? undefined} />;
							})}
						</div>
					</div>
				</div>
				<InteractionBar conversationId={conversationId.value} messageHistory={messageHistory} />
			</div>
		</>
	);
});
