# 🚀 Automatic Versioning Summary

## TL;DR

**Just use conventional commit messages and the package publishes automatically!**

```bash
# Bug fix → 0.1.0 → 0.1.1
git commit -m "fix: resolve map bug"
git push origin main

# New feature → 0.1.0 → 0.2.0
git commit -m "feat: add new layer"
git push origin main

# Breaking change → Use GitHub Actions workflow
# Go to Actions → "Release Major Version"
```

---

## How It Works

### Automatic (Patch & Minor)

1. **You commit** with conventional format
2. **Workflow detects** commit type
3. **Version bumps** automatically
4. **Publishes** to npm
5. **Creates** GitHub release

### Manual (Major Only)

1. **Go to** Actions → "Release Major Version"
2. **Type** "MAJOR" to confirm
3. **Describe** breaking changes
4. **Done** - auto publishes

---

## Commit Types

| Type | Bump | Example |
|------|------|---------|
| `fix:` | Patch | `fix: resolve layer bug` |
| `feat:` | Minor | `feat: add export` |
| `perf:` | Patch | `perf: optimize tiles` |
| `refactor:` | Patch | `refactor: cleanup` |
| `docs:` | Patch | `docs: update readme` |
| `test:` | Patch | `test: add tests` |
| Major | Manual | Use workflow |

---

## Examples

### Bug Fix
```bash
git commit -m "fix: resolve map initialization race condition"
git push origin main
```
✅ Auto bumps to 0.1.1 and publishes

### New Feature
```bash
git commit -m "feat: add polygon editing to AOI tool"
git push origin main
```
✅ Auto bumps to 0.2.0 and publishes

### Breaking Change
1. Commit your changes normally
2. Go to GitHub Actions
3. Run "Release Major Version" workflow
4. Type "MAJOR" and describe changes

✅ Bumps to 1.0.0 and publishes

---

## Skip Publishing

```bash
git commit -m "docs: fix typo [skip ci]"
```

---

## Files

- **`publish-npm.yml`** - Auto detects commits and publishes
- **`version-bump.yml`** - Manual major version releases
- **`COMMIT_CONVENTION.md`** - Full commit guidelines
- **`PUBLISHING.md`** - Complete publishing guide

---

## Setup (One-time)

1. Create npm token at npmjs.com
2. Add as `NPM_TOKEN` secret in GitHub
3. Done! Commits now auto-publish

---

## Benefits

✅ No manual version management  
✅ Consistent versioning  
✅ Automatic changelogs  
✅ Safe major releases  
✅ Fast iteration  
✅ Less human error

