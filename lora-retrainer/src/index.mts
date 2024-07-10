import { serve, type HttpBindings } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev';
import { etag } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { exec } from 'node:child_process';
import { createHash } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import type { ReadableStream } from 'node:stream/web';
import { promisify } from 'node:util';
import { stringify } from 'yaml';
import { z } from 'zod';

async function streamHasher(stream: ReadableStream, algorithm: 'sha1' | 'sha256' | 'sha384' | 'sha512' = 'sha256') {
	const hash = createHash(algorithm);

	for await (const chunk of stream) {
		hash.update(chunk);
	}

	return hash.digest('hex');
}

class HTTPResponder {
	private validApiMethods = ['GET', 'POST'];
	private server = new Hono<{ Bindings: HttpBindings }>();

	constructor() {
		// Dev debug injection point
		this.server.use('*', async (c, next) => {
			await next();
		});

		// Security
		this.server.use('*', secureHeaders());
		// this.server.use('*', csrf());
		this.server.use(
			'*',
			cors({
				origin: '*',
				allowMethods: [...new Set([...this.validApiMethods, 'OPTIONS'])],
				maxAge: 300,
			}),
		);

		// Performance
		this.server.use('*', compress());
		this.server.use('*', etag());
		this.server.use('*', bodyLimit({ maxSize: 128 * 1024 * 1024 }));

		// Debug
		this.server.use('*', prettyJSON());
		this.server.use('*', timing());

		const status = new Hono();
		status.get('/', (c) =>
			promisify(exec)(`conda run --no-capture-output -p env /bin/bash -c "autotrain --help"`, { cwd: '..' }).then(({ stdout, stderr }) => {
				console.log(stdout);
				console.error(stderr);

				return c.text('OK', 200);
			}),
		);
		this.server.route('/ready', status);
		this.server.route('/status', status);

		this.server.post(
			'/train',
			zValidator(
				'form',
				z.object({
					file: z.any(),
					project_name: z.string().trim(),
					// workersAiCatalog.modelGroups['Text Generation'].models.filter((model) => 'lora' in model.properties && model.properties.lora).map((model) => model.name)
					model_name: z.enum(['@cf/google/gemma-2b-it-lora', '@cf/mistral/mistral-7b-instruct-v0.1', '@cf/mistral/mistral-7b-instruct-v0.2-lora', '@hf/mistral/mistral-7b-instruct-v0.2', '@cf/meta-llama/llama-2-7b-chat-hf-lora', '@cf/mistral/mistral-7b-instruct-v0.1-vllm', '@cf/google/gemma-7b-it-lora', '@hf/google/gemma-7b-it'] as const),
					push_to_hub: z.boolean().default(false),
					hf_token: z.string().toLowerCase().startsWith('hf_').trim(),
					hf_username: z.string().trim(),
					unsloth: z.boolean().default(false),
					learning_rate: z.number().default(2e-4),
					num_epochs: z.number().default(1),
					batch_size: z.number().min(1).max(32).default(1),
					block_size: z.number().default(1024),
					trainer: z.enum(['generic', 'sft'] as const).default('sft'),
					warmup_ratio: z.number().default(0.1),
					weight_decay: z.number().default(0.01),
					gradient_accumulation: z.number().default(4),
					mixed_precision: z.enum(['fp16', 'bf16', 'none'] as const).default('fp16'),
					peft: z.boolean().default(true),
					quantization: z.enum(['int4', 'int8', 'none'] as const).default('none'), // .default('int4'),
					lora_r: z.number().default(8), // .default(16),
					lora_alpha: z.number().default(32),
					lora_dropout: z.number().default(0.05),
				}),
			),
			(c) =>
				c.req.parseBody().then((body) => {
					const csv = body['file'] as File;

					if (csv.type === 'text/csv') {
						return streamHasher(csv.stream()).then((csvHash) => {
							console.debug('csv', csv, csvHash);
							// return c.json(c.req.valid('form'));

							const { trainer, model_name, project_name, block_size, learning_rate, warmup_ratio, weight_decay, num_epochs, batch_size, gradient_accumulation, mixed_precision, peft, quantization, lora_r, lora_alpha, lora_dropout, unsloth, hf_username, hf_token, push_to_hub } = c.req.valid('form');

							const conf = stringify({
								task: `llm-${trainer}`,
								base_model: model_name,
								project_name,
								log: 'tensorboard',
								backend: 'local',
								data: {
									path: 'data/',
									train_split: 'train',
									valid_split: null,
									chat_template: null,
									column_mapping: {
										text_column: 'text',
									},
								},
								params: {
									block_size,
									lr: learning_rate,
									warmup_ratio,
									weight_decay,
									epochs: num_epochs,
									batch_size,
									gradient_accumulation,
									mixed_precision,
									peft,
									quantization: `"${quantization}"`,
									lora_r,
									lora_alpha,
									lora_dropout,
									unsloth,
								},
								hub: {
									username: hf_username,
									token: hf_token,
									push_to_hub,
								},
							});

							return Promise.allSettled([writeFile(`dist/${csvHash}.csv`, csv.stream()), writeFile(`conf.${csvHash}.yaml`, conf)])
								.then(() => c.text(conf))
								.catch(console.error)
								.finally(() => Promise.allSettled([unlink(`dist/${csvHash}.csv`), unlink(`conf.${csvHash}.yaml`)]));
						});
					} else {
						throw new HTTPException(415, { message: 'Unsupported Media Type' });
					}
				}),
		);

		showRoutes(this.server, { colorize: true, verbose: true });
	}

	public listen(port: number = 8080) {
		serve(
			{
				fetch: this.server.fetch,
				port,
			},
			(info) => console.log(`Server running at ${new URL(`http://${info.address}:${info.port}`).toString()}`),
		);
	}
}

new HTTPResponder().listen();
