import type { MessageAction } from '../../worker/aiTypes/MessageAction';
import type { AsyncFunctionWithParams, MessageActionTaken } from './types';

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

export function deepMerge<T>(base: T, incoming: Partial<T>): T {
	const output = { ...base } as T;

	for (const key in incoming) {
		if (Object.prototype.hasOwnProperty.call(incoming, key)) {
			const incomingValue = incoming[key];
			const baseValue = (base as any)[key];

			// Check if both incomingValue and baseValue are arrays
			if (Array.isArray(incomingValue) && Array.isArray(baseValue)) {
				// Type assertion used here to bypass the type checking
				output[key] = baseValue.concat(incomingValue) as any;
			} else if (incomingValue && typeof incomingValue === 'object') {
				// @ts-expect-error
				output[key] = baseValue !== null && key in base ? deepMerge(baseValue, incomingValue) : incomingValue;
			} else {
				(output as any)[key] = incomingValue;
			}
		}
	}

	return output;
}

export function calculateActionTaken(action: MessageAction): MessageActionTaken {
	return {
		translation: action.translation !== null && action.translation.userRequestLanguage !== action.translation.preferredResponseLanguage,
		previousMessageKeywordSearch: action.previousMessageKeywordSearch !== null && action.previousMessageKeywordSearch.length > 0,
		webSearchTerms: action.webSearchTerms !== null && action.webSearchTerms.length > 0,
		imageGenerate: action.imageGenerate !== null && action.imageGenerate.trim().length > 0,
	};
}

export function retryWithSelectiveRemoval<P1, P2, P3, R, T>(func: AsyncFunctionWithParams<P1, P2, P3, R, T>, param1: P1, items: T[], param2: P2, param3: P3): Promise<R> {
	if (items.length === 0) {
		throw new Error('No items left to process');
	}

	try {
		return func(param1, items, param2, param3);
	} catch (error) {
		if (items.length > 1) {
			// Remove the topmost item and retry
			return retryWithSelectiveRemoval(func, param1, items.slice(1), param2, param3);
		} else {
			// Only one item left, throw the error
			throw new Error('Last item in the array also failed: ' + error);
		}
	}
}
