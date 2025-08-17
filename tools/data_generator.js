const fs = require('fs');
const path = require('path');
const { generateUUID } = require('../server/utils/uuidGenerator');

// Parse command line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('📋 Usage: node data_generator.js <days_back> <location_name>');
        console.log('📋 Example: node data_generator.js 7 kliplev');
        console.log('📋 Example: node data_generator.js 30 church1');
        console.log('📋 Example: node data_generator.js 1 office');
        process.exit(1);
    }
    
    const daysBack = parseInt(args[0]);
    const locationName = args[1];
    
    if (isNaN(daysBack) || daysBack < 1) {
        console.log('❌ Error: days_back must be a positive number');
        console.log('📋 Example: node data_generator.js 7 kliplev');
        process.exit(1);
    }
    
    if (!locationName || locationName.trim() === '') {
        console.log('❌ Error: location_name cannot be empty');
        console.log('📋 Example: node data_generator.js 7 kliplev');
        process.exit(1);
    }
    
    return { daysBack, locationName: locationName.trim() };
}

// Generate realistic environmental data for multiple sensors
function generateTestData(daysBack, locationName) {
    const now = new Date();
    const timeframe = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Sensor configurations with different baseline values and characteristics
    const sensors = [
        {
            id: 'sensor_001',
            baseTemp: 25.5,
            baseHumidity: 42.5,
            basePressure: 975.4,
            tempVariation: 0.8,
            humidityVariation: 3.0,
            pressureVariation: 2.0
        },
        {
            id: 'sensor_002', 
            baseTemp: 20.2,
            baseHumidity: 48.8,
            basePressure: 996.1,
            tempVariation: 1.6,
            humidityVariation: 4.5,
            pressureVariation: 1.8
        },
        {
            id: 'sensor_003',
            baseTemp: 16.8,
            baseHumidity: 55.2,
            basePressure: 1020.7,
            tempVariation: 0.2,
            humidityVariation: 2.8,
            pressureVariation: 2.5
        },
        {
            id: 'sensor_004',
            baseTemp: 28.8,
            baseHumidity: 65.2,
            basePressure: 1040.7,
            tempVariation: 0.2,
            humidityVariation: 1.8,
            pressureVariation: 2.5
        }
    ];

    const newData = [];
    
    // Generate data every 15 minutes for the specified time period
    for (let time = timeframe; time <= now; time = new Date(time.getTime() + (15 * 60 * 1000))) {
        sensors.forEach(sensor => {
            // Add realistic variations based on time of day
            const hour = time.getHours();
            const timeFactor = Math.sin((hour - 6) * Math.PI / 12) * 0.3; // Daily temperature cycle
            
            // Generate realistic temperature with daily cycle and random variation
            const tempVariation = (Math.random() - 0.5) * sensor.tempVariation;
            const temperature = sensor.baseTemp + tempVariation + timeFactor;
            
            // Humidity inversely related to temperature (realistic)
            const humidityVariation = (Math.random() - 0.5) * sensor.humidityVariation;
            const humidity = sensor.baseHumidity + humidityVariation - (tempVariation * 0.8);
            
            // Pressure with gradual changes and small random variations
            const pressureVariation = (Math.random() - 0.5) * sensor.pressureVariation;
            const pressure = sensor.basePressure + pressureVariation;
            
            newData.push({
                id: generateUUID(),
                sensor_id: sensor.id,
                location_id: locationName,
                record_time: time.toISOString(),
                temperature: Math.round(temperature * 100) / 100,
                relative_humidity: Math.round(humidity * 100) / 100,
                air_pressure: Math.round(pressure * 100) / 100
            });
        });
    }

    return newData;
}

// Create or update location data file
function updateLocationData(daysBack, locationName) {
    try {
        // Ensure the data directory exists
        const dataDir = path.join(__dirname, '../server/data/environmental');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const filePath = path.join(dataDir, `${locationName}.json`);
        
        // Read existing data if file exists
        let existingData = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
            console.log(`📖 Found existing data file: ${filePath}`);
            console.log(`📊 Existing readings: ${existingData.length}`);
        } else {
            console.log(`🆕 Creating new data file: ${filePath}`);
        }
        
        // Generate new data
        console.log(`🔄 Generating data for ${locationName} over the last ${daysBack} days...`);
        const newData = generateTestData(daysBack, locationName);
        
        // Merge and sort by timestamp
        const mergedData = [...existingData, ...newData].sort((a, b) => 
            new Date(a.record_time) - new Date(b.record_time)
        );
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
        
        // Calculate time range
        const startTime = new Date(newData[0].record_time);
        const endTime = new Date(newData[newData.length - 1].record_time);
        const totalHours = Math.round((endTime - startTime) / (1000 * 60 * 60));
        
        console.log('\n✅ Data generation completed successfully!');
        console.log(`📍 Location: ${locationName}`);
        console.log(`📅 Days back: ${daysBack}`);
        console.log(`🕐 Time range: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);
        console.log(`⏱️  Total hours: ${totalHours}`);
        console.log(`📡 Sensors: ${newData.length / Math.ceil((endTime - startTime) / (1000 * 60 * 15))} sensors`);
        console.log(`📊 New readings generated: ${newData.length}`);
        console.log(`📊 Total readings in file: ${mergedData.length}`);
        console.log(`💾 File saved to: ${filePath}`);
        
        // Show data frequency
        const readingsPerDay = Math.round(newData.length / daysBack);
        console.log(`📈 Average readings per day: ${readingsPerDay}`);
        
    } catch (error) {
        console.error('❌ Error generating data:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Main execution
function main() {
    console.log('🚀 KlimaKontrol Data Generator');
    console.log('================================\n');
    
    try {
        const { daysBack, locationName } = parseArguments();
        
        console.log(`🎯 Configuration:`);
        console.log(`   📅 Days back: ${daysBack}`);
        console.log(`   📍 Location: ${locationName}`);
        console.log(`   📡 Sensors: 4 (sensor_001, sensor_002, sensor_003, sensor_004)`);
        console.log(`   ⏱️  Frequency: Every 15 minutes`);
        console.log('');
        
        updateLocationData(daysBack, locationName);
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { generateTestData, updateLocationData }; 