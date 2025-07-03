#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readPackageJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

function checkVersions() {
    console.log('🔍 KlimaKontrol Version Check\n');
    
    const packages = [
        { name: 'Root Package', path: './package.json' },
        { name: 'Client (Frontend)', path: './client/package.json' },
        { name: 'Server (Backend)', path: './server/package.json' }
    ];
    
    let allVersions = [];
    let hasErrors = false;
    
    packages.forEach(pkg => {
        const packageJson = readPackageJson(pkg.path);
        if (packageJson) {
            allVersions.push({
                name: pkg.name,
                version: packageJson.version
            });
        } else {
            hasErrors = true;
        }
    });
    
    if (hasErrors) {
        console.log('❌ Some package.json files could not be read');
        process.exit(1);
    }
    
    // Display versions
    allVersions.forEach(pkg => {
        console.log(`${pkg.name}: ${pkg.version}`);
    });
    
    // Check if all versions match
    const versions = allVersions.map(pkg => pkg.version);
    const uniqueVersions = [...new Set(versions)];
    
    console.log('\n📊 Version Status:');
    if (uniqueVersions.length === 1) {
        console.log('✅ All packages have the same version');
    } else {
        console.log('⚠️  Version mismatch detected!');
        console.log('   Different versions found:', uniqueVersions.join(', '));
    }
    
    // Check VERSION.md
    try {
        const versionContent = fs.readFileSync('./VERSION.md', 'utf8');
        const versionMatch = versionContent.match(/## Current Version\s*\*\*([^*]+)\*\*/);
        if (versionMatch) {
            const versionFileVersion = versionMatch[1];
            console.log(`\n📄 VERSION.md shows: ${versionFileVersion}`);
            
            if (versions.includes(versionFileVersion)) {
                console.log('✅ VERSION.md matches package versions');
            } else {
                console.log('⚠️  VERSION.md does not match package versions');
            }
        }
    } catch (error) {
        console.log('\n⚠️  VERSION.md not found or could not be read');
    }
    
    console.log('\n📋 Summary:');
    console.log(`   Total packages checked: ${allVersions.length}`);
    console.log(`   Unique versions found: ${uniqueVersions.length}`);
    console.log(`   Current version: ${uniqueVersions[0] || 'Unknown'}`);
}

if (require.main === module) {
    checkVersions();
}

module.exports = { checkVersions }; 