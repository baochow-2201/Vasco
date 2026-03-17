// Script to add media_url column to messages table
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function addMediaUrlColumn() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Add media_url column if it doesn't exist
    console.log('📝 Adding media_url column to messages table...');
    await sequelize.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS media_url VARCHAR(500);
    `);
    console.log('✅ media_url column added successfully');

    // Verify the column was added
    const result = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'media_url';
    `);
    
    if (result[0].length > 0) {
      console.log('✅ Column verified:', result[0][0]);
    }

    await sequelize.close();
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

addMediaUrlColumn();
