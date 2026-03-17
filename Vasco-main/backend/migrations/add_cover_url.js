// Migration to add cover_url column to user_profiles table
const sequelize = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('Starting migration: Adding cover_url to user_profiles table...');
    
    // Check if cover_url column already exists
    const result = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='user_profiles'",
      { type: QueryTypes.SELECT }
    );
    
    const existingColumns = result.map(r => r.column_name);
    
    if (!existingColumns.includes('cover_url')) {
      await sequelize.query('ALTER TABLE user_profiles ADD COLUMN cover_url TEXT');
      console.log('✓ Added cover_url column to user_profiles');
    } else {
      console.log('✓ cover_url column already exists in user_profiles');
    }
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
