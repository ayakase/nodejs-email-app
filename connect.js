const mysql = require('mysql2');
// Kết nối với database 
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'wpr',
  password: 'fit2023',
  database: 'wpr2023',
});

module.exports = connection;
