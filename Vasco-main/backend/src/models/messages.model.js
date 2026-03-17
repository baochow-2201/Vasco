const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define("messages", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT },
  media_url: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true, underscored: true });

module.exports = Message;
