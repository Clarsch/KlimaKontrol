const fs = require('fs').promises;
const path = require('path');

async function verifyDataStructure() {
    const directories = [
        'data',
        'data/warnings',
        'data/environmental',
        'data/uploads'
    ];

    const files = [
        ['data/warnings/warnings.json', '{}']
    ];

    // Create directories
    for (const dir of directories) {
        const dirPath = path.join(__dirname, '..', dir);
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        }
    }

    // Create files
    for (const [filePath, defaultContent] of files) {
        const fullPath = path.join(__dirname, '..', filePath);
        try {
            await fs.access(fullPath);
        } catch {
            await fs.writeFile(fullPath, defaultContent);
            console.log(`Created file: ${fullPath}`);
        }
    }
}

module.exports = { verifyDataStructure }; 