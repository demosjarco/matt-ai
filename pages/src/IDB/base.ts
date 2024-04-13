import { openDB, type IDBPDatabase } from 'idb';
import { AiLocal as AiLocalV2, type AiLocalSchema as AiLocalSchemaV2 } from './schemas/v2';

export abstract class IDBBase {
	private static readonly LOWER_CHAR_SET = 'abcdefghijklmnopqrstuvwxyz';
	private static readonly NUMBER_CHAR_SET = '0123456789';
	private static readonly CHAR_SET = `${IDBBase.LOWER_CHAR_SET.toUpperCase()}${IDBBase.LOWER_CHAR_SET}${IDBBase.NUMBER_CHAR_SET}`;

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
		return openDB<AiLocalSchemaV2>('ailocal', 2, {
			upgrade(database, oldVersion) {
				// Ignore v1 as it was before ORM
				if (oldVersion < 2) {
					AiLocalV2.upgrade(database as unknown as IDBPDatabase, database);
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
