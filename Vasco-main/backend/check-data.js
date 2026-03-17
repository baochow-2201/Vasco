/**
 * Script to check data in user_profiles and posts
 */

const sequelize = require('./src/config/database');
const { User, UserProfile, Post } = require('./src/models');

async function checkData() {
  try {
    console.log('🔍 Kiểm tra dữ liệu...\n');

    // Check users
    const users = await User.findAll({
      include: UserProfile,
      limit: 5
    });
    console.log('📊 Users (max 5):');
    console.log(JSON.stringify(users, null, 2));

    console.log('\n' + '='.repeat(80) + '\n');

    // Check user_profiles
    const profiles = await UserProfile.findAll({
      limit: 5
    });
    console.log('📋 User Profiles (max 5):');
    console.log(JSON.stringify(profiles, null, 2));

    console.log('\n' + '='.repeat(80) + '\n');

    // Check posts with User and UserProfile
    const posts = await Post.findAll({
      include: {
        model: User,
        include: UserProfile
      },
      limit: 3
    });
    console.log('📝 Posts with User & UserProfile (max 3):');
    console.log(JSON.stringify(posts, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkData();
