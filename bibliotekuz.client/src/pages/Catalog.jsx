import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Catalog = () => {
    const { isAuthenticated } = useAuth();
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [actionInProgress, setActionInProgress] = useState(null);

    const fetchBooks = async () => {
        try {
            setError('');
            const response = await fetch('/api/Books');

            if (!response.ok) {
                throw new Error('Nie udało się pobrać katalogu książek.');
            }

            const data = await response.json();
            setBooks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBorrow = async (bookId) => {
        setActionInProgress(`borrow-${bookId}`);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/Loans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookId })
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Nie udało się wypożyczyć książki.');
            }

            alert('Książka została pomyślnie wypożyczona!');
            fetchBooks(); // Odświeżanie listy
        } catch (err) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    const handleJoinWaitlist = async (bookId) => {
        setActionInProgress(`waitlist-${bookId}`);
        try {
            const token = localStorage.getItem('token');

            // ENDPOINT DO WERYFIKACJI
            const response = await fetch('/api/Waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookId })
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Nie udało się zapisać do kolejki.');
            }

            alert('Pomyślnie zapisano do kolejki oczekujących!');
        } catch (err) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    if (isLoading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Ładowanie księgozbioru...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4 mb-5">
            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <h2 className="text-black mb-0">Katalog Książek</h2>
                    <p className="text-muted">Przeglądaj, wyszukuj i wypożyczaj nasze zbiory.</p>
                </Col>
                <Col md={6}>
                    <InputGroup>
                        <Form.Control
                            placeholder="Szukaj po tytule lub autorze..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                            Wyczyść
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

            {filteredBooks.length === 0 ? (
                <Alert variant="info">Nie znaleziono książek spełniających kryteria.</Alert>
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {filteredBooks.map(book => {
                        const isAvailable = book.availableCopies > 0;
                        const isBorrowing = actionInProgress === `borrow-${book.id}`;
                        const isWaitlisting = actionInProgress === `waitlist-${book.id}`;

                        return (
                            <Col key={book.id}>
                                <Card className="h-100 shadow-sm border-0">
                                    <div style={{ height: '250px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {book.coverUrl ? (
                                            <Card.Img
                                                variant="top"
                                                src={book.coverUrl}
                                                style={{ objectFit: 'contain', height: '100%', width: '100%', padding: '10px' }}
                                            />
                                        ) : (
                                            <span className="text-muted">Brak okładki</span>
                                        )}
                                    </div>

                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="fw-bold">{book.title}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">{book.author}</Card.Subtitle>

                                        <div className="mt-auto pt-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className="text-muted small">Wydanie: {book.publishedYear || '-'}</span>
                                                <Badge bg={isAvailable ? "success" : "warning"} text={!isAvailable ? "dark" : "white"}>
                                                    {isAvailable ? `Dostępne: ${book.availableCopies}` : 'Wypożyczona'}
                                                </Badge>
                                            </div>

                                            {!isAuthenticated ? (
                                                <Button variant="secondary" className="w-100" disabled>
                                                    Zaloguj się, by wypożyczyć
                                                </Button>
                                            ) : isAvailable ? (
                                                <Button
                                                    variant="primary"
                                                    className="w-100"
                                                    disabled={actionInProgress !== null}
                                                    onClick={() => handleBorrow(book.id)}
                                                >
                                                    {isBorrowing ? <Spinner size="sm" animation="border" /> : 'Wypożycz'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline-warning"
                                                    className="w-100 fw-bold"
                                                    disabled={actionInProgress !== null}
                                                    onClick={() => handleJoinWaitlist(book.id)}
                                                >
                                                    {isWaitlisting ? <Spinner size="sm" animation="border" /> : 'Zapisz się do kolejki'}
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default Catalog;