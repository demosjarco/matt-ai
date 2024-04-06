import type Helper from '../../worker/src/index';

export interface EnvVars extends Bindings, Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';

	TURNSTILE_SECRET_KEY: string;
}

interface Bindings {
	AI: any;
	BACKEND_WORKER: Service<Helper>;
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}

export interface ChatFormSubmit {
	message: string;
	'cf-turnstile-response': string;
}
