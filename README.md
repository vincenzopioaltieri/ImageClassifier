# Battaglia Navale - Progetto AW1

Progetto per l'esame di Applicazioni Web I (Politecnico di Torino).
Vincenzo Pio Altieri s353170.

## Server

### API

- **POST `/api/sessions`**
  - **Descrizione:** Effettua il login dell'utente.
  - **Parametri richiesti:** `username` (string), `password` (string) nel body.
  - **Risposte:** `200 OK` (payload: `{ id, username }`), `401 Unauthorized`, `422 Unprocessable Entity`.

- **GET `/api/sessions/current`**
  - **Descrizione:** Recupera i dati dell'utente attualmente loggato.
  - **Parametri:** Nessuno.
  - **Risposte:** `200 OK` (payload: `{ id, username }`), `401 Unauthorized`.

- **DELETE `/api/sessions/current`**
  - **Descrizione:** Effettua il logout dell'utente e pulisce lo stato in RAM.
  - **Parametri:** Nessuno.
  - **Risposte:** `200 OK` (payload vuoto).

- **POST `/api/match/casual`**
  - **Descrizione:** Avvia una nuova partita casuale.
  - **Parametri richiesti:** `difficulty` (string: 'EASY', 'MEDIUM', 'HARD') nel body.
  - **Risposte:** `201 Created` (payload: `{ size, maxTorpedoes, torpedoesFired, shots }`), `422 Unprocessable Entity`.

- **POST `/api/tournaments`**
  - **Descrizione:** Crea un nuovo torneo. Richiede autenticazione.
  - **Parametri richiesti:** `difficulty` (string: 'EASY', 'MEDIUM', 'HARD') nel body.
  - **Risposte:** `201 Created` (payload: `{ code, difficulty }`), `401 Unauthorized`, `422 Unprocessable Entity`.

- **POST `/api/match/tournament/:code`**
  - **Descrizione:** Partecipa a un torneo tramite codice. Richiede autenticazione.
  - **Parametri richiesti:** `code` (string) nell'URL.
  - **Risposte:** `201 Created` (payload: `{ size, maxTorpedoes, torpedoesFired, shots, difficulty }`), `401 Unauthorized`, `404 Not Found`.

- **POST `/api/match/fire`**
  - **Descrizione:** Spara un siluro.
  - **Parametri richiesti:** `row` (int), `col` (int) nel body.
  - **Risposte:** `200 OK` (payload: `{ result, torpedoesFired, gameOver, won, solutionGrid }`), `400 Bad Request`, `404 Not Found`, `422 Unprocessable Entity`.

- **GET `/api/statistics`**
  - **Descrizione:** Recupera le statistiche pubbliche globali.
  - **Parametri:** Nessuno.
  - **Risposte:** `200 OK` (payload: array di `{ username, difficulty, played, won, percentage }`).

## Database

Il database SQLite (`database.sqlite`) è strutturato nelle seguenti tabelle:

- **`users`**: Memorizza le credenziali degli utenti registrati. Contiene `id`, `username`, `salt`, `password` (hash bcrypt).
- **`tournaments`**: Memorizza i tornei creati. Contiene `code` (stringa univoca di 6 caratteri), `creator_id` (foreign key su users), `difficulty`. Usata per generare le plance deterministiche.
- **`statistics`**: Memorizza i punteggi. Contiene `user_id` (foreign key), `difficulty`, `played`, `won`. Aggiornata automaticamente a fine torneo.

## Client

### Routes React implementate
- `/`: `HomeRoute` (Selezione casuale e form tornei).
- `/login`: `LoginRoute` (Form di autenticazione).
- `/casual/:difficulty`: `GameRoute` (Partita casuale. `difficulty` passato via URL param).
- `/tournament/:code`: `ProtectedTournamentRoute` -> `GameRoute` (Partita torneo. `code` passato via URL param. Accessibile solo se loggati).
- `/stats`: `StatsRoute` (Classifica globale).
- `*`: `NotFoundRoute` (Gestione 404).

### Componenti Principali UI
- `App`: Punto di ingresso, provider del router e gestore dello stato globale (`user`, `loggedIn`).
- `NavHeader`: Barra di navigazione persistente.
- `GameRoute`: Unico *Smart Component* del gameplay. Gestisce `matchState`, interazioni API, loading ed error handling.
- `Board`: *Dumb Component* che renderizza la griglia in base a una `cellStatusMap` derivata O(1).
- `Cell`: *Dumb Component* che rappresenta un singolo blocco e il suo stato visivo (acqua, nave, hit, miss, sunk).
- `MatchInfo`: Mostra informazioni sullo stato di avanzamento, munizioni residue ed esito partita.

## Altro

### Screenshot
![Screenshot Partita](./image.png)

### Utenti Registrati
- **user1** / password
- **user2** / password
- **user3** / password

### Uso Strumenti AI
Durante lo sviluppo del progetto ho usato un assistente AI (LLM) per alcuni compiti manuali e ripetitivi (come la formattazione estetica tramite classi CSS di Bootstrap e la stesura delle query SQL per il popolamento iniziale dl database) e come supporto teorico per l'algoritmo di generazione pseudo-casuale (PRNG) basato su seed per il posizionamento delle navi. Tutto il codice è stato testato e validato manualmente.

