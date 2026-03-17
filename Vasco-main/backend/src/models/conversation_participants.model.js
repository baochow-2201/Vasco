const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ConversationParticipant = sequelize.define("conversation_participants", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true, underscored: true });

module.exports = ConversationParticipant;
