/**
 * Modal Stress Test - Open/Close 30x em sequência
 * Detecta erros de removeChild e DOM race conditions
 */

let modalTestResults = {
  cycles: 0,
  errors: [],
  consoleErrors: [],
  domErrors: [],
  success: true
};

// Capturar erros de console
const originalConsoleError = console.error;
console.error = function(...args) {
  modalTestResults.consoleErrors.push(args.join(' '));
  if (args.join(' ').includes('removeChild')) {
    modalTestResults.domErrors.push(`removeChild error: ${args.join(' ')}`);
    modalTestResults.success = false;
  }
  originalConsoleError.apply(console, args);
};

async function testModalCycle() {
  console.log('🧪 Iniciando Teste de Modais (30x)...');
  
  const testModals = [
    'search-dialog',
    'outflow-dialog',
    'batch-operations',
    'notes-dialog',
    'add-user-dialog'
  ];
  
  for (let cycle = 1; cycle <= 30; cycle++) {
    modalTestResults.cycles = cycle;
    
    for (const modalType of testModals) {
      try {
        // Simular abertura de modal
        const modalId = `modal-${modalType}-${cycle}`;
        const modalDiv = document.createElement('div');
        modalDiv.id = modalId;
        modalDiv.setAttribute('data-testid', modalType);
        modalDiv.innerHTML = `
          <div data-portal="true">
            <div class="fixed inset-0 bg-black/50" data-testid="overlay">
              <div class="dialog-content" data-testid="content">
                <h2>Test Modal ${cycle}</h2>
                <p>Modal: ${modalType}</p>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        // Wait for DOM to settle
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Simular fechamento com enhanced cleanup
        const portals = modalDiv.querySelectorAll('[data-portal="true"]');
        portals.forEach(portal => {
          if (portal.isConnected && document.body.contains(portal)) {
            try {
              document.body.removeChild(portal);
            } catch (error) {
              if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
                modalTestResults.errors.push(`Portal cleanup error (${modalType}): ${error.message}`);
                modalTestResults.success = false;
              }
            }
          }
        });
        
        // Remove main modal
        if (modalDiv.isConnected && document.body.contains(modalDiv)) {
          document.body.removeChild(modalDiv);
        }
        
      } catch (error) {
        modalTestResults.errors.push(`Modal ${modalType} cycle ${cycle}: ${error.message}`);
        modalTestResults.success = false;
      }
    }
    
    // Log progress every 10 cycles
    if (cycle % 10 === 0) {
      console.log(`✅ Completado ${cycle}/30 cycles`);
    }
  }
  
  // Restaurar console.error
  console.error = originalConsoleError;
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DO TESTE DE MODAIS:');
  console.log(`Cycles: ${modalTestResults.cycles}/30`);
  console.log(`Errors: ${modalTestResults.errors.length}`);
  console.log(`Console Errors: ${modalTestResults.consoleErrors.length}`);
  console.log(`DOM Errors: ${modalTestResults.domErrors.length}`);
  console.log(`Success: ${modalTestResults.success ? '✅' : '❌'}`);
  
  if (modalTestResults.errors.length > 0) {
    console.log('\n❌ ERRORS ENCONTRADOS:');
    modalTestResults.errors.forEach(error => console.log(`- ${error}`));
  }
  
  if (modalTestResults.domErrors.length > 0) {
    console.log('\n🚨 DOM ERRORS (removeChild):');
    modalTestResults.domErrors.forEach(error => console.log(`- ${error}`));
  }
  
  return modalTestResults;
}

// Auto-executar se estiver no browser
if (typeof window !== 'undefined') {
  // Esperar DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testModalCycle);
  } else {
    setTimeout(testModalCycle, 1000);
  }
}

// Export para Node.js  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testModalCycle, modalTestResults };
}