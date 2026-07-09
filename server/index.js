import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { check, validationResult } from 'express-validator';
import * as dao from './dao.js';
import { generateBoard, fireTorpedo } from './game-engine.js';

// Setup Express
const app = express();
const port = 3001;

app.use(morgan('dev'));
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

// Le partite vengono salvate nella ram con un oggetto Map
const activeMatches = new Map();

// Genera una chiave unica a cui associare una partita
const getMatchKey = (req) => {
    return req.isAuthenticated() ? `user:${req.user.id}` : `session:${req.session.id}`;
};

// --- SETUP PASSPORT & SESSION  ---
// Funzione di login
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await dao.getUser(username, password);
            if (user) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Username o password errati.' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

// Manda il cookie di sessione dell'utente
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Recupera l'utente basandosi sul cookie
passport.deserializeUser(async (id, done) => {
    try {
        const user = await dao.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Configurazione express-session
app.use(session({
    secret: 'segreto_battaglia_navale_aw1_2026', // Genera una firma matematica unica
    resave: false,
    saveUninitialized: true, // Per generare il cookie anche ai visitatori
    cookie: { secure: false } // False per sviluppo locale su HTTP
}));

// Inizializzazione passport e session
app.use(passport.initialize());
app.use(passport.session());

// Custom Middleware per rotte protette
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ error: 'Non autenticato' });
};

const isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    return res.status(403).json({ error: 'Le partite casuali sono riservate agli utenti non autenticati' });
};

// --- API AUTH ---

// Verifica sessione
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json(req.user);
    } else {
        res.status(401).json({ error: 'Non autenticato' });
    }
});

// Login
app.post('/api/sessions', [
    check('username').isString().notEmpty(),
    check('password').isString().notEmpty()
], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    // 'local' -> LocalStrategy
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            // Errore di login
            return res.status(401).json({ error: info.message });
        }
        // req.login -> serializeUser
        req.login(user, (err) => {
            if (err)
                return next(err);

            // Restituisce utente come json al frontend
            return res.json(req.user);
        });
    })(req, res, next);
});

// Logout
app.delete('/api/sessions/current', (req, res) => {
    // Rimuoviamo la partita se l'utente era in gioco
    const key = getMatchKey(req);
    if (activeMatches.has(key)) {
        activeMatches.delete(key);
    }

    req.logout(() => {
        res.end();
    });
});

// --- API GAME ---

// Inizia partita casuale (solo ospiti)
app.post('/api/match/casual', isNotLoggedIn, [
    check('difficulty').isIn(['EASY', 'MEDIUM', 'HARD'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
        const key = getMatchKey(req);
        let matchState = activeMatches.get(key);

        // Idempotenza per StrictMode: se c'è già una partita casuale intonsa, la restituisce senza sovrascriverla
        if (matchState && matchState.type === 'casual' && matchState.difficulty === req.body.difficulty && matchState.shots.length === 0) {
            return res.status(200).json({
                size: matchState.size,
                maxTorpedoes: matchState.maxTorpedoes,
                torpedoesFired: 0,
                shots: []
            });
        }
        const board = generateBoard(req.body.difficulty);

        // Partita
        matchState = {
            type: 'casual',
            difficulty: req.body.difficulty,
            ...board,
            shots: [],
            torpedoesFired: 0,
            gameOver: false,
            won: false
        };

        // Partita aggiunta a quelle attive
        activeMatches.set(key, matchState);

        // Spediamo solo le info necessarie
        res.status(201).json({
            size: matchState.size,
            maxTorpedoes: matchState.maxTorpedoes,
            torpedoesFired: 0,
            shots: []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Creazione torneo
app.post('/api/tournaments', isLoggedIn, [
    check('difficulty').isIn(['EASY', 'MEDIUM', 'HARD'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
        // Genera codice alfanumerico di 6 caratteri
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Creiamo torneo con codice + info ottenute
        await dao.createTournament(code, req.user.id, req.body.difficulty);
        // Restituiamo il codice e difficoltà
        res.status(201).json({ code, difficulty: req.body.difficulty });
    } catch (e) {
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Partecipazione torneo
app.post('/api/match/tournament/:code', isLoggedIn, [
    check('code').isAlphanumeric().isLength({ min: 6, max: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    try {
        const key = getMatchKey(req);
        let matchState = activeMatches.get(key);

        // Idempotenza per StrictMode
        if (matchState && matchState.type === 'tournament' && matchState.tournamentCode === req.params.code && matchState.shots.length === 0) {
            return res.status(200).json({
                size: matchState.size,
                maxTorpedoes: matchState.maxTorpedoes,
                torpedoesFired: 0,
                shots: [],
                difficulty: matchState.difficulty
            });
        }
        // Proviamo a farci restituire il torneo cercato
        const tournament = await dao.getTournament(req.params.code);
        if (tournament.error) return res.status(404).json(tournament);

        // Genera la board usando anche il codice del torneo come seed
        const board = generateBoard(tournament.difficulty, tournament.code);

        // Partita
        matchState = {
            type: 'tournament',
            difficulty: tournament.difficulty,
            tournamentCode: tournament.code,
            ...board,
            shots: [],
            torpedoesFired: 0,
            gameOver: false,
            won: false
        };

        // Aggiunge la partita a quelle attive
        activeMatches.set(key, matchState);

        // Serve restituisce al client il json
        res.status(201).json({
            size: matchState.size,
            maxTorpedoes: matchState.maxTorpedoes,
            torpedoesFired: 0,
            shots: [],
            difficulty: tournament.difficulty
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Sparo dei siluri
app.post('/api/match/fire', [
    check('row').isInt({ min: 0 }),
    check('col').isInt({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    // Prende il session ID o l'user ID
    const key = getMatchKey(req);
    // Cerca la partita con quell'id tra quelle attive
    const matchState = activeMatches.get(key);

    if (!matchState) {
        return res.status(404).json({ error: 'Nessuna partita in corso trovata. Forse è scaduta?' });
    }

    if (matchState.gameOver) {
        return res.status(400).json({ error: 'La partita è già terminata.' });
    }

    // Estratti i numeri di riga e colonna
    const { row, col } = req.body;

    // Controlliamo i confini
    if (row >= matchState.size || col >= matchState.size) {
        return res.status(422).json({ error: 'Coordinate fuori dai confini.' });
    }

    // Proviamo a sparare il siluro
    const fireResult = fireTorpedo(matchState, row, col);

    if (fireResult.error) {
        return res.status(400).json(fireResult);
    }

    // Verifica se partita conclusa
    if (matchState.gameOver) {
        if (matchState.type === 'tournament' && req.isAuthenticated()) {
            // Aggiorna statistiche
            await dao.updateStatistics(req.user.id, matchState.difficulty, matchState.won);
        }

        // Cancelliamo il match
        activeMatches.delete(key);
    }

    // Inviamo risultato colpo e, se partita finita, posizioni navi
    res.json(fireResult);
});

// --- API STATISTICS ---

// Classifica (pubblica)
app.get('/api/statistics', async (req, res) => {
    try {
        // Server contatta DAO
        const stats = await dao.getPublicStatistics();
        // Restituiamo il JSON della classifica
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || 'Errore interno del server' });
});

// Avvio server
app.listen(port, () => {
    console.log(`API server started at http://localhost:${port}`);
});