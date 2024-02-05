export function isLocal(incoming: string | URL | Request): boolean {
	let incomingUrl: URL;

	if (incoming instanceof Request) {
		incomingUrl = new URL(incoming.headers.get('origin') ?? incoming.url);
	} else {
		incomingUrl = new URL(incoming);
	}

	if (incomingUrl.hostname === 'localhost' || incomingUrl.hostname === '127.0.0.1') {
		return true;
	}

	const parts = incomingUrl.hostname.split('.').map((part) => parseInt(part, 10));

	if (parts.length !== 4) {
		// Not a valid IPv4 address
		return false;
	}

	if (parts[0] === 10) {
		// Class A private IP
		return true;
	}

	if (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) {
		// Class B private IP
		return true;
	}

	if (parts[0] === 192 && parts[1] === 168) {
		// Class C private IP
		return true;
	}

	return false;
}
export function runningLocally(incomingRequest: Request): boolean {
	return isLocal(new URL(incomingRequest.headers.get('Origin') ?? `https://${incomingRequest.headers.get('Host')}`));
}

export enum IDBConversationIndexes {
	accessTime = 'atime',
	birthTime = 'btime',
	changeTime = 'ctime',
	modifiedTime = 'mtime',
	conversationId = 'id',
}
export enum IDBMessageIndexes {
	conversationId = 'conversation_id',
	messageId = 'message_id',
	contentVersion = 'content_version',
	birthTime = 'btime',
	conversationIdMessageIdContentVersion = `${conversationId}|${messageId}|${contentVersion}`,
	conversationIdMessageId = `${conversationId}|${messageId}`,
}

export function deepMerge<T>(base: T, incoming: Partial<T>): T {
	if (base === null || incoming === null || typeof base !== 'object' || typeof incoming !== 'object') {
		throw new Error('Both base and incoming should be non-null objects');
	}

	const output = { ...base } as T;

	for (const key in incoming) {
		// eslint-disable-next-line no-prototype-builtins
		if (incoming.hasOwnProperty(key)) {
			const incomingValue = incoming[key];
			const baseValue = (base as any)[key];

			if (incomingValue && typeof incomingValue === 'object') {
				output[key] = baseValue !== null && key in base ? deepMerge(baseValue, incomingValue) : incomingValue;
			} else {
				(output as any)[key] = incomingValue;
			}
		}
	}

	return output;
}
