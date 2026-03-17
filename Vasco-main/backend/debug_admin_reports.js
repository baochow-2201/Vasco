#!/usr/bin/env node

// Debug script to test the admin reports endpoint
const path = require('path');
const jwt = require('jsonwebtoken');
const sequelize = require(path.join(__dirname, 'src/config/database'));
const { User, Report } = require(path.join(__dirname, 'src/models'));

async function debugAdminReports() {
  try {
    console.log('🔍 Debug Admin Reports Endpoint\n');

    // 1. Get admin user
    console.log('📋 Step 1: Finding admin user...');
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }
    console.log(`✅ Found admin: ${admin.username} (ID: ${admin.id})\n`);

    // 2. Create a test JWT token
    console.log('🔐 Step 2: Creating test JWT token...');
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log(`✅ Token created: ${token.substring(0, 30)}...\n`);

    // 3. Decode token to verify it contains role
    console.log('🔐 Step 3: Verifying token structure...');
    const decoded = jwt.decode(token);
    console.log(`✅ Token payload: `, JSON.stringify(decoded, null, 2));
    console.log(`   - ID: ${decoded.id}`);
    console.log(`   - Role: ${decoded.role}\n`);

    // 4. Test direct database query like the controller does
    console.log('📊 Step 4: Testing reports query (like controller does)...');
    const { Post, Comment } = require(path.join(__dirname, 'src/models'));
    
    const reports = await Report.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "username", "email"] },
        { model: User, as: "reported_user", attributes: ["id", "username", "email"] },
        { model: Post, attributes: ["id", "content"] },
        { model: Comment, attributes: ["id", "content"] },
      ],
      order: [["created_at", "DESC"]],
    });

    console.log(`✅ Found ${reports.length} reports\n`);
    
    if (reports.length > 0) {
      console.log('📄 First report structure:');
      console.log(JSON.stringify(reports[0], null, 2));
    }

    // 5. Check endpoint paths
    console.log('\n✅ Frontend should call these endpoints:');
    console.log(`   1. GET http://localhost:5000/api/reports`);
    console.log(`      Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`   2. PUT http://localhost:5000/api/admin/report/{id}/resolve`);
    console.log(`   3. PUT http://localhost:5000/api/admin/report/{id}/dismiss`);
    console.log(`   4. PUT http://localhost:5000/api/admin/post/{postId}/reject`);
    console.log(`   5. PUT http://localhost:5000/api/admin/comment/{commentId}/reject`);

    console.log('\n✅ Debug completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

debugAdminReports();
