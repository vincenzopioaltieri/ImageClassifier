import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { NavHeader } from './components/NavHeader';
import { HomeRoute, LoginRoute, GameRoute, StatsRoute, NotFoundRoute } from './components/Views';
import API from './API/API';

// Route Guard per il Torneo
function ProtectedTournamentRoute({ loggedIn }) {
  const location = useLocation();
  if (!loggedIn) {
    // Se fai il login ti riporta al torneo
    return <Navigate replace to="/login" state={{ fromProtectedRoute: true, redirectTo: location.pathname }} />;
  }
  return <GameRoute mode="tournament" />;
}

// Route Guard per Casual (solo ospiti non autenticati)
function GuestOnlyRoute({ loggedIn }) {
  if (loggedIn) {
    return <Navigate replace to="/" />;
  }
  return <GameRoute mode="casual" />;
}

/**
 * DefaultLayout funge da "guscio" per l'applicazione
 * La NavHeader è fissata in alto e inietta il contenuto delle route interne tramite <Outlet />
 */
function DefaultLayout(props) {
  return (
    <>
      <NavHeader loggedIn={props.loggedIn} user={props.user} logout={props.logout} />
      <Container fluid className="mt-4">
        <Outlet />
      </Container>
    </>
  );
}

function App() {
  // Inizializzazione stati globali
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');

  // Verifico se c'è una sessione attiva al mount (lifecycle hook)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await API.getUserInfo();
        setUser(currentUser);
        setLoggedIn(true);
      } catch (err) {
        // Nessuna sessione attiva (errore 401), pulisco lo stato
        setUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Aggiorna lo stato login
  const handleLogin = (user) => {
    setUser(user);
    setLoggedIn(true);
    setGlobalError('');
  };

  // Aggiornato lo stato login (logout)
  const handleLogout = async () => {
    try {
      // Chiamata al backend per eliminare la sessione
      await API.logOut();
      setUser(null);
      setLoggedIn(false);
    } catch (err) {
      setGlobalError('Errore durante il logout.');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <BrowserRouter>
      {globalError && (
        <Alert variant="danger" dismissible onClose={() => setGlobalError('')}>
          {globalError}
        </Alert>
      )}
      {/* Tutte le rotte */}
      <Routes>
        {/* Rotta padre con Layout */}
        <Route path="/" element={<DefaultLayout loggedIn={loggedIn} user={user} logout={handleLogout} />}>

          {/* Rotta home */}
          <Route index element={<HomeRoute loggedIn={loggedIn} />} />

          {/* Rotta login */}
          <Route path="login" element={
            // Se già loggato, la pagina di login non ha senso, reindirizzo a home
            loggedIn ? <Navigate replace to="/" /> : <LoginRoute onLogin={handleLogin} />
          } />

          {/* Rotta per partita casuale */}
          <Route path="casual/:difficulty" element={<GuestOnlyRoute loggedIn={loggedIn} />} />

          {/* Rotta Torneo */}
          <Route path="tournament/:code" element={<ProtectedTournamentRoute loggedIn={loggedIn} />} />

          {/* Rotta stats */}
          <Route path="stats" element={<StatsRoute />} />

          {/* Rotta pagina 404 */}
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
