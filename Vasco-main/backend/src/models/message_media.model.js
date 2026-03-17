const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageMedia = sequelize.define("message_media", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message_id: { type: DataTypes.INTEGER, allowNull: false },
  media_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true, underscored: true });

module.exports = MessageMedia;
