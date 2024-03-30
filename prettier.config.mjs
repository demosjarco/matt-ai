import baseConfig from '@demosjarco/prettier-config' assert { type: 'json' };

/** @type {import("prettier").Config} */
export default {
	...baseConfig,
	overrides: [
		...baseConfig.overrides,
		{
			files: 'pages/**',
			options: {
				plugins: ['prettier-plugin-tailwindcss'],
			},
		},
	],
};
