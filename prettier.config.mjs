import baseConfig from '@demosjarco/prettier-config';

/** @type {import("prettier").Config} */
export default {
	...baseConfig,
	plugins: ['prettier-plugin-tailwindcss'],
};
