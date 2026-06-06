import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');

            const response = await fetch('/api/Users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać listy użytkowników. Sprawdź, czy endpoint /api/Users istnieje na backendzie.');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchUsers();
            setIsLoading(false);
        };

        loadInitialData();
    }, []);

    if (isLoading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Ładowanie listy czytelników...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="text-black mb-0">Zarządzanie Czytelnikami</h4>
                {/* Przycisk na przyszłość, np. do ręcznego dodawania konta pracownika */}
                <Button variant="outline-secondary" disabled>
                    Eksportuj listę (Wkrótce)
                </Button>
            </div>

            {users.length === 0 ? (
                <Alert variant="info">Brak zarejestrowanych użytkowników w bazie danych.</Alert>
            ) : (
                <Table responsive striped bordered hover className="align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>ID (Email)</th>
                            <th>Imię i Nazwisko</th>
                            <th>Data urodzenia</th>
                            <th>Status</th>
                            <th className="text-center">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id || user.email}>
                                <td className="fw-bold text-muted">{user.email}</td>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>
                                    {user.dateOfBirth
                                        ? new Date(user.dateOfBirth).toLocaleDateString('pl-PL')
                                        : 'Brak danych'}
                                </td>
                                <td>
                                    {/* Założenie: w przyszłości backend może zwracać pole isActive lub isBlocked */}
                                    <Badge bg={user.isBlocked ? "danger" : "success"}>
                                        {user.isBlocked ? "Zablokowany" : "Aktywny"}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Button
                                        variant={user.isBlocked ? "success" : "warning"}
                                        size="sm"
                                        className="me-2"
                                    >
                                        {user.isBlocked ? "Odblokuj" : "Zablokuj"}
                                    </Button>
                                    <Button variant="outline-info" size="sm">
                                        Historia wypożyczeń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default UserManager;