import { db, dbRun, dbGet, dbAll } from './db.js';
import { User, Stat, Tournament } from './Models.js';
import crypto from 'crypto';
import util from 'util';

const scrypt = util.promisify(crypto.scrypt);

// --- UTENTI ---

// Login
export const getUser = async (username, password) => {
  try {
    const row = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!row) return false;

    // Prendo id, username, sale e hash salvato
    const user = { id: row.id, username: row.username };
    const [salt, storedHash] = row.password.split(':');

    // Scrypt prende la pass inserita e la crittografa usando il sale estratto
    const hashBuffer = await scrypt(password, salt, 32);
    // Bufferizza l'hash salvato nel db
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    // Confronta i due hash impiegando lo stesso tempo
    if (crypto.timingSafeEqual(hashBuffer, storedHashBuffer)) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

// Recupero di un utente a partire dal suo ID
export const getUserById = async (id) => {
  try {
    const row = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return { error: 'User not found.' };
    return new User(row.id, row.username);
  } catch (err) {
    throw err; // o gestiscilo come preferisci
  }
};

// --- TORNEI ---

// Creazione torneo (codice torneo, id creatore e difficoltà)
export const createTournament = async (code, creatorId, difficulty) => {
  try {
    const sql = 'INSERT INTO tournaments (code, creator_id, difficulty) VALUES (?, ?, ?)';
    await dbRun(sql, [code, creatorId, difficulty]);
    return code;
  } catch (err) {
    throw err;
  }
};

// Recupero di un torneo tramite codice
export const getTournament = async (code) => {
  try {
    const sql = 'SELECT * FROM tournaments WHERE code = ?';
    const row = await dbGet(sql, [code]);
    if (!row) return { error: 'Tournament not found.' };
    return new Tournament(row.code, row.creator_id, row.difficulty);
  } catch (err) {
    throw err;
  }
};

// --- STATISTICHE ---

// Aggiorna statistiche
export const updateStatistics = async (userId, difficulty, isWin) => {
  const sql = `
    INSERT INTO statistics (user_id, difficulty, played, won)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, difficulty)
    DO UPDATE SET
      played = played + 1,
      won = won + ?
  `;
  const wonIncrement = isWin ? 1 : 0;
  try {
    await dbRun(sql, [userId, difficulty, wonIncrement, wonIncrement]);
    return true;
  } catch (err) {
    throw err;
  }
};

// Ottiene le statistiche pubbliche di tutti gli utenti
export const getPublicStatistics = async () => {
  const rows = await dbAll(`
    SELECT u.username, s.difficulty, s.played, s.won
    FROM statistics s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.difficulty, s.won DESC, s.played ASC
  `);

  return rows.map(r => ({
    username: r.username,
    difficulty: r.difficulty,
    played: r.played,
    won: r.won,
    percentage: r.played > 0 ? parseFloat(((r.won / r.played) * 100).toFixed(1)) : 0.0
  }));
};
