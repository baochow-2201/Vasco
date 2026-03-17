const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reaction = sequelize.define("reactions", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: true },
  comment_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING(20) },
}, { timestamps: true, underscored: true });

module.exports = Reaction;
