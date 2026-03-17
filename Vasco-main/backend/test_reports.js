#!/usr/bin/env node

// Test script to verify reports are being created and fetched correctly
const path = require('path');
const sequelize = require(path.join(__dirname, 'src/config/database'));
const { Report, User, Post, Comment } = require(path.join(__dirname, 'src/models'));

async function testReports() {
  try {
    console.log('🔄 Starting reports test...\n');

    // 1. Check if reports table exists and has data
    console.log('📊 Checking reports table...');
    const reportCount = await Report.count();
    console.log(`✅ Total reports in database: ${reportCount}\n`);

    // 2. Fetch all reports with relations
    console.log('📥 Fetching all reports with relations...');
    const reports = await Report.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "username", "email"] },
        { model: User, as: "reported_user", attributes: ["id", "username", "email"] },
        { model: Post, attributes: ["id", "content"] },
        { model: Comment, attributes: ["id", "content"] },
      ],
      order: [["created_at", "DESC"]],
      limit: 10
    });

    if (reports.length === 0) {
      console.log('⚠️  No reports found in database.\n');
    } else {
      console.log(`✅ Found ${reports.length} reports:\n`);
      reports.forEach((r, idx) => {
        console.log(`Report #${r.id}:`);
        console.log(`  Type: ${r.type}`);
        console.log(`  Status: ${r.status}`);
        console.log(`  Reporter: ${r.reporter?.username || 'Unknown'}`);
        console.log(`  Reported User: ${r.reported_user?.username || 'Unknown'}`);
        console.log(`  Reason: ${r.reason?.substring(0, 50)}...`);
        console.log(`  Target: ${r.type === 'post' ? `Post #${r.post_id}` : `Comment #${r.comment_id}`}`);
        console.log('');
      });
    }

    // 3. Check if there are pending reports
    console.log('📋 Checking pending reports...');
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    console.log(`✅ Pending reports: ${pendingReports}\n`);

    // 4. Check if there are admins to receive notifications
    console.log('👨‍💼 Checking admin users...');
    const admins = await User.findAll({ where: { role: 'admin' } });
    console.log(`✅ Total admins: ${admins.length}`);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`  - ${admin.username} (${admin.email})`);
      });
    } else {
      console.log('⚠️  No admin users found. Create an admin to receive notifications.');
    }
    console.log('');

    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testReports();
