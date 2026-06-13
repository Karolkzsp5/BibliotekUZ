import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './pages/ProtectedRoute';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import ReaderPanel from './pages/ReaderPanel';

const NavigationBar = () => {
    const { isAuthenticated, roles, logout } = useAuth();
    const navigate = useNavigate();

    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);

                    const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
                        || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
                        || payload.email
                        || 'Użytkownik';

                    setUserEmail(email);
                } catch (e) {
                    console.error('Błąd odczytu tokenu:', e);
                }
            }
        } else {
            setUserEmail('');
        }
    }, [isAuthenticated]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isLibrarian = roles.includes('Librarian');

    return (
        <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="mb-4 shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/" className="fw-bold">📚 BibliotekUZ</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Katalog</Nav.Link>
                    </Nav>
                    <Nav className="align-items-center">
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="ms-lg-3 me-3 text-light d-none d-lg-block">
                                    Zalogowano jako: <span className="text-info fw-bold">{userEmail}</span>
                                </Navbar.Text>

                                <Nav.Link as={Link} to="/moje-konto">Moje Konto</Nav.Link>
                                {/* Panel Admina widoczny tylko dla ról Librarian */}
                                {isLibrarian && (
                                    <Nav.Link as={Link} to="/admin" className="text-warning fw-bold">
                                        Panel Admina
                                    </Nav.Link>
                                )}

                                <Button variant="outline-light" size="sm" className="ms-lg-2 mt-2 mt-lg-0" onClick={handleLogout}>
                                    Wyloguj się
                                </Button>
                            </>
                        ) : (
                            <Nav.Link as={Link} to="/login">Zaloguj się</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <NavigationBar />

                {/* Główny kontener na treść podstron */}
                <Container>
                    <Routes>
                        <Route path="/" element={<Catalog />} />
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/moje-konto"
                            element={
                                <ProtectedRoute>
                                    <ReaderPanel />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole="Librarian">
                                    <AdminPanel />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Container>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;