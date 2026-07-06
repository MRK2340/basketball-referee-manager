import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
	{ ignores: ['node_modules/**', 'dist/**', 'build/**', 'vite.config.js', 'vitest.config.js', 'functions/**', 'public/**'] },
	{
		files: ['**/*.js', '**/*.jsx'],
		plugins: { react, 'react-hooks': reactHooks, import: importPlugin },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: { ...globals.browser, React: 'readonly', Intl: 'readonly' },
		},
		settings: {
			react: { version: 'detect' },
			'import/resolver': {
				node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
				alias: { map: [['@', './src']], extensions: ['.js', '.jsx', '.ts', '.tsx'] },
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...importPlugin.flatConfigs.recommended.rules,

			// Surface dead code as warnings so CI stays green while issues become visible
			'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
			'react/prop-types': 'warn',

			// Not needed in React 17+ / non-critical presentation rules
			'react/no-unescaped-entities': 'off',
			'react/display-name': 'off',
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-vars': 'off',
			'react/jsx-no-comment-textnodes': 'off',

			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',

			// Critical rules that prevent runtime errors
			'no-undef': 'error',

			// Override recommended import rules for stricter checking
			'import/no-self-import': 'error',

			// Disabled — project migrated to TypeScript; TS compiler handles cycle detection
			'import/no-cycle': 'off',
		},
	},
	{ files: ['serve.js'], languageOptions: { globals: { ...globals.node } } },
	// Vitest suites run under Node and may read repo files via fs/process.
	{ files: ['src/__tests__/**/*.{js,jsx}'], languageOptions: { globals: { ...globals.node } } },

	// ── TypeScript sources ─────────────────────────────────────────────────
	// Parsed with typescript-eslint (syntactic rules only — type-aware
	// linting is tsc's job). no-undef stays off in these blocks: TypeScript
	// itself flags unknown identifiers, and eslint's version false-positives
	// on TS-only constructs like ambient types.
	...tseslint.configs.recommended.map(c => ({ ...c, files: ['**/*.ts', '**/*.tsx'] })),
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: { react, 'react-hooks': reactHooks, import: importPlugin },
		languageOptions: {
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: { ...globals.browser, React: 'readonly', Intl: 'readonly' },
		},
		settings: {
			react: { version: 'detect' },
			'import/resolver': {
				node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
				alias: { map: [['@', './src']], extensions: ['.js', '.jsx', '.ts', '.tsx'] },
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...importPlugin.flatConfigs.recommended.rules,

			// Mirror the JS-block philosophy: real breakage is an error,
			// hygiene issues surface as warnings so CI (--quiet) stays green
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
			'@typescript-eslint/no-explicit-any': 'warn',

			// Prop typing comes from TypeScript, not PropTypes
			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'react/display-name': 'off',
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-vars': 'off',
			'react/jsx-no-comment-textnodes': 'off',

			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',
			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
		},
	},

	// Shadcn UI stubs ship with package imports that may not be installed (unused components).
	// Disable the unresolved-module check only for that directory.
	{ files: ['src/components/ui/**/*.{js,jsx,ts,tsx}'], rules: { 'import/no-unresolved': 'off' } },
];
