import { openDB, type IDBPDatabase } from 'idb';
import { AiLocal as AiLocalV2, type AiLocalSchema as AiLocalSchemaV2 } from './schemas/v2';

export abstract class IDBBase {
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
