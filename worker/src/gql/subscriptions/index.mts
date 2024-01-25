import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, type GraphQLResolveInfo } from 'graphql';
import type { GqlContext } from '../../types.js';
import { BaseSchema } from '../baseSchema.mjs';

export class SubscriptionIndex extends BaseSchema {
	protected override async createSubscriptionType(): Promise<void> {
		this.subscriptionType = new GraphQLObjectType({
			name: 'Subscription',
			fields: {
				countdown: {
					type: new GraphQLNonNull(GraphQLInt),
					args: {
						from: {
							type: new GraphQLNonNull(GraphQLInt),
						},
					},
					subscribe: async function* (obj, args: { from: number }, context: GqlContext, info: GraphQLResolveInfo) {
						for (let i = args.from; i >= 0; i--) {
							await new Promise((resolve) => setTimeout(resolve, 1000));
							console.log('sending', i);
							yield { countdown: i };
						}
					},
				},
			},
		});
	}
}
