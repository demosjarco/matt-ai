import type { EnvVars } from '../types';
import { Helpers } from './helpers.mjs';
import type { CustomContext } from './types.mjs';

export interface BaseHelpers {
	c: CustomContext;
}

export abstract class CFBase<T extends BaseHelpers = BaseHelpers> extends Helpers {
	// @ts-ignore
	protected helpers: T = {};

	protected static isQwikCityPlatform(incomingContext: QwikCityPlatform | any): incomingContext is QwikCityPlatform {
		return (incomingContext as QwikCityPlatform).request !== undefined && (incomingContext as QwikCityPlatform).ctx !== undefined;
	}

	constructor(incomingContext: QwikCityPlatform | T) {
		super();

		if (CFBase.isQwikCityPlatform(incomingContext)) {
			// @ts-ignore
			this.helpers = {
				c: {
					req: {
						raw: incomingContext.request,
					},
					env: incomingContext.env as EnvVars,
					executionCtx: incomingContext.ctx as ExecutionContext,
				},
			};
		} else {
			this.helpers = incomingContext;
		}
	}
}
