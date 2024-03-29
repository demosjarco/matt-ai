import { GraphQLSchema, type GraphQLFieldConfigArgumentMap, type GraphQLObjectType, type GraphQLResolveInfo } from 'graphql';
import { Base } from '../base.mjs';
import type { ArgsType, GqlContext } from '../types.js';

export abstract class BaseSchema extends Base {
	// @ts-ignore
	protected argsType: GraphQLFieldConfigArgumentMap;
	protected queryType: GraphQLObjectType | undefined;
	protected mutationType: GraphQLObjectType | undefined;

	// Mutations
	protected async createMutationHelperTypes(): Promise<void> {
		return;
	}
	protected async createMutationType(): Promise<void> {
		return;
	}

	// Queries
	protected async createQueryHelperTypes(): Promise<void> {
		return;
	}
	protected async createQueryType(): Promise<void> {
		return;
	}

	public get gqlArgsType(): GraphQLFieldConfigArgumentMap {
		return this.argsType;
	}

	public async gqlMutationType(): Promise<GraphQLObjectType | undefined> {
		await this.createMutationHelperTypes();
		await this.createMutationType();

		return this.mutationType;
	}

	public async gqlQueryType(): Promise<GraphQLObjectType | undefined> {
		await this.createQueryHelperTypes();
		await this.createQueryType();

		return this.queryType;
	}

	// Resolving queries
	public async gqlResolve(obj = {}, args: ArgsType<typeof this.argsType> = {}, context: GqlContext, info: GraphQLResolveInfo): Promise<Record<string, unknown>> {
		return {};
	}

	// Setup
	public async schema(): Promise<GraphQLSchema> {
		return new GraphQLSchema({});
	}
}
