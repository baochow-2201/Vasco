const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("users", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  username: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  full_name: { type: DataTypes.STRING(100), allowNull: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(20), defaultValue: "user" },
  status: { type: DataTypes.STRING(20), defaultValue: "active" },
  last_active: { type: DataTypes.DATE, allowNull: true, defaultValue: () => new Date() },
}, { timestamps: true, underscored: true });

module.exports = User;
