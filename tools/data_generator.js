const fs = require('fs');
const { generateUUID } = require('./server/utils/uuidGenerator');

// Generate realistic environmental data for 3 sensors over the last 3 hours
function generateTestData() {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    // Sensor configurations with different baseline values and characteristics
    const sensors = [
        {
            id: 'sensor_001',
            baseTemp: 19.5,
            baseHumidity: 52.5,
            basePressure: 985.4,
            tempVariation: 0.8,
            humidityVariation: 3.0,
            pressureVariation: 2.0
        },
        {
            id: 'sensor_002', 
            baseTemp: 20.2,
            baseHumidity: 48.8,
            basePressure: 986.1,
            tempVariation: 1.2,
            humidityVariation: 4.5,
            pressureVariation: 1.8
        },
        {
            id: 'sensor_003',
            baseTemp: 18.8,
            baseHumidity: 55.2,
            basePressure: 984.7,
            tempVariation: 0.6,
            humidityVariation: 2.8,
            pressureVariation: 2.5
        }
    ];

    const newData = [];
    
    // Generate data every 5 minutes for the last 3 hours
    for (let time = threeHoursAgo; time <= now; time = new Date(time.getTime() + (5 * 60 * 1000))) {
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
                location_id: 'bov',
                record_time: time.toISOString(),
                temperature: Math.round(temperature * 100) / 100,
                relative_humidity: Math.round(humidity * 100) / 100,
                air_pressure: Math.round(pressure * 100) / 100
            });
        });
    }

    return newData;
}

// Read existing data and merge with new data
function updateBovData() {
    try {
        const filePath = './server/data/environmental/bov.json';
        
        // Read existing data
        let existingData = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
        }
        
        // Generate new data
        const newData = generateTestData();
        
        // Merge and sort by timestamp
        const mergedData = [...existingData, ...newData].sort((a, b) => 
            new Date(a.record_time) - new Date(b.record_time)
        );
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
        
        console.log(`✅ Generated ${newData.length} new readings for 3 sensors over the last 3 hours`);
        console.log(`📊 Total readings in bov.json: ${mergedData.length}`);
        console.log(`🕐 Time range: ${newData[0].record_time} to ${newData[newData.length - 1].record_time}`);
        console.log(`📡 Sensors: sensor_001, sensor_002, sensor_003`);
        
    } catch (error) {
        console.error('❌ Error updating bov data:', error);
    }
}

// Run the script
updateBovData(); 