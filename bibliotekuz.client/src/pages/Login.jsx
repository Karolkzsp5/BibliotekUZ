import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        dateOfBirth: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Wybór odpowiedniego endpointu
        const endpoint = isLogin ? '/api/Auth/login' : '/api/Auth/register';

        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : { ...formData };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Zabezpieczenie przed rzucaniem błędów przez serwer
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = 'Wystąpił błąd podczas autoryzacji.';

                if (contentType && contentType.includes('application/json')) {
                    const errData = await response.json();
                    // Backend zwraca tablicę błędów przy rejestracji
                    if (Array.isArray(errData)) {
                        errorMessage = errData.join(' ');
                    } else if (errData.title) {
                        errorMessage = errData.title;
                    }
                } else {
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage);
            }

            // Zapisanie tokenu JWT i roli w pamięci przeglądarki
            const data = await response.json();

            login(data.token, data.roles);

            // Przekierowanie na stronę główną po pomyślnym zalogowaniu
            navigate('/');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <h3 className="text-center mb-4 text-black">
                                {isLogin ? 'Logowanie' : 'Rejestracja'}
                            </h3>

                            {/* Komponent Bootstrapa do wyświetlania błędów z serwera */}
                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Imię</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="firstName"
                                                placeholder="Wpisz imię"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Nazwisko</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="lastName"
                                                placeholder="Wpisz nazwisko"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Data urodzenia</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Adres e-mail</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Hasło</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder="Wpisz hasło"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Spinner animation="border" size="sm" /> : (isLogin ? 'Zaloguj się' : 'Zarejestruj konto')}
                                </Button>

                                <div className="d-flex justify-content-center align-items-baseline gap-2 mt-3">
                                    <span className="text-muted">
                                        {isLogin ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
                                    </span>
                                    <Button
                                        variant="link"
                                        className="p-0 text-decoration-none"
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError('');
                                        }}
                                    >
                                        {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;