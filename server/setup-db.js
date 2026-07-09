import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import util from 'util';
import { db, dbRun } from './db.js';

// così script restituisce un valore di tipo Promise invece di callback
const scrypt = util.promisify(crypto.scrypt);

// Setup del db
const setupDatabase = async () => {
  // Viene fatta pulizia delle tabella esistenti
  await dbRun(`DROP TABLE IF EXISTS statistics`);
  await dbRun(`DROP TABLE IF EXISTS tournaments`);
  await dbRun(`DROP TABLE IF EXISTS users`);

  // Viene creata la tabella degli utenti
  await dbRun(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

  // Viene creata la tabella dei tornei
  await dbRun(`
      CREATE TABLE tournaments (
        code TEXT PRIMARY KEY,
        creator_id INTEGER NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
        FOREIGN KEY (creator_id) REFERENCES users (id)
      )
    `);

  // Viene creata la tabella delle statistiche
  await dbRun(`
      CREATE TABLE statistics (
        user_id INTEGER NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
        played INTEGER DEFAULT 0 CHECK (played >= 0),
        won INTEGER DEFAULT 0 CHECK (won >= 0 AND won <= played),
        PRIMARY KEY (user_id, difficulty),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

  // Creiamo 3 utenti per popolare il database
  const users = [
    { username: 'user1', password: 'password' },
    { username: 'user2', password: 'password' },
    { username: 'user3', password: 'password' },
  ];

  // Inseriamo gli utenti nel database
  for (const u of users) {
    // sale da 16 byte in hex, poi hash con scrypt
    const salt = crypto.randomBytes(16).toString('hex');
    const hashBuffer = await scrypt(u.password, salt, 32);
    const hashHex = hashBuffer.toString('hex');
    const passwordToSave = `${salt}:${hashHex}`;

    await dbRun(`INSERT INTO users (username, password) VALUES (?, ?)`, [u.username, passwordToSave]);
  }

  // Inseriamo qualche statistica di prova
  await dbRun(`INSERT INTO statistics (user_id, difficulty, played, won) VALUES (1, 'EASY', 5, 3)`);
  await dbRun(`INSERT INTO statistics (user_id, difficulty, played, won) VALUES (1, 'MEDIUM', 2, 1)`);
  await dbRun(`INSERT INTO statistics (user_id, difficulty, played, won) VALUES (2, 'EASY', 10, 5)`);
  await dbRun(`INSERT INTO statistics (user_id, difficulty, played, won) VALUES (3, 'HARD', 1, 0)`);
  console.log("Database initialized with demo data.");
  db.close();

};

setupDatabase();
