export interface EnvVars extends Bindings, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: any;
}
