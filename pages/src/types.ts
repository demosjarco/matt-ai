import type { randomUUID } from 'node:crypto';
import type { workersAiCatalog } from '../../shared/workers-ai-catalog';
import type Helper from '../../worker/src/index';
import type { IDBMessage } from './IDB/schemas/v3';

export interface EnvVars extends Secrets, Bindings, Partial<PagesEnvironmentvariables>, Record<string, any> {
	NODE_ENV: 'production' | 'development';
	TURNSTILE_SITE_KEY: string;
}

interface Secrets {
	TURNSTILE_SECRET_KEY: string;
}

interface Bindings {
	AI: Ai;
	BACKEND_WORKER: Service<Helper>;
}

interface PagesEnvironmentvariables {
	CF_PAGES: '0' | '1';
	CF_PAGES_COMMIT_SHA: string;
	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}

export interface CustomContext {
	req: {
		raw: Parameters<ExportedHandlerFetchHandler<EnvVars, unknown>>[0];
	};
	env: EnvVars;
	executionCtx: ExecutionContext;
}

export type modelTypes = keyof typeof workersAiCatalog.modelGroups;
export type modelPossibilities<M extends modelTypes = modelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number];
export type modelPossibilitiesName<M extends modelTypes = modelTypes> = modelPossibilities<M>['name'];

type ModelProperties<Model> = Model extends { properties: infer Props } ? keyof Props : never;
type modelPossibilitiesProperties<M extends modelTypes = modelTypes> = ModelProperties<modelPossibilities<M>>;
export type filteredModelPossibilities<M extends modelTypes = modelTypes, K extends modelPossibilitiesProperties<M> = modelPossibilitiesProperties<M>, V extends modelPossibilities<M>['properties'][K] = any> = modelPossibilities<M> extends infer Model ? (Model extends { properties: Record<K, V> } ? Model : never) : never;
export type filteredModelPossibilitiesName<M extends modelTypes = modelTypes, K extends modelPossibilitiesProperties<M> = modelPossibilitiesProperties<M>, V extends modelPossibilities<M>['properties'][K] = any> = filteredModelPossibilities<M, K, V>['name'];

export interface UuidExport {
	utf8: ReturnType<typeof randomUUID>;
	hex: string;
	blob: (typeof Uint8Array)['prototype']['buffer'];
}

export interface ChatFormSubmit {
	message: string;
	'cf-turnstile-response': string;
}

export type MessageContext = Record<NonNullable<IDBMessage['key']>, MessageContextValue>;

export interface MessageContextValue {
	webSearchInfo?: Record<string, any>;
}

export type AsyncFunctionWithParams<P1, P2, P3, R, T> = (param1: P1, items: T[], param2: P2, param3: P3) => Promise<R>;

/**
 * @link https://developers.cloudflare.com/turnstile/troubleshooting/testing/#dummy-sitekeys-and-secret-keys
 */
export namespace TurnstileDummySitekey {
	export enum Visible {
		passes = '1x00000000000000000000AA',
		blocks = '2x00000000000000000000AB',
		interactive = '3x00000000000000000000FF',
	}
	export enum Invisible {
		passes = '1x00000000000000000000BB',
		blocks = '2x00000000000000000000BB',
	}
}
export enum TurnstileDummySecretkey {
	passes = '1x0000000000000000000000000000000AA',
	fails = '2x0000000000000000000000000000000AA',
	spent = '3x0000000000000000000000000000000AA',
}

/**
 * @link https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#accepted-parameters
 */
export interface TurnstileResponse {
	success: boolean;
	/**
	 * the ISO timestamp for the time the challenge was solved
	 */
	challenge_ts: ReturnType<Date['toISOString']>;
	/**
	 * the hostname for which the challenge was served
	 */
	hostname: URL['hostname'];
	/**
	 * the customer widget identifier passed to the widget on the client side. This is used to differentiate widgets using the same sitekey in analytics. Its integrity is protected by modifications from an attacker. It is recommended to validate that the action matches an expected value
	 */
	action: string;
	/**
	 * the customer data passed to the widget on the client side. This can be used by the customer to convey state. It is integrity protected by modifications from an attacker
	 */
	cdata: string;
	/**
	 * a list of errors that occurred
	 */
	'error-codes': string[];
}
