import { component$, useServerData, useVisibleTask$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister, server$ } from '@builder.io/qwik-city';
import { Ai } from '@cloudflare/ai';
import type { AiTextGenerationOutput } from '@cloudflare/ai/dist/tasks/text-generation';
import { initFlowbite } from 'flowbite';
import { FaStylesheet } from 'qwik-fontawesome';
import type { ExcludeType } from '../../worker/typechat/model';
import { RouterHead } from './components/router-head/router-head';
import { IDBConversationIndexes, IDBMessageIndexes } from './extras';
import type { EnvVars, IDBConversation, IDBMessage } from './types';

import './global.less';

const chatGenerator = server$(function () {
	const { AI } = this.platform.env as EnvVars;

	const ai = new Ai(AI);

	console.debug('Generating dummy chat message');
	return new Promise<{ created: Date; response: string }>((resolve, reject) =>
		ai
			.run('@cf/meta/llama-2-7b-chat-fp16', {
				max_tokens: 2500,
				messages: [{ role: 'system', content: 'You are a dev helper to simulate chat messages. Generate a sample chat message' }],
			})
			.then((staticResponse: ExcludeType<AiTextGenerationOutput, ReadableStream>) => {
				if (staticResponse.response) {
					const output: { created: Date; response: string } = {
						created: new Date(),
						response: staticResponse.response,
					};

					console.debug('Done generating dummy chat message');
					resolve(output);
				} else {
					console.debug('Failed generating dummy chat message');
					reject(staticResponse.response);
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

			function createConversations() {
				const table = db.createObjectStore('conversations', {
					keyPath: 'id',
					autoIncrement: true,
				});

				// For search
				table.createIndex(IDBConversationIndexes.accessTime, 'atime', { unique: false, multiEntry: false });
				table.createIndex(IDBConversationIndexes.birthTime, 'btime', { unique: false, multiEntry: false });
				table.createIndex(IDBConversationIndexes.changeTime, 'ctime', { unique: false, multiEntry: false });
				table.createIndex(IDBConversationIndexes.modifiedTime, 'mtime', { unique: false, multiEntry: false });

				// For safety
				table.createIndex(IDBConversationIndexes.conversationId, 'id', { unique: true });

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
				table.createIndex(IDBMessageIndexes.conversationId, 'conversation_id', { unique: false, multiEntry: false });
				table.createIndex(IDBMessageIndexes.contentVersion, 'content_version', { unique: false, multiEntry: false });
				table.createIndex(IDBMessageIndexes.birthTime, 'btime', { unique: false, multiEntry: false });

				// For safety
				table.createIndex(IDBMessageIndexes.conversationIdMessageIdContentVersion, ['conversation_id', 'id', 'content_version'], { unique: true });

				// For speed
				table.createIndex(IDBMessageIndexes.conversationIdMessageId, ['conversation_id', 'id'], { unique: false });

				// Other columns
				// table.createIndex('role', 'role', { unique: false, multiEntry: true });
				// table.createIndex('model_used', 'model_used', { unique: false, multiEntry: false });
				// table.createIndex('content', 'content', { unique: false, multiEntry: true });
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
						mtime: new Date(),
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
								content: [{ description: response }],
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
				<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
			</body>
		</QwikCityProvider>
	);
});
