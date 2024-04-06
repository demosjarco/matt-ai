import { DurableObject } from 'cloudflare:workers';
import type { EnvVars } from '../pages/src/types.js';

export class QueueCallbackHandler extends DurableObject<EnvVars> {
	override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {}

	override webSocketError(ws: WebSocket, error: unknown) {}

	override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {}
}
