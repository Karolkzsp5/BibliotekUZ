import { Container, Row, Col, Tab, Tabs } from 'react-bootstrap';
import BookManager from './BookManager';
import UserManager from './UserManager';
import LoanManager from './LoanManager';

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
                                <BookManager />
                            </div>
                        </Tab>

                        {/* ZAKŁADKA UŻYTKOWNICY */}
                        <Tab eventKey="users" title="Użytkownicy">
                            <div className="p-4 bg-white border rounded shadow-sm mt-3">
                                <UserManager />
                            </div>
                        </Tab>

                        <Tab eventKey="loans" title="Wypożyczenia i Kary">
                            <div className="p-4 bg-white border rounded shadow-sm mt-3">
                                <LoanManager />
                            </div>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminPanel;