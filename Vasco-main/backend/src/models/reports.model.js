const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Report = sequelize.define("reports", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reporter_id: { type: DataTypes.INTEGER },
  post_id: { type: DataTypes.INTEGER, allowNull: true },
  comment_id: { type: DataTypes.INTEGER, allowNull: true },
  reported_user_id: { type: DataTypes.INTEGER },
  reason: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('post', 'comment'), defaultValue: 'post' },
  status: { type: DataTypes.ENUM('pending', 'resolved', 'dismissed'), defaultValue: 'pending' },
}, { timestamps: true, underscored: true });

module.exports = Report;
