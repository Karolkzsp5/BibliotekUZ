import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Spinner, Alert, Card } from 'react-bootstrap';

const ReaderPanel = () => {
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyLoans = async () => {
            try {
                setError('');
                const token = localStorage.getItem('token');

                const response = await fetch('/api/Loans', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Nie udało się pobrać Twoich wypożyczeń.');
                }

                const data = await response.json();
                setLoans(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyLoans();
    }, []);

    if (isLoading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Wczytywanie danych konta...</p>
            </Container>
        );
    }

    // Rozdzielenie wypożyczeń na aktywne i archiwalne (zwrócone)
    const activeLoans = loans.filter(loan => !loan.returnedAt);
    const historyLoans = loans.filter(loan => loan.returnedAt);

    return (
        <Container className="mt-4 mb-5">
            <Row className="mb-4">
                <Col>
                    <h2 className="text-black">Moje Konto</h2>
                    <p className="text-muted">Przeglądaj swoje aktualne wypożyczenia oraz historię czytelniczą.</p>
                </Col>
            </Row>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {/* SEKCJA 1: AKTUALNIE WYPOŻYCZONE */}
            <Card className="shadow-sm border-0 mb-5">
                <Card.Header className="bg-dark text-white fw-bold py-3">
                    📚 Aktualnie wypożyczone książki ({activeLoans.length})
                </Card.Header>
                <Card.Body className="p-0">
                    {activeLoans.length === 0 ? (
                        <div className="text-center my-4 text-muted p-3">
                            Nie masz obecnie żadnych wypożyczonych książek. Przejdź do Katalogu, aby coś wybrać!
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle text-center mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Tytuł i Autor</th>
                                    <th>Data wypożyczenia</th>
                                    <th>Termin zwrotu</th>
                                    <th>Status / Kary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeLoans.map(loan => {
                                    return (
                                        <tr key={loan.id}>
                                            <td className="text-start ps-4">
                                                <strong className="text-black">{loan.bookTitle}</strong>
                                            </td>
                                            <td>{new Date(loan.borrowedAt).toLocaleDateString('pl-PL')}</td>
                                            <td className={loan.isOverdue ? 'text-danger fw-bold' : ''}>
                                                {new Date(loan.dueDate).toLocaleDateString('pl-PL')}
                                            </td>
                                            <td>
                                                {loan.isOverdue ? (
                                                    <div>
                                                        <Badge bg="danger" className="mb-1">Przetrzymana</Badge>
                                                        {loan.fineAmount > 0 && (
                                                            <div className="text-danger fw-bold small">Do zapłaty: {loan.fineAmount} zł</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge bg="success">W toku</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* SEKCJA 2: HISTORIA ZWROTÓW */}
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-secondary text-white fw-bold py-3">
                    ⏱️ Historia wypożyczeń
                </Card.Header>
                <Card.Body className="p-0">
                    {historyLoans.length === 0 ? (
                        <div className="text-center my-4 text-muted p-3">
                            Brak historii wypożyczeń w naszym systemie.
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle text-center mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Tytuł książki</th>
                                    <th>Data wypożyczenia</th>
                                    <th>Data zwrotu</th>
                                    <th>Kara</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoans.map(loan => (
                                    <tr key={loan.id}>
                                        <td className="text-start ps-4">{loan.bookTitle}</td>
                                        <td>{new Date(loan.borrowedAt).toLocaleDateString('pl-PL')}</td>
                                        <td>{new Date(loan.returnedAt).toLocaleDateString('pl-PL')}</td>
                                        <td>
                                            {loan.fineAmount > 0 ? (
                                                <span className={loan.isFinePaid ? "text-success" : "text-danger fw-bold"}>
                                                    {loan.fineAmount} zł {loan.isFinePaid ? "(Opłacona)" : "(Nieopłacona)"}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReaderPanel;