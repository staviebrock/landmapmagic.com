# Commit Message Convention

This project uses **Conventional Commits** to automatically determine version bumps and generate changelogs.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types and Version Bumps

### `fix:` - Patch Release (0.0.X)
Bug fixes that don't change the API.

**Examples:**
```bash
git commit -m "fix: resolve map initialization race condition"
git commit -m "fix(aoi): correct polygon area calculation"
git commit -m "fix: prevent memory leak in layer cleanup"
```

**Result:** 0.1.0 → 0.1.1

---

### `feat:` - Minor Release (0.X.0)
New features that are backwards-compatible.

**Examples:**
```bash
git commit -m "feat: add support for custom map projections"
git commit -m "feat(layers): add new parcels layer type"
git commit -m "feat: implement dark mode for map controls"
```

**Result:** 0.1.0 → 0.2.0

---

### Breaking Changes - Manual Major Release (X.0.0)
**DO NOT** use breaking change commits directly. Instead:

1. Make your changes and commit normally
2. Use the **"Release Major Version"** workflow in GitHub Actions
3. Provide release notes describing the breaking changes

**Why?** Major releases require careful coordination, documentation updates, and user notification.

---

### Other Types - Patch Release (0.0.X)

These also trigger patch bumps:

- `perf:` - Performance improvements
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `test:` - Adding or updating tests
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "perf: optimize tile loading performance"
git commit -m "refactor: simplify layer initialization logic"
git commit -m "docs: update AOI query examples"
git commit -m "test: add unit tests for map controls"
```

**Result:** 0.1.0 → 0.1.1

---

## Scopes (Optional)

Add a scope to provide more context:

```bash
git commit -m "feat(aoi): add polygon editing capabilities"
git commit -m "fix(layers): resolve SSURGO layer visibility bug"
git commit -m "perf(tiles): improve caching strategy"
```

Common scopes:
- `aoi` - Area of Interest features
- `layers` - Layer management
- `tiles` - Tile loading/rendering
- `controls` - Map controls
- `api` - API changes
- `types` - TypeScript types

---

## Multi-line Commits

For more detailed commits:

```bash
git commit -m "feat: add polygon editing to AOI tool

- Users can now edit existing polygons
- Added undo/redo functionality
- Improved touch device support

Closes #123"
```

---

## Skip CI

To push without triggering a build/publish:

```bash
git commit -m "docs: fix typo [skip ci]"
```

---

## Examples by Scenario

### Bug Fix
```bash
git commit -m "fix: resolve layer ordering issue in map legend"
```
→ Triggers **patch** bump (0.1.0 → 0.1.1)

### New Feature
```bash
git commit -m "feat: add export functionality for AOI queries"
```
→ Triggers **minor** bump (0.1.0 → 0.2.0)

### Performance Improvement
```bash
git commit -m "perf: optimize tile cache invalidation"
```
→ Triggers **patch** bump (0.1.0 → 0.1.1)

### Documentation
```bash
git commit -m "docs: add examples for custom layer styling"
```
→ Triggers **patch** bump (0.1.0 → 0.1.1)

### Breaking Change (Manual Process)
```bash
# 1. Make your changes
git commit -m "refactor: update layer API structure"

# 2. Push to main
git push

# 3. Go to GitHub Actions → "Release Major Version"
# 4. Fill in breaking changes description
# 5. Confirm by typing "MAJOR"
```
→ Triggers **major** bump (0.1.0 → 1.0.0)

---

## Quick Reference

| Commit Type | Version Bump | When to Use |
|-------------|--------------|-------------|
| `fix:` | Patch (0.0.X) | Bug fixes |
| `feat:` | Minor (0.X.0) | New features |
| `perf:` | Patch (0.0.X) | Performance |
| `refactor:` | Patch (0.0.X) | Code cleanup |
| `docs:` | Patch (0.0.X) | Documentation |
| `test:` | Patch (0.0.X) | Tests |
| `build:` | Patch (0.0.X) | Build changes |
| `ci:` | Patch (0.0.X) | CI/CD |
| `chore:` | Patch (0.0.X) | Maintenance |
| Major | Manual workflow | Breaking changes |

---

## Tips

1. **Be specific**: Good commit messages help others understand changes
2. **One change per commit**: Makes it easier to track and revert
3. **Use present tense**: "add feature" not "added feature"
4. **Reference issues**: Use "Closes #123" or "Fixes #456"
5. **Keep subject short**: 50 characters or less
6. **Explain why, not what**: The diff shows what changed, explain why

---

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

