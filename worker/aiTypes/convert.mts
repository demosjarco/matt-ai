import { createWriteStream } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

class TypeScriptDefinitionsHandler {
	private readonly directory: string = './aiTypes';

	public async processDefinitions(minify: boolean = false) {
		return new Promise<void>((resolve, reject) =>
			readdir(this.directory)
				.then(async (files) => {
					const dtsFiles = files.filter((file) => file.endsWith('.d.ts'));

					const typesContent: Record<string, string> = {};

					for (const file of dtsFiles) {
						const filePath = join(this.directory, file);
						const content = await readFile(filePath, 'utf8');
						typesContent[basename(file, '.d.ts')] = content;
					}

					const outputStream = createWriteStream(join(this.directory, 'types.json'));
					outputStream.write(minify ? JSON.stringify(typesContent).replace(/\\n\s*/g, '') : JSON.stringify(typesContent), 'utf-8', (err) => {
						outputStream.end();

						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				})
				.catch(reject),
		);
	}
}
new TypeScriptDefinitionsHandler().processDefinitions(true).catch(console.error);
