const Sequelize = require("sequelize");
const db = require("../db");
const User = require("../user/model");
const Room = require("../room/model");

const Card = db.define("card", {
  cardObject: Sequelize.JSON
});

module.exports = Card;
