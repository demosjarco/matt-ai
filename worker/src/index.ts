import { connect, launch, sessions, type Browser, type BrowserWorker } from '@cloudflare/puppeteer';
import { zValidator } from '@hono/zod-validator';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import type { EnvVars, filteredModelPossibilities } from './types.js';

interface InferenceResult {
	arguments: {
		score: number;
	};
	name: 'Relevance' | 'Clarity' | 'Comprehensiveness' | 'Hallucination/Accuracy';
}

export default class extends WorkerEntrypoint<EnvVars> {
	// Dummy entry point, crashes without it
	override async fetch(request: Request) {
		// return new Response('Hello world');

		const app = new Hono<{ Bindings: EnvVars }>();
		const validApiMethods = ['POST', 'GET'];

		app.use('*', (c, next) => {
			return cors({
				origin: '*',
				allowMethods: [...new Set([...validApiMethods, 'OPTIONS'])],
				maxAge: 300,
			})(c, next);
		});
		app.use('*', secureHeaders());

		app.use('*', etag());
		app.use('*', timing());

		app.post(
			'/',
			zValidator(
				'form',
				z.object({
					req: z.string().trim(),
					res: z.string().trim(),
				}),
			),
			(c) => {
				const { req, res } = c.req.valid('form');

				/**
				 * It's `LLMClassifierFromTemplate` from `autoevals` but withotu openai hardcoding
				 */
				const useCoT: boolean = true;
				// @ts-ignore
				return this.env.AI.run('@hf/nousresearch/hermes-2-pro-mistral-7b' satisfies filteredModelPossibilities<'Text Generation', 'function_calling', true>, {
					// Financial safety limit
					max_tokens: 512,
					// Works better
					temperature: 0.2,
					messages: [
						{ role: 'system', content: `You are an peer-review evaluator for AI responses. Evaluate the following response and associated request using the tools as criteria.${useCoT ? ' Use your reasoning in a step-by-step manner to be sure that your conclusion is correct. Avoid simply stating the correct answer at the outset.' : ''}` },
						{ role: 'user', content: req },
						{ role: 'assistant', content: res },
					],
					tools: [
						{
							name: 'Relevance',
							description: 'How relevant is the response to the request?',
							parameters: {
								type: 'object',
								properties: {
									score: {
										type: 'integer',
										description: 'The score is an integer from 0 to 100. 0 being completely irrelevant. 100 being perfect spot on relevant to user request',
									},
								},
								required: ['score'],
							},
						},
						{
							name: 'Clarity',
							description: 'How clear and understandable is the response?',
							parameters: {
								type: 'object',
								properties: {
									score: {
										type: 'integer',
										description: 'The score is an integer from 0 to 100. 0 being completely garbled and not human readable. 100 being perfect grammar and spelling',
									},
								},
								required: ['score'],
							},
						},
						{
							name: 'Comprehensiveness',
							description: 'How comprehensive is the response?',
							parameters: {
								type: 'object',
								properties: {
									score: {
										type: 'integer',
										description: 'The score is an integer from 0 to 100. 0 is like forgetting what the user even asked and answering differently. 100 is addressing all aspects of the assigned task, including depth, breadth, relevant details, and overall completeness.',
									},
								},
								required: ['score'],
							},
						},
						{
							name: 'Hallucination/Accuracy',
							description: 'Does the response contain any factual inaccuracies or hallucinations?',
							parameters: {
								type: 'object',
								properties: {
									score: {
										type: 'integer',
										description: 'The score is an integer from 0 to 100. 0 having the response filled with hallucinations. 100 being perfect spot on accuracy',
									},
								},
								required: ['score'],
							},
						},
					],
				}).then((response) => {
					const { tool_calls } = response as Exclude<AiTextGenerationOutput, ReadableStream>;
					const grades = this.combineGrading(tool_calls as InferenceResult[]);
					const finalGrade = 0.3 * grades.Relevance + 0.25 * grades.Clarity + 0.25 * grades.Comprehensiveness + 0.2 * grades['Hallucination/Accuracy'];

					return c.json({ ...grades, finalGrade, willUseAsTrainingData: finalGrade >= 80 });
				});
			},
		);

		return app.fetch(request, this.env, this.ctx);
	}
	private combineGrading(results: InferenceResult[]) {
		const scoreMap = results.reduce(
			(acc, { name, arguments: { score } }) => {
				if (!acc[name]) {
					acc[name] = { total: 0, count: 0 };
				}
				acc[name].total += score;
				acc[name].count += 1;
				return acc;
			},
			{} as Record<InferenceResult['name'], { total: number; count: number }>,
		);

		return Object.keys(scoreMap).reduce(
			(acc, name) => {
				acc[name] = scoreMap[name].total / scoreMap[name].count;
				return acc;
			},
			{} as Record<InferenceResult['name'], number>,
		);
	}

	private getRandomSession(endpoint: BrowserWorker) {
		return sessions(endpoint).then((sessions) => {
			console.log(`Sessions: ${JSON.stringify(sessions)}`);
			const sessionsIds = sessions
				// remove sessions with workers connected to them
				.filter((v) => !v.connectionId)
				.map((v) => v.sessionId);
			if (sessionsIds.length === 0) {
				return;
			}

			const sessionId = sessionsIds[randomInt(sessionsIds.length)];

			return sessionId!;
		});
	}
	public webBrowse(url: string | URL) {
		if (this.env.BROWSER) {
			/**
			 * @todo 1.1.1.1 secure resolver lookup (and possibly block if bad site)
			 * @todo check robots.txt to see if allowed to visit in first place
			 * @todo add toggle between raw mode and summary (`bart-large-cnn`) mode
			 */
			return this.getRandomSession(this.env.BROWSER).then(async (sessionId) => {
				let browser: Browser | undefined;

				if (sessionId) {
					try {
						browser = await connect(this.env.BROWSER!, sessionId);
					} catch (e) {
						// another worker may have connected first
						console.error(`Failed to connect to ${sessionId}. Error ${e}`);
					}
				}
				if (!browser) {
					// No open sessions, launch new session
					browser = await launch(this.env.BROWSER!);
				}

				return (
					browser
						.newPage()
						/**
						 * @todo Check header if json and do .json() wrapped by JSON.stringify to remove whitespace
						 */
						.then((page) => page.goto(new URL(url).toString()).then((response) => response!.text()))
						.finally(() => browser.disconnect())
				);
			});
		} else {
			throw new Error('Browser Rendering not available');
		}
	}
}
