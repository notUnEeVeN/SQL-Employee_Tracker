const mysql = require('mysql2');

function initializeDatabase(callback) {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'employee_management'
  }, (err, result) => {
    if (err) return callback(err);
    callback(null, connection);
  });
}

module.exports = initializeDatabase;