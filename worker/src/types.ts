import type { Request } from '@cloudflare/workers-types';
import type { GraphQLFieldConfigArgumentMap, GraphQLScalarType } from 'graphql';

export interface EnvVars extends Bindings, Record<string, any> {
	NODE_ENV: 'production' | 'development';
}

interface Bindings {
	AI: any;
}

export interface GqlContext extends Bindings, ExecutionContext {
	request: Request;
}

type GraphQLTypeToTs<T> = T extends GraphQLScalarType ? ReturnType<T['parseValue']> : any;

export type ArgsType<T extends GraphQLFieldConfigArgumentMap> = {
	[K in keyof T]: GraphQLTypeToTs<T[K]['type']>;
};
