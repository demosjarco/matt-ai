import { createQwikCity, type PlatformCloudflarePages } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import type { Request } from '@cloudflare/workers-types/experimental';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';
import type { EnvVars } from './types';

declare global {
	interface QwikCityPlatform extends Omit<PlatformCloudflarePages, 'request'> {
		request: Request;
		env: EnvVars;
	}
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
