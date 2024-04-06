import { openDB } from 'idb';
import { AiLocal as AiLocalV1, type AiLocalSchema as AiLocalSchemaV1 } from './schemas/v1';

export abstract class IDBBase {
	protected get db() {
		return openDB<AiLocalSchemaV1>('ailocal', 1, {
			upgrade(database, oldVersion) {
				if (oldVersion < 1) {
					AiLocalV1.upgrade(database);
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
