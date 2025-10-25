# Publishing Guide for LandMapMagic

This guide explains how to publish new versions of the `landmapmagic` npm package.

## 🚀 Quick Start - Automatic Versioning

**The package automatically versions and publishes based on your commit messages!**

### For Bug Fixes & Features (Automatic)

Just use conventional commit messages:

```bash
# Bug fix - triggers PATCH bump (0.1.0 → 0.1.1)
git commit -m "fix: resolve map initialization issue"
git push origin main

# New feature - triggers MINOR bump (0.1.0 → 0.2.0)
git commit -m "feat: add polygon editing to AOI tool"
git push origin main

# Performance improvement - triggers PATCH bump
git commit -m "perf: optimize tile loading"
git push origin main
```

**That's it!** The workflow automatically:
1. Detects the commit type
2. Bumps the appropriate version
3. Publishes to npm
4. Creates a GitHub release

### For Breaking Changes (Manual)

Breaking changes require manual approval:

1. Make your changes and commit normally
2. Go to **Actions** → **Release Major Version** in GitHub
3. Type "MAJOR" to confirm
4. Add description of breaking changes
5. Click **Run workflow**

This triggers a MAJOR bump (0.1.0 → 1.0.0)

## 🔄 How It Works

### Automatic Workflow

1. **You push** a commit with conventional format to `main`
2. **Workflow detects** the commit type:
   - `fix:` → patch bump
   - `feat:` → minor bump
   - `perf:`, `refactor:`, `docs:`, etc. → patch bump
3. **Version bumps** automatically in `package.json`
4. **Publishes** to npm
5. **Creates** GitHub release with tag

### Manual Major Release Workflow

1. **You trigger** "Release Major Version" workflow
2. **Confirm** by typing "MAJOR"
3. **Provide** breaking changes description
4. **Workflow bumps** major version
5. **Creates** commit with breaking change notes
6. **Publishes** to npm automatically

### Manual Publishing (Emergency Fallback)

Only if workflows are broken:

```bash
# 1. Update version
npm version patch  # or minor, or major

# 2. Build
npm run build

# 3. Publish
npm publish --access public

# 4. Push tags
git push origin main --tags
```

## 📋 Commit Message Convention

This project uses **Conventional Commits** for automatic versioning.

### Commit Types and Version Bumps

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | Patch (0.0.X) | `fix: resolve layer ordering bug` |
| `feat:` | Minor (0.X.0) | `feat: add export functionality` |
| `perf:` | Patch (0.0.X) | `perf: optimize tile caching` |
| `refactor:` | Patch (0.0.X) | `refactor: simplify layer init` |
| `docs:` | Patch (0.0.X) | `docs: update API examples` |
| `test:` | Patch (0.0.X) | `test: add unit tests` |
| `build:` | Patch (0.0.X) | `build: update dependencies` |
| `ci:` | Patch (0.0.X) | `ci: fix workflow` |
| `chore:` | Patch (0.0.X) | `chore: cleanup code` |
| Major | Manual workflow | Use "Release Major Version" |

### Examples

**Bug Fix (Patch):**
```bash
git commit -m "fix: resolve map initialization race condition"
```
→ 0.1.0 → 0.1.1

**New Feature (Minor):**
```bash
git commit -m "feat: add support for custom projections"
```
→ 0.1.0 → 0.2.0

**With Scope:**
```bash
git commit -m "feat(aoi): add polygon editing capabilities"
git commit -m "fix(layers): resolve SSURGO visibility bug"
```

**Multi-line:**
```bash
git commit -m "feat: add polygon editing

- Users can edit existing polygons
- Added undo/redo functionality
- Improved touch support

Closes #123"
```

**Skip CI:**
```bash
git commit -m "docs: fix typo [skip ci]"
```

See [COMMIT_CONVENTION.md](.github/COMMIT_CONVENTION.md) for full details.

## 🔧 Setup (One-time)

### 1. Create NPM Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to **Access Tokens** → **Generate New Token**
3. Choose **Automation** token type
4. Copy the token

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### 3. Verify Package Name

Make sure `package.json` has the correct name:
```json
{
  "name": "landmapmagic"
}
```

Or if using a scoped package:
```json
{
  "name": "@landmap/landmapmagic"
}
```

## 🔍 Workflow Details

### Publish Workflow Triggers

The npm publish workflow runs when:
1. Code is pushed to `main` branch
2. Changes affect `package.json`, `src/**`, or `tsup.config.ts`
3. Manually triggered via workflow_dispatch

### What the Workflow Does

1. ✅ Checks if version already exists on npm (skips if it does)
2. 🔍 Runs type checking
3. 📦 Builds the package
4. 🚀 Publishes to npm
5. 📝 Creates a GitHub release with the version tag

### Preventing Duplicate Publishes

The workflow automatically checks if the version exists on npm before publishing. If it does, it skips the publish step with a notice.

## 📦 What Gets Published

Based on `.npmignore`, the published package includes:
- ✅ `dist/` - Compiled JavaScript and TypeScript definitions
- ✅ `README.md` - Documentation
- ✅ `package.json` - Package metadata

Excluded:
- ❌ `src/` - Source TypeScript files
- ❌ `examples/` - Example applications
- ❌ Config files (tsconfig, tsup, etc.)
- ❌ Development files

## 🧪 Testing Before Publishing

Always test your changes before publishing:

```bash
# 1. Build locally
npm run build

# 2. Test in another project using npm link
cd /path/to/landmapmagic
npm link

cd /path/to/test-project
npm link landmapmagic

# 3. Or test using the tarball
npm pack
# This creates landmapmagic-x.x.x.tgz
# Install it in another project:
npm install /path/to/landmapmagic-x.x.x.tgz
```

## 📊 Monitoring

### Check Publish Status

1. Go to **Actions** tab in GitHub
2. Look for **Publish to NPM** workflow runs
3. Check the logs for any errors

### Verify on NPM

After publishing, verify at:
- https://www.npmjs.com/package/landmapmagic
- Check version, download stats, and package contents

## 🐛 Troubleshooting

### "Version already exists on npm"

This is expected behavior. The workflow skips publishing if the version exists. To publish:
1. Bump the version using the Version Bump workflow
2. Or manually update `package.json` and push

### "NPM_TOKEN not found"

1. Verify the secret exists in GitHub Settings → Secrets
2. Make sure it's named exactly `NPM_TOKEN`
3. Regenerate the token on npmjs.com if needed

### "Build failed"

1. Run `npm run build` locally to see the error
2. Fix any TypeScript errors
3. Run `npm run typecheck` to verify
4. Push the fix to main

### "Permission denied"

1. Verify you're a maintainer of the npm package
2. Check that the NPM_TOKEN has publish permissions
3. For scoped packages, ensure `--access public` is used

## 📝 Changelog Best Practices

Consider maintaining a `CHANGELOG.md`:

```markdown
# Changelog

## [0.2.0] - 2024-01-15
### Added
- New AOI query tool
- Support for CDL layer

### Fixed
- Map initialization bug

## [0.1.0] - 2024-01-01
### Added
- Initial release
```

## 🔐 Security

- Never commit npm tokens to the repository
- Use GitHub Secrets for all sensitive tokens
- Use Automation tokens (not Classic tokens) for CI/CD
- Rotate tokens periodically
- Review npm package access regularly

## 📚 Resources

- [npm Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

