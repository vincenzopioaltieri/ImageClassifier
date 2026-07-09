// --- MODELLI DATI ---

// Modello per l'utente loggato
export class User {
    constructor(id, username) {
        this.id = id;
        this.username = username;
    }
}

// Modello per lo stato della partita corrente (sia frontend che backend)
export class MatchState {
    constructor(size, maxTorpedoes, torpedoesFired, shots, difficulty, gameOver = false, won = false, solutionGrid = null) {
        this.size = size;
        this.maxTorpedoes = maxTorpedoes;
        this.torpedoesFired = torpedoesFired;
        this.shots = shots;
        this.difficulty = difficulty;
        this.gameOver = gameOver;
        this.won = won;
        this.solutionGrid = solutionGrid;
    }
}

// Modello per le statistiche di un singolo giocatore
export class Stat {
    constructor(username, difficulty, played, won, percentage) {
        this.username = username;
        this.difficulty = difficulty;
        this.played = played;
        this.won = won;
        this.percentage = percentage;
    }
}
