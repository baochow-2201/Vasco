const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FriendRequest = sequelize.define("friend_requests", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  requester_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(20), defaultValue: "pending" },
}, { timestamps: true, underscored: true });

module.exports = FriendRequest;
