import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
	js.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
			ecmaVersion: 2020,
			sourceType: 'module'
		},
		plugins: {
			'@typescript-eslint': typescript
		},
		rules: {
			'@typescript-eslint/naming-convention': 'warn',
			'@typescript-eslint/semi': 'warn',
			'curly': 'warn',
			'eqeqeq': 'warn',
			'no-throw-literal': 'warn',
			'semi': 'off'
		}
	}
];