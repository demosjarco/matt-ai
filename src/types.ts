export interface Bindings extends Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}
