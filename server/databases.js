const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password'
});

connection.connect((err) => {
  if (err) {
    console.error('Error in connection:', err);
    return;
  }
  console.log('Connected to MySQL!');
  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
    } else {
      console.log('Databases you can access:');
      results.forEach(db => console.log(db.Database));
    }
    connection.end();
  });
});

