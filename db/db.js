const sqlite3 = require('sqlite3').verbose();
console.log('This: ' + `${__dirname}\\..\\data\\migration.db`)

// Create a database instance
const db = new sqlite3.Database(`${__dirname}\\..\\data\\migration.db`);

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY,
      department STRING
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY,
      job STRING
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      name STRING,
      datetime STRING,
      department_id INTEGER,
      job_id INTEGER
    )
  `);
});

module.exports = db;
