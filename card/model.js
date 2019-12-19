const Sequelize = require("sequelize");
const db = require("../db");

const Card = db.define("card", {
  cardObject: Sequelize.JSON
});

module.exports = Card;
