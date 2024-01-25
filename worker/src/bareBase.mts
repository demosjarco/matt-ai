import type { Context } from 'hono';
import type { EnvVars } from './types.js';

export interface BareBaseHelpers {
	c: Context<{ Bindings: EnvVars }>;
}

export abstract class BareBase<T extends BareBaseHelpers = BareBaseHelpers> {
	// @ts-ignore
	protected helpers: T = {};

	constructor(helpers: T) {
		this.helpers = helpers;
	}
}
