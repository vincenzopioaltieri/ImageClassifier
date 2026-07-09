// --- VISTE DELL'APPLICAZIONE (Pagine) ---

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { LoginForm } from './AuthComponents';
import { Board, MatchInfo } from './GameComponents';
import API from '../API/API';

// --- VISTA HOME ---

export function HomeRoute(props) {
    // A seconda di loggedIn cambia l'interfaccia (Ospite vs Utente loggato)
    const { loggedIn } = props;
    // Funzione navigate per i redirect
    const navigate = useNavigate();

    // Stati locali per la gestione dei Tornei
    const [tournDifficulty, setTournDifficulty] = useState('MEDIUM');
    const [generatedCode, setGeneratedCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [tournError, setTournError] = useState('');
    const [creating, setCreating] = useState(false);

    // Gestore avvio partita casuale
    const startCasual = (difficulty) => {
        // Modifica URL, la route GameRoute farà il resto
        navigate(`/casual/${difficulty}`);
    };

    // Gestore creazione torneo (solo loggati)
    const handleCreateTournament = async () => {
        setTournError('');
        // Setto lo stato di caricamento per lo spinner
        setCreating(true);
        try {
            const result = await API.createTournament(tournDifficulty);
            // Salva il codice del torneo generato in generatedCode per mostrarlo a schermo
            setGeneratedCode(result.code);
        } catch (err) {
            // Gestione errore di connessione col server
            if (err.message.includes("fetch")) {
                setTournError("Impossibile contattare il server. Verifica che il backend sia in esecuzione.");
            } else {
                setTournError(err.message);
            }
        } finally {
            // Spegne spinner
            setCreating(false);
        }
    };

    // Gestore partecipazione a torneo
    const handleJoinTournament = (e) => {
        // Fermiamo il submit del form HTML per evitare ricaricamenti di pagina
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        
        // Validazione regex lato client: solo 6 caratteri alfanumerici
        if (/^[A-Z0-9]{6}$/.test(code)) {
            navigate(`/tournament/${code}`);
        } else {
            setTournError('Codice torneo non valido.');
        }
    };

    return (
        <Row className="justify-content-center">
            <Col md={12} lg={10}>

                {/* Hero Section */}
                <div className="bg-white rounded-4 shadow-sm border-0 p-5 mb-5 text-center">
                    <h1 className="fw-bold text-primary mb-3">⚓ Battaglia Navale</h1>
                    <p className="lead text-muted mb-0">Affonda la flotta nemica prima di finire i siluri!</p>
                </div>

                <Row className="g-4">
                    {/* Sezione Casuale */}
                    <Col md={6}>
                        <Card className="shadow-sm text-center h-100 border-0 rounded-4">
                            <Card.Body className="p-4 p-md-5 d-flex flex-column justify-content-center">
                                <Card.Title className="fw-bold fs-4 text-primary mb-3">Partita Casuale</Card.Title>
                                <Card.Text className="text-muted mb-4">Gioca subito in singolo, nessuna registrazione richiesta.</Card.Text>
                                
                                {/* Mostra i pulsanti di difficoltà se ospite, altrimenti mostra l'avviso */}
                                {!loggedIn ? (
                                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-auto">
                                        <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => startCasual('EASY')}>EASY</Button>
                                        <Button variant="warning" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => startCasual('MEDIUM')}>MEDIUM</Button>
                                        <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => startCasual('HARD')}>HARD</Button>
                                    </div>
                                ) : (
                                    <div className="text-center mt-auto">
                                        <Alert variant="info" className="rounded-4 border-0 shadow-sm mb-0">
                                            Le partite casuali sono riservate agli ospiti.
                                        </Alert>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Sezione Torneo */}
                    <Col md={6}>
                        <Card className="shadow-sm h-100 border-0 rounded-4">
                            <Card.Body className="p-4 p-md-5 d-flex flex-column justify-content-center">
                                <Card.Title className="text-center fw-bold fs-4 text-primary mb-3">Tornei</Card.Title>

                                {/* Blocco Ospite: invio al Login */}
                                {!loggedIn ? (
                                    <div className="text-center mt-3">
                                        <Card.Text className="text-muted mb-3">Partecipa a sfide alla pari o crea il tuo torneo.</Card.Text>
                                        <Alert variant="warning" className="rounded-4 border-0 shadow-sm">Devi effettuare il login per i tornei.</Alert>
                                        <Button as={Link} to="/login" variant="primary" className="rounded-pill px-4 fw-bold shadow-sm mt-2">Vai al Login</Button>
                                    </div>
                                ) : (
                                    // Blocco Autenticato: creazione e unione tornei
                                    <>
                                        {tournError && <Alert variant="danger" className="p-3 text-center rounded-4 border-0 shadow-sm">{tournError}</Alert>}

                                        {/* CREAZIONE */}
                                        <div className="mb-4 pb-4 border-bottom border-light">
                                            <h6 className="text-muted text-center mb-3 text-uppercase fw-medium fs-6">Crea nuovo torneo</h6>
                                            {!generatedCode ? (
                                                <div className="d-flex gap-2">
                                                    <select
                                                        className="form-select rounded-pill shadow-none px-3"
                                                        value={tournDifficulty}
                                                        onChange={e => setTournDifficulty(e.target.value)}
                                                    >
                                                        <option value="EASY">EASY</option>
                                                        <option value="MEDIUM">MEDIUM</option>
                                                        <option value="HARD">HARD</option>
                                                    </select>
                                                    <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleCreateTournament} disabled={creating}>
                                                        {creating ? <Spinner size="sm" animation="border" /> : 'Crea'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                // Mostra il codice generato pronto per essere giocato
                                                <Alert variant="success" className="text-center p-3 mb-0 rounded-4 border-0 shadow-sm">
                                                    Codice: <strong className="fs-5">{generatedCode}</strong>
                                                    <div className="mt-3">
                                                        <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate(`/tournament/${generatedCode}`)}>
                                                            Gioca Ora
                                                        </Button>
                                                    </div>
                                                </Alert>
                                            )}
                                        </div>

                                        {/* PARTECIPAZIONE */}
                                        <div className="mt-auto">
                                            <h6 className="text-muted text-center mb-3 text-uppercase fw-medium fs-6">Partecipa a un torneo</h6>
                                            <form onSubmit={handleJoinTournament} className="d-flex gap-2">
                                                <input
                                                    type="text"
                                                    className="form-control text-uppercase rounded-pill shadow-none px-3"
                                                    placeholder="Codice torneo..."
                                                    value={joinCode}
                                                    onChange={e => setJoinCode(e.target.value)}
                                                    required
                                                />
                                                <Button variant="outline-primary" type="submit" className="rounded-pill px-4 fw-bold">
                                                    Entra
                                                </Button>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

// --- VISTA LOGIN ---

export function LoginRoute(props) {
    const location = useLocation();
    // Se proveniamo da una route protetta (es. si prova a entrare in un torneo senza sessione)
    const message = location.state?.fromProtectedRoute ? "Effettua il login per accedere al torneo." : "";

    return (
        <Row className="justify-content-center">
            <Col md={6} lg={4}>
                <LoginForm onLogin={props.onLogin} message={message} />
            </Col>
        </Row>
    );
}

// --- VISTA GIOCO (Casuale o Torneo) ---

export function GameRoute(props) {

    // modalita' passata dal parent (App.jsx)
    const { mode } = props;
    const { difficulty, code } = useParams();
    const navigate = useNavigate();

    // Stati locali della partita e dell'interfaccia
    const [matchState, setMatchState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Validation: se manca il parametro obbligatorio, torniamo alla home
        const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
        if (mode === 'casual' && (!difficulty || !validDifficulties.includes(difficulty))) {
            navigate('/', { replace: true });
            return;
        }
        if (mode === 'tournament' && !code) {
            navigate('/', { replace: true });
            return;
        }

        // Funzione per inizializzare o recuperare il match dal backend
        const initMatch = async () => {
            try {
                let initialMatch;
                if (mode === 'casual') {
                    initialMatch = await API.startCasualMatch(difficulty);
                } else if (mode === 'tournament') {
                    initialMatch = await API.joinTournament(code);
                }
                setMatchState(initialMatch);
            } catch (err) {
                // Gestione down del server
                if (err.message.includes("fetch")) {
                    setErrorMsg("Impossibile contattare il server. Verifica che il backend sia in esecuzione.");
                } else {
                    setErrorMsg(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        initMatch();
    }, [mode, difficulty, code, navigate]);

    // 1. Estraiamo le dipendenze stabili per evitare null pointer
    const shots = matchState?.shots || [];
    const solutionGrid = matchState?.solutionGrid || null;
    const size = matchState?.size || 0;

    // 2. Costruiamo la cellStatusMap completa per la Board ad ogni render
    // Rimosso useMemo in ottemperanza ai vincoli di AW1. Le performance sono trascurabili.
    const cellStatusMap = (() => {
        const map = new Map();

        // Prima mappiamo i colpi esplosi dall'utente
        for (let s of shots) {
            map.set(`${s.r}-${s.c}`, s.result);
        }

        // Se c'è la solutionGrid (cioè a fine partita), sovrascriviamo le celle delle navi non colpite per renderle visibili
        if (solutionGrid) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const key = `${r}-${c}`;
                    if (solutionGrid[r][c] !== null && !map.has(key)) {
                        map.set(key, "ship");
                    }
                }
            }
        }

        return map;
    })();

    // Gestore per il click su una cella della griglia
    const handleCellClick = async (row, col) => {
        // Ignoriamo i click se stiamo già caricando un'azione o se la partita è finita
        if (actionLoading || matchState.gameOver) return;

        try {
            setActionLoading(true);
            setErrorMsg('');
            const shotResult = await API.fireTorpedo(row, col);

            // Nota backend: API.fireTorpedo restituisce il singolo esito, non l'intero array shots.
            // Pertanto, dobbiamo aggiornare l'array locale unendo il nuovo colpo al precedente state.
            setMatchState(prev => ({
                ...prev,
                torpedoesFired: shotResult.torpedoesFired,
                shots: [...prev.shots, { r: row, c: col, result: shotResult.result }],
                gameOver: shotResult.gameOver,
                won: shotResult.won,
                solutionGrid: shotResult.solutionGrid || null
            }));
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Render loading iniziale
    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Avvio partita...</div>;
    }

    // Render errore critico fatale all'avvio
    if (!matchState) {
        return (
            <Alert variant="danger" className="text-center mt-5">
                <p>{errorMsg || "Impossibile avviare la partita."}</p>
                <Button variant="outline-danger" onClick={() => navigate('/')}>
                    Torna alla Home
                </Button>
            </Alert>
        );
    }

    return (
        <Row className="justify-content-center">
            <Col lg={8}>
                {/* Visualizza errori interattivi (es. "Hai già sparato in questa cella") */}
                {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

                <MatchInfo matchState={matchState} mode={mode} code={code} />

                {/* Opacizza la griglia durante il caricamento del colpo (feedback visivo per l'utente) */}
                <div className={actionLoading ? 'opacity-75' : ''}>
                    <Board
                        size={matchState.size}
                        cellStatusMap={cellStatusMap}
                        onCellClick={handleCellClick}
                        disabled={matchState.gameOver || actionLoading}
                    />
                </div>
            </Col>
        </Row>
    );
}

// --- VISTA CLASSIFICHE GLOBALI ---

export function StatsRoute() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Recupera i dati dal server per comporre la classifica
        API.getStats()
            .then(data => setStats(data))
            .catch(err => {
                // Gestione down del server
                if (err.message.includes('fetch')) {
                    setErrorMsg('Impossibile contattare il server. Verifica che il backend sia in esecuzione.');
                } else {
                    setErrorMsg(err.message);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    // Render in attesa del backend
    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    }

    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <h2 className="mb-4 text-primary fw-bold text-center">🏆 Classifica Globale</h2>
                
                {/* Messaggio di errore, altrimenti Tabella */}
                {errorMsg && <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{errorMsg}</Alert>}

                {!errorMsg && stats.length === 0 ? (
                    <Alert variant="info" className="rounded-4 border-0 shadow-sm text-center">Nessuna statistica presente. Gioca un torneo!</Alert>
                ) : (
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Table hover responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6">Giocatore</th>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6">Difficoltà</th>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6 text-center">Giocate</th>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6 text-center">Vinte</th>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6 text-center">Perse</th>
                                    <th className="py-3 px-4 text-uppercase text-muted fs-6 text-center">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => (
                                    <tr key={`${s.username}-${s.difficulty}`}>
                                        <td className="py-3 px-4 fw-medium text-primary">{s.username}</td>
                                        <td className="py-3 px-4"><Badge bg="info" text="dark" className="rounded-pill">{s.difficulty}</Badge></td>
                                        <td className="py-3 px-4 text-center">{s.played}</td>
                                        <td className="py-3 px-4 text-center text-success fw-bold">{s.won}</td>
                                        <td className="py-3 px-4 text-center text-danger fw-bold">{s.played - s.won}</td>
                                        <td className="py-3 px-4 text-center fw-bold">{s.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}
            </Col>
        </Row>
    );
}

// --- VISTA FALLBACK ---

export function NotFoundRoute() {
    return <div>Route non trovata!</div>;
}
