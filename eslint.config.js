const tseslint = require('typescript-eslint');

module.exports = [
	{
		ignores: ['src/extension.ts'], // Ignore existing file to avoid modifying working code
	},
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		languageOptions: {
			ecmaVersion: 6,
			sourceType: 'module',
			parser: tseslint.parser,
		},
		rules: {
			'@typescript-eslint/naming-convention': 'warn',
			'curly': 'warn',
			'eqeqeq': 'warn',
			'no-throw-literal': 'warn',
		},
	},
];
