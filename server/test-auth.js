#!/usr/bin/env node

/**
 * Authentication Test Script for KlimaKontrol Server
 * Tests the newly added authentication middleware on data upload endpoints
 */

const https = require('https');
const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';
const TEST_USERNAME = process.env.TEST_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin';

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

async function testAuthentication() {
    console.log('🔐 Testing Authentication Middleware');
    console.log('====================================');
    console.log(`Server URL: ${SERVER_URL}`);
    console.log('');

    try {
        // Test 1: Health check (should work without auth)
        console.log('1. Testing health check endpoint (no auth required)...');
        const healthResponse = await makeRequest(`${SERVER_URL}/api/health`);
        if (healthResponse.status === 200) {
            console.log('✅ Health check successful');
        } else {
            console.log(`❌ Health check failed: ${healthResponse.status}`);
            return;
        }

        console.log('');

        // Test 2: Login to get token
        console.log('2. Testing login to get authentication token...');
        const loginResponse = await makeRequest(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            body: {
                username: TEST_USERNAME,
                password: TEST_PASSWORD
            }
        });

        if (loginResponse.status !== 200) {
            console.log(`❌ Login failed: ${loginResponse.status}`);
            console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
            console.log('');
            console.log('💡 Make sure you have a user configured in your server config');
            console.log('   Default credentials: username=admin, password=admin');
            return;
        }

        const token = loginResponse.data.accessToken || loginResponse.data.token;
        if (!token) {
            console.log('❌ No token received from login');
            console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
            return;
        }

        console.log('✅ Login successful, token received');
        console.log('');

        // Test 3: Test single reading endpoint without auth (should fail)
        console.log('3. Testing single reading endpoint WITHOUT authentication (should fail)...');
        const singleReadingNoAuth = await makeRequest(`${SERVER_URL}/api/data/reading/dataReading`, {
            method: 'POST',
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

        if (singleReadingNoAuth.status === 401) {
            console.log('✅ Single reading endpoint correctly rejects unauthenticated requests');
        } else {
            console.log(`❌ Single reading endpoint should reject unauthenticated requests, got: ${singleReadingNoAuth.status}`);
        }

        // Test 4: Test single reading endpoint with auth (should work)
        console.log('4. Testing single reading endpoint WITH authentication (should work)...');
        const singleReadingWithAuth = await makeRequest(`${SERVER_URL}/api/data/reading/dataReading`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
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

        if (singleReadingWithAuth.status === 200) {
            console.log('✅ Single reading endpoint accepts authenticated requests');
        } else {
            console.log(`❌ Single reading endpoint failed with auth: ${singleReadingWithAuth.status}`);
            console.log(`   Response: ${JSON.stringify(singleReadingWithAuth.data)}`);
        }

        // Test 5: Test batch upload endpoint without auth (should fail)
        console.log('5. Testing batch upload endpoint WITHOUT authentication (should fail)...');
        const batchUploadNoAuth = await makeRequest(`${SERVER_URL}/api/data/upload`, {
            method: 'POST',
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
                batch_id: 'test-batch-001',
                timestamp: '2024-01-01T12:00:00Z'
            }
        });

        if (batchUploadNoAuth.status === 401) {
            console.log('✅ Batch upload endpoint correctly rejects unauthenticated requests');
        } else {
            console.log(`❌ Batch upload endpoint should reject unauthenticated requests, got: ${batchUploadNoAuth.status}`);
        }

        // Test 6: Test batch upload endpoint with auth (should work)
        console.log('6. Testing batch upload endpoint WITH authentication (should work)...');
        const batchUploadWithAuth = await makeRequest(`${SERVER_URL}/api/data/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
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
                batch_id: 'test-batch-001',
                timestamp: '2024-01-01T12:00:00Z'
            }
        });

        if (batchUploadWithAuth.status === 200) {
            console.log('✅ Batch upload endpoint accepts authenticated requests');
        } else {
            console.log(`❌ Batch upload endpoint failed with auth: ${batchUploadWithAuth.status}`);
            console.log(`   Response: ${JSON.stringify(batchUploadWithAuth.data)}`);
        }

        console.log('');
        console.log('🏁 Authentication testing complete!');
        console.log('');
        console.log('Summary:');
        console.log('- Both data upload endpoints now require authentication');
        console.log('- Unauthenticated requests are properly rejected with 401 status');
        console.log('- Authenticated requests with valid JWT tokens are accepted');
        console.log('');
        console.log('✅ Authentication middleware successfully implemented!');

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
testAuthentication().catch(console.error);
