import { GraphQLBoolean, GraphQLError, GraphQLNonNull, GraphQLObjectType, GraphQLString, type GraphQLResolveInfo } from 'graphql';
import { GraphQLJSONObject, GraphQLPositiveInt } from 'graphql-scalars';
import { ModelSelector, createJsonTranslator, createLanguageModel } from '../../../typechat/index.js';
import { createTypeScriptJsonValidator } from '../../../typechat/ts/index.js';
import type { GqlContext } from '../../types.js';
import { BaseSchema } from '../baseSchema.mjs';

export class QueryIndex extends BaseSchema {
	protected override async createQueryType(): Promise<void> {
		this.queryType = new GraphQLObjectType({
			name: 'Query',
			fields: {
				typechatTest: {
					type: new GraphQLNonNull(GraphQLJSONObject),
					args: {
						model: {
							type: new GraphQLNonNull(GraphQLString),
							defaultValue: '@cf/meta/llama-2-7b-chat-int8',
						},
						type: {
							type: new GraphQLNonNull(GraphQLString),
							defaultValue: 'SentimentResponse',
						},
						instruction: {
							type: GraphQLString,
						},
						message: {
							type: new GraphQLNonNull(GraphQLString),
						},
						maxTokens: {
							type: GraphQLPositiveInt,
						},
						internalStream: {
							type: GraphQLBoolean,
							defaultValue: false,
						},
					},
					resolve: (
						obj: {},
						args: {
							model: ModelSelector['model'];
							type: string;
							instruction?: string;
							message: string;
							maxTokens?: number;
							internalStream: boolean;
						},
						context: GqlContext,
						info: GraphQLResolveInfo,
					) =>
						new Promise<Record<string, any>>((resolve, reject) => {
							const model = createLanguageModel({
								binding: context.AI,
								model: args.model,
								maxTokens: args.maxTokens,
								stream: args.internalStream,
							});
							import('../../../aiTypes/types.json')
								.then(({ default: types }) => {
									if (args.type in types) {
										// @ts-expect-error
										const schema = types[args.type];
										const validator = createTypeScriptJsonValidator(schema, args.type);
										const translator = createJsonTranslator(model, validator);
										translator
											.translate(args.message, args.instruction ? [{ role: 'system', content: args.instruction }] : undefined)
											.then((response) => {
												if (response.success) {
													resolve(response.data);
												} else {
													console.error(response.message);
													reject(new GraphQLError('TypeChat Error'));
												}
											})
											.catch(reject);
									} else {
										reject(new GraphQLError(`Type ${args.type} does not exist`));
									}
								})
								.catch(reject);
						}),
				},
				hello: {
					type: new GraphQLNonNull(GraphQLString),
					resolve: () => 'Hello World!',
				},
			},
		});
	}
}
