import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 6,
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            'curly': 'warn',
            'eqeqeq': 'warn',
            'no-throw-literal': 'warn'
        }
    },
    {
        ignores: ['out/**', 'dist/**', '**/*.d.ts']
    }
];
