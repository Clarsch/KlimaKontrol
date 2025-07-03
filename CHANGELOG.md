# Changelog

All notable changes to the KlimaKontrol project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup

### Changed

### Deprecated

### Removed

### Fixed

### Security

---

## [1.0.0] - 2024-01-XX

### Added
- Initial release of KlimaKontrol climate monitoring system
- React-based frontend with Vite build system
- Express.js backend API server
- User authentication system
- Location management with environmental data tracking
- Real-time warning system for temperature, humidity, and pressure thresholds
- CSV data upload functionality
- Multi-language support (English/Danish)
- Responsive dashboard with charts and graphs
- Area-based location grouping
- Environmental data visualization with time range filtering
- Warning management system with activation/deactivation
- Configuration management system

### Technical Features
- Modern React 18 with hooks
- Styled-components for styling
- Recharts for data visualization
- Axios for API communication
- JWT-based authentication
- CORS configuration for cross-origin requests
- CSV parsing and validation
- File upload handling with Multer
- Internationalization with i18next
- ESLint configuration for code quality

### Architecture
- Monorepo structure with client and server
- RESTful API design
- Modular component architecture
- Separation of concerns between frontend and backend
- Configuration-driven approach for locations and users

---

## Version History

| Version | Release Date | Major Changes |
|---------|--------------|---------------|
| 1.0.0   | 2024-01-XX   | Initial release |

---

## Release Process

### Version Numbering
- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, minor improvements

### Release Checklist
- [ ] Update version numbers in all package.json files
- [ ] Update CHANGELOG.md with new version
- [ ] Update VERSION.md with current version
- [ ] Create git tag for the release
- [ ] Test all functionality
- [ ] Update documentation if needed
- [ ] Deploy to production environment

### Git Tags
Releases are tagged in git using the format: `v1.0.0`

Example:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
``` 