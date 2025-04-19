const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',  // Replace with your MySQL username
  password: 'Sahithi@07',  // Replace with your MySQL password
  database: 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();

// Export the pool to be used in other modules
module.exports = pool;