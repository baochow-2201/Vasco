// Migration: Add last_active column to users table
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

async function migrate() {
  try {
    console.log("🔄 Starting migration: Adding last_active to users table...");
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if column exists
    const tableDescription = await queryInterface.describeTable("users");
    
    if (tableDescription.last_active) {
      console.log("✓ Column 'last_active' already exists");
      process.exit(0);
      return;
    }
    
    // Add column
    await queryInterface.addColumn("users", "last_active", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: new Date(),
    });
    
    console.log("✓ Successfully added 'last_active' column to users table");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

migrate();
