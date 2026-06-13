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
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Nie udało się zarejestrować zwrotu.');
            }

            // Odświeżenie listy po udanym zwrocie
            fetchLoans();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePayFine = async (loanId) => {
        if (!window.confirm('Czy na pewno chcesz oznaczyć tę karę jako opłaconą? (Zdejmie to również blokadę z konta użytkownika)')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Loans/${loanId}/pay-fine`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const textError = await response.text();
                throw new Error(textError || 'Nie udało się przetworzyć płatności.');
            }

            fetchLoans();
        } catch (err) {
            alert(`Błąd: ${err.message}`);
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
                            const isOverdue = new Date(loan.dueDate) < new Date() && !loan.returnedAt;

                            return (
                                <tr key={loan.id}>
                                    {/* Usunięto .substring(0, 8), aby uniknąć błędu z liczbowym ID */}
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
                                            <Badge bg="secondary" className="mb-1 d-block">Zwrócono</Badge>
                                        ) : isOverdue ? (
                                            <Badge bg="danger" className="mb-1 d-block">Przetrzymana</Badge>
                                        ) : (
                                            <Badge bg="success" className="mb-1 d-block">Wypożyczona</Badge>
                                        )}

                                        {/* Wyświetlanie informacji o karze */}
                                        {loan.fineAmount > 0 && (
                                            <div className={`small fw-bold ${loan.isFinePaid ? 'text-success' : 'text-danger'}`}>
                                                Kara: {loan.fineAmount} zł {loan.isFinePaid ? '(Opłacona)' : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column align-items-center gap-2">
                                            {!loan.returnedAt && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-100"
                                                    onClick={() => handleReturnBook(loan.id)}
                                                >
                                                    Odbierz zwrot
                                                </Button>
                                            )}

                                            {/* Przycisk opłacania kary pojawia się tylko, gdy jest kara i nie jest opłacona */}
                                            {loan.fineAmount > 0 && !loan.isFinePaid && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="w-100"
                                                    onClick={() => handlePayFine(loan.id)}
                                                >
                                                    Opłać karę
                                                </Button>
                                            )}
                                        </div>
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