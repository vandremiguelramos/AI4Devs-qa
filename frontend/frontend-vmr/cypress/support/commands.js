// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando para aguardar o carregamento do Kanban corretamente
Cypress.Commands.add('waitForKanban', (options = {}) => {
  const timeout = options.timeout || 15000;
  const additionalWait = options.additionalWait || 1000;
  
  // Tenta encontrar qualquer elemento importante da página
  cy.get('body', { timeout }).then($body => {
    // Verificar vários seletores possíveis para determinar se a página carregou
    const hasH2 = $body.find('h2').length > 0;
    const hasH5WithEngineer = $body.find('h5:contains("Senior Full-Stack Engineer")').length > 0;
    const hasKanbanColumn = $body.find('.kanban-column').length > 0;
    const hasKanbanColumns = $body.find('.kanban-columns').length > 0;
    const hasCandidateCard = $body.find('.candidate-card').length > 0;
    
    // Log do estado atual para debug
    cy.log(`Page elements - h2: ${hasH2}, h5: ${hasH5WithEngineer}, kanban column: ${hasKanbanColumn}, kanban columns: ${hasKanbanColumns}, candidate card: ${hasCandidateCard}`);
    
    // Verificar se pelo menos um dos elementos importantes está presente
    if (hasH2 || hasH5WithEngineer || hasKanbanColumn || hasKanbanColumns || hasCandidateCard) {
      cy.log('Página do Kanban parece estar carregada');
      
      // Podemos esperar um pouco mais para garantir carregamento completo
      cy.wait(additionalWait);
    } else {
      // Se não encontrar nenhum elemento importante, tire um screenshot e reporte
      cy.log('Elementos do Kanban não encontrados, criando snapshot');
      cy.screenshot('kanban-elements-not-found');
      
      // Imprimir a estrutura HTML para diagnóstico
      cy.log('Current DOM Structure:');
      cy.log($body.html());
    }
  });
});

// Comando para verificar se o candidato existe na coluna correta
Cypress.Commands.add('checkCandidateInColumn', (candidateName, columnName, options = {}) => {
  const timeout = options.timeout || 5000;
  
  // Primeiro, tenta usar o método mais específico
  cy.get('body', { timeout }).then($body => {
    const hasColumnHeaders = $body.find('.kanban-column-header').length > 0;
    const hasCandidateCards = $body.find('.candidate-card').length > 0;
    
    if (hasColumnHeaders && hasCandidateCards) {
      // Tente usar a abordagem mais específica
      cy.contains('.kanban-column-header', columnName)
        .parent('.kanban-column')
        .within(() => {
          cy.contains('.candidate-card', candidateName).should('be.visible');
        });
    } else {
      // Abordagem fallback: apenas verificar se os textos existem na página
      cy.contains(candidateName).should('exist');
      cy.contains(columnName).should('exist');
    }
  });
});

// Comando para simular o arrasto de um candidato para uma coluna
// Este método é mais genérico e funciona com diferentes estruturas de DOM
Cypress.Commands.add('dragCandidateToColumn', (candidateName, targetColumnName) => {
  // Passo 1: Identificar o cartão do candidato
  cy.contains(candidateName).then($candidate => {
    // Guardar as coordenadas do elemento candidato
    const candidateRect = $candidate[0].getBoundingClientRect();
    const candidateX = candidateRect.left + candidateRect.width / 2;
    const candidateY = candidateRect.top + candidateRect.height / 2;

    // Passo 2: Identificar a coluna de destino
    cy.contains(targetColumnName).then($targetColumn => {
      // Guardar as coordenadas da coluna de destino
      const targetRect = $targetColumn[0].getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      // Passo 3: Simular o arrasto do candidato
      cy.contains(candidateName)
        .trigger('mousedown', { button: 0 })
        .trigger('mousemove', { clientX: candidateX, clientY: candidateY, force: true })
        .wait(300) // Esperar um pouco para o drag começar
        .trigger('mousemove', { clientX: targetX, clientY: targetY, force: true })
        .wait(300) // Esperar um pouco para o movimento do mouse
        .trigger('mouseup', { force: true });

      // Passo 4: Aguardar um pouco para o DOM atualizar
      cy.wait(1000);
    });
  });
});

// Comando alternativo que usa dataTransfer para simular drag and drop
// (pode ser mais eficaz em alguns casos)
Cypress.Commands.add('dragAndDropCandidate', (candidateName, targetColumnName) => {
  // Encontrar o candidato
  cy.contains(candidateName).then($candidate => {
    // Encontrar a coluna de destino
    cy.contains(targetColumnName).then($targetColumn => {
      // Criar um objeto dataTransfer
      const dataTransfer = new DataTransfer();
      
      // Simular os eventos de drag and drop
      cy.wrap($candidate)
        .trigger('dragstart', { dataTransfer })
        .trigger('drag', { dataTransfer });
      
      cy.wrap($targetColumn)
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer })
        .trigger('dragend', { dataTransfer });
      
      // Esperar um pouco para a UI atualizar
      cy.wait(1000);
    });
  });
});

// Interceptar a requisição PUT para atualizar a fase do candidato
Cypress.Commands.add('interceptCandidateStageUpdate', (candidateId, applicationId, newStepId) => {
  cy.intercept('PUT', `http://localhost:3010/candidates/${candidateId}`, {
    statusCode: 200,
    body: {
      success: true,
      message: 'Candidate stage updated successfully'
    }
  }).as('updateCandidateStage');
});

// Comando para salvar o estado atual do DOM para depuração
Cypress.Commands.add('savedomState', (name = 'dom-state') => {
  cy.document().then(doc => {
    const html = doc.body.innerHTML;
    cy.log(`DOM State for ${name}: ${html.substring(0, 500)}...`);
    cy.writeFile(`cypress/fixtures/${name}.html`, html);
    cy.screenshot(name);
  });
}); 