import { Container, Row, Col, Tab, Tabs } from 'react-bootstrap';
import BookManager from './BookManager'; 

const AdminPanel = () => {
    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2 className="text-black">Panel Administratora</h2>
                    <p className="text-muted">Zarządzaj zasobami biblioteki i użytkownikami.</p>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Tabs
                        defaultActiveKey="books"
                        id="admin-panel-tabs"
                        className="mb-4"
                    >
                        <Tab eventKey="books" title="Książki i Egzemplarze">
                            <div className="p-4 bg-white border rounded shadow-sm mt-3">
                                {/* Wpięty nowy komponent tabeli */}
                                <BookManager />
                            </div>
                        </Tab>
                        
                        <Tab eventKey="users" title="Użytkownicy">
                            <div className="p-4 bg-white border rounded shadow-sm mt-3">
                                <h4 className="text-black">Zarządzanie Czytelnikami</h4>
                                <p className="text-muted">Lista czytelników pojawi się tutaj...</p>
                            </div>
                        </Tab>

                        <Tab eventKey="loans" title="Wypożyczenia i Kary">
                            <div className="p-4 bg-white border rounded shadow-sm mt-3">
                                <h4 className="text-black">Operacje Biblioteczne</h4>
                                <p className="text-muted">Zarządzanie wypożyczeniami pojawi się tutaj...</p>
                            </div>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminPanel;