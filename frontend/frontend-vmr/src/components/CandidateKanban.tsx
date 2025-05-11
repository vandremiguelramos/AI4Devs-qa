import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import CandidateDetails from './CandidateDetails';
import './CandidateKanban.css';
import { Candidate, InterviewFlow, DraggedCandidate, CandidateCardProps } from './KanbanTypes';

// Componente do cartão de candidato
const CandidateCard = ({ candidate, onDragStart, onViewDetails }: CandidateCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  // Determinar a classe de score
  const getScoreClass = () => {
    if (candidate.averageScore === null) return '';
    if (candidate.averageScore >= 4) return 'high-score';
    if (candidate.averageScore >= 3) return 'medium-score';
    return 'low-score';
  };

  // Função para obter o emoji baseado no score
  const getScoreEmoji = () => {
    if (candidate.averageScore === null) return '❓';
    if (candidate.averageScore >= 4) return '🌟';
    if (candidate.averageScore >= 3) return '✅';
    return '⚠️';
  };

  return (
    <Card
      className={`mb-3 candidate-card ${isDragging ? 'dragging' : ''} ${getScoreClass()}`}
      draggable="true"
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, candidate.id, candidate.applicationId);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <Card.Body>
        <Card.Title className="drag-handle">
          {candidate.fullName}
          {candidate.averageScore !== null && (
            <span className="score-indicator" title={`Score: ${candidate.averageScore}`}>
              {getScoreEmoji()}
            </span>
          )}
        </Card.Title>
        <div className="d-flex justify-content-between align-items-center">
          <Badge bg={
            candidate.averageScore === null ? 'secondary' : 
            candidate.averageScore >= 4 ? 'success' : 
            candidate.averageScore >= 3 ? 'warning' : 'danger'
          }>
            Score: {candidate.averageScore === null ? 'N/A' : candidate.averageScore}
          </Badge>
          <Button 
            size="sm" 
            variant="outline-primary"
            className="details-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(candidate.id, candidate.applicationId);
            }}
            onDragStart={(e) => e.stopPropagation()}
          >
            Ver Detalhes
          </Button>
        </div>
      </Card.Body>
      {candidate.averageScore !== null && (
        <div 
          className="score-bar" 
          style={{ 
            width: `${Math.min(100, candidate.averageScore * 20)}%`,
            backgroundColor: candidate.averageScore >= 4 ? '#28a745' : 
                            candidate.averageScore >= 3 ? '#ffc107' : '#dc3545'
          }} 
        />
      )}
    </Card>
  );
};

const CandidateKanban: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const positionId = id ? parseInt(id) : 1;

  const [loading, setLoading] = useState<boolean>(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewFlow, setInterviewFlow] = useState<InterviewFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [draggedCandidate, setDraggedCandidate] = useState<DraggedCandidate | null>(null);
  
  // Estados para o modal de detalhes
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);

  // Carregar os dados da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(''); // Limpar erros anteriores
        
        // Carregar fluxo de entrevista
        let flowResponse;
        try {
          flowResponse = await axios.get(`http://localhost:3010/position/${positionId}/interviewflow`);
          
          // Verificar se a resposta contém os dados esperados
          if (!flowResponse.data || !flowResponse.data.interviewFlow) {
            throw new Error('O formato da resposta do fluxo de entrevista não é válido');
          }
          
          setInterviewFlow(flowResponse.data.interviewFlow);
        } catch (err: any) {
          console.error('Erro ao carregar fluxo de entrevista:', err);
          
          if (axios.isAxiosError(err)) {
            if (err.code === 'ECONNREFUSED' || !err.response) {
              throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            } else if (err.response?.status === 404) {
              throw new Error(`Endpoint de fluxo de entrevista não encontrado: /position/${positionId}/interviewflow. Verifique se as URLs estão corretas.`);
            } else {
              throw new Error(`Erro no fluxo de entrevista: ${err.response?.data?.message || err.message}`);
            }
          } else {
            throw new Error(`Erro ao carregar fluxo de entrevista: ${err.message}`);
          }
        }
        
        // Carregar candidatos
        try {
          const candidatesResponse = await axios.get(`http://localhost:3010/position/${positionId}/candidates`);
          
          // Verificar se a resposta é um array
          if (!Array.isArray(candidatesResponse.data)) {
            throw new Error('O formato da resposta de candidatos não é válido (esperava um array)');
          }
          
          setCandidates(candidatesResponse.data);
        } catch (err: any) {
          console.error('Erro ao carregar candidatos:', err);
          
          if (axios.isAxiosError(err)) {
            if (err.code === 'ECONNREFUSED' || !err.response) {
              throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            } else if (err.response?.status === 404) {
              throw new Error(`Endpoint de candidatos não encontrado: /position/${positionId}/candidates. Verifique se as URLs estão corretas.`);
            } else {
              throw new Error(`Erro ao carregar candidatos: ${err.response?.data?.message || err.message}`);
            }
          } else {
            throw new Error(`Erro ao carregar candidatos: ${err.message}`);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Erro geral ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar os dados. Por favor, tente novamente.');
        setLoading(false);
      }
    };

    fetchData();
  }, [positionId]);

  // Agrupar candidatos por etapa
  const getCandidatesByStep = (stepName: string) => {
    return candidates.filter(candidate => candidate.currentInterviewStep === stepName);
  };

  // Atualizar a etapa de um candidato no backend
  const updateCandidateStage = async (candidateId: number, applicationId: number, newStepId: number) => {
    // Encontrar o candidato e a etapa alvo para atualização otimista
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    const targetStep = interviewFlow?.interviewFlow.interviewSteps.find(step => step.id === newStepId);
    if (!targetStep) return;
    
    // Salvar o valor antigo para caso de rollback
    const originalStepName = candidate.currentInterviewStep;
    
    try {
      // Atualização otimista: mudar a UI imediatamente antes da resposta da API
      const updatedCandidates = candidates.map(c => {
        if (c.id === candidateId) {
          return { ...c, currentInterviewStep: targetStep.name };
        }
        return c;
      });
      
      setCandidates(updatedCandidates);
      
      // Enviar a atualização ao backend usando a rota correta conforme a API
      await axios.put(`http://localhost:3010/candidates/${candidateId}`, {
        applicationId: applicationId,
        currentInterviewStep: newStepId
      });
      
      console.log(`Candidato ${candidateId} movido para etapa "${targetStep.name}" com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar etapa do candidato:', error);
      
      // Rollback em caso de erro
      const rolledBackCandidates = candidates.map(c => {
        if (c.id === candidateId) {
          return { ...c, currentInterviewStep: originalStepName };
        }
        return c;
      });
      
      setCandidates(rolledBackCandidates);
      
      // Exibir mensagem de erro temporária
      setError(`Erro ao mover candidato: ${(error as any)?.message || 'Falha na comunicação com o servidor'}`);
      setTimeout(() => setError(''), 5000); // Limpar mensagem após 5 segundos
      
      // Recarregar candidatos em caso de erro para garantir consistência
      try {
        const response = await axios.get(`http://localhost:3010/position/${positionId}/candidates`);
        setCandidates(response.data);
      } catch (err) {
        console.error('Erro ao recarregar candidatos:', err);
      }
    }
  };

  // Abrir modal de detalhes do candidato
  const handleViewCandidateDetails = (candidateId: number, applicationId: number) => {
    setSelectedCandidateId(candidateId);
    setSelectedApplicationId(applicationId);
    setShowDetails(true);
  };

  // Eventos de drag and drop nativo do HTML5
  const handleDragStart = (e: React.DragEvent, candidateId: number, applicationId: number) => {
    setDraggedCandidate({ id: candidateId, applicationId });
    
    // Salvar o ID do candidato no dataTransfer
    e.dataTransfer.setData('text/plain', candidateId.toString());
    
    // Definir a imagem de arrasto transparente para melhor visualização
    if (e.dataTransfer.setDragImage) {
      const draggedElement = e.currentTarget as HTMLElement;
      const rect = draggedElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // Usar o próprio elemento como imagem de arrasto, mas com transparência
      e.dataTransfer.setDragImage(draggedElement, offsetX, offsetY);
    }
    
    // Definir o efeito de arrasto para 'move'
    e.dataTransfer.effectAllowed = 'move';
    
    // Adicionar classe ao body para indicar que está arrastando
    document.body.classList.add('dragging-active');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Adicionar classe visual para destacar a coluna
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remover classe visual quando o arrasto sai da coluna
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent, stepId: number) => {
    e.preventDefault();
    
    // Remover classe visual
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drag-over');
    }
    
    // Verificar se temos um candidato sendo arrastado
    if (!draggedCandidate) {
      const candidateId = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        setDraggedCandidate({ id: candidateId, applicationId: candidate.applicationId });
      } else {
        return; // Não encontrou o candidato, sai da função
      }
    }
    
    // Agora temos certeza que draggedCandidate existe
    const { id: candidateId, applicationId } = draggedCandidate!;
    const candidate = candidates.find(c => c.id === candidateId);
    
    if (!candidate) return;
    
    // Verificar se o candidato está sendo movido para uma etapa diferente
    const targetStep = interviewFlow?.interviewFlow.interviewSteps.find(step => step.id === stepId);
    if (!targetStep || targetStep.name === candidate.currentInterviewStep) {
      return;
    }
    
    // Atualizar a etapa do candidato
    updateCandidateStage(candidateId, applicationId, stepId);
    setDraggedCandidate(null);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
    
    // Remover todas as classes drag-over que possam ter ficado
    document.querySelectorAll('.drag-over').forEach(element => {
      element.classList.remove('drag-over');
    });
    
    // Remover a classe do body
    document.body.classList.remove('dragging-active');
  };

  if (loading) {
    return <div className="text-center mt-5">Carregando...</div>;
  }

  if (error) {
    return (
      <Container fluid className="mt-5">
        <div className="text-center">
          <div className="alert alert-danger">
            <h4>Erro ao Carregar Dados</h4>
            <p>{error}</p>
            <Button 
              variant="outline-primary" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
            <hr />
            <small>
              Se o erro persistir, verifique:
              <ul className="text-start mt-2">
                <li>O servidor backend está rodando na porta 3010?</li>
                <li>As URLs dos endpoints estão configuradas corretamente?</li>
                <li>Existe algum problema de CORS impedindo as requisições?</li>
                <li>Os formatos de dados estão compatíveis entre frontend e backend?</li>
              </ul>
              <p className="text-start">Para diagnóstico detalhado, acesse a <Link to="/kanban-test">página de teste de API</Link>.</p>
            </small>
          </div>
        </div>
      </Container>
    );
  }

  if (!interviewFlow) {
    return <div className="text-center mt-5">Fluxo de entrevista não encontrado.</div>;
  }

  const sortedSteps = [...interviewFlow.interviewFlow.interviewSteps]
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Calcular estatísticas para o cabeçalho
  const totalCandidates = candidates.length;
  const evaluatedCandidates = candidates.filter(c => c.averageScore !== null).length;
  const progressPercentage = Math.floor((evaluatedCandidates / totalCandidates) * 100) || 0;
  
  // Calcular estatísticas adicionais
  const averageScore = candidates.length > 0 
    ? (candidates.reduce((sum, c) => sum + (c.averageScore || 0), 0) / 
       (candidates.filter(c => c.averageScore !== null).length || 1)).toFixed(1)
    : "0.0";
  
  // Candidatos por etapa para estatísticas
  const candidatesByStage = sortedSteps.map(step => ({
    name: step.name,
    count: getCandidatesByStep(step.name).length,
    percentage: Math.round((getCandidatesByStep(step.name).length / totalCandidates) * 100) || 0
  }));

  return (
    <Container fluid className="mt-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <div className="d-flex align-items-center">
                <Link to="/positions" className="back-arrow me-3">
                  <i className="fas fa-arrow-left"></i>
                </Link>
                <div>
                  <h2 className="mb-1">Kanban de Candidatos</h2>
                  <h5 className="text-muted">{interviewFlow.positionName}</h5>
                </div>
              </div>
            </div>
            <div className="text-end">
              <div className="fs-5">
                <Badge bg="primary" className="me-2">Total: {totalCandidates}</Badge>
                <Badge bg="success">Avaliados: {evaluatedCandidates}</Badge>
                {averageScore && <Badge bg="info" className="ms-2">Score Médio: {averageScore}</Badge>}
              </div>
              <p className="text-muted mb-0 mt-2">Progresso do processo seletivo: {progressPercentage}%</p>
            </div>
          </div>
          
          {/* Barra de progresso do processo seletivo */}
          <div className="kanban-progress mb-3">
            <div 
              className="kanban-progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Distribuição de candidatos por etapa */}
          <div className="stage-distribution mb-2">
            {candidatesByStage.map((stageData, index) => (
              <div 
                key={index} 
                className="stage-bar" 
                style={{ 
                  width: `${stageData.percentage}%`,
                  backgroundColor: index === 0 ? '#6610f2' : 
                                  index === 1 ? '#007bff' : 
                                  index === 2 ? '#28a745' : '#17a2b8',
                  minWidth: stageData.count > 0 ? '30px' : '0'
                }}
                title={`${stageData.name}: ${stageData.count} candidatos (${stageData.percentage}%)`}
              >
                {stageData.count > 0 && <span>{stageData.count}</span>}
              </div>
            ))}
          </div>
          <div className="text-center mb-3">
            <small className="text-muted">Distribuição de candidatos por etapa</small>
            <div className="stage-colors-legend mt-1">
              {candidatesByStage.map((stageData, index) => (
                <div key={index} className="stage-color-item">
                  <span 
                    className="color-dot" 
                    style={{
                      backgroundColor: index === 0 ? '#6610f2' : 
                                        index === 1 ? '#007bff' : 
                                        index === 2 ? '#28a745' : '#17a2b8'
                    }}
                  ></span>
                  <span className="stage-name">{stageData.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legenda dos ícones */}
          <div className="icons-legend mt-3 mb-2">
            <div className="d-flex justify-content-center flex-wrap">
              <div className="legend-item">
                <span className="legend-icon high-score-icon">🌟</span>
                <span className="legend-text">Score Alto (4-5)</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon medium-score-icon">✅</span>
                <span className="legend-text">Score Médio (3-3.9)</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon low-score-icon">⚠️</span>
                <span className="legend-text">Score Baixo (0-2.9)</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">❓</span>
                <span className="legend-text">Sem Avaliação</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">☰</span>
                <span className="legend-text">Arrastar</span>
              </div>
            </div>
          </div>
          
          {/* Legenda das cores de borda */}
          <div className="card-border-legend mt-1 mb-3">
            <div className="d-flex justify-content-center flex-wrap">
              <div className="border-legend-item high-score-border">
                <span className="border-legend-text">Score Alto</span>
              </div>
              <div className="border-legend-item medium-score-border">
                <span className="border-legend-text">Score Médio</span>
              </div>
              <div className="border-legend-item low-score-border">
                <span className="border-legend-text">Score Baixo</span>
              </div>
              <div className="border-legend-item default-score-border">
                <span className="border-legend-text">Sem Avaliação</span>
              </div>
            </div>
          </div>
          
          <p className="text-muted mt-2 mb-0">
            <i className="fas fa-info-circle me-1"></i> Arraste os cartões entre as colunas para atualizar o status dos candidatos.
          </p>
        </Card.Body>
      </Card>
      
      <Row className="kanban-board">
        {sortedSteps.map(step => (
          <Col key={step.id} md={4} className="mb-4">
            <Card className="shadow-sm h-100">
              <div className="kanban-column-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{step.name}</h5>
                  <div className="candidate-counter">
                    {getCandidatesByStep(step.name).length}
                  </div>
                </div>
              </div>
              <Card.Body 
                className="kanban-column" 
                style={{ minHeight: '500px', padding: '15px' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, step.id)}
              >
                {getCandidatesByStep(step.name).length === 0 && (
                  <div 
                    className="empty-column-message"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, step.id)}
                  >
                    <div>
                      <p className="mb-0">Sem candidatos</p>
                      <small>Arraste um candidato para esta etapa</small>
                    </div>
                  </div>
                )}
                
                {getCandidatesByStep(step.name).map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onDragStart={handleDragStart}
                    onViewDetails={handleViewCandidateDetails}
                  />
                ))}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal de Detalhes do Candidato */}
      <CandidateDetails 
        show={showDetails}
        onHide={() => {
          setShowDetails(false);
          // Recarregar candidatos após fechar o modal para refletir possíveis atualizações
          const fetchCandidates = async () => {
            try {
              const response = await axios.get(`http://localhost:3010/position/${positionId}/candidates`);
              setCandidates(response.data);
            } catch (err) {
              console.error('Erro ao recarregar candidatos:', err);
            }
          };
          fetchCandidates();
        }}
        candidateId={selectedCandidateId}
        applicationId={selectedApplicationId}
      />
    </Container>
  );
};

export default CandidateKanban; 