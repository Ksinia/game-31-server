const Sequelize = require("sequelize");
const db = require("../db");

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

module.exports = Room;
