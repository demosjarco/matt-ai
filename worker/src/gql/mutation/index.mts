import { GraphQLObjectType, GraphQLString, type GraphQLResolveInfo } from 'graphql';
import type { GqlContext } from '../../types.js';
import { BaseSchema } from '../baseSchema.mjs';

export class MutationIndex extends BaseSchema {
	protected override async createMutationType(): Promise<void> {
		this.mutationType = new GraphQLObjectType({
			name: 'Mutation',
			fields: {
				hello: {
					type: GraphQLString,
					args: {
						name: { type: GraphQLString },
					},
					resolve: (obj, args: { name?: string }, context: GqlContext, info: GraphQLResolveInfo) => `Hello ${args.name}`,
				},
			},
		});
	}
}
