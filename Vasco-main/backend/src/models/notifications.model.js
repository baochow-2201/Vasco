const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define("notifications", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(50) },
  message: { type: DataTypes.TEXT },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  source_id: { type: DataTypes.INTEGER },
  source_type: { type: DataTypes.STRING(50) },
}, { timestamps: true, underscored: true });

module.exports = Notification;
