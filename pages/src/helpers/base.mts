import type { EnvVars } from '../types';
import { Helpers } from './helpers.mjs';
import type { CustomContext } from './types.mjs';

export interface BaseHelpers {
	c: CustomContext;
}

export interface GraphQlBody {
	query?: string;
	mutation?: string;
	variables?: Record<string, any>;
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

	protected fetchBackend(gql: GraphQlBody) {
		const graphqlUrl = new URL('/graphql', this.helpers.c.req.raw.url);

		return new Promise<Record<string, any>>((resolve, reject) =>
			this.helpers.c.env.BACKEND_WORKER.fetch(graphqlUrl.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				cf: this.helpers.c.req.raw.cf ?? {},
				body: JSON.stringify(gql),
			})
				.then((response) =>
					response
						.json<{ data: Record<string, any> }>()
						.then((json) => resolve(json.data))
						.catch(reject),
				)
				.catch(reject),
		);
	}
}
