const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserProfile = sequelize.define("user_profiles", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  full_name: { type: DataTypes.STRING(100) },
  avatar_url: { type: DataTypes.TEXT },
  cover_url: { type: DataTypes.TEXT },
  bio: { type: DataTypes.TEXT },
  major: { type: DataTypes.STRING(100) },
  class_name: { type: DataTypes.STRING(50) },
}, { timestamps: true, underscored: true });

module.exports = UserProfile;
