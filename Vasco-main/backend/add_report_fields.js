#!/usr/bin/env node

// Simple script to add missing columns to reports table
const path = require('path');
const sequelize = require(path.join(__dirname, 'src/config/database'));

async function migrate() {
  try {
    console.log('🔄 Starting migration: Adding fields to reports table...\n');
    
    // Add comment_id column
    try {
      await sequelize.query('ALTER TABLE reports ADD COLUMN comment_id INTEGER');
      console.log('✅ Added comment_id column');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('⏭️  comment_id column already exists');
      } else {
        console.error('❌ Error adding comment_id:', err.message);
      }
    }
    
    // Add type column
    try {
      await sequelize.query(`ALTER TABLE reports ADD COLUMN type VARCHAR(50) DEFAULT 'post'`);
      console.log('✅ Added type column');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('⏭️  type column already exists');
      } else {
        console.error('❌ Error adding type:', err.message);
      }
    }
    
    // Add status column
    try {
      await sequelize.query(`ALTER TABLE reports ADD COLUMN status VARCHAR(50) DEFAULT 'pending'`);
      console.log('✅ Added status column');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('⏭️  status column already exists');
      } else {
        console.error('❌ Error adding status:', err.message);
      }
    }
    
    // Add foreign key for comment_id
    try {
      await sequelize.query(`ALTER TABLE reports ADD CONSTRAINT fk_reports_comment_id FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL`);
      console.log('✅ Added foreign key for comment_id');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('⏭️  Foreign key already exists');
      } else {
        console.error('⚠️  Error adding foreign key:', err.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

migrate();
