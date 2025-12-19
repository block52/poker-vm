# SDK Release Guide

This guide explains how to release a new version of the `@block52/poker-vm-sdk` package to NPM.

## Prerequisites

1. **NPM Token**: Ensure the `NPM_TOKEN` secret is configured in the GitHub repository settings
   - Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
   - Name: `NPM_TOKEN`
   - Value: Your NPM access token with publish permissions

2. **NPM Account**: You need publish permissions for the `@block52` organization on NPM

## Release Process

### Method 1: Tag-based Release (Recommended)

1. **Update the version** in `sdk/package.json`:
   ```bash
   cd sdk
   npm version patch  # or minor, or major
   # This creates version 1.0.2 for example
   ```

2. **Commit and push the version change**:
   ```bash
   git add package.json
   git commit -m "chore(sdk): bump version to 1.0.2"
   git push origin main
   ```

3. **Create and push a git tag**:
   ```bash
   git tag sdk-v1.0.2
   git push origin sdk-v1.0.2
   ```

4. **Wait for the workflow**: The GitHub Action will automatically:
   - Build the SDK
   - Run tests
   - Publish to NPM
   - Create a GitHub release

### Method 2: Manual Workflow Dispatch

1. Go to GitHub Actions tab in the repository
2. Select "Release SDK to NPM" workflow
3. Click "Run workflow"
4. Enter the version number (e.g., `1.0.2`)
5. Optionally enable "Dry run" to test without publishing
6. Click "Run workflow"

## Version Naming Convention

- **Patch Release**: `1.0.x` - Bug fixes, minor changes
- **Minor Release**: `1.x.0` - New features, backwards compatible
- **Major Release**: `x.0.0` - Breaking changes

## Tag Naming

Use one of these formats:
- `sdk-v1.0.2` (recommended - makes it clear it's an SDK release)
- `v1.0.2` (also supported)

## Dry Run Testing

Before publishing, you can test the release process:

1. Go to GitHub Actions
2. Run workflow with "Dry run" enabled
3. Check the logs to see what would be published
4. Verify the package contents

## Troubleshooting

### "Version already published" error
- Check NPM to see if the version already exists
- Bump the version number and try again

### "Unauthorized" error
- Verify the `NPM_TOKEN` secret is set correctly
- Ensure the token has publish permissions
- Check that the token hasn't expired

### Tests failing
- Fix the failing tests before releasing
- The workflow will not publish if PVM tests fail

### Version mismatch warning
- The workflow will automatically update package.json if the version doesn't match the tag
- Ideally, update package.json before tagging

## Post-Release Checklist

After a successful release:

- [ ] Verify the package on NPM: https://www.npmjs.com/package/@block52/poker-vm-sdk
- [ ] Check the GitHub release page
- [ ] Test installation in a new project:
  ```bash
  npm install @block52/poker-vm-sdk@latest
  ```
- [ ] Update dependent projects/documentation if needed
- [ ] Announce the release (if applicable)

## NPM Package Links

- **Package page**: https://www.npmjs.com/package/@block52/poker-vm-sdk
- **Versions**: https://www.npmjs.com/package/@block52/poker-vm-sdk?activeTab=versions
- **Statistics**: https://npm-stat.com/charts.html?package=@block52/poker-vm-sdk

## Rollback

If you need to deprecate a version:

```bash
npm deprecate @block52/poker-vm-sdk@1.0.2 "Reason for deprecation"
```

To unpublish (only within 72 hours):

```bash
npm unpublish @block52/poker-vm-sdk@1.0.2
```

**Note**: Unpublishing is discouraged as it breaks existing installations.
