const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PostMedia = sequelize.define("post_media", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  media_id: { type: DataTypes.INTEGER, allowNull: false },
  order_index: { type: DataTypes.INTEGER },
}, { timestamps: true, underscored: true });

module.exports = PostMedia;
