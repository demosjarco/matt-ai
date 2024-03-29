import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig, type UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import pkg from './package.json';
import type { EnvVars } from './src/types';

const { dependencies = {}, devDependencies = {} } = pkg as any as {
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	[key: string]: unknown;
};

// https://developers.cloudflare.com/workers/runtime-apis/nodejs
const cloudflareNodeRuntimes: `node:${string}`[] = ['node:assert', 'node:async_hooks', 'node:buffer', 'node:crypto', 'node:diagnostics_channel', 'node:events', 'node:path', 'node:process', 'node:stream', 'node:string_decoder', 'node:util'];

export default defineConfig(({ command, mode }): UserConfig => {
	return {
		plugins: [
			qwikCity(),
			qwikVite(),
			tsconfigPaths(),
			nodeResolve({
				browser: true,
				modulesOnly: true,
				preferBuiltins: true,
			}),
		],
		server: {
			headers: {
				// Don't cache the server response in dev mode
				'Cache-Control': 'public, max-age=0',
			},
		},
		preview: {
			headers: {
				// Do cache the server response in preview (non-adapter production build)
				'Cache-Control': 'public, max-age=600',
			},
		},
		build: {
			target: 'esnext',
			sourcemap: (process.env as EnvVars).NODE_ENV ? (process.env as EnvVars).NODE_ENV !== 'production' : true,
			emptyOutDir: true,
			rollupOptions: {
				external: [...cloudflareNodeRuntimes],
			},
			manifest: true,
		},
		worker: {
			rollupOptions: {
				external: [...cloudflareNodeRuntimes],
			},
		},
		ssr: {
			external: [...cloudflareNodeRuntimes],
		},
		// This tells Vite which dependencies to pre-build in dev mode.
		optimizeDeps: {
			// Put problematic deps that break bundling here, mostly those with binaries.
			// For example ['better-sqlite3'] if you use that in server functions.
			exclude: [...cloudflareNodeRuntimes],
		},
	};
});
