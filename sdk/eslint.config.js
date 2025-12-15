import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', '*.js', '*.config.js', '**/*.test.ts', '**/*.spec.ts'],
    },
    {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                console: 'readonly',
                fetch: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,

            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-unnecessary-type-constraint': 'off',

            // General rules
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            'no-undef': 'off', // TypeScript handles this

            // Allow some common patterns in SDK code
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
        },
    },
    // More lenient rules for generated protobuf files
    {
        files: ['src/**/types/**/*.ts', 'src/**/*.v1/*.ts', 'src/**/*.v1beta1/*.ts', 'src/**/*.v2/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unnecessary-type-constraint': 'off',
            'prefer-const': 'off',
            'no-console': 'off',
        },
    },
];