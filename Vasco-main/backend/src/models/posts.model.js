const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Post = sequelize.define("posts", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT },
  is_hidden: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true, underscored: true });

module.exports = Post;
