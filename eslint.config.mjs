import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
	{
		files: ["**/*.ts"],
		plugins: {
			"@typescript-eslint": typescriptEslint,
		},
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2020,
			sourceType: "module",
		},
		rules: {
			"curly": "warn",
			"eqeqeq": "warn",
			"no-throw-literal": "warn",
		},
	},
	{
		ignores: ["out", "dist", "**/*.d.ts"],
	},
];
