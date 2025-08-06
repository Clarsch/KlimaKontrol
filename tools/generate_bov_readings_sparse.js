const fs = require('fs');
const path = require('path');

// Generate realistic environmental data for 3 sensors over 4 hours (past 3 + next 1)
// Using 30-minute intervals for better graph visualization
function generateBovReadingsSparse() {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const oneHourFromNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    
    // Sensor configurations with different baseline values and characteristics
    const sensors = [
        {
            id: 'bov_sensor_001',
            baseTemp: 19.5,
            baseHumidity: 52.5,
            basePressure: 1013.4,
            tempVariation: 1.2,
            humidityVariation: 4.0,
            pressureVariation: 3.0
        },
        {
            id: 'bov_sensor_002', 
            baseTemp: 23.2,
            baseHumidity: 40.8,
            basePressure: 1014.1,
            tempVariation: 1.5,
            humidityVariation: 5.5,
            pressureVariation: 2.8
        },
        {
            id: 'bov_sensor_003',
            baseTemp: 18.8,
            baseHumidity: 55.2,
            basePressure: 1002.7,
            tempVariation: 1.0,
            humidityVariation: 3.8,
            pressureVariation: 3.5
        }
    ];

    const readings = [];
    
    // Generate data every 30 minutes for 4 hours total (better for graphs)
    for (let time = threeHoursAgo; time <= oneHourFromNow; time = new Date(time.getTime() + (30 * 60 * 1000))) {
        sensors.forEach(sensor => {
            // Add realistic variations based on time of day
            const hour = time.getHours();
            const timeFactor = Math.sin((hour - 6) * Math.PI / 12) * 0.5; // Daily temperature cycle
            
            // Generate realistic temperature with daily cycle and random variation
            const tempVariation = (Math.random() - 0.5) * sensor.tempVariation;
            const temperature = sensor.baseTemp + tempVariation + timeFactor;
            
            // Humidity inversely related to temperature (realistic)
            const humidityVariation = (Math.random() - 0.5) * sensor.humidityVariation;
            const humidity = sensor.baseHumidity + humidityVariation - (tempVariation * 1.2);
            
            // Pressure with gradual changes and small random variations
            const pressureVariation = (Math.random() - 0.5) * sensor.pressureVariation;
            const pressure = sensor.basePressure + pressureVariation;
            
            readings.push({
                record_time: time.toISOString(),
                temperature: Math.round(temperature * 100) / 100,
                relative_humidity: Math.round(humidity * 100) / 100,
                air_pressure: Math.round(pressure * 100) / 100,
                sensor_id: sensor.id,
                location_id: 'bov',
                pause: 0
            });
        });
    }

    return readings;
}

// Generate and save the data
function createBovReadingsSparse() {
    try {
        const readings = generateBovReadingsSparse();
        
        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '..', 'misc', 'sample_data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save as CSV files for each sensor
        sensors.forEach(sensor => {
            const sensorReadings = readings.filter(reading => reading.sensor_id === sensor.id);
            
            // Create CSV content
            const csvHeader = 'record_time,temperature,relative_humidity,air_pressure,pause\n';
            const csvContent = sensorReadings.map(reading => 
                `${reading.record_time},${reading.temperature},${reading.relative_humidity},${reading.air_pressure},${reading.pause}`
            ).join('\n');
            
            const csvData = csvHeader + csvContent;
            const fileName = `bov_${sensor.id}_readings_sparse.csv`;
            const filePath = path.join(outputDir, fileName);
            
            fs.writeFileSync(filePath, csvData);
            console.log(`✅ Generated ${sensorReadings.length} readings for ${sensor.id} in ${fileName}`);
        });
        
        // Also save as a combined JSON file
        const jsonFilePath = path.join(outputDir, 'bov_all_sensors_readings_sparse.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(readings, null, 2));
        
        console.log(`\n📊 Summary:`);
        console.log(`📡 Total readings generated: ${readings.length}`);
        console.log(`🕐 Time range: ${readings[0].record_time} to ${readings[readings.length - 1].record_time}`);
        console.log(`📍 Location: Bov Kirke`);
        console.log(`📡 Sensors: bov_sensor_001, bov_sensor_002, bov_sensor_003`);
        console.log(`⏱️  Interval: 30 minutes (better for graph visualization)`);
        console.log(`📁 Files created in: ${outputDir}`);
        console.log(`📄 Combined data saved as: bov_all_sensors_readings_sparse.json`);
        
    } catch (error) {
        console.error('❌ Error generating Bov readings:', error);
    }
}

// Define sensors for the CSV generation
const sensors = [
    {
        id: 'bov_sensor_001',
        baseTemp: 19.5,
        baseHumidity: 52.5,
        basePressure: 1013.4,
        tempVariation: 1.2,
        humidityVariation: 4.0,
        pressureVariation: 3.0
    },
    {
        id: 'bov_sensor_002', 
        baseTemp: 20.2,
        baseHumidity: 48.8,
        basePressure: 1014.1,
        tempVariation: 1.5,
        humidityVariation: 5.5,
        pressureVariation: 2.8
    },
    {
        id: 'bov_sensor_003',
        baseTemp: 18.8,
        baseHumidity: 55.2,
        basePressure: 1012.7,
        tempVariation: 1.0,
        humidityVariation: 3.8,
        pressureVariation: 3.5
    }
];

// Run the script
createBovReadingsSparse(); 

// console.log(`\n🔧 To run this script, use the following command:`);
// console.log(`   node tools/generate_bov_readings_sparse.js`);
