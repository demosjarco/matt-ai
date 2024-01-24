import { Ai } from '@cloudflare/ai';
import { Result, error, success } from './result';

export interface ModelSelector {
	binding: ConstructorParameters<typeof Ai>[0];
	options?: ConstructorParameters<typeof Ai>[1];
	model: Parameters<Ai['run']>[0];
}

/**
 * Represents a section of an LLM prompt with an associated role. TypeChat uses the "user" role for
 * prompts it generates and the "assistant" role for previous LLM responses (which will be part of
 * the prompt in repair attempts). TypeChat currently doesn't use the "system" role.
 */
export interface PromptSection {
	/**
	 * Specifies the role of this section.
	 */
	role: 'system' | 'user' | 'assistant';
	/**
	 * Specifies the content of this section.
	 */
	content: string;
}

/**
 * Represents a AI language model that can complete prompts. TypeChat uses an implementation of this
 * interface to communicate with an AI service that can translate natural language requests to JSON
 * instances according to a provided schema. The `createLanguageModel`, `createOpenAILanguageModel`,
 * and `createAzureOpenAILanguageModel` functions create instances of this interface.
 */
export interface TypeChatLanguageModel {
	/**
	 * Optional property that specifies the maximum number of retry attempts (the default is 3).
	 */
	retryMaxAttempts?: number;
	/**
	 * Optional property that specifies the delay before retrying in milliseconds (the default is 1000ms).
	 */
	retryPauseMs?: number;
	/**
	 * Obtains a completion from the language model for the given prompt.
	 * @param prompt A prompt string or an array of prompt sections. If a string is specified,
	 *   it is converted into a single "user" role prompt section.
	 */
	complete(prompt: string | PromptSection[]): Promise<Result<string>>;
}

/**
 * Creates a language model encapsulation of an OpenAI or Azure OpenAI REST API endpoint
 * chosen by environment variables.
 *
 * If an `OPENAI_API_KEY` environment variable exists, the `createOpenAILanguageModel` function
 * is used to create the instance. The `OPENAI_ENDPOINT` and `OPENAI_MODEL` environment variables
 * must also be defined or an exception will be thrown.
 *
 * If an `AZURE_OPENAI_API_KEY` environment variable exists, the `createAzureOpenAILanguageModel` function
 * is used to create the instance. The `AZURE_OPENAI_ENDPOINT` environment variable must also be defined
 * or an exception will be thrown.
 *
 * If none of these key variables are defined, an exception is thrown.
 * @returns An instance of `TypeChatLanguageModel`.
 */

export function createLanguageModel(config: ModelSelector): TypeChatLanguageModel {
	if (config.binding && config.model) {
		return createBindingLanguageModel(config.model, config.binding, config.options);
	} else {
		throw new Error('Missing AI Binding and/or model selection');
	}
}

function createBindingLanguageModel(model: ModelSelector['model'], binding: ModelSelector['binding'], options: ModelSelector['options']) {
	const returnModel: TypeChatLanguageModel = {
		complete,
	};
	return returnModel;

	async function complete(prompt: string | PromptSection[]) {
		let retryCount = 0;
		const retryMaxAttempts = returnModel.retryMaxAttempts ?? 3;
		const retryPauseMs = returnModel.retryPauseMs ?? 1000;
		const messages = typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt;
		while (true) {
			try {
				const { response } = await new Ai(binding).run(model, { messages });
				if (response) {
					return success(response ?? '');
				}
			} catch (err) {
				return error(`Workers AI error ${err}`);
			}
			await sleep(retryPauseMs);
			retryCount++;
		}
	}
}

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
