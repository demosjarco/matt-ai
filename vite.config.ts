import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig, type UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://developers.cloudflare.com/workers/runtime-apis/nodejs
const cloudflareNodeRuntimes: `node:${string}`[] = ['node:assert', 'node:async_hooks', 'node:buffer', 'node:crypto', 'node:diagnostics_channel', 'node:events', 'node:path', 'node:process', 'node:stream', 'node:string_decoder', 'node:util'];

export default defineConfig((): UserConfig => {
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
		preview: {
			headers: {
				'Cache-Control': 'public, max-age=600',
			},
		},
		build: {
			target: 'esnext',
			sourcemap: process.env.CF_PAGES_BRANCH ? process.env.CF_PAGES_BRANCH !== 'production' : true,
			emptyOutDir: true,
			rollupOptions: {
				external: cloudflareNodeRuntimes,
			},
			manifest: true,
		},
		optimizeDeps: {
			include: ['@auth/core'],
			exclude: cloudflareNodeRuntimes,
		},
	};
});
