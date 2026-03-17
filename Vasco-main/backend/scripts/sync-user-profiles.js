/**
 * Script to sync user data from users table to user_profiles table
 * Lấy thông tin từ bảng users và cập nhật vào user_profiles
 */

const sequelize = require('../src/config/database');
const { User, UserProfile } = require('../src/models');

async function syncUserProfiles() {
  try {
    console.log('🔄 Bắt đầu đồng bộ dữ liệu từ users sang user_profiles...\n');

    // Lấy tất cả users
    const users = await User.findAll();
    console.log(`📊 Tìm thấy ${users.length} người dùng`);

    let created = 0;
    let updated = 0;

    for (const user of users) {
      try {
        // Tìm profile hiện tại
        const existingProfile = await UserProfile.findOne({
          where: { user_id: user.id }
        });

        if (existingProfile) {
          // Cập nhật profile
          await existingProfile.update({
            full_name: user.full_name,
          });
          updated++;
          console.log(`✏️  Cập nhật: User ID ${user.id} - ${user.full_name}`);
        } else {
          // Tạo profile mới
          await UserProfile.create({
            user_id: user.id,
            full_name: user.full_name,
          });
          created++;
          console.log(`✨ Tạo mới: User ID ${user.id} - ${user.full_name}`);
        }
      } catch (err) {
        console.error(`❌ Lỗi với User ${user.id}:`, err.message);
      }
    }

    console.log(`\n✅ Hoàn thành!`);
    console.log(`📝 Tạo mới: ${created} record`);
    console.log(`📝 Cập nhật: ${updated} record`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
syncUserProfiles();
