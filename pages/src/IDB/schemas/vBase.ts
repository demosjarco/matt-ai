import type { DBSchema, IDBPDatabase } from 'idb';

export abstract class AiLocalBase {
	// @ts-expect-error
	public static upgrade<S extends DBSchema>(oldDatabase: IDBPDatabase, newDatabase: IDBPDatabase<S>): void;
}
