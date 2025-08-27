// Simple ESLint configuration for VS Code extension
export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module'
		},
		rules: {
			'semi': ['warn', 'always'],
			'quotes': ['warn', 'single'],
			'no-unused-vars': 'warn',
			'no-console': 'off',
			'curly': 'warn',
			'eqeqeq': 'warn'
		}
	},
	{
		ignores: ['out/**', 'dist/**', '**/*.d.ts', 'node_modules/**']
	}
];