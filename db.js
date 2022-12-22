const { Sequelize } = require("sequelize");
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:secret@localhost:5432/game31";
const db = new Sequelize(databaseUrl, { logging: false }); // to get rid of so many messages in console

db.sync({ force: false }) // dont delete data on sync
  .then(() => console.log("DB connected"));

module.exports = db;
