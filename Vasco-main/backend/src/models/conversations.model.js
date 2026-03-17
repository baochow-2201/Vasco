const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Conversation = sequelize.define("conversations", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100) },
  is_group: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true, underscored: true });

module.exports = Conversation;
