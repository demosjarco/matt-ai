module.exports = {
	content: ['./src/**/*.{html,js}'],
	plugins: {
		'postcss-import': {},
		'tailwindcss/nesting': 'postcss-nesting',
		tailwindcss: {},
		autoprefixer: {},
	},
};
