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

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isLibrarian = roles.includes('Librarian');

    return (
        <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={Link} to="/">📚 BibliotekUZ</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Katalog</Nav.Link>
                    </Nav>
                    <Nav className="align-items-center">
                        {isAuthenticated ? (
                            <>
                                <Nav.Link as={Link} to="/moje-konto">Moje Konto</Nav.Link>
                                {/* Panel Admina widoczny tylko dla ról Librarian */}
                                {isLibrarian && (
                                    <Nav.Link as={Link} to="/admin" className="text-warning">
                                        Panel Admina
                                    </Nav.Link>
                                )}
                                <Button variant="outline-light" size="sm" className="ms-3" onClick={handleLogout}>
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
                        {/* Główny Katalog jako strona startowa */}
                        <Route path="/" element={<Catalog />} />
                        <Route path="/login" element={<Login />} />

                        {/* Widok chroniony - dla zalogowanych */}
                        <Route
                            path="/moje-konto"
                            element={
                                <ProtectedRoute>
                                    <ReaderPanel />
                                </ProtectedRoute>
                            }
                        />

                        {/* Widok chroniony - tylko dla ról Librarian */}
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