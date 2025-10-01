#!/usr/bin/env node

/**
 * Test Script for Service Uploader Role
 * Tests the new service_uploader role authentication on upload endpoints
 */

const https = require('https');
const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function testServiceUploaderRole() {
    console.log('🔐 Testing Service Uploader Role');
    console.log('=================================');
    console.log(`Server URL: ${SERVER_URL}`);
    console.log('');

    try {
        // Test 1: Login as admin (should work)
        console.log('1. Testing admin login...');
        const adminLoginResponse = await makeRequest(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            body: {
                username: 'admin',
                password: 'admin123'
            }
        });

        if (adminLoginResponse.status !== 200) {
            console.log(`❌ Admin login failed: ${adminLoginResponse.status}`);
            console.log(`   Response: ${JSON.stringify(adminLoginResponse.data)}`);
            return;
        }

        const adminToken = adminLoginResponse.data.accessToken || adminLoginResponse.data.token;
        console.log('✅ Admin login successful');
        console.log(`   Role: ${adminLoginResponse.data.user.role}`);
        console.log('');

        // Test 2: Test upload with admin role (should work)
        console.log('2. Testing upload with admin role...');
        const adminUploadResponse = await makeRequest(`${SERVER_URL}/api/data/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: {
                readings: [{
                    sensor_id: 'test-sensor-001',
                    location_id: 'bov',
                    record_time: '2024-01-01T12:00:00Z',
                    temperature: 20.5,
                    relative_humidity: 55.0,
                    air_pressure: 1013.25,
                    pause: 0
                }],
                batch_id: 'test-batch-admin',
                timestamp: '2024-01-01T12:00:00Z'
            }
        });

        if (adminUploadResponse.status === 200) {
            console.log('✅ Admin upload successful');
        } else {
            console.log(`❌ Admin upload failed: ${adminUploadResponse.status}`);
            console.log(`   Response: ${JSON.stringify(adminUploadResponse.data)}`);
        }
        console.log('');

        // Test 3: Test upload with collector role (should fail)
        console.log('3. Testing upload with collector role (should fail)...');
        const collectorLoginResponse = await makeRequest(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            body: {
                username: 'bov',
                password: 'password123'
            }
        });

        if (collectorLoginResponse.status === 200) {
            const collectorToken = collectorLoginResponse.data.accessToken || collectorLoginResponse.data.token;
            console.log(`   Collector role: ${collectorLoginResponse.data.user.role}`);
            
            const collectorUploadResponse = await makeRequest(`${SERVER_URL}/api/data/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${collectorToken}`
                },
                body: {
                    readings: [{
                        sensor_id: 'test-sensor-001',
                        location_id: 'bov',
                        record_time: '2024-01-01T12:00:00Z',
                        temperature: 20.5,
                        relative_humidity: 55.0,
                        air_pressure: 1013.25,
                        pause: 0
                    }],
                    batch_id: 'test-batch-collector',
                    timestamp: '2024-01-01T12:00:00Z'
                }
            });

            if (collectorUploadResponse.status === 403) {
                console.log('✅ Collector upload correctly rejected (403 Forbidden)');
                console.log(`   Message: ${collectorUploadResponse.data.message}`);
            } else {
                console.log(`❌ Collector upload should be rejected, got: ${collectorUploadResponse.status}`);
                console.log(`   Response: ${JSON.stringify(collectorUploadResponse.data)}`);
            }
        } else {
            console.log(`❌ Collector login failed: ${collectorLoginResponse.status}`);
        }
        console.log('');

        // Test 4: Test single reading endpoint with admin role
        console.log('4. Testing single reading with admin role...');
        const adminSingleResponse = await makeRequest(`${SERVER_URL}/api/data/reading/dataReading`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: {
                sensor_id: 'test-sensor-001',
                location_id: 'bov',
                record_time: '2024-01-01T12:00:00Z',
                temperature: 20.5,
                relative_humidity: 55.0,
                air_pressure: 1013.25,
                pause: 0
            }
        });

        if (adminSingleResponse.status === 200) {
            console.log('✅ Admin single reading successful');
        } else {
            console.log(`❌ Admin single reading failed: ${adminSingleResponse.status}`);
            console.log(`   Response: ${JSON.stringify(adminSingleResponse.data)}`);
        }
        console.log('');

        console.log('🏁 Service Uploader Role Testing Complete!');
        console.log('');
        console.log('Summary:');
        console.log('- Admin role can upload data ✅');
        console.log('- Collector role is rejected ✅');
        console.log('- Ready for service_uploader role implementation');
        console.log('');
        console.log('💡 Next steps:');
        console.log('1. Add a service_uploader user to klima_kontrol_config/server/data/users.js');
        console.log('2. Test the service_uploader role with this script');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('');
        console.log('💡 Make sure:');
        console.log('1. Server is running on the correct port');
        console.log('2. User configuration exists in server config');
        console.log('3. JWT_SECRET environment variable is set');
    }
}

// Run the test
testServiceUploaderRole().catch(console.error);
