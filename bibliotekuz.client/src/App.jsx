import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';

// Tymczasowe komponenty
const Home = () => <h2>Katalog Książek</h2>;
const Login = () => <h2>Formularz Logowania</h2>;
const ReaderPanel = () => <h2>Moje Wypożyczenia i Kolejka</h2>;
const AdminPanel = () => <h2>Panel Administratora</h2>;

function App() {
    return (
        <BrowserRouter>
            {/* Pasek nawigacyjny Bootstrap */}
            <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="mb-4">
                <Container>
                    <Navbar.Brand as={Link} to="/">📚 BibliotekUZ</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/">Katalog</Nav.Link>
                        </Nav>
                        <Nav>
                            <Nav.Link as={Link} to="/login">Zaloguj się</Nav.Link>
                            <Nav.Link as={Link} to="/moje-konto">Moje Konto</Nav.Link>
                            <Nav.Link as={Link} to="/admin" className="text-warning">Panel Admina</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Główny kontener na treść podstron */}
            <Container className="text-black">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/moje-konto" element={<ReaderPanel />} />
                    <Route path="/admin" element={<AdminPanel />} />
                </Routes>
            </Container>
        </BrowserRouter>
    );
}

export default App;