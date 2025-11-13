# SDK Linting and Dependency Setup

## Overview

This document outlines the dependency fixes and linting infrastructure setup for the Block52 Poker VM SDK.

## Dependency Fixes

### Missing Dependencies Added

1. **`rollup-plugin-dts`** (v6.1.1)

    - Required for TypeScript declaration file generation
    - Generates `.d.ts` files for the SDK bundle

2. **`jest`** (v30.0.0)

    - Added as devDependency to resolve `ts-jest` peer dependency warning
    - Enables proper test execution

3. **`@keplr-wallet/types`** (v0.12.0)
    - Missing type definitions for Keplr wallet integration
    - Required by client and types modules

### ESLint Infrastructure

4. **ESLint and TypeScript Support**
    - `eslint` (v9.0.0)
    - `@typescript-eslint/parser` (v8.0.0)
    - `@typescript-eslint/eslint-plugin` (v8.0.0)
    - `@eslint/js` (v9.0.0)

## Build Status

### Before Fixes

-   ❌ Build failed with module not found errors
-   ❌ Missing `rollup-plugin-dts` dependency
-   ⚠️ Peer dependency warnings for `jest` and `@keplr-wallet/types`

### After Fixes

-   ✅ Build completes successfully: `yarn build`
-   ✅ All output files generated (`dist/index.js`, `dist/index.esm.js`, `dist/index.d.ts`)
-   ✅ No dependency errors

## Linting Setup

### Configuration File

Created `eslint.config.js` with:

-   Modern ESLint flat config format
-   TypeScript parser integration
-   Separate rule sets for different file types

### Linting Rules

#### Core Files (handwritten code)

-   `@typescript-eslint/no-unused-vars`: warn
-   `@typescript-eslint/no-explicit-any`: warn
-   `no-console`: warn
-   `prefer-const`: error
-   `no-var`: error

#### Generated Files (protobuf types)

More lenient rules for:

-   `src/**/types/**/*.ts`
-   `src/**/*.v1/*.ts`
-   `src/**/*.v1beta1/*.ts`
-   `src/**/*.v2/*.ts`

Rules disabled:

-   `@typescript-eslint/no-unused-vars`
-   `@typescript-eslint/no-explicit-any`
-   `prefer-const`
-   `no-console`

### Global Definitions

Added to language options:

```javascript
globals: {
    console: 'readonly',
    fetch: 'readonly',
}
```

### Ignored Patterns

-   `dist/**`
-   `node_modules/**`
-   `*.js`
-   `*.config.js`
-   `**/*.test.ts`
-   `**/*.spec.ts`

## Code Quality Improvements

### Issue Reduction

| Metric       | Before | After | Improvement      |
| ------------ | ------ | ----- | ---------------- |
| Total Issues | 1,186  | 94    | 92% reduction    |
| Errors       | 601    | 0     | 100% elimination |
| Warnings     | 585    | 94    | 84% reduction    |

### Auto-fixes Applied

-   Converted `let` to `const` where variables aren't reassigned (240+ instances)
-   Removed unused eslint-disable directives
-   Fixed various code style issues

## Remaining Warnings (94)

All remaining issues are warnings, categorized as:

1. **Console statements** (~50 warnings)

    - Acceptable for debugging and development
    - Located in client/server communication code

2. **Unused variables** (~30 warnings)

    - Mostly in placeholder/stub functions
    - Parameters kept for interface consistency

3. **Any types** (~14 warnings)
    - Primarily in type definition files
    - Required for dynamic/flexible type handling

## Available Scripts

### Linting Commands

```bash
# Run linter
yarn lint

# Run linter with auto-fix
yarn lint:fix
```

### Build Commands

```bash
# Build the SDK
yarn build

# Build TypeScript declarations only
yarn build:types

# Clean build artifacts
yarn clean

# Clean and rebuild
yarn prepublishOnly
```

## Package.json Updates

### Added Module Type

```json
"type": "module"
```

This enables ES modules and removes Node.js warnings about module type detection.

### DevDependencies Added

```json
{
    "@eslint/js": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jest": "^30.0.0",
    "rollup-plugin-dts": "^6.1.1"
}
```

### Dependencies Added

```json
{
    "@keplr-wallet/types": "^0.12.0"
}
```

## Best Practices

### When to Run Linter

1. **Before committing code**: `yarn lint`
2. **Before creating PR**: `yarn lint:fix` to auto-fix issues
3. **As part of CI/CD**: Add `yarn lint` to pipeline

### Handling Warnings

-   Console statements: Keep for debugging, consider using a logger in production
-   Unused variables: Remove if truly unused, or prefix with `_` if required by interface
-   Any types: Replace with specific types when possible, but acceptable for dynamic scenarios

## Future Improvements

1. **Reduce console statements**: Implement proper logging infrastructure
2. **Type safety**: Replace `any` types with specific types where feasible
3. **Remove unused code**: Clean up placeholder functions with unused parameters
4. **Add pre-commit hooks**: Use `husky` and `lint-staged` for automatic linting
5. **CI Integration**: Add linting to GitHub Actions workflow

## Troubleshooting

### Build Issues

If build fails with module errors:

```bash
cd sdk
yarn install
yarn clean
yarn build
```

### Linting Issues

If ESLint configuration errors occur:

```bash
# Reinstall ESLint dependencies
yarn install --force
```

### Type Errors

If TypeScript compilation fails:

```bash
# Regenerate protobuf types
yarn proto:generate
yarn proto:update-deps
```

## Maintenance

### Updating ESLint Rules

Edit `eslint.config.js` to modify rules. Common adjustments:

```javascript
// Make a warning an error
'no-console': 'error',

// Disable a rule
'@typescript-eslint/no-explicit-any': 'off',

// Add a new rule
'no-unused-expressions': 'warn',
```

### Updating Dependencies

```bash
# Update all dependencies
yarn upgrade

# Update specific dependency
yarn upgrade eslint@latest
```

---

**Last Updated**: November 13, 2025  
**SDK Version**: 3.0.3  
**Status**: ✅ All systems operational
