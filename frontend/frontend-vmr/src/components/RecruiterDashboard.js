import React from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/lti-logo.png'; // Ruta actualizada para importar desde src/assets

const RecruiterDashboard = () => {
    return (
        <Container className="mt-5">
            <div className="text-center"> {/* Contenedor para el logo */}
                <img src={logo} alt="LTI Logo" style={{ width: '150px' }} />
            </div>
            <h1 className="mb-4 text-center">Dashboard do Recrutador</h1>
            <Row>
                <Col md={3}>
                    <Card className="shadow p-4 mb-4">
                        <h5 className="mb-4">Adicionar Candidato</h5>
                        <Link to="/add-candidate">
                            <Button variant="primary" className="w-100">Adicionar Novo Candidato</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow p-4 mb-4">
                        <h5 className="mb-4">Ver Posições</h5>
                        <Link to="/positions">
                            <Button variant="primary" className="w-100">Ir para Posições</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow p-4 mb-4">
                        <h5 className="mb-4">Kanban de Candidatos</h5>
                        <Link to="/positions/1/kanban">
                            <Button variant="success" className="w-100">Ver Kanban</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow p-4 mb-4">
                        <h5 className="mb-4">Diagnóstico</h5>
                        <Link to="/kanban-test">
                            <Button variant="info" className="w-100">Testar API</Button>
                        </Link>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RecruiterDashboard;