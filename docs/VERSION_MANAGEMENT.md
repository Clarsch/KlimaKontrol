# Version Management Guide

This document explains how to manage versions and releases for the KlimaKontrol project.

## Overview

KlimaKontrol uses [Semantic Versioning 2.0.0](https://semver.org/) for version management. The project consists of three main components that are versioned together:

- **Root Package** (`package.json`)
- **Client (Frontend)** (`client/package.json`)
- **Server (Backend)** (`server/package.json`)

## Version Structure

### Semantic Versioning Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes, major new features
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, minor improvements

### Examples

| Current Version | Release Type | New Version | Description |
|----------------|--------------|-------------|-------------|
| 1.0.0 | Patch | 1.0.1 | Bug fixes, security updates |
| 1.0.0 | Minor | 1.1.0 | New features, backward compatible |
| 1.0.0 | Major | 2.0.0 | Breaking changes, major refactor |

## Files Involved in Version Management

### 1. Package Files
- `package.json` (Root)
- `client/package.json` (Frontend)
- `server/package.json` (Backend)

### 2. Documentation Files
- `VERSION.md` - Current version information
- `CHANGELOG.md` - Detailed change history
- `docs/VERSION_MANAGEMENT.md` - This guide

### 3. Scripts
- `scripts/version-check.js` - Check current versions
- `scripts/release.js` - Create new releases

## Quick Commands

### Check Current Versions
```bash
npm run version-check
```

### Create a New Release
```bash
# Bug fix release
npm run release:patch

# New feature release
npm run release:minor

# Breaking change release
npm run release:major
```

## Manual Version Management

### 1. Update Package Versions
Update the `version` field in all three package.json files:

```json
{
  "version": "1.1.0"
}
```

### 2. Update VERSION.md
Update the current version and add to version history:

```markdown
## Current Version
**1.1.0** - Feature Release

## Version Components
- **Client (Frontend)**: 1.1.0
- **Server (Backend)**: 1.1.0
- **Root Package**: 1.1.0
```

### 3. Update CHANGELOG.md
Add a new version section:

```markdown
## [1.1.0] - 2024-01-15

### Added
- New feature description
- Another new feature

### Changed
- Updated functionality

### Fixed
- Bug fix description
```

### 4. Create Git Tag
```bash
git add .
git commit -m "Release version 1.1.0"
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

## Release Process Checklist

### Before Release
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No breaking changes (unless major release)

### During Release
- [ ] Run version check: `npm run version-check`
- [ ] Create release: `npm run release:patch|minor|major`
- [ ] Review generated changes
- [ ] Push git tag: `git push origin v<version>`

### After Release
- [ ] Deploy to production
- [ ] Create GitHub release (if using GitHub)
- [ ] Notify stakeholders
- [ ] Update deployment documentation

## Best Practices

### 1. Version Consistency
- Always keep all package versions in sync
- Use the version check script before releases
- Never have different versions across packages

### 2. Commit Messages
- Use conventional commit messages
- Include version number in release commits
- Reference issue numbers when applicable

### 3. Documentation
- Update CHANGELOG.md for every release
- Keep VERSION.md current
- Document breaking changes clearly

### 4. Testing
- Test the release process in a development environment
- Verify all functionality works with new version
- Test deployment process

## Troubleshooting

### Version Mismatch
If you see version mismatches:
```bash
npm run version-check
```
This will show you which packages have different versions.

### Release Script Errors
If the release script fails:
1. Check that all package.json files are valid JSON
2. Ensure you have git installed and configured
3. Make sure you're in the project root directory
4. Check that VERSION.md exists and is properly formatted

### Git Tag Issues
If git tagging fails:
```bash
# Check git status
git status

# Create tag manually
git add .
git commit -m "Release version X.Y.Z"
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm run install-all
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy
        run: npm run deploy
```

## Version History

| Version | Date | Type | Major Changes |
|---------|------|------|---------------|
| 1.0.0 | 2024-01-XX | Initial | Initial release |

---

For questions or issues with version management, please refer to the project documentation or contact the development team. 