const Sequelize = require("sequelize");
const db = require("../db");
const User = require("../user/model");

const Room = db.define("room", {
  name: Sequelize.STRING,
  maxPlayers: {
    type: Sequelize.INTEGER,
    validate: {
      min: 2,
      max: 4
    }
  }
});

User.belongsTo(Room);
Room.hasMany(User, {
  allowNull: true
});
module.exports = Room;
