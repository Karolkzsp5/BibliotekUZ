import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge, Modal, Form, InputGroup, Row, Col } from 'react-bootstrap';

const BookManager = () => {
    // Stany głównej tabeli
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Stany modala dodawania nowej książki
    const [showAddModal, setShowAddModal] = useState(false);
    const [isbnToSearch, setIsbnToSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '', author: '', isbn: '', description: '', coverUrl: '', publishedYear: ''
    });

    // Stany modala zarządzania egzemplarzami (Kopiami)
    const [showCopiesModal, setShowCopiesModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [copies, setCopies] = useState([]);
    const [isCopiesLoading, setIsCopiesLoading] = useState(false);
    const [copiesError, setCopiesError] = useState('');

    // --------------------------------------------------------
    // LOGIKA KSIĄŻEK
    // --------------------------------------------------------
    const fetchBooks = async () => {
        try {
            setError('');
            const response = await fetch('/api/Books');
            if (!response.ok) throw new Error('Nie udało się pobrać listy książek.');
            const data = await response.json();
            setBooks(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchBooks();
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setSearchError('');
        setIsbnToSearch('');
        setNewBook({ title: '', author: '', isbn: '', description: '', coverUrl: '', publishedYear: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBook(prev => ({ ...prev, [name]: value }));
    };

    const handleLookupIsbn = async () => {
        if (!isbnToSearch) return;
        setIsSearching(true);
        setSearchError('');
        try {
            const response = await fetch(`/api/Books/lookup?isbn=${isbnToSearch}`);
            if (!response.ok) throw new Error('Nie znaleziono książki w bazie Google.');
            const data = await response.json();
            setNewBook(prev => ({ ...prev, title: data.title, author: data.author, isbn: isbnToSearch }));
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSaveBook = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSearchError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/Books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newBook, publishedYear: newBook.publishedYear ? parseInt(newBook.publishedYear) : null })
            });

            if (!response.ok) {
                let errorMessage = `Błąd serwera: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.title || JSON.stringify(errorData.errors) || errorMessage;
                } catch {
                    const textError = await response.text();
                    errorMessage = textError || errorMessage;
                }
                throw new Error(errorMessage);
            }

            handleCloseAddModal();
            fetchBooks();
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --------------------------------------------------------
    // LOGIKA EGZEMPLARZY
    // --------------------------------------------------------
    const handleOpenCopiesModal = async (book) => {
        setSelectedBook(book);
        setShowCopiesModal(true);
        fetchCopies(book.id);
    };

    const handleCloseCopiesModal = () => {
        setShowCopiesModal(false);
        setSelectedBook(null);
        setCopies([]);
        setCopiesError('');
    };

    const fetchCopies = async (bookId) => {
        setIsCopiesLoading(true);
        setCopiesError('');
        try {
            const response = await fetch(`/api/Copies?bookId=${bookId}`);
            if (!response.ok) throw new Error('Nie udało się pobrać listy egzemplarzy.');
            const data = await response.json();
            setCopies(data);
        } catch (err) {
            setCopiesError(err.message);
        } finally {
            setIsCopiesLoading(false);
        }
    };

    const handleAddCopy = async () => {
        try {
            setCopiesError('');
            const token = localStorage.getItem('token');
            const response = await fetch('/api/Copies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bookId: selectedBook.id })
            });

            if (!response.ok) throw new Error('Nie udało się dodać egzemplarza.');

            fetchCopies(selectedBook.id);
            fetchBooks();
        } catch (err) {
            setCopiesError(err.message);
        }
    };

    const handleDeleteCopy = async (copyId) => {
        try {
            setCopiesError('');
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Copies/${copyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Nie udało się usunąć egzemplarza (może jest aktualnie wypożyczony?).');
            }

            fetchCopies(selectedBook.id);
            fetchBooks();
        } catch (err) {
            setCopiesError(err.message);
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm('Czy na pewno chcesz CAŁKOWICIE usunąć tę książkę z systemu? To działanie bezpowrotnie skasuje również wszystkie jej egzemplarze, historię wypożyczeń oraz rezerwacje.')) return;

        try {
            setError('');
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Books/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Wystąpił błąd podczas usuwania książki.');
            }

            fetchBooks();
        } catch (err) {
            alert(`Błąd: ${err.message}`);
        }
    };

    // --------------------------------------------------------
    // RENDEROWANIE WIDOKU
    // --------------------------------------------------------
    if (isLoading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Ładowanie księgozbioru...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="text-black mb-0">Zarządzanie Książkami</h4>
                <Button variant="success" onClick={() => setShowAddModal(true)}>
                    + Dodaj nową książkę
                </Button>
            </div>

            {books.length === 0 ? (
                <Alert variant="info">Brak książek w bazie danych.</Alert>
            ) : (
                <Table responsive striped bordered hover className="align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Tytuł</th>
                            <th>Autor</th>
                            <th>ISBN</th>
                            <th>Rok wyd.</th>
                            <th>Egzemplarze (Dostępne/Wszystkie)</th>
                            <th className="text-center">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book) => (
                            <tr key={book.id}>
                                <td>{book.id}</td>
                                <td className="fw-bold">{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.isbn || '-'}</td>
                                <td>{book.publishedYear || '-'}</td>
                                <td>
                                    <Badge
                                        bg={book.availableCopies > 0 ? "success" : "danger"}
                                        className="me-1"
                                        style={{ fontSize: '1em' }}
                                    >
                                        {book.availableCopies}
                                    </Badge>
                                    <span style={{ fontSize: '1em', fontWeight: '500' }}> / {book.totalCopies}</span>
                                </td>
                                <td className="text-center align-middle">
                                    <div className="d-flex flex-column align-items-center gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="w-100"
                                            onClick={() => handleOpenCopiesModal(book)}
                                        >
                                            Egzemplarze
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="w-100"
                                            onClick={() => handleDeleteBook(book.id)}
                                        >
                                            Usuń
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* ---------------- MODAL 1: DODAWANIE KSIĄŻKI ---------------- */}
            <Modal show={showAddModal} onHide={handleCloseAddModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Dodaj nową książkę</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {searchError && <Alert variant="danger">{searchError}</Alert>}
                    <div className="mb-4 p-3 bg-light rounded border">
                        <Form.Label className="fw-bold">Wyszukiwarka Google Books</Form.Label>
                        <InputGroup>
                            <Form.Control
                                placeholder="Wpisz numer ISBN (np. 9788328324911)"
                                value={isbnToSearch}
                                onChange={(e) => setIsbnToSearch(e.target.value)}
                            />
                            <Button variant="outline-primary" onClick={handleLookupIsbn} disabled={isSearching || !isbnToSearch}>
                                {isSearching ? <Spinner size="sm" animation="border" /> : 'Szukaj'}
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">System spróbuje automatycznie uzupełnić tytuł i autora.</Form.Text>
                    </div>

                    <Form id="addBookForm" onSubmit={handleSaveBook}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tytuł *</Form.Label>
                                    <Form.Control name="title" value={newBook.title} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Autor *</Form.Label>
                                    <Form.Control name="author" value={newBook.author} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ISBN</Form.Label>
                                    <Form.Control name="isbn" value={newBook.isbn} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Rok wydania</Form.Label>
                                    <Form.Control type="number" name="publishedYear" value={newBook.publishedYear} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Adres URL okładki</Form.Label>
                            <Form.Control name="coverUrl" value={newBook.coverUrl} onChange={handleInputChange} placeholder="https://..." />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Opis / Streszczenie</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={newBook.description} onChange={handleInputChange} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAddModal} disabled={isSaving}>Anuluj</Button>
                    <Button variant="primary" type="submit" form="addBookForm" disabled={isSaving}>
                        {isSaving ? <Spinner size="sm" animation="border" /> : 'Zapisz książkę'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ---------------- MODAL 2: ZARZĄDZANIE EGZEMPLARZAMI ---------------- */}
            <Modal show={showCopiesModal} onHide={handleCloseCopiesModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Egzemplarze: {selectedBook?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {copiesError && <Alert variant="danger">{copiesError}</Alert>}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold">Lista fizycznych sztuk:</span>
                        <Button variant="success" size="sm" onClick={handleAddCopy}>
                            + Dodaj egzemplarz
                        </Button>
                    </div>

                    {isCopiesLoading ? (
                        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                    ) : copies.length === 0 ? (
                        <p className="text-muted text-center">Brak dodanych egzemplarzy dla tej książki.</p>
                    ) : (
                        <Table size="sm" bordered hover className="align-middle text-center">
                            <thead className="table-light">
                                <tr>
                                    <th>ID Sztuki</th>
                                    <th>Status</th>
                                    <th>Akcja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {copies.map(copy => (
                                    <tr key={copy.id}>
                                        <td className="fw-bold text-muted">#{copy.id}</td>
                                        <td>
                                            <Badge bg={
                                                copy.status === 'Available' ? 'success' :
                                                    copy.status === 'Borrowed' ? 'warning' : 'secondary'
                                            }>
                                                {copy.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteCopy(copy.id)}
                                                disabled={copy.status !== 'Available'} 
                                            >
                                                Usuń
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCopiesModal}>Zamknij</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default BookManager;