import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'curly': 'warn',
			'eqeqeq': 'warn',
			'no-throw-literal': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					'argsIgnorePattern': '^_',
					'varsIgnorePattern': '^_'
				}
			]
		}
	},
	{
		ignores: [
			'out/**',
			'dist/**',
			'**/*.d.ts'
		]
	}
);
