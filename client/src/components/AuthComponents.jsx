// --- COMPONENTI DI AUTENTICAZIONE ---

import React, { useState } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../API/API';

// Form di login per l'accesso utente
export function LoginForm(props) {
    // Stati locali per i dati del form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Hook per il routing
    const navigate = useNavigate();
    const location = useLocation();

    // Gestore per la sottomissione del form
    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg(''); // Resetta eventuali errori precedenti

        // Validazione minima lato client
        if (username.trim() === '' || password.trim() === '') {
            setErrorMsg('Username e password sono obbligatori.');
            return;
        }

        try {
            setLoading(true);
            // Chiamata API per il login
            const user = await API.logIn(username, password);
            props.onLogin(user); 

            // Redirezione post-login: torna alla route protetta di origine o alla home
            const redirectTo = location.state?.redirectTo || '/';
            navigate(redirectTo, { replace: true });

        } catch (err) {
            // Mappatura user-friendly degli errori (nasconde i log grezzi del server)
            if (err.message.includes('errati') || err.message.includes('401')) {
                setErrorMsg('Credenziali non valide. Riprova.');
            } else {
                setErrorMsg('Errore di comunicazione col server. Riprova più tardi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-sm rounded-4 mt-5">
            <Card.Body className="p-4 p-md-5">
                <Card.Title className="mb-4 text-center fw-bold text-primary fs-3">Accedi al Gioco</Card.Title>
                
                {/* Avviso visivo nel caso l'utente provenga da un redirect da route protetta */}
                {props.message && (
                    <Alert variant="warning" className="rounded-4 border-0 shadow-sm text-center">
                        {props.message}
                    </Alert>
                )}

                {/* Banner di errore per credenziali errate */}
                {errorMsg && (
                    <Alert variant="danger" dismissible onClose={() => setErrorMsg('')} className="rounded-4 border-0 shadow-sm">
                        {errorMsg}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4" controlId="formUsername">
                        <Form.Label className="text-muted fw-medium ms-1">Username</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Inserisci username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="rounded-pill px-4 py-2 shadow-none"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formPassword">
                        <Form.Label className="text-muted fw-medium ms-1">Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-pill px-4 py-2 shadow-none"
                        />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" className="w-100 rounded-pill py-2 fw-bold shadow-sm mt-2" disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Entra nella Flotta'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}
