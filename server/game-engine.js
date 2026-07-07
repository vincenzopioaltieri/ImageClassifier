// Configurazione difficoltà 
const DIFFICULTY_CONFIG = {
    EASY: {
        size: 5,
        ships: [2, 2, 3, 4],
        maxTorpedoes: 10 // inizialmente 18 poi aggiornato
    },
    MEDIUM: {
        size: 10,
        ships: [2, 2, 2, 2, 3, 3, 4, 4],
        maxTorpedoes: 30 // prima era 35
    },
    HARD: {
        size: 15,
        ships: [2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4],
        maxTorpedoes: 50 // prima era 55
    }
};

// Semplice PRNG per seed deterministico
const mulberry32 = (a) => {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
};

// Funzione di hash stringa per produrre un seed intero 32bit
const xmur3 = (str) => {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
};

// Validazione del posizionamento
// grid = griglia,
// size = dimensione della griglia,
// r = coordinata riga,
// c = coordinata colonna,
// len = lunghezza nave
// isHorizontal == booleano per l'orientamento della nave
const isValidPlacement = (grid, size, r, c, len, isHorizontal) => {
    // Controllo dei bordi della griglia
    if (isHorizontal && c + len > size) return false;
    if (!isHorizontal && r + len > size) return false;

    // Controlla eventuali sovrapposizioni e adiacenze tra le navi
    const minR = Math.max(0, r - 1);
    const maxR = Math.min(size - 1, isHorizontal ? r + 1 : r + len);
    const minC = Math.max(0, c - 1);
    const maxC = Math.min(size - 1, isHorizontal ? c + len : c + 1);

    // Se le celle identificate contengono qualcosa allora la nave non può essere piazzata
    for (let i = minR; i <= maxR; i++) {
        for (let j = minC; j <= maxC; j++) {
            if (grid[i][j] !== null) return false;
        }
    }

    return true;
};

// Funzione generazione griglia
export const generateBoard = (difficulty, seedStr) => {
    // Se la difficoltà non è presente lancia eccezione
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) throw new Error("Invalid difficulty");

    // Se è stato passato un seme vengono usae le funzioni, altrimenti Math.random
    let rand = Math.random;
    if (seedStr) {
        const seed = xmur3(seedStr)();
        rand = mulberry32(seed);
    }

    // Funzione floor per convertire decimale in intero compreso tra 0 e max 
    const randomInt = (max) => Math.floor(rand() * max);

    // Salviamo le dimensioni del tabellone e inizializza la matrice
    const size = config.size;
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    // Array vuoto per navi posizionate
    const placedShips = [];

    // Da ad ogni nave una targa univoca
    let shipIdCounter = 0;

    // Si itera sull'array delle navi (flag = false)
    for (const len of config.ships) {
        let placed = false;
        let attempts = 0;

        // Ciclo di iterazione per posizionare la nave 
        while (!placed && attempts < 1000) {
            // Decide orientamento ed estrae a caso le coordinate iniziali (con limite size)
            const isHorizontal = rand() < 0.5;
            const r = randomInt(size);
            const c = randomInt(size);

            // Controlla se il posizionamento della nave è valido
            if (isValidPlacement(grid, size, r, c, len, isHorizontal)) {
                const shipId = shipIdCounter++;
                const cells = [];
                // Assegna l'id della nave ad ongi cella che viene occupata
                for (let i = 0; i < len; i++) {
                    const cellR = isHorizontal ? r : r + i;
                    const cellC = isHorizontal ? c + i : c;
                    grid[cellR][cellC] = shipId;
                    cells.push({ r: cellR, c: cellC });
                }
                // La nave viene salvata nell'array relativo
                placedShips.push({ id: shipId, cells, hits: 0, length: len });
                placed = true;
            }
            attempts++;
        }

        if (!placed) {
            // Se fallisce per troppi tentativi, cambiamo leggermente il seed iterando
            return generateBoard(difficulty, seedStr ? seedStr + attempts.toString() : Math.random().toString());
        }
    }

    // Viene restituita la griglia di gioco
    return {
        size,
        maxTorpedoes: config.maxTorpedoes,
        ships: placedShips,
        grid
    };
};

// Funzione lancio missile (stato match + coordinate)
export const fireTorpedo = (matchState, row, col) => {
    if (matchState.gameOver) return { error: "Partita già terminata." };

    // Controlliamo se ha già sparato lì o se ha finito i siluri
    const alreadyFired = matchState.shots.some(s => s.r === row && s.c === col);
    if (alreadyFired) {
        return { error: "Hai già sparato in questa cella." };
    }

    if (matchState.torpedoesFired >= matchState.maxTorpedoes) {
        return { error: "Siluri esauriti." };
    }

    // Legge l'id della nave sulla griglia
    const shipId = matchState.grid[row][col];
    let result = "miss";

    // Se è diverso da null aumenta il numero delle hit della nave
    if (shipId !== null) {
        const ship = matchState.ships.find(s => s.id === shipId);
        ship.hits++;
        // Se il numero di hit == alla lunghezza nave -> nave affondata
        result = ship.hits === ship.length ? "sunk" : "hit";
    } else {
        // Se non prendo il bersaglio consuma il siluro
        matchState.torpedoesFired++;
    }

    // Aggiunge il colpo ai colpi sparati della partita
    matchState.shots.push({ r: row, c: col, result });

    // Verifica GameOver
    const allSunk = matchState.ships.every(s => s.hits === s.length);
    const noMoreTorpedoes = matchState.torpedoesFired >= matchState.maxTorpedoes;

    if (allSunk || noMoreTorpedoes) {
        matchState.gameOver = true;
        matchState.won = allSunk; // si vince solo se tutte sono affondate
    }

    // Restituisce esito colpo + aggiornamento stato del gioco
    return {
        result,
        torpedoesFired: matchState.torpedoesFired,
        gameOver: matchState.gameOver,
        won: matchState.won,
        // Mandiamo la griglia reale solo se finita
        solutionGrid: matchState.gameOver ? matchState.grid : undefined
    };
};
