// --- HEADER DI NAVIGAZIONE ---

import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Componente per la barra di navigazione fissa in alto
export function NavHeader(props) {
    return (
        <Navbar bg="primary" variant="dark" expand="lg" className="py-3 shadow-sm">
            <Container fluid className="px-4">
                {/* Logo e Link alla Home */}
                <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 d-flex align-items-center gap-2">
                    <span>⚓</span> Battaglia Navale
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* Link di navigazione principali */}
                    <Nav className="me-auto ms-4 gap-2">
                        <Nav.Link as={Link} to="/" className="fw-medium">Home</Nav.Link>
                        <Nav.Link as={Link} to="/stats" className="fw-medium">Classifiche</Nav.Link>
                    </Nav>
                    
                    {/* Sezione Autenticazione (Loggato vs Ospite) */}
                    <Nav className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
                        {props.loggedIn ? (
                            <>
                                {/* Mostra il badge con lo username se loggato */}
                                <Navbar.Text className="text-light">
                                    Ciao, <span className="badge bg-light text-primary fw-bold ms-1 px-3 py-2 rounded-pill shadow-sm">{props.user.username}</span>
                                </Navbar.Text>
                                <Button variant="outline-light" className="rounded-pill px-4 fw-medium" onClick={props.logout}>Logout</Button>
                            </>
                        ) : (
                            // Altrimenti mostra il tasto Accedi
                            <Link to="/login" className="btn btn-light text-primary rounded-pill px-4 fw-bold shadow-sm">Accedi</Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
