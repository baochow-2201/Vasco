const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comment = sequelize.define("comments", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT },
  is_hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true, underscored: true });

module.exports = Comment;
