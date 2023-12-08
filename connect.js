const mysql = require('mysql2');

function establishConnection() {
  const connection = mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'wpr2023',
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL: ', err);
    } else {
      console.log('Connected to MySQL!');
    }
  });

  connection.on('error', (err) => {
    console.error('MySQL Connection Error: ', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      // Retry after a delay (e.g., 5 seconds)
      setTimeout(establishConnection, 5000); // Retry after 5 seconds
    } else {
      throw err;
    }
  });

  return connection;
}

const connection = establishConnection();
module.exports = connection;
