import { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge, Modal } from 'react-bootstrap';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionInProgress, setActionInProgress] = useState(null);

    const [currentUserId, setCurrentUserId] = useState(null);

    const [showLoansModal, setShowLoansModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLoans, setUserLoans] = useState([]);
    const [isLoansLoading, setIsLoansLoading] = useState(false);
    const [loansError, setLoansError] = useState('');

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
                throw new Error('Nie udało się pobrać listy użytkowników.');
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

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                // W C# Identity NameIdentifier przechowuje ID użytkownika
                const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub;
                setCurrentUserId(userId);
            } catch (e) {
                console.error('Błąd odczytu tokenu:', e);
            }
        }
    }, []);

    // --------------------------------------------------------
    // AKCJA: BLOKOWANIE / ODBLOKOWANIE KONTA
    // --------------------------------------------------------
    const handleToggleBlock = async (userId, currentStatus) => {
        const actionText = currentStatus ? "odblokować" : "zablokować";
        if (!window.confirm(`Czy na pewno chcesz ${actionText} tego użytkownika?`)) return;

        setActionInProgress(userId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Users/${userId}/block`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(!currentStatus)
            });

            if (!response.ok) {
                throw new Error('Nie udało się zmienić statusu użytkownika.');
            }

            fetchUsers();
        } catch (err) {
            alert(`Błąd: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    // --------------------------------------------------------
    // AKCJA: EKSPORT LISTY DO CSV
    // --------------------------------------------------------
    const handleExportCSV = () => {
        if (users.length === 0) {
            alert('Brak danych do eksportu.');
            return;
        }

        const headers = ['Email', 'Imię', 'Nazwisko', 'Data urodzenia', 'Zablokowany'];

        const csvRows = users.map(user => {
            const birthDate = user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('pl-PL') : 'Brak danych';
            const status = user.isBlocked ? 'Tak' : 'Nie';

            return `"${user.email}","${user.firstName}","${user.lastName}","${birthDate}","${status}"`;
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Czytelnicy_BibliotekUZ_${dateStr}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --------------------------------------------------------
    // AKCJA: HISTORIA WYPOŻYCZEŃ (MODAL)
    // --------------------------------------------------------
    const handleShowLoans = async (user) => {
        setSelectedUser(user);
        setShowLoansModal(true);
        setIsLoansLoading(true);
        setLoansError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/Users/${user.id}/loans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Nie udało się pobrać historii wypożyczeń.');

            const data = await response.json();
            setUserLoans(data);
        } catch (err) {
            setLoansError(err.message);
        } finally {
            setIsLoansLoading(false);
        }
    };

    const handleCloseLoansModal = () => {
        setShowLoansModal(false);
        setSelectedUser(null);
        setUserLoans([]);
    };

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
                <Button variant="outline-success" onClick={handleExportCSV}>
                    Eksportuj listę (CSV)
                </Button>
            </div>

            {users.length === 0 ? (
                <Alert variant="info">Brak zarejestrowanych użytkowników w bazie danych.</Alert>
            ) : (
                <Table responsive striped bordered hover className="align-middle text-center">
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
                        {users.map((user) => {
                            const isMe = currentUserId === user.id;

                            return (
                                <tr key={user.id}>
                                    <td className="fw-bold text-muted text-start ps-3">
                                        {user.email}
                                    </td>
                                    <td>{user.firstName} {user.lastName}</td>
                                    <td>
                                        {user.dateOfBirth
                                            ? new Date(user.dateOfBirth).toLocaleDateString('pl-PL')
                                            : 'Brak danych'}
                                    </td>
                                    <td>
                                        <Badge bg={user.isBlocked ? "danger" : "success"}>
                                            {user.isBlocked ? "Zablokowany" : "Aktywny"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button
                                                variant={user.isBlocked ? "warning" : "danger"}
                                                size="sm"
                                                onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                                                // Blokujemy przycisk, jeśli to Twoje konto
                                                disabled={actionInProgress === user.id || isMe}
                                                title={isMe ? "Nie możesz zablokować własnego konta administratora" : ""}
                                            >
                                                {actionInProgress === user.id ? <Spinner size="sm" animation="border" /> : (user.isBlocked ? "Odblokuj" : "Zablokuj")}
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => handleShowLoans(user)}
                                            >
                                                Historia wypożyczeń
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            {/* ---------------- MODAL HISTORII WYPOŻYCZEŃ ---------------- */}
            <Modal show={showLoansModal} onHide={handleCloseLoansModal} size="xl">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        Historia wypożyczeń: <span className="fw-bold">{selectedUser?.email}</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loansError && <Alert variant="danger">{loansError}</Alert>}

                    {isLoansLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Pobieranie rejestru...</p>
                        </div>
                    ) : userLoans.length === 0 ? (
                        <Alert variant="info" className="text-center my-3">
                            Ten czytelnik nie posiada jeszcze żadnej historii wypożyczeń.
                        </Alert>
                    ) : (
                        <Table responsive striped bordered hover className="align-middle text-center mb-0">
                            <thead className="table-secondary">
                                <tr>
                                    <th>Książka (Sztuka ID)</th>
                                    <th>Wypożyczono</th>
                                    <th>Termin zwrotu</th>
                                    <th>Zwrócono</th>
                                    <th>Kary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userLoans.map(loan => (
                                    <tr key={loan.id}>
                                        <td className="text-start ps-3">
                                            <strong>{loan.bookTitle}</strong><br />
                                            <small className="text-muted">#{loan.copyId}</small>
                                        </td>
                                        <td>{new Date(loan.borrowedAt).toLocaleDateString('pl-PL')}</td>
                                        <td className={loan.isOverdue ? 'text-danger fw-bold' : ''}>
                                            {new Date(loan.dueDate).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td>
                                            {loan.returnedAt ? (
                                                <Badge bg="secondary">
                                                    {new Date(loan.returnedAt).toLocaleDateString('pl-PL')}
                                                </Badge>
                                            ) : (
                                                <Badge bg="success">W trakcie</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {loan.fineAmount > 0 ? (
                                                <span className={`fw-bold ${loan.isFinePaid ? 'text-success' : 'text-danger'}`}>
                                                    {loan.fineAmount} zł {loan.isFinePaid ? '(Opłacono)' : ''}
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseLoansModal}>Zamknij</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserManager;