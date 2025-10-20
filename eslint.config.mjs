import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'semi': ['error', 'always'],
			'quotes': ['error', 'single', { avoidEscape: true }],
		},
	},
	{
		ignores: ['out/**', 'node_modules/**', '.vscode-test/**'],
	},
];
