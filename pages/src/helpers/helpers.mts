import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { UuidExport } from './types.mjs';

export class Helpers {
	public static get generateUuid(): UuidExport {
		const uuid = randomUUID();
		const uuidHex = uuid.replaceAll('-', '');

		return {
			utf8: uuid,
			hex: uuidHex,
			blob: Buffer.from(uuidHex, 'hex'),
		};
	}

	public static uuidConvertFromUtf8(utf8: UuidExport['utf8']): UuidExport {
		const hex = utf8.replaceAll('-', '');

		return {
			utf8: utf8,
			hex,
			blob: Buffer.from(hex, 'hex'),
		};
	}

	public static uuidConvertFromHex(hex: UuidExport['hex']): UuidExport {
		return {
			utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
			hex: hex,
			blob: Buffer.from(hex, 'hex'),
		};
	}

	public static uuidConvertFromBlob(blob: UuidExport['blob']): UuidExport {
		const hex = Buffer.from(blob).toString('hex');

		return {
			utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
			hex,
			blob: blob,
		};
	}
}
