const Sequelize = require("sequelize");
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:cheesecake@localhost:5432/postgres";
const db = new Sequelize(databaseUrl, { logging: false }); // to get rid of so many messages in console

db.sync({ force: true }) // dont delete data on sync
  .then(() => console.log("DB connected"));

module.exports = db;
