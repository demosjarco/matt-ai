import type { Context } from 'hono';

export interface BareBaseHelpers {
	c: Context;
}

export abstract class BareBase<T extends BareBaseHelpers = BareBaseHelpers> {
	// @ts-ignore
	protected helpers: T = {};

	constructor(helpers: T) {
		this.helpers = helpers;
	}
}
