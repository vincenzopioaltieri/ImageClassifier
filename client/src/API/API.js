import { User, MatchState, Stat } from '../models/Models.js';

// URL centralizzato
const SERVER_URL = 'http://localhost:3001/api';

/**
 * Helper per il parsing delle response.
 * Resiliente a body vuoti (es. per il logout backend senza body)
 */
async function handleResponse(response) {
    if (response.ok) {
        // Leggiamo corpo della risposta
        const text = await response.text();
        // Se text contiene qualcosa lo trasformiamo in JSON, altrimenti restituiamo null
        return text ? JSON.parse(text) : null;
    } else {
        let errDetails;
        try {
            // Proviamo ad estrarre il corpo dell'errore
            errDetails = await response.json();
        } catch (e) {
            // Fallback se il backend torna stringa o HTML di errore
            throw new Error(`Errore di rete o server: ${response.status}`);
        }
        throw new Error(errDetails.error || 'Errore imprevisto lato server');
    }
}

// --- USER API's ---

// Login
async function logIn(username, password) {
    const response = await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
    });
    // Trasforma e restituisce un oggetto User partendo dal JSON
    const userJson = await handleResponse(response);
    return new User(userJson.id, userJson.username);
}

// Logout
async function logOut() {
    const response = await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    await handleResponse(response);
}

// Informazioni relative all'utente
async function getUserInfo() {
    const response = await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    });
    const userJson = await handleResponse(response);
    return new User(userJson.id, userJson.username);
}

// --- GAME APIs ---

// Inizia match casuale
async function startCasualMatch(difficulty) {
    const response = await fetch(SERVER_URL + '/match/casual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ difficulty })
    });
    const data = await handleResponse(response);
    return new MatchState(data.size, data.maxTorpedoes, data.torpedoesFired, data.shots, difficulty);
}

// Crea torneo
async function createTournament(difficulty) {
    const response = await fetch(SERVER_URL + '/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ difficulty })
    });
    return await handleResponse(response); // Restituisce { code, difficulty }
}

// Partecipa ad un torneo
async function joinTournament(code) {
    const response = await fetch(SERVER_URL + '/match/tournament/' + code, {
        method: 'POST',
        credentials: 'include'
    });
    const data = await handleResponse(response);
    return new MatchState(data.size, data.maxTorpedoes, data.torpedoesFired, data.shots, data.difficulty);
}

// Spara siluro
async function fireTorpedo(row, col) {
    const response = await fetch(SERVER_URL + '/match/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ row, col })
    });
    return await handleResponse(response);
}

// --- STATS APIs ---

// Restituisce statistiche
async function getStats() {
    const response = await fetch(SERVER_URL + '/statistics', {
        credentials: 'include'
    });
    const statsJson = await handleResponse(response);
    // map perché ogni elemento dell'array viene convertito in un'istanza di Stat
    return statsJson.map(s => new Stat(s.username, s.difficulty, s.played, s.won, s.percentage));
}

// Impacchettiamo ed esportiamo le funzioni
const API = {
    logIn,
    logOut,
    getUserInfo,
    startCasualMatch,
    createTournament,
    joinTournament,
    fireTorpedo,
    getStats
};
export default API;
