import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";

const Catalog = () => {
    const { isAuthenticated } = useAuth();
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [borrowingId, setBorrowingId] = useState(null);

    useEffect(() => {
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

        fetchBooks();
    }, []);

    // Filtrowanie po tytule lub autorze
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBorrow = async (bookId) => {
        setBorrowingId(bookId);
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
                throw new Error(textError || 'Nie udało się wypożyczyć książki. Być może osiągnąłeś limit?');
            }

            alert('Książka została pomyślnie wypożyczona!');

            // Odświeżenie listy po wypożyczeniu, by zaktualizować liczbę dostępnych egzemplarzy
            const updatedResponse = await fetch('/api/Books');
            const updatedData = await updatedResponse.json();
            setBooks(updatedData);

        } catch (err) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setBorrowingId(null);
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
                <Alert variant="info">Nie znaleziono książek spełniających kryteria wyszukiwania.</Alert>
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {filteredBooks.map(book => {
                        const isAvailable = book.availableCopies > 0;

                        return (
                            <Col key={book.id}>
                                <Card className="h-100 shadow-sm border-0">
                                    {/* Jeśli nie ma okładki, dajemy bezpieczny placeholder */}
                                    <div style={{ height: '250px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {book.coverUrl ? (
                                            <Card.Img
                                                variant="top"
                                                src={book.coverUrl}
                                                alt={`Okładka ${book.title}`}
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
                                                <Badge bg={isAvailable ? "success" : "danger"}>
                                                    {isAvailable ? `Dostępne: ${book.availableCopies}` : 'Niedostępna'}
                                                </Badge>
                                            </div>

                                            <Button
                                                variant="primary"
                                                className="w-100"
                                                disabled={!isAvailable || borrowingId === book.id || !isAuthenticated}
                                                onClick={() => handleBorrow(book.id)}
                                            >
                                                {!isAuthenticated
                                                    ? 'Zaloguj się, by wypożyczyć'
                                                    : borrowingId === book.id
                                                        ? <Spinner size="sm" animation="border" />
                                                        : isAvailable
                                                            ? 'Wypożycz'
                                                            : 'Brak egzemplarzy'
                                                }
                                            </Button>
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