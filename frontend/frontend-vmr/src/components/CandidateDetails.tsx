import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, Row, Col, Form } from 'react-bootstrap';
import axios from 'axios';
import './CandidateDetails.css';

interface CandidateDetailsProps {
  show: boolean;
  onHide: () => void;
  candidateId: number | null;
  applicationId: number | null;
}

interface CandidateDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  applications: {
    id: number;
    currentInterviewStep: number;
    position: {
      title: string;
    };
    interviews: {
      interviewDate: string;
      interviewStep: {
        name: string;
      };
      score: number;
      notes: string;
    }[];
    notes: string;
  }[];
  educations: {
    id: number;
    institution: string;
    title: string;
    startDate: string;
    endDate: string;
  }[];
  workExperiences: {
    id: number;
    company: string;
    position: string;
    description: string;
    startDate: string;
    endDate: string;
  }[];
}

const CandidateDetails: React.FC<CandidateDetailsProps> = ({ show, onHide, candidateId, applicationId }) => {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (candidateId && show) {
      fetchCandidateDetails();
    }
  }, [candidateId, show]);

  const fetchCandidateDetails = async () => {
    if (!candidateId) return;
    
    try {
      setLoading(true);
      setError(''); // Limpar erros anteriores
      const response = await axios.get(`http://localhost:3010/candidates/${candidateId}`);
      
      if (!response.data) {
        throw new Error('Dados do candidato não encontrados');
      }
      
      setCandidate(response.data);
      
      // Encontrar as notas da aplicação atual
      if (applicationId && response.data && response.data.applications) {
        const currentApp = response.data.applications.find((app: any) => app.id === applicationId);
        if (currentApp) {
          setNotes(currentApp.notes || '');
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do candidato:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError(`Candidato não encontrado (ID: ${candidateId}). Verifique se a URL está correta.`);
        } else if (err.response?.status === 500) {
          setError('Erro no servidor. Por favor, tente novamente mais tarde.');
        } else if (!err.response) {
          setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        } else {
          setError(`Erro ao carregar dados: ${err.response?.data?.message || err.message}`);
        }
      } else {
        setError(`Erro inesperado: ${err.message}`);
      }
      
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!applicationId) return;
    
    try {
      setError(''); // Limpar erros anteriores
      await axios.put(`http://localhost:3010/applications/${applicationId}/notes`, {
        notes: notes
      });
      
      onHide(); // Fechar o modal após salvar
    } catch (err: any) {
      console.error('Erro ao salvar notas:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError(`Aplicação não encontrada (ID: ${applicationId}). Verifique se a URL está correta.`);
        } else if (err.response?.status === 500) {
          setError('Erro no servidor ao salvar as notas. Por favor, tente novamente mais tarde.');
        } else if (!err.response) {
          setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        } else {
          setError(`Erro ao salvar notas: ${err.response?.data?.message || err.message}`);
        }
      } else {
        setError(`Erro inesperado ao salvar: ${err.message}`);
      }
    }
  };

  // Encontrar a aplicação atual
  const currentApplication = candidate?.applications.find(app => app.id === applicationId);

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="candidate-details-modal">
      <Modal.Header closeButton className="border-bottom-0 bg-light">
        <Modal.Title>
          {candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Detalhes do Candidato'}
          {currentApplication && (
            <Badge bg="primary" className="ms-2">{currentApplication.position.title}</Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {loading ? (
          <div className="text-center my-4 py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 text-muted">Carregando detalhes do candidato...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger p-3 shadow-sm">
            <h6 className="mb-2">Erro ao carregar dados</h6>
            <p className="mb-0">{error}</p>
          </div>
        ) : candidate ? (
          <>
            <Row>
              <Col md={6} className="border-end">
                <div className="candidate-profile mb-4">
                  <div className="profile-avatar mb-3">
                    {candidate.firstName && candidate.lastName && (
                      <div className="avatar-circle">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="contact-info">
                    <h5 className="mb-3">Informações de Contato</h5>
                    <p className="mb-2">
                      <i className="fas fa-envelope me-2 text-muted"></i> 
                      <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
                    </p>
                    <p className="mb-2">
                      <i className="fas fa-phone me-2 text-muted"></i> 
                      {candidate.phone || 'Não informado'}
                    </p>
                    <p className="mb-3">
                      <i className="fas fa-map-marker-alt me-2 text-muted"></i> 
                      {candidate.address || 'Não informado'}
                    </p>
                  </div>
                </div>
                
                {currentApplication && (
                  <div className="interview-history mb-4">
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-history me-2"></i>
                      Histórico de Entrevistas
                    </h5>
                    
                    {currentApplication.interviews && currentApplication.interviews.length > 0 ? (
                      <div className="timeline">
                        {currentApplication.interviews.map((interview, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker">
                              <Badge 
                                bg={
                                  interview.score >= 4 ? 'success' : 
                                  interview.score >= 3 ? 'warning' : 'danger'
                                }
                                pill
                              >
                                {interview.score || '?'}
                              </Badge>
                            </div>
                            <div className="timeline-content">
                              <div className="card shadow-sm mb-3">
                                <div className="card-body">
                                  <h6 className="card-title">{interview.interviewStep.name}</h6>
                                  <p className="text-muted mb-2">
                                    <small>
                                      <i className="far fa-calendar me-1"></i> 
                                      {formatDate(interview.interviewDate)}
                                    </small>
                                  </p>
                                  {interview.notes && (
                                    <div className="notes-section">
                                      <h6 className="text-muted">Observações:</h6>
                                      <p className="mb-0 notes-text">{interview.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-light">
                        <p className="mb-0">Nenhuma entrevista realizada ainda</p>
                      </div>
                    )}
                  </div>
                )}
              </Col>
              
              <Col md={6}>
                <div className="notes-section mb-4">
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-sticky-note me-2"></i>
                    Anotações
                  </h5>
                  <Form.Group>
                    <Form.Control 
                      as="textarea" 
                      rows={5} 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione notas sobre este candidato..."
                      className="shadow-sm"
                    />
                    <small className="text-muted d-block mt-2">
                      Estas anotações são internas e não são compartilhadas com o candidato.
                    </small>
                  </Form.Group>
                </div>

                <div className="education-section mb-4">
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-graduation-cap me-2"></i>
                    Formação Acadêmica
                  </h5>
                  {candidate.educations && candidate.educations.length > 0 ? (
                    <div className="education-list">
                      {candidate.educations.map((edu, index) => (
                        <div key={index} className="education-item card shadow-sm mb-3">
                          <div className="card-body">
                            <h6 className="institution-name">{edu.institution}</h6>
                            <p className="degree-title mb-1">{edu.title}</p>
                            <p className="period text-muted mb-0">
                              <small>
                                <i className="far fa-calendar-alt me-1"></i>
                                {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Atual'}
                              </small>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-light">
                      <p className="mb-0">Nenhuma informação educacional disponível</p>
                    </div>
                  )}
                </div>

                <div className="experience-section">
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-briefcase me-2"></i>
                    Experiência Profissional
                  </h5>
                  {candidate.workExperiences && candidate.workExperiences.length > 0 ? (
                    <div className="experience-list">
                      {candidate.workExperiences.map((exp, index) => (
                        <div key={index} className="experience-item card shadow-sm mb-3">
                          <div className="card-body">
                            <h6 className="company-name">{exp.company}</h6>
                            <p className="position-title mb-1">{exp.position}</p>
                            <p className="description mb-2">{exp.description}</p>
                            <p className="period text-muted mb-0">
                              <small>
                                <i className="far fa-calendar-alt me-1"></i>
                                {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Atual'}
                              </small>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-light">
                      <p className="mb-0">Nenhuma experiência profissional disponível</p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center py-5">
            <p className="text-muted">Nenhum candidato selecionado</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 bg-light">
        <Button variant="outline-secondary" onClick={onHide}>
          Fechar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSaveNotes}
          disabled={loading || !candidateId}
        >
          <i className="fas fa-save me-1"></i> Salvar Anotações
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CandidateDetails; 