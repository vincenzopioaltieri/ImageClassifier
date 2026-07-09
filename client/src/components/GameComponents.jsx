// --- COMPONENTI DELLA PARTITA ---

import React from 'react';
import { Row, Col, Card, Badge, Alert } from 'react-bootstrap';

/**
 * Componente Cell
 * Renderizza una singola cella della plancia. 
 * E' un componente puramente presentazionale (dumb).
 */
function Cell(props) {
    const { r, c, status, onClick, disabled } = props;

    // Determina la classe CSS in base allo stato della cella
    let bgClass = "cell-empty"; // default acqua inesplorata
    let content = "";

    if (status === "miss") {
        bgClass = "cell-miss";
        content = "🌊";
    } else if (status === "hit") {
        bgClass = "cell-hit";
        content = "🎯";
    } else if (status === "sunk") {
        bgClass = "cell-sunk";
        content = "💥";
    } else if (status === "ship") {
        // Mostrato solo a fine partita tramite solutionGrid
        bgClass = "cell-ship";
        content = "🚢";
    }

    // Una cella è cliccabile se non è disabilitata e non è stata ancora esplorata
    const isClickable = !disabled && status === null;

    return (
        <div
            className={`board-cell m-1 ${bgClass} ${disabled ? 'disabled-cell' : ''} ${isClickable ? 'clickable' : ''}`}
            onClick={() => {
                if (isClickable) {
                    onClick(r, c);
                }
            }}
        >
            {content}
        </div>
    );
}

/**
 * Componente Board
 * Renderizza l'intera griglia leggendo esclusivamente la cellStatusMap.
 * Nessuna logica di dominio (shots o solutionGrid) è presente qui.
 */
export function Board(props) {
    const { size = 0, cellStatusMap = new Map(), onCellClick, disabled } = props;

    // Controllo di sicurezza: se la griglia non è ancora pronta
    if (!size || size <= 0) {
        return <div className="text-center mt-3">Griglia non disponibile</div>;
    }

    // Costruiamo la griglia N x N da visualizzare
    const gridRows = [];
    for (let r = 0; r < size; r++) {
        const rowCells = [];
        for (let c = 0; c < size; c++) {
            const cellKey = `${r}-${c}`;
            // Leggiamo lo stato preconfezionato da GameRoute, fallback a null (inesplorata)
            const status = cellStatusMap.has(cellKey) ? cellStatusMap.get(cellKey) : null;

            rowCells.push(
                <Cell
                    key={`cell-${cellKey}`}
                    r={r}
                    c={c}
                    status={status}
                    onClick={onCellClick}
                    disabled={disabled}
                />
            );
        }
        gridRows.push(
            <div key={`row-${r}`} className="d-flex justify-content-center">
                {rowCells}
            </div>
        );
    }

    return (
        <div className="d-flex justify-content-center my-4">
            <div className="board-container bg-white p-3 rounded-4 shadow-sm border d-inline-block">
                {gridRows}
            </div>
        </div>
    );
}

/**
 * Componente MatchInfo
 * Mostra le info di stato della partita corrente (difficoltà, siluri, flotta, fine gioco).
 */
export function MatchInfo(props) {
    const { matchState, mode, code } = props;

    // Composizione deterministica della flotta in base alla difficoltà
    const FLEET_COMPOSITION = {
        EASY: "4 navi totali: 2 da 2 celle, 1 da 3 celle, 1 da 4 celle",
        MEDIUM: "8 navi totali: 4 da 2 celle, 2 da 3 celle, 2 da 4 celle",
        HARD: "12 navi totali: 6 da 2 celle, 4 da 3 celle, 2 da 4 celle"
    };

    return (
        <Card className="mb-4 shadow-sm border-0 rounded-4 text-center">
            <Card.Body className="p-4">
                <Card.Title className="fw-bold text-primary mb-3">
                    ⚓ Stato Partita
                    {/* Se la partita è un torneo, mostra il codice di partecipazione */}
                    {mode === 'tournament' && (
                        <div className="text-muted fs-6 mt-2 fw-normal">
                            Modalità: Tournament (Codice: <span className="text-primary fw-bold">{code}</span>)
                        </div>
                    )}
                </Card.Title>
                <Row className="mt-4">
                    <Col>
                        <h5 className="text-muted fs-6 text-uppercase">Difficoltà</h5>
                        <Badge bg="info" text="dark" className="fs-6 px-3 py-2 rounded-pill shadow-sm">{matchState.difficulty}</Badge>
                    </Col>
                    <Col>
                        <h5 className="text-muted fs-6 text-uppercase">Siluri</h5>
                        {/* Il badge diventa rosso se i siluri sono esauriti */}
                        <Badge bg={matchState.torpedoesFired >= matchState.maxTorpedoes ? "danger" : "primary"} className="fs-6 px-3 py-2 rounded-pill shadow-sm">
                            {matchState.torpedoesFired} / {matchState.maxTorpedoes}
                        </Badge>
                    </Col>
                </Row>

                <div className="mt-4 text-start bg-light p-3 rounded-3 border">
                    <h6 className="text-primary fw-bold mb-1">Flotta Nemica:</h6>
                    <p className="mb-0 text-muted small">{FLEET_COMPOSITION[matchState.difficulty] || "Informazione non disponibile"}</p>
                </div>

                {/* Mostra il banner di vittoria o sconfitta a fine partita */}
                {matchState.gameOver && (
                    <Alert variant={matchState.won ? "success" : "danger"} className="mt-4 mb-0 rounded-4 shadow-sm border-0">
                        <h4 className="fw-bold">{matchState.won ? "🏆 HAI VINTO! 🏆" : "💀 HAI PERSO! 💀"}</h4>
                        <p className="mb-0">
                            {matchState.won
                                ? "Hai affondato tutta la flotta nemica!"
                                : "Hai esaurito i siluri o il nemico ha resistito."}
                        </p>
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
}
