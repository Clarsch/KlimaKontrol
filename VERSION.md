# KlimaKontrol Version Information

## Current Version
**1.0.0** - Initial Release

## Version Components
- **Client (Frontend)**: 1.0.0
- **Server (Backend)**: 1.0.0
- **Root Package**: 1.0.0

## Release Date
2024-01-XX

## Version History

### 1.0.0 (2025-07-03) - Initial Release
- First public release of KlimaKontrol
- Complete climate monitoring system
- Full feature set including authentication, data management, and warnings

---

## Version Management

### Semantic Versioning
This project follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Version Update Process
1. Update version in `VERSION.md` (this file)
2. Update version in root `package.json`
3. Update version in `client/package.json`
4. Update version in `server/package.json`
5. Update `CHANGELOG.md` with new version details
6. Create git tag for the release

### Quick Version Check
To check current versions across all packages:
```bash
npm run version-check
```

### Release Commands
```bash
# Create a new patch release (bug fixes)
npm run release:patch

# Create a new minor release (new features)
npm run release:minor

# Create a new major release (breaking changes)
npm run release:major
``` 