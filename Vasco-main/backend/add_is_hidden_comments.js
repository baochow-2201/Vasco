#!/usr/bin/env node

// Migration script to add is_hidden column to comments table
const path = require('path');
const sequelize = require(path.join(__dirname, 'src/config/database'));
const { QueryInterface } = require('sequelize');

async function migrate() {
  try {
    console.log('🔄 Starting migration: Add is_hidden to comments table\n');

    // Check if column already exists
    const columns = await sequelize.queryInterface.describeTable('comments');
    
    if (columns.is_hidden) {
      console.log('✅ Column is_hidden already exists in comments table');
      process.exit(0);
    }

    // Add the column
    await sequelize.queryInterface.addColumn('comments', 'is_hidden', {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    console.log('✅ Added is_hidden column to comments table');
    console.log('✅ Default value: false');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
