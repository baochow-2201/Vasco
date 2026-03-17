#!/usr/bin/env node

// Test the actual API endpoint
const jwt = require('jsonwebtoken');
const path = require('path');
const sequelize = require(path.join(__dirname, 'src/config/database'));
const { User } = require(path.join(__dirname, 'src/models'));

async function testAPI() {
  try {
    console.log('🧪 Testing /api/reports endpoint\n');

    // Get admin
    const admin = await User.findOne({ where: { role: 'admin' } });
    console.log('✅ Admin found:', admin.username);

    // Create token
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log('✅ Token created\n');

    // Check if server is running
    console.log('🌐 Starting server to test endpoint...');
    const app = require(path.join(__dirname, 'src/app'));
    const server = app.listen(3001, async () => {
      console.log('✅ Test server running on port 3001\n');

      try {
        // Test the endpoint
        console.log('📡 Fetching /api/reports...');
        const response = await fetch('http://localhost:3001/api/reports', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`📊 Response status: ${response.status}`);
        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ SUCCESS! Received ${Array.isArray(data) ? data.length : '?'} reports`);
          console.log('\n📋 Response structure:');
          console.log('Type:', Array.isArray(data) ? 'Array' : typeof data);
          if (Array.isArray(data) && data.length > 0) {
            console.log('First report keys:', Object.keys(data[0]));
          }
          console.log('\n📄 Raw response (first 200 chars):');
          console.log(JSON.stringify(data).substring(0, 200) + '...');
        } else {
          console.log('❌ ERROR:', data);
        }
      } catch (err) {
        console.error('❌ Fetch error:', err.message);
      } finally {
        server.close();
        process.exit(0);
      }
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testAPI();
