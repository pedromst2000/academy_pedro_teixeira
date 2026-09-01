// ---------------------------------------------COM A BASE DE DADOS DA EMPRESA---------------------------
// const mysql = require("mysql");
// const PORT = process.env.PORT || 3306;

// const db = mysql.createPool({
//   host: "185.118.114.199",
//   database: "phormuladev_academy",
//   user: "phormuladev_academy_user",
//   password: "6%JSdBxc[5IB,zgA",
//   port: PORT,
//   multipleStatements: true,
// });

// module.exports = db;

// ---------------------------------------------COM A BASE DE DADOS PESSOAL---------------------------


require("dotenv").config();
const mysql = require("mysql2");
const DB_PORT = process.env.DB_PORT || 3306;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: DB_PORT,
  multipleStatements: true,
});

module.exports = db;
