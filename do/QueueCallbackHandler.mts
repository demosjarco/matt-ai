import { DurableObject } from 'cloudflare:workers';
import type { EnvVars } from '../worker/src/types.js';

export class QueueCallbackHandler extends DurableObject<EnvVars> {
	override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		/**
		 * @todo Upon receiving a message from the client, reply with the same message, but will prefix the message with "[Durable Object]:""
		 */
		console.log(`[Incoming]: ${message}`);
		ws.send(`[Durable Object]: ${message}`);
	}

	override webSocketError(ws: WebSocket, error: unknown) {
		/**
		 * @todo
		 */
		console.error('WS Error', error);
	}

	override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// If the client closes the connection, we will close it too
		console.debug('WS Closed', code, reason, wasClean);
		ws.close(code, 'Durable Object is closing WebSocket');
	}
}
