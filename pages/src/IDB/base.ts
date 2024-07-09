import { openDB, type IDBPDatabase } from 'idb';
import { AiLocal as AiLocalV2 } from './schemas/v2';
import AiLocalV3, { type AiLocalSchema as AiLocalSchemaV3 } from './schemas/v3';

export abstract class IDBBase {
	private static readonly LOWER_CHAR_SET = 'abcdefghijklmnopqrstuvwxyz';
	private static readonly NUMBER_CHAR_SET = '0123456789';
	private static readonly CHAR_SET = `${IDBBase.LOWER_CHAR_SET}${IDBBase.NUMBER_CHAR_SET}${IDBBase.LOWER_CHAR_SET.toUpperCase()}`;

	protected static randomText(length: number) {
		const randomBytes = new Uint8Array(length);
		crypto.getRandomValues(randomBytes);
		let randomText = '';
		for (const byte of randomBytes) {
			// Map each byte to a character in the character set
			const charIndex = byte % this.CHAR_SET.length;
			randomText += this.CHAR_SET.charAt(charIndex);
		}
		return randomText;
	}

	protected get db() {
		return openDB<AiLocalSchemaV3>('ailocal', 3, {
			upgrade(database, oldVersion) {
				// Ignore v1 as it was before ORM
				if (oldVersion < 2) {
					AiLocalV2.upgrade(database as unknown as IDBPDatabase, database);
				}
				if (oldVersion < 3) {
					AiLocalV3.upgrade(database as unknown as IDBPDatabase, database);
				}
				/**
				 * @link https://github.com/jakearchibald/idb?tab=readme-ov-file#opting-out-of-types
				 */
			},
			blocked(currentVersion, blockedVersion, event) {
				const error = new Error('IDBOpenDBRequest: blocked', { cause: `An open connection to v${currentVersion} is blocking a versionchange transaction to v${blockedVersion}` });
				console.error(error, event);
			},
			blocking(currentVersion, blockedVersion, event) {
				const error = new Error('IDBDatabase: versionchange', { cause: `An attempt to open v${blockedVersion} is blocked while it is upgrading from v${currentVersion}` });
				console.warn(error, event);
			},
			terminated() {
				const error = new Error('IDBDatabase: close', { cause: 'Browser abnormally terminated connection' });
				console.error(error);
			},
		});
	}
}
