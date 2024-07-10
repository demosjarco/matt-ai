import type { BrowserWorker } from '@cloudflare/puppeteer';
import type { workersAiCatalog } from '../../shared/workers-ai-catalog';

export interface EnvVars extends Bindings, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: Ai;
	BROWSER?: BrowserWorker;
}

export type modelTypes = keyof typeof workersAiCatalog.modelGroups;
export type modelPossibilitiesRaw<M extends modelTypes = modelTypes> = (typeof workersAiCatalog.modelGroups)[M]['models'][number];
export type modelPossibilities<M extends modelTypes = modelTypes> = modelPossibilitiesRaw<M>['name'];
type modelProperties<Model> = Model extends { properties: infer Props } ? keyof Props : never;
type modelPossibilitiesProperties<M extends modelTypes = modelTypes> = modelProperties<modelPossibilitiesRaw<M>>;
export type filteredModelPossibilitiesRaw<M extends modelTypes = modelTypes, K extends modelPossibilitiesProperties<M> = modelPossibilitiesProperties<M>, V extends modelPossibilitiesRaw<M>['properties'][K] = any> = modelPossibilitiesRaw<M> extends infer Model ? (Model extends { properties: Record<K, V> } ? Model : never) : never;
export type filteredModelPossibilities<M extends modelTypes = modelTypes, K extends modelPossibilitiesProperties<M> = modelPossibilitiesProperties<M>, V extends modelPossibilitiesRaw<M>['properties'][K] = any> = filteredModelPossibilitiesRaw<M, K, V>['name'];
