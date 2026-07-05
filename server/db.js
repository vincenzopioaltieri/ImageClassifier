import sqlite3 from 'sqlite3';

// Connessione con il database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) throw err;
});

export default db;
