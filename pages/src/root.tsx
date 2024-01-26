import { component$, useServerData, useVisibleTask$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister, server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import { initFlowbite } from 'flowbite';
import { FaStylesheet } from 'qwik-fontawesome';
import { RouterHead } from './components/router-head/router-head';
import type { EnvVars, IDBConversation, IDBMessage } from './types';

import './global.less';

const chatGenerator = server$(function () {
	const { AI } = this.platform.env as EnvVars;

	const ai = new Ai(AI);

	return new Promise<{ created: Date; response: string }>((resolve, reject) =>
		ai
			.run('@cf/meta/llama-2-7b-chat-fp16', {
				stream: true,
				messages: [{ role: 'system', content: 'You are a dev helper to simulate chat messages. Generate a sample chat message' }],
			})
			.then(async (stream: NonNullable<Awaited<ReturnType<typeof fetch>>['body']>) => {
				try {
					const output: { created: Date; response: string } = {
						created: new Date(),
						response: '',
					};

					const eventField = 'data';
					const contentPrefix = `${eventField}: `;

					let numTokens = 0;
					let accumulatedData = '';
					let newlineCounter = 0;
					let streamError = false;
					// @ts-expect-error
					for await (const chunk of stream) {
						numTokens++;
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
									const decodedJson = JSON.parse(decodedString);

									if (decodedJson['response'] === '\n') {
										newlineCounter++; // Increment for each newline found
										if (newlineCounter >= 5) {
											streamError = true;
											break;
										}
									} else {
										newlineCounter = 0;
									}

									// Return JSON
									for (const key in decodedJson) {
										output.response = output.response ? output.response + decodedJson[key] : decodedJson[key];
									}
								} catch (error) {
									// Not valid JSON - just ignore and move on
								}
							}
						}

						output.created = new Date();

						if (streamError) break;
					}

					if (streamError) stream.cancel();

					resolve(output);
				} catch (error) {
					reject(error);
				}
			})
			.catch(reject),
	);
});

