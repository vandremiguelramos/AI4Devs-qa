import React, { useState } from 'react';
import { Button, Container, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

// Interface para os resultados do teste
interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

const CandidateKanbanTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');

  // Posição de teste para usar nos testes
  const testPositionId = 1;

  // Testar a conexão com o servidor
  const testServerConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3010/api/health', { timeout: 5000 });
      setServerStatus('online');
      return { 
        endpoint: '/api/health', 
        status: 'success', 
        message: 'Servidor está online e respondendo corretamente.' 
      } as TestResult;
    } catch (error) {
      console.error('Erro ao testar conexão com o servidor:', error);
      setServerStatus('offline');
      return { 
        endpoint: '/api/health', 
        status: 'error', 
        message: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3010.' 
      } as TestResult;
    } finally {
      setLoading(false);
    }
  };

  // Testar endpoint de fluxo de entrevista
  const testInterviewFlowEndpoint = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3010/position/${testPositionId}/interviewflow`);
      
      // Verificar se a estrutura da resposta está correta
      if (response.data && 
          response.data.interviewFlow && 
          response.data.interviewFlow.interviewFlow &&
          Array.isArray(response.data.interviewFlow.interviewFlow.interviewSteps)) {
        
        // Verificar estrutura detalhada das etapas
        const steps = response.data.interviewFlow.interviewFlow.interviewSteps;
        const hasValidStructure = steps.every((step: any) => 
          typeof step.id === 'number' && 
          typeof step.name === 'string' && 
          typeof step.orderIndex === 'number'
        );
        
        if (hasValidStructure) {
          return { 
            endpoint: `/position/${testPositionId}/interviewflow`, 
            status: 'success', 
            message: 'Endpoint de fluxo de entrevista está funcionando corretamente.', 
            data: response.data 
          } as TestResult;
        } else {
          return { 
            endpoint: `/position/${testPositionId}/interviewflow`, 
            status: 'error', 
            message: 'Os passos de entrevista não têm os campos esperados (id, name, orderIndex).', 
            data: response.data 
          } as TestResult;
        }
      } else {
        return { 
          endpoint: `/position/${testPositionId}/interviewflow`, 
          status: 'error', 
          message: 'Endpoint retornou dados em formato inesperado. Verifique a estrutura da resposta.', 
          data: response.data 
        } as TestResult;
      }
    } catch (error) {
      console.error('Erro ao testar endpoint de fluxo de entrevista:', error);
      return { 
        endpoint: `/position/${testPositionId}/interviewflow`, 
        status: 'error', 
        message: `Erro ao acessar endpoint de fluxo de entrevista: ${(error as any)?.message || 'Erro desconhecido'}` 
      } as TestResult;
    } finally {
      setLoading(false);
    }
  };

  // Testar endpoint de candidatos
  const testCandidatesEndpoint = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3010/position/${testPositionId}/candidates`);
      
      // Verificar se a resposta é um array
      if (Array.isArray(response.data)) {
        // Verificar se os itens do array têm a estrutura esperada
        const hasValidStructure = response.data.length === 0 || response.data.every((candidate: any) => 
          typeof candidate.id === 'number' && 
          typeof candidate.fullName === 'string' && 
          typeof candidate.currentInterviewStep === 'string' && 
          (candidate.averageScore === null || typeof candidate.averageScore === 'number') &&
          typeof candidate.applicationId === 'number'
        );
        
        if (hasValidStructure) {
          return { 
            endpoint: `/position/${testPositionId}/candidates`, 
            status: 'success', 
            message: 'Endpoint de candidatos está funcionando corretamente.', 
            data: response.data 
          } as TestResult;
        } else {
          return { 
            endpoint: `/position/${testPositionId}/candidates`, 
            status: 'error', 
            message: 'Os candidatos não têm os campos esperados (id, fullName, currentInterviewStep, averageScore, applicationId).', 
            data: response.data 
          } as TestResult;
        }
      } else {
        return { 
          endpoint: `/position/${testPositionId}/candidates`, 
          status: 'error', 
          message: 'Endpoint retornou dados em formato inesperado. Esperava-se um array de candidatos.', 
          data: response.data 
        } as TestResult;
      }
    } catch (error) {
      console.error('Erro ao testar endpoint de candidatos:', error);
      return { 
        endpoint: `/position/${testPositionId}/candidates`, 
        status: 'error', 
        message: `Erro ao acessar endpoint de candidatos: ${(error as any)?.message || 'Erro desconhecido'}` 
      } as TestResult;
    } finally {
      setLoading(false);
    }
  };

  // Testar endpoint de atualização de etapa
  const testUpdateStageEndpoint = async () => {
    try {
      setLoading(true);
      
      // Primeiro, obter um candidato para teste
      let candidateResponse;
      try {
        candidateResponse = await axios.get(`http://localhost:3010/position/${testPositionId}/candidates`);
      } catch (err) {
        return {
          endpoint: `/candidates/:id`,
          status: 'error',
          message: 'Não foi possível obter um candidato para testar a atualização de etapa.'
        } as TestResult;
      }
      
      if (!Array.isArray(candidateResponse.data) || candidateResponse.data.length === 0) {
        return {
          endpoint: `/candidates/:id`,
          status: 'error',
          message: 'Não há candidatos disponíveis para testar a atualização de etapa.'
        } as TestResult;
      }
      
      // Obter fluxo de entrevista para identificar uma etapa
      let interviewFlowResponse;
      try {
        interviewFlowResponse = await axios.get(`http://localhost:3010/position/${testPositionId}/interviewflow`);
      } catch (err) {
        return {
          endpoint: `/candidates/:id`,
          status: 'error',
          message: 'Não foi possível obter o fluxo de entrevista para testar a atualização de etapa.'
        } as TestResult;
      }
      
      if (!interviewFlowResponse.data?.interviewFlow?.interviewFlow?.interviewSteps || 
          !Array.isArray(interviewFlowResponse.data?.interviewFlow?.interviewFlow?.interviewSteps) ||
          interviewFlowResponse.data.interviewFlow.interviewFlow.interviewSteps.length === 0) {
        return {
          endpoint: `/candidates/:id`,
          status: 'error',
          message: 'Não há etapas de entrevista disponíveis para testar a atualização.'
        } as TestResult;
      }
      
      // Selecionar o primeiro candidato e a primeira etapa de entrevista
      const candidate = candidateResponse.data[0];
      const interviewStep = interviewFlowResponse.data.interviewFlow.interviewFlow.interviewSteps[0];
      
      // Testar o endpoint de atualização de etapa diretamente
      try {
        // Apenas verificar se o endpoint responde ao OPTIONS
        await axios.options(`http://localhost:3010/candidates/${candidate.id}`);
        return {
          endpoint: `/candidates/:id`,
          status: 'success',
          message: `Endpoint para atualização de etapa está disponível (apenas verificado, não executado).`,
          data: {
            payload: {
              applicationId: candidate.applicationId,
              currentInterviewStep: interviewStep.id
            },
            note: 'Endpoint não foi chamado para evitar modificar dados reais'
          }
        } as TestResult;
      } catch (err) {
        return {
          endpoint: `/candidates/:id`,
          status: 'error',
          message: `Endpoint de atualização de etapa não está disponível: ${(err as any)?.message || 'Erro desconhecido'}`
        } as TestResult;
      }
    } catch (error) {
      console.error('Erro ao testar endpoint de atualização de etapa:', error);
      return { 
        endpoint: `/candidates/:id`, 
        status: 'error', 
        message: `Erro geral ao testar atualização de etapa: ${(error as any)?.message || 'Erro desconhecido'}` 
      } as TestResult;
    } finally {
      setLoading(false);
    }
  };

  // Executar todos os testes
  const runAllTests = async () => {
    setResults([]);
    setLoading(true);
    
    // Testar servidor primeiro
    const serverResult = await testServerConnection();
    setResults(prev => [...prev, serverResult]);
    
    // Se o servidor estiver online, continuar com os outros testes
    if (serverResult.status === 'success') {
      const interviewFlowResult = await testInterviewFlowEndpoint();
      const candidatesResult = await testCandidatesEndpoint();
      const updateStageResult = await testUpdateStageEndpoint();
      
      setResults(prev => [...prev, interviewFlowResult, candidatesResult, updateStageResult]);
    }
    
    setLoading(false);
  };

  return (
    <Container className="mt-4">
      <h2>Teste de API do Kanban de Candidatos</h2>
      <p>Esta página testa se os endpoints necessários para o funcionamento do Kanban estão operando corretamente.</p>
      
      <div className="mb-4">
        <Button 
          variant="primary" 
          onClick={runAllTests} 
          disabled={loading}
          className="me-2"
        >
          {loading ? 'Executando testes...' : 'Executar Todos os Testes'}
        </Button>
        
        {serverStatus !== 'unknown' && (
          <Alert variant={serverStatus === 'online' ? 'success' : 'danger'} className="mt-2">
            Status do Servidor: {serverStatus === 'online' ? 'Online' : 'Offline'}
          </Alert>
        )}
      </div>
      
      {results.length > 0 && (
        <div>
          <h3>Resultados dos Testes</h3>
          {results.map((result, index) => (
            <Card key={index} className="mb-3" border={result.status === 'success' ? 'success' : 'danger'}>
              <Card.Header className={`bg-${result.status === 'success' ? 'success' : 'danger'} text-white`}>
                Endpoint: {result.endpoint}
              </Card.Header>
              <Card.Body>
                <Card.Title>
                  Status: {result.status === 'success' ? 'Sucesso' : 'Erro'}
                </Card.Title>
                <Card.Text>{result.message}</Card.Text>
                
                {result.data && (
                  <div className="mt-3">
                    <h6>Dados Retornados (Amostra):</h6>
                    <pre className="bg-light p-2" style={{maxHeight: '150px', overflow: 'auto'}}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
          
          {results.some(r => r.status === 'error') && (
            <Alert variant="warning">
              <h5>Sugestões de Solução:</h5>
              <ul>
                <li>Verifique se o servidor backend está rodando em http://localhost:3010</li>
                <li>Verifique se os endpoints estão configurados corretamente no backend</li>
                <li>Verifique se você tem as permissões necessárias para acessar esses endpoints</li>
                <li>Confira se a estrutura das interfaces no frontend corresponde ao formato da resposta da API</li>
                <li>Verifique se existe algum problema de CORS impedindo as requisições</li>
              </ul>
            </Alert>
          )}
          
          <Card className="mt-4">
            <Card.Header>
              <h5>Análise do Componente CandidateKanban</h5>
            </Card.Header>
            <Card.Body>
              <h6>Problemas Comuns e Soluções</h6>
              
              <div className="mb-3">
                <strong>1. Problema de CORS</strong>
                <p>Se você está vendo erros como "Access to XMLHttpRequest at 'http://localhost:3010/...' from origin 'http://localhost:3000' has been blocked by CORS policy", o backend não está configurado para aceitar requisições do seu frontend.</p>
                <Alert variant="info">
                  <strong>Solução:</strong> Adicione os seguintes cabeçalhos ao seu servidor backend:
                  <pre className="mt-2 bg-light p-2">
{`// Em Express.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});`}
                  </pre>
                </Alert>
              </div>
              
              <div className="mb-3">
                <strong>2. Servidor Backend Offline</strong>
                <p>Se o servidor não está respondendo, verifique se o backend está rodando na porta correta.</p>
                <Alert variant="info">
                  <strong>Solução:</strong> Inicie seu servidor com:
                  <pre className="mt-2 bg-light p-2">
{`cd /caminho/para/seu/backend
npm start`}
                  </pre>
                </Alert>
              </div>
              
              <div className="mb-3">
                <strong>3. Formato da Resposta Incompatível</strong>
                <p>O componente CandidateKanban espera um formato específico de dados. Se a API retorna um formato diferente, você verá erros.</p>
                <Alert variant="info">
                  <strong>Solução:</strong> Modifique o componente CandidateKanban para processar o formato de resposta atual:
                  <pre className="mt-2 bg-light p-2">
{`// Exemplo de ajuste para um formato diferente:
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Carregar fluxo de entrevista
      const flowResponse = await axios.get(\`http://localhost:3010/positions/\${positionId}/interviewFlow\`);
      
      // Adaptador para formato de API diferente
      const adaptedData = {
        positionName: flowResponse.data.title || 'Posição',
        interviewFlow: {
          id: flowResponse.data.id || 1,
          description: flowResponse.data.description || '',
          interviewSteps: flowResponse.data.steps || []
        }
      };
      
      setInterviewFlow(adaptedData);
      
      // ... resto do código ...
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(\`Erro ao carregar os dados: \${err.message}\`);
      setLoading(false);
    }
  };

  fetchData();
}, [positionId]);`}
                  </pre>
                </Alert>
              </div>
              
              <div className="mb-3">
                <strong>4. Melhor Tratamento de Erros</strong>
                <p>O componente atual mostra apenas uma mensagem genérica quando há erro. Um tratamento mais detalhado ajudaria a identificar problemas.</p>
                <Alert variant="info">
                  <strong>Solução:</strong> Adicione tratamento de erro mais detalhado:
                  <pre className="mt-2 bg-light p-2">
{`catch (err) {
  console.error('Erro ao carregar dados:', err);
  
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNREFUSED' || !err.response) {
      setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    } else if (err.response?.status === 404) {
      setError('Endpoint não encontrado. Verifique se as URLs estão corretas.');
    } else if (err.response?.status === 403 || err.response?.status === 401) {
      setError('Acesso negado. Verifique suas permissões de acesso.');
    } else {
      setError(\`Erro ao carregar os dados: \${err.response?.data?.message || err.message}\`);
    }
  } else {
    setError(\`Erro ao carregar os dados: \${err.message || 'Erro desconhecido'}\`);
  }
  
  setLoading(false);
}`}
                  </pre>
                </Alert>
              </div>
              
              <div>
                <strong>5. Verificar Estrutura da URL</strong>
                <p>Certifique-se de que as URLs dos endpoints estão corretamente formatadas.</p>
                <Alert variant="info">
                  <strong>URLs esperadas pelo componente:</strong>
                  <ul className="mb-0 mt-2">
                    <li>GET <code>http://localhost:3010/position/{`{positionId}`}/interviewflow</code></li>
                    <li>GET <code>http://localhost:3010/position/{`{positionId}`}/candidates</code></li>
                    <li>PUT <code>http://localhost:3010/candidates/{`{candidateId}`}</code> (com payload: applicationId, currentInterviewStep)</li>
                    <li>GET <code>http://localhost:3010/candidate/{`{candidateId}`}</code></li>
                    <li>PUT <code>http://localhost:3010/application/{`{applicationId}`}/notes</code></li>
                  </ul>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default CandidateKanbanTest; 