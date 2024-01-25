import { GraphQLSchema } from 'graphql';
import { BaseSchema } from './baseSchema.mjs';
import { MutationIndex } from './mutation/index.mjs';
import { QueryIndex } from './query/index.mjs';
import { SubscriptionIndex } from './subscriptions/index.mjs';

export class ApiSchema extends BaseSchema {
	public override async schema(): Promise<GraphQLSchema> {
		return new GraphQLSchema({
			query: await new QueryIndex(this.helpers).gqlQueryType(),
			subscription: await new SubscriptionIndex(this.helpers).gqlSubscriptionType(),
			mutation: await new MutationIndex(this.helpers).gqlMutationType(),
		});
	}
}