export default component$(() => {
	const nonce = useServerData<string | undefined>('nonce');

	useVisibleTask$(() => {
		initFlowbite();
	});

	useVisibleTask$(() => {
		const DBOpenRequest = indexedDB.open('ailocal', 1);
		DBOpenRequest.onerror = console.error;
		DBOpenRequest.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			db.onerror = console.error;

			/**
			 * `atime` = access time
			 * `btime` = birth time
			 * `ctime` = changed time (metadata)
			 * `mtime` = modified time (content)
			 */

			function createConversations() {
				const table = db.createObjectStore('conversations', {
					keyPath: 'id',
					autoIncrement: true,
				});

				// For search
				table.createIndex('atime', 'atime', { unique: false, multiEntry: false });
				table.createIndex('btime', 'btime', { unique: false, multiEntry: false });
				table.createIndex('ctime', 'ctime', { unique: false, multiEntry: false });
				// table.createIndex('mtime', 'mtime', { unique: false, multiEntry: false });

				// For safety
				table.createIndex('id', 'id', { unique: true });

				// For speed

				// Other columns
				// table.createIndex('name', 'name', { unique: false, multiEntry: false });
			}
			createConversations();

			function createMessages() {
				const table = db.createObjectStore('messages', {
					keyPath: 'id',
					autoIncrement: true,
				});

				// For search
				table.createIndex('conversation_id', 'conversation_id', { unique: false, multiEntry: false });
				table.createIndex('content_version', 'content_version', { unique: false, multiEntry: false });
				table.createIndex('btime', 'btime', { unique: false, multiEntry: false });

				// For safety
				table.createIndex(['conversation_id', 'id', 'content_version'].join('|'), ['conversation_id', 'id', 'content_version'], { unique: true });

				// For speed
				table.createIndex(['conversation_id', 'id'].join('|'), ['conversation_id', 'id'], { unique: false });

				// Other columns
				// table.createIndex('role', 'role', { unique: false, multiEntry: true });
				// table.createIndex('model_used', 'model_used', { unique: false, multiEntry: false });
				// table.createIndex('content_message', 'content_message', { unique: false, multiEntry: false });
				// table.createIndex('content_supplemental', 'content_supplemental', { unique: false, multiEntry: true });
				// table.createIndex('content_cards', 'content_cards', { unique: false, multiEntry: true });
				// table.createIndex('content_chips', 'content_chips', { unique: false, multiEntry: true });
				// table.createIndex('content_references', 'content_references', { unique: false, multiEntry: true });
			}
			createMessages();
		};
		DBOpenRequest.onsuccess = async (event) => {
			const db = DBOpenRequest.result;

			async function dummyMessages() {
				for (let i = 0; i < 5; i++) {
					const conversationTransaction = db.transaction('conversations', 'readwrite');

					const insertConversation: Partial<IDBConversation> = {
						name: `Conversation ${i}`,
						atime: new Date(),
						btime: new Date(),
						ctime: new Date(),
					};

					conversationTransaction.objectStore(conversationTransaction.objectStoreNames[0]!).add(insertConversation);

					conversationTransaction.commit();

					for (let j = 0; j < 5; j++) {
						try {
							const { created, response } = await chatGenerator();

							const messageTransaction = db.transaction('messages', 'readwrite');

							const insertMessage: Partial<IDBMessage> = {
								conversation_id: i,
								content_version: 1,
								btime: created,
								role: 'assistant',
								model_used: '@cf/meta/llama-2-7b-chat-fp16',
								content_message: response,
								content_supplemental: [],
								content_cards: [],
								content_chips: [],
								content_references: [],
							};

							messageTransaction.objectStore(messageTransaction.objectStoreNames[0]!).add(insertMessage);

							messageTransaction.commit();
						} catch (error) {
							console.error(error);
						}
					}
				}
			}
			// await dummyMessages();

			async function getConversationOrder() {
				const transaction = db.transaction('messages', 'readonly', { durability: 'relaxed' });
				const store = transaction.objectStore(transaction.objectStoreNames[0]!);

				return new Promise<number[]>((resolve, reject) => {
					const latestMessages = new Map<number, IDBMessage>();
					const myIndex = store.index('conversation_id').openCursor();
					myIndex.onerror = reject;

					myIndex.onsuccess = (event) => {
						const cursorEvent = event.target as ReturnType<IDBIndex['openCursor']>;
						const cursor = cursorEvent.result;

						if (cursor) {
							const currentMessage = cursor.value as IDBMessage;

							// If this conversation hasn't been encountered yet, or the message is newer, update the map
							if (!latestMessages.has(currentMessage.conversation_id) || latestMessages.get(currentMessage.conversation_id)!.btime < currentMessage.btime) {
								latestMessages.set(currentMessage.conversation_id, currentMessage);
							}

							cursor.continue();
						} else {
							transaction.commit();
							resolve(
								Array.from(latestMessages.entries())
									.sort((a, b) => b[1].btime.getTime() - a[1].btime.getTime())
									.map((entry) => entry[0]),
							);
						}
					};
				});
			}

			function getConversations(sortedIds: number[]) {
				const transaction = db.transaction('conversations', 'readonly', { durability: 'relaxed' });
				const store = transaction.objectStore(transaction.objectStoreNames[0]!);

				return new Promise<IDBConversation[]>((resolve, reject) => {
					const result = store.getAll();
					result.onerror = reject;

					result.onsuccess = (event) => {
						const getEvent = event.target as ReturnType<IDBIndex['getAll']>;
						const allConversations: IDBConversation[] = getEvent.result;

						resolve(allConversations.filter((conversation) => sortedIds.includes(conversation.id)).sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id)));
					};
				});
			}
			const conversations = await getConversations(await getConversationOrder());
			console.debug(conversations);
		};
	});

	return (
		<QwikCityProvider>
			<head>
				<meta charSet="utf-8" />
				<link rel="manifest" href="/manifest.json" />
				<RouterHead />
				<FaStylesheet />
			</head>
			<body lang="en">
				<RouterOutlet />
				<ServiceWorkerRegister nonce={nonce} />
			</body>
		</QwikCityProvider>
	);
});
