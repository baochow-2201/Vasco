const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Friendship = sequelize.define("friendships", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user1_id: { type: DataTypes.INTEGER, allowNull: false },
  user2_id: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: true, underscored: true });

module.exports = Friendship;
