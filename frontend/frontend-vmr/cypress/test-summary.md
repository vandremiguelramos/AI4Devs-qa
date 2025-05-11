# Resumen de Pruebas E2E con Cypress

## Visión General
Este documento resume las pruebas E2E implementadas con Cypress para la aplicación del tablero kanban de candidatos.

## Suites de Prueba

### 1. Funcionalidad Básica del Kanban (`kanban.cy.js`)
Pruebas que verifican la estructura básica y el contenido del tablero kanban:

- **Visualización del Título del Puesto**: Verifica que el título del puesto "Senior Full-Stack Engineer" se muestre correctamente
- **Columnas de Fases de Entrevista**: Confirma que las tres columnas de fases de entrevista (Initial Screening, Technical Interview, Manager Interview) se muestren adecuadamente
- **Ubicación de Tarjetas de Candidatos**: Valida que las tarjetas de los candidatos aparezcan en sus columnas correctas según su fase actual de entrevista

### 2. Funcionalidad de Arrastrar y Soltar (`kanban-drag.cy.js`)
Pruebas que verifican la interacción de arrastrar y soltar y las actualizaciones asociadas en el backend:

- **Arrastre de Tarjeta de Candidato**: Simula el arrastre de una tarjeta de candidato ("João Silva") desde la columna "Initial Screening" hacia "Technical Interview" utilizando eventos del ratón
- **Integración con API Backend**: Verifica que se envíe la solicitud PUT correcta para actualizar el estado de un candidato cuando se arrastra a una nueva columna
- **Validación de Payload de API**: Asegura que el payload contenga los datos correctos (applicationId y newStepId) al actualizar el estado de un candidato

## Detalles de Implementación de Pruebas

### Respuestas Simuladas de API
Todas las pruebas utilizan datos de fixture para simular respuestas de API:
- `interviewFlow.json`: Contiene el nombre del puesto y las fases de entrevista
- `candidates.json`: Contiene la lista de candidatos con sus fases actuales
- `candidateUpdate.json`: Contiene los datos actualizados del candidato después del cambio de fase

### Características de Resiliencia
Las pruebas incluyen varias características de resiliencia:
- Manejo de errores para excepciones no capturadas
- Eliminación de superposiciones del servidor de desarrollo que podrían interferir con las interacciones
- Uso de `force: true` para evitar problemas de cobertura de elementos
- Estrategia de selectores basada en contenido en lugar de depender de una estructura DOM específica
- Tiempos de espera para manejar posibles problemas de sincronización durante la carga de la página y las respuestas de API

### Verificación Visual
Se capturan capturas de pantalla en puntos clave de las pruebas:
- Antes del intento de arrastre
- Después del intento de arrastre
- Después de la validación del backend

## Ejecución de las Pruebas
Ejecute las pruebas con:
```bash
npm run cypress:open    # Modo interactivo
npm run cypress:run     # Modo sin interfaz gráfica
``` 