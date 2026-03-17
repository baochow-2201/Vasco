const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Media = sequelize.define("media", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  public_id: { type: DataTypes.STRING(200) },
  url: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING(20) },
  format: { type: DataTypes.STRING(10) },
  width: { type: DataTypes.INTEGER },
  height: { type: DataTypes.INTEGER },
  duration: { type: DataTypes.FLOAT },
}, { timestamps: true, underscored: true });

module.exports = Media;
