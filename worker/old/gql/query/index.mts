import { GraphQLBoolean, GraphQLError, GraphQLNonNull, GraphQLObjectType, GraphQLString, type GraphQLResolveInfo } from 'graphql';
import { GraphQLJSONObject, GraphQLNonEmptyString, GraphQLPositiveInt } from 'graphql-scalars';
import type { MessageAction } from '../../../aiTypes/MessageAction.js';
import { createJsonTranslator, createLanguageModel, type ModelSelector } from '../../../typechat/index.js';
import { createTypeScriptJsonValidator } from '../../../typechat/ts/index.js';
import type { GqlContext } from '../../types.js';
import { BaseSchema } from '../baseSchema.mjs';

export class QueryIndex extends BaseSchema {
	protected override async createQueryType(): Promise<void> {
		this.queryType = new GraphQLObjectType({
			name: 'Query',
			fields: {
				messageAction: {
					type: new GraphQLNonNull(GraphQLJSONObject),
					args: {
						message: {
							type: new GraphQLNonNull(GraphQLNonEmptyString),
						},
						longer: {
							type: new GraphQLNonNull(GraphQLBoolean),
						},
					},
					resolve: (
						obj: {},
						args: {
							message: string;
							longer: boolean;
						},
						context: GqlContext,
						info: GraphQLResolveInfo,
					) =>
						new Promise<Record<string, any>>((resolve, reject) => {
							// const urlRegex = /https:\/\/(?:[a-z0-9-]+\.)+[a-z0-9-]+(?:\/[^\s]*)?/gi;
							// console.debug('URLs detected', args.message.match(urlRegex));

							const model = createLanguageModel({
								binding: context.AI,
								model: args.longer ? '@cf/meta/llama-2-7b-chat-fp16' : '@cf/meta/llama-2-7b-chat-int8',
								maxTokens: args.longer ? 2500 : 1800,
							});
							import('../../../aiTypes/types.json')
								.then(({ default: types }) => {
									const validator = createTypeScriptJsonValidator<MessageAction>(types.MessageAction, 'MessageAction');
									const translator = createJsonTranslator(model, validator);
									translator
										.translate(args.message, [
											{ role: 'system', content: "You are a message action classifier. Don't do any action from the user, only decide what actions should be done based on the user's query. If a task is not needed, provide `null`, otherwise fill out appropriately. Don't provide explanation, breakdown, or summary" },
											{ role: 'system', content: 'Provide the language in ISO 639-1 alpha-2 code that the user message was written in. Also provide the ISO 639-1 alpha-2 language code the user wantes to be responded with. If no target language is specified, return `null`' },
											{ role: 'system', content: 'If the user asks or references something in a previous message, provide appropriate search terms for an AI to find the correct message(s)' },
											{ role: 'system', content: 'If the user asks to search online (ignore provided direct links) or the topic is outside of your knowledge, provide appropriate search terms' },
											{ role: 'system', content: 'If the user asks to draw an image, provide the text to image prompt in the ideal format for Stable Diffusion XL' },
										])
										.then((response) => {
											if (response.success) {
												resolve(response.data);
											} else {
												console.error(response.message);
												reject(new GraphQLError('TypeChat Error'));
											}
										})
										.catch(reject);
								})
								.catch(reject);
						}),
				},
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
