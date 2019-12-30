const Sequelize = require("sequelize");
const db = require("../db");
const User = require("../user/model");
const Card = require("../card/model");
const Room = db.define("room", {
  name: Sequelize.STRING,
  maxPlayers: {
    type: Sequelize.INTEGER,
    validate: {
      min: 2,
      max: 4
    }
  },
  phase: {
    type: Sequelize.ENUM("waiting", "ready", "started", "finished"),
    defaultValue: "waiting"
  },
  turn: Sequelize.INTEGER,
  passed: { type: Sequelize.INTEGER, defaultValue: null },
  score: Sequelize.JSON
});

User.belongsTo(Room);
Room.hasMany(User, {
  allowNull: true
});
Card.belongsTo(User);
Card.belongsTo(Room);

Room.hasMany(Card);
User.hasMany(Card);
module.exports = Room;
