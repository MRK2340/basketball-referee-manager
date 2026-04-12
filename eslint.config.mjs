import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
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
				node: { extensions: ['.js', '.jsx'] },
				alias: { map: [['@', './src']], extensions: ['.js', '.jsx'] },
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

			// Disable expensive rules for performance
			'import/no-cycle': 'off',
		},
	},
	{ files: ['tools/**/*.js', 'tailwind.config.js'], languageOptions: { globals: globals.node } },
	// Shadcn UI stubs ship with package imports that may not be installed (unused components).
	// Disable the unresolved-module check only for that directory.
	{ files: ['src/components/ui/**/*.{js,jsx}'], rules: { 'import/no-unresolved': 'off' } },
];
