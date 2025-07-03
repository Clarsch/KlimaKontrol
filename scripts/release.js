#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function readPackageJson(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

function writePackageJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function bumpVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);
    
    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            throw new Error(`Invalid version type: ${type}`);
    }
}

function updateVersionFile(newVersion, releaseType) {
    const versionPath = './VERSION.md';
    let content = fs.readFileSync(versionPath, 'utf8');
    
    // Update current version
    content = content.replace(
        /## Current Version\s*\*\*([^*]+)\*\*/,
        `## Current Version\n**${newVersion}**`
    );
    
    // Update version components
    content = content.replace(
        /## Version Components\s*- \*\*Client \(Frontend\)\*\*: [\d.]+/,
        `## Version Components\n- **Client (Frontend)**: ${newVersion}`
    );
    content = content.replace(
        /- \*\*Server \(Backend\)\*\*: [\d.]+/,
        `- **Server (Backend)**: ${newVersion}`
    );
    content = content.replace(
        /- \*\*Root Package\*\*: [\d.]+/,
        `- **Root Package**: ${newVersion}`
    );
    
    // Add new version to history
    const today = new Date().toISOString().split('T')[0];
    const versionHistoryEntry = `\n### ${newVersion} (${today}) - ${releaseType.charAt(0).toUpperCase() + releaseType.slice(1)} Release\n- ${releaseType} release\n\n`;
    
    // Insert after the first version entry
    const historyMatch = content.match(/(## Version History\s*\n\s*### [\d.]+)/);
    if (historyMatch) {
        content = content.replace(
            historyMatch[1],
            historyMatch[1] + versionHistoryEntry
        );
    }
    
    fs.writeFileSync(versionPath, content);
}

function createRelease() {
    const releaseType = process.argv[2];
    
    if (!releaseType || !['patch', 'minor', 'major'].includes(releaseType)) {
        console.error('❌ Invalid release type. Use: patch, minor, or major');
        console.log('\nUsage: node scripts/release.js <type>');
        console.log('  patch  - Bug fixes (1.0.0 -> 1.0.1)');
        console.log('  minor  - New features (1.0.0 -> 1.1.0)');
        console.log('  major  - Breaking changes (1.0.0 -> 2.0.0)');
        process.exit(1);
    }
    
    console.log(`🚀 Creating ${releaseType} release...\n`);
    
    try {
        // Check git status BEFORE making any changes
        console.log('🔍 Checking git status...');
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                console.log('\n⚠️  Uncommitted changes detected:');
                console.log(gitStatus);
                console.log('\nPlease commit your changes before creating a release.');
                process.exit(1);
            }
            console.log('✅ No uncommitted changes found\n');
        } catch (error) {
            console.log('⚠️  Could not check git status. Make sure you have git installed and are in a git repository.');
        }
        
        // Read current versions
        const rootPackage = readPackageJson('./package.json');
        const clientPackage = readPackageJson('./client/package.json');
        const serverPackage = readPackageJson('./server/package.json');
        
        const currentVersion = rootPackage.version;
        const newVersion = bumpVersion(currentVersion, releaseType);
        
        console.log(`📦 Current version: ${currentVersion}`);
        console.log(`📦 New version: ${newVersion}\n`);
        
        // Update package.json files
        console.log('📝 Updating package.json files...');
        rootPackage.version = newVersion;
        clientPackage.version = newVersion;
        serverPackage.version = newVersion;
        
        writePackageJson('./package.json', rootPackage);
        writePackageJson('./client/package.json', clientPackage);
        writePackageJson('./server/package.json', serverPackage);
        
        // Update VERSION.md
        console.log('📝 Updating VERSION.md...');
        updateVersionFile(newVersion, releaseType);
        
        // Create git tag
        try {
            console.log('\n🏷️  Creating git tag...');
            execSync(`git add .`);
            execSync(`git commit -m "Release version ${newVersion}"`);
            execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`);
            console.log(`✅ Git tag v${newVersion} created successfully`);
        } catch (error) {
            console.log('⚠️  Could not create git tag. You may need to do this manually:');
            console.log(`   git add .`);
            console.log(`   git commit -m "Release version ${newVersion}"`);
            console.log(`   git tag -a v${newVersion} -m "Release version ${newVersion}"`);
            console.log(`   git push origin v${newVersion}`);
        }
        
        console.log('\n🎉 Release created successfully!');
        console.log(`\n📋 Next steps:`);
        console.log(`   1. Review the changes in CHANGELOG.md`);
        console.log(`   2. Push the tag: git push origin v${newVersion}`);
        console.log(`   3. Deploy to production`);
        console.log(`   4. Create a GitHub release (if using GitHub)`);
        
    } catch (error) {
        console.error('❌ Error creating release:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    createRelease();
}

module.exports = { createRelease, bumpVersion }; 