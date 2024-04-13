import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { UuidExport } from '../types';

export class Helpers {
	public static get uuidGenerate(): UuidExport {
		const uuid = randomUUID();
		const uuidHex = uuid.replaceAll('-', '');

		return {
			utf8: uuid,
			hex: uuidHex,
			blob: Buffer.from(uuidHex, 'hex'),
		};
	}

	public static uuidConvert(input: UuidExport['blob']): UuidExport;
	public static uuidConvert(input: UuidExport['utf8']): UuidExport;
	public static uuidConvert(input: UuidExport['hex']): UuidExport;
	public static uuidConvert(input: UuidExport['blob'] | UuidExport['utf8'] | UuidExport['hex']): UuidExport {
		if (Buffer.isBuffer(input)) {
			const hex = input.toString('hex');

			return {
				utf8: `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`,
				hex,
				blob: input,
			};
		} else {
			if (input.includes('-')) {
				const hex = input.replaceAll('-', '');

				return {
					utf8: input as UuidExport['utf8'],
					hex,
					blob: Buffer.from(hex, 'hex'),
				};
			} else {
				return {
					utf8: `${input.substring(0, 8)}-${input.substring(8, 12)}-${input.substring(12, 16)}-${input.substring(16, 20)}-${input.substring(20)}`,
					hex: input,
					blob: Buffer.from(input, 'hex'),
				};
			}
		}
	}
}
