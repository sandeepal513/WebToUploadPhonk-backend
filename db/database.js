const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log(`⚡ Connected to Aiven MySQL Cloud: ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT} / ${process.env.MYSQL_DATABASE || 'defaultdb'}`);
    connection.release();

    // Ensure tables exist
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const statements = sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const stmt of statements) {
        await pool.query(stmt);
      }
      console.log('✅ MySQL tables verified & synchronized successfully!');
    }
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  connectDB,
};
