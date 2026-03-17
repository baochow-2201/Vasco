const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define("audit_logs", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  admin_id: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING(100) },
  target_id: { type: DataTypes.INTEGER },
  target_type: { type: DataTypes.STRING(50) },
  description: { type: DataTypes.TEXT },
}, { timestamps: true, underscored: true });

module.exports = AuditLog;
