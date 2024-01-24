import { createLanguageModel } from '../typechat';
import { createTypeScriptJsonValidator } from '../typechat/ts';
import { CFBase } from './helpers/base.mjs';
import type { SentimentResponse } from './sentimentSchema';

export class TypeChatTest extends CFBase {
	public async testing() {
		console.log(this.helpers.c.env);

		const model = createLanguageModel({
			binding: this.helpers.c.env.AI,
			model: '@cf/meta/llama-2-7b-chat-fp16',
		});
		const schema = `// The following is a schema definition for determining the sentiment of a some user input.
        export interface SentimentResponse {
            sentiment: 'negative' | 'neutral' | 'positive'; // The sentiment of the text
        }`;
		const validator = createTypeScriptJsonValidator<SentimentResponse>(schema, 'SentimentResponse');
		// const translator = createJsonTranslator(model, validator);
		// const testingPrompts = ['hello, world', 'TypeChat is awesome!', "I'm having a good day", "it's very rainy outside"];
		// for (const request of testingPrompts) {
		// 	const response = await translator.translate(request);
		// 	if (response.success) {
		// 		console.log(`The sentiment is ${response.data.sentiment}`);
		// 	} else {
		// 		console.error(response.message);
		// 	}
		// }
	}
}
