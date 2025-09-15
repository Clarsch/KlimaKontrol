#!/usr/bin/env node

/**
 * CORS Test Script for KlimaKontrol Backend
 * 
 * This script tests the CORS configuration by making requests
 * from different origins to verify they work correctly.
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://possible-key-bluebird.ngrok-free.app';
const TEST_ORIGINS = [
    'https://klima-kontrol-five.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

function makeRequest(url, origin = null) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const client = isHttps ? https : http;
        
        const options = {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        };
        
        if (origin) {
            options.headers['Origin'] = origin;
        }
        
        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function testCORS() {
    console.log('🧪 Testing CORS Configuration');
    console.log('================================');
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log('');
    
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/test`);
        if (response.status === 200) {
            console.log('✅ Backend is reachable');
            console.log(`   Response: ${response.data}`);
        } else {
            console.log(`❌ Backend returned status ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Cannot reach backend: ${error.message}`);
        return;
    }
    
    console.log('');
    
    // Test 2: CORS preflight requests
    console.log('2. Testing CORS preflight requests...');
    for (const origin of TEST_ORIGINS) {
        try {
            const response = await makeRequest(`${BACKEND_URL}/api/test`, origin);
            const corsOrigin = response.headers['access-control-allow-origin'];
            const corsCredentials = response.headers['access-control-allow-credentials'];
            
            if (corsOrigin === origin && corsCredentials === 'true') {
                console.log(`✅ ${origin} - CORS configured correctly`);
            } else {
                console.log(`❌ ${origin} - CORS issue`);
                console.log(`   Expected origin: ${origin}`);
                console.log(`   Actual origin: ${corsOrigin}`);
                console.log(`   Credentials: ${corsCredentials}`);
            }
        } catch (error) {
            console.log(`❌ ${origin} - Request failed: ${error.message}`);
        }
    }
    
    console.log('');
    
    // Test 3: Authentication endpoint
    console.log('3. Testing authentication endpoint...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'https://klima-kontrol-five.vercel.app');
        const corsOrigin = response.headers['access-control-allow-origin'];
        
        if (corsOrigin === 'https://klima-kontrol-five.vercel.app') {
            console.log('✅ Authentication endpoint CORS configured correctly');
        } else {
            console.log('❌ Authentication endpoint CORS issue');
            console.log(`   Expected: https://klima-kontrol-five.vercel.app`);
            console.log(`   Actual: ${corsOrigin}`);
        }
    } catch (error) {
        console.log(`❌ Authentication endpoint test failed: ${error.message}`);
    }
    
    console.log('');
    console.log('🏁 CORS testing complete!');
    console.log('');
    console.log('If you see any ❌ errors, check:');
    console.log('1. Backend server is running');
    console.log('2. CORS_ORIGINS environment variable includes your frontend URL');
    console.log('3. ngrok tunnel is active and accessible');
}

// Run the test
testCORS().catch(console.error);
