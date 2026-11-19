import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['build.js', 'do_release.js', 'dist/**'],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'prefer-const': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
        },
    },
);
