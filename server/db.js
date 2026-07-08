import sqlite3 from 'sqlite3';

// Connessione con il database
export const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.');
});

// Helper per "promisificare" db.run (INSERT, UPDATE e DELETE)
export const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

// Promise per restituire la riga corrispondente
export const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Promise per restituire tutte le righe corrispondenti
export const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});