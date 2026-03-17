// Migration to add comment_id, type, and status fields to reports table
const sequelize = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    console.log('Starting migration: Adding comment_id, type, status to reports table...');
    
    // Check if columns already exist
    const result = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='reports'",
      { type: QueryTypes.SELECT }
    );
    
    const existingColumns = result.map(r => r.column_name);
    
    // Add comment_id if not exists
    if (!existingColumns.includes('comment_id')) {
      await sequelize.query('ALTER TABLE reports ADD COLUMN comment_id INTEGER');
      console.log('✓ Added comment_id column');
    } else {
      console.log('✓ comment_id column already exists');
    }
    
    // Add type if not exists
    if (!existingColumns.includes('type')) {
      await sequelize.query(
        `ALTER TABLE reports ADD COLUMN type VARCHAR(50) DEFAULT 'post' CHECK (type IN ('post', 'comment'))`
      );
      console.log('✓ Added type column');
    } else {
      console.log('✓ type column already exists');
    }
    
    // Add status if not exists
    if (!existingColumns.includes('status')) {
      await sequelize.query(
        `ALTER TABLE reports ADD COLUMN status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed'))`
      );
      console.log('✓ Added status column');
    } else {
      console.log('✓ status column already exists');
    }
    
    // Add foreign key for comment_id if not exists
    try {
      await sequelize.query(
        'ALTER TABLE reports ADD CONSTRAINT fk_reports_comment_id FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL'
      );
      console.log('✓ Added foreign key for comment_id');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✓ Foreign key for comment_id already exists');
      } else {
        console.error('Error adding foreign key:', err.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
