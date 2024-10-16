import type { UuidExport } from '../types';

export class Helpers {
	/**
	 * @link https://jsbm.dev/NHJHj31Zwm3OP
	 */
	public static bufferFromHex(hex: string) {
		return new Uint8Array(hex.length / 2).map((_, index) => parseInt(hex.slice(index * 2, index * 2 + 2), 16)).buffer;
	}

	/**
	 * @link https://jsbm.dev/AoXo8dEke1GUg
	 */
	public static bufferToHex(buffer: ReturnType<typeof this.bufferFromHex>) {
		return new Uint8Array(buffer).reduce((output, elem) => output + ('0' + elem.toString(16)).slice(-2), '');
	}

	public static get generateUuid(): UuidExport {
		const uuid = crypto.randomUUID();
		const uuidHex = uuid.replaceAll('-', '');

		return {
			utf8: uuid,
			hex: uuidHex,
			blob: this.bufferFromHex(uuidHex),
		};
	}

	public static randomText(length: number) {
		const LOWER_CHAR_SET = 'abcdefghijklmnopqrstuvwxyz' as const;
		const NUMBER_CHAR_SET = '0123456789' as const;
		const CHAR_SET = `${LOWER_CHAR_SET.toUpperCase()}${LOWER_CHAR_SET}${NUMBER_CHAR_SET}` as const;

		const randomBytes = new Uint8Array(length);
		crypto.getRandomValues(randomBytes);
		let randomText = '';
		for (const byte of randomBytes) {
			// Map each byte to a character in the character set
			const charIndex = byte % CHAR_SET.length;
			randomText += CHAR_SET.charAt(charIndex);
		}
		return randomText;
	}

	public static uuidConvert(input: UuidExport['blob']): UuidExport;
	public static uuidConvert(input: UuidExport['utf8']): UuidExport;
	public static uuidConvert(input: UuidExport['hex']): UuidExport;
	public static uuidConvert(input: undefined): undefined;
	public static uuidConvert(input?: UuidExport['blob'] | UuidExport['utf8'] | UuidExport['hex']) {
		if (input) {
			if (typeof input === 'string') {
				if (input.includes('-')) {
					const hex = input.replaceAll('-', '');

					return {
						utf8: input as UuidExport['utf8'],
						hex,
						blob: this.bufferFromHex(hex),
					};
				} else {
					return {
						utf8: `${input.substring(0, 8)}-${input.substring(8, 12)}-${input.substring(12, 16)}-${input.substring(16, 20)}-${input.substring(20)}`,
						hex: input,
						blob: this.bufferFromHex(input),
					};
				}
			} else {
				const hex = this.bufferToHex(input);

				return {
					utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
					hex,
					blob: input,
				};
			}
		} else {
			return undefined;
		}
	}

	public static getHash(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', input: string | ArrayBufferLike) {
		return crypto.subtle.digest(algorithm, typeof input === 'string' ? new TextEncoder().encode(input) : input).then((hashBuffer) => this.bufferToHex(hashBuffer));
	}

	/**
	 * @returns Fully formatted (double quote encapsulated) `ETag` header value
	 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag#etag_value
	 */
	public static generateETag(response: Response, algorithm: Parameters<typeof this.getHash>[0] = 'SHA-512') {
		return response
			.clone()
			.arrayBuffer()
			.then((buffer) => this.getHash(algorithm, buffer).then((hex) => `"${hex}"`));
	}
}
