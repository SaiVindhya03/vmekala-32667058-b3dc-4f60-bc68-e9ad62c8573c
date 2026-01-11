#!/usr/bin/env node
/**
 * Test JWT Authentication
 * 
 * This script tests the JWT authentication system:
 * 1. Login with email/password
 * 2. Receive JWT token
 * 3. Access protected route with token
 * 4. Validate token
 * 
 * Usage: node apps/api/src/auth/test-auth.js
 */

const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3000;

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: path,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuthentication() {
  console.log('🔐 Testing JWT Authentication System\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Login
    console.log('\n📝 Test 1: Login with email/password');
    console.log('POST /auth/login');
    console.log('Body:', JSON.stringify(TEST_USER, null, 2));

    const loginResponse = await makeRequest('POST', '/auth/login', TEST_USER);
    
    console.log('Status:', loginResponse.status);
    
    if (loginResponse.status === 200 || loginResponse.status === 201) {
      console.log('✅ Login successful!');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      
      const { access_token, user } = loginResponse.data;
      
      if (!access_token) {
        console.error('❌ No access_token in response');
        return;
      }

      console.log('\n📋 JWT Token:', access_token.substring(0, 50) + '...');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Roles:', user.roles);
      console.log('Permissions:', user.permissions);

      // Test 2: Access protected route
      console.log('\n📝 Test 2: Access protected route with JWT');
      console.log('GET /auth/profile');
      console.log('Header: Authorization: Bearer <token>');

      const profileResponse = await makeRequest('GET', '/auth/profile', null, access_token);
      
      console.log('Status:', profileResponse.status);
      
      if (profileResponse.status === 200) {
        console.log('✅ Protected route accessed successfully!');
        console.log('Response:', JSON.stringify(profileResponse.data, null, 2));
      } else {
        console.log('❌ Failed to access protected route');
        console.log('Response:', profileResponse.data);
      }

      // Test 3: Validate token
      console.log('\n📝 Test 3: Validate JWT token');
      console.log('GET /auth/validate');

      const validateResponse = await makeRequest('GET', '/auth/validate', null, access_token);
      
      console.log('Status:', validateResponse.status);
      
      if (validateResponse.status === 200) {
        console.log('✅ Token validation successful!');
        console.log('Response:', JSON.stringify(validateResponse.data, null, 2));
      } else {
        console.log('❌ Token validation failed');
        console.log('Response:', validateResponse.data);
      }

      // Test 4: Access protected route without token
      console.log('\n📝 Test 4: Access protected route WITHOUT token (should fail)');
      console.log('GET /auth/profile');
      console.log('Header: (no Authorization header)');

      const unauthorizedResponse = await makeRequest('GET', '/auth/profile');
      
      console.log('Status:', unauthorizedResponse.status);
      
      if (unauthorizedResponse.status === 401) {
        console.log('✅ Correctly rejected unauthorized request!');
        console.log('Response:', JSON.stringify(unauthorizedResponse.data, null, 2));
      } else {
        console.log('⚠️  Expected 401 status but got:', unauthorizedResponse.status);
      }

      // Test 5: Access with invalid token
      console.log('\n📝 Test 5: Access with INVALID token (should fail)');
      console.log('GET /auth/profile');
      console.log('Header: Authorization: Bearer invalid-token');

      const invalidTokenResponse = await makeRequest('GET', '/auth/profile', null, 'invalid-token-12345');
      
      console.log('Status:', invalidTokenResponse.status);
      
      if (invalidTokenResponse.status === 401) {
        console.log('✅ Correctly rejected invalid token!');
        console.log('Response:', JSON.stringify(invalidTokenResponse.data, null, 2));
      } else {
        console.log('⚠️  Expected 401 status but got:', invalidTokenResponse.status);
      }

      console.log('\n' + '='.repeat(50));
      console.log('✅ All authentication tests completed!');
      console.log('\n💡 JWT Authentication is working correctly!');

    } else {
      console.log('❌ Login failed!');
      console.log('Response:', loginResponse.data);
      console.log('\n💡 Make sure:');
      console.log('   1. The API server is running (npm run serve)');
      console.log('   2. Test user exists (run create-test-user.ts)');
      console.log('   3. Credentials are correct');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the API server is running on port 3000');
  }
}

// Run tests
testAuthentication();
