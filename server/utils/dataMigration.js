const fs = require('fs').promises;
const path = require('path');
const { addUUIDToRecord } = require('./uuidGenerator');

/**
 * Migrate existing environmental data to include UUID, sensor_id, and location_id
 */
async function migrateEnvironmentalData() {
    try {
        const environmentalDir = path.join(__dirname, '..', 'data', 'environmental');
        
        // Check if directory exists
        try {
            await fs.access(environmentalDir);
        } catch (error) {
            console.log('Environmental data directory does not exist. No migration needed.');
            return;
        }

        const files = await fs.readdir(environmentalDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log('No environmental data files found. No migration needed.');
            return;
        }

        console.log(`Found ${jsonFiles.length} environmental data files to migrate...`);

        for (const file of jsonFiles) {
            const filePath = path.join(environmentalDir, file);
            const locationId = file.replace('.json', '');
            
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(fileContent);
                
                if (!Array.isArray(data)) {
                    console.log(`Skipping ${file}: Not an array format`);
                    continue;
                }

                let hasChanges = false;
                const migratedData = data.map(record => {
                    // Check if record already has the new fields
                    if (record.id && record.sensor_id && record.location_id) {
                        return record; // Already migrated
                    }

                    hasChanges = true;
                    return addUUIDToRecord({
                        sensor_id: 'sensor_01',
                        location_id: locationId,
                        ...record
                    });
                });

                if (hasChanges) {
                    await fs.writeFile(filePath, JSON.stringify(migratedData, null, 2));
                    console.log(`Migrated ${file}: ${migratedData.length} records updated`);
                } else {
                    console.log(`Skipped ${file}: Already migrated`);
                }

            } catch (error) {
                console.error(`Error migrating ${file}:`, error.message);
            }
        }

        console.log('Environmental data migration completed.');

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

/**
 * Run the migration if this file is executed directly
 */
if (require.main === module) {
    migrateEnvironmentalData()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = {
    migrateEnvironmentalData
}; 