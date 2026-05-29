// config/database.js
// Connects to MySQL using Sequelize ORM.
// Sequelize is like Mongoose but for SQL databases.

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // change to: logging: console.log  to see raw SQL queries
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully");
    await sequelize.sync({ alter: true }); // auto-creates/updates tables
    console.log("✅ All tables synced");
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };