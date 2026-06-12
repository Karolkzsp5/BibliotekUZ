import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';

const LoanManager = () => {
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLoans = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');

            const response = await fetch('/api/Loans', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać listy wypożyczeń. Sprawdź endpoint /api/Loans na backendzie.');
            }

            const data = await response.json();
            setLoans(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchLoans();
            setIsLoading(false);
        };

        loadInitialData();
    }, []);

    const handleReturnBook = async (loanId) => {
        if (!window.confirm('Czy na pewno chcesz zarejestrować zwrot tego egzemplarza?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Loans/${loanId}/return`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się zarejestrować zwrotu.');
            }

            // Odświeżenie listy po udanym zwrocie
            fetchLoans();
        } catch (err) {
            alert(err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Ładowanie rejestru wypożyczeń...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="text-black mb-0">Rejestr Wypożyczeń</h4>
                <Button variant="outline-primary" onClick={fetchLoans}>
                    Odśwież listę
                </Button>
            </div>

            {loans.length === 0 ? (
                <Alert variant="info">Obecnie brak aktywnych lub historycznych wypożyczeń w systemie.</Alert>
            ) : (
                <Table responsive striped bordered hover className="align-middle text-center">
                    <thead className="table-dark">
                        <tr>
                            <th>ID Wypożyczenia</th>
                            <th>Czytelnik (Email)</th>
                            <th>Tytuł Książki (ID Egzemplarza)</th>
                            <th>Data Wypożyczenia</th>
                            <th>Termin Zwrotu</th>
                            <th>Status / Kary</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan) => {
                            // Sprawdzamy, czy termin minął i czy książka nie została jeszcze zwrócona
                            const isOverdue = new Date(loan.dueDate) < new Date() && !loan.returnedAt;

                            return (
                                <tr key={loan.id}>
                                    <td className="text-muted fw-bold">#{loan.id}</td>
                                    <td>{loan.userEmail}</td>
                                    <td>
                                        <strong>{loan.bookTitle}</strong> <br />
                                        <small className="text-muted">(Sztuka: #{loan.copyId})</small>
                                    </td>
                                    <td>{new Date(loan.borrowedAt).toLocaleDateString('pl-PL')}</td>
                                    <td className={isOverdue ? 'text-danger fw-bold' : ''}>
                                        {new Date(loan.dueDate).toLocaleDateString('pl-PL')}
                                    </td>
                                    <td>
                                        {loan.returnedAt ? (
                                            <Badge bg="secondary">Zwrócono</Badge>
                                        ) : isOverdue ? (
                                            <div>
                                                <Badge bg="danger" className="mb-1">Przetrzymana</Badge>
                                                {loan.fineAmount > 0 && (
                                                    <div className="text-danger small">Kara: {loan.fineAmount} zł</div>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge bg="success">Wypożyczona</Badge>
                                        )}
                                    </td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleReturnBook(loan.id)}
                                            disabled={loan.returnedAt !== null}
                                        >
                                            {loan.returnedAt ? 'Zakończone' : 'Odbierz zwrot'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default LoanManager;