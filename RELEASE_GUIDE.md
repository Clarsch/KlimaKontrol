# Quick Release Guide

## 🚀 Creating a New Release

### 1. Check Current Version
```bash
npm run version-check
```

### 2. Choose Release Type
- **Patch** (1.0.0 → 1.0.1): Bug fixes, security updates
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

### 3. Create Release
```bash
# Bug fix release
npm run release:patch

# New feature release
npm run release:minor

# Breaking change release
npm run release:major
```

### 4. Push Git Tag
```bash
git push origin v<new-version>
```

## 📋 Release Checklist

### Before Release
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No breaking changes (unless major release)

### During Release
- [ ] Run `npm run version-check`
- [ ] Run `npm run release:<type>`
- [ ] Review generated changes
- [ ] Push git tag

### After Release
- [ ] Deploy to production
- [ ] Create GitHub release (if using GitHub)
- [ ] Notify stakeholders

## 📁 Files Updated Automatically

- `package.json` (Root)
- `client/package.json`
- `server/package.json`
- `VERSION.md`
- Git tag created

## 📝 Manual Updates Required

- `CHANGELOG.md` - Add detailed change notes
- Documentation updates
- Deployment notes

## 🔧 Troubleshooting

### Version Mismatch
```bash
npm run version-check
```

### Release Script Fails
1. Check all package.json files are valid
2. Ensure git is installed and configured
3. Make sure you're in project root
4. Check VERSION.md exists and is formatted correctly

### Manual Git Tag
```bash
git add .
git commit -m "Release version X.Y.Z"
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

## 📚 Full Documentation

For detailed information, see:
- `docs/VERSION_MANAGEMENT.md` - Complete version management guide
- `CHANGELOG.md` - Change history
- `VERSION.md` - Current version information

---

**Current Version**: 1.0.0
**Last Updated**: 2024-01-XX 