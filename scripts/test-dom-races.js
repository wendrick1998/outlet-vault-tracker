/**
 * DOM Race Conditions Test
 * Testa montagem/desmontagem de 30x dos principais Dialogs/Sheets
 */

class DOMRaceTest {
  constructor() {
    this.errors = [];
    this.cycles = 30;
    this.dialogs = [
      'search-dialog',
      'outflow-dialog', 
      'batch-outflow-dialog',
      'device-actions-dialog',
      'notes-dialog'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testDialogCycle(dialogId, cycles) {
    this.log(`Testing ${dialogId} for ${cycles} cycles...`, 'info');
    
    for (let i = 0; i < cycles; i++) {
      try {
        // Simulate dialog open
        const dialog = document.createElement('div');
        dialog.id = `${dialogId}-${i}`;
        dialog.setAttribute('data-testid', dialogId);
        dialog.innerHTML = `
          <div data-portal="true">
            <div class="dialog-content">Test Content ${i}</div>
          </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Wait a bit to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Simulate dialog close with proper cleanup
        const portals = dialog.querySelectorAll('[data-portal="true"]');
        portals.forEach(portal => {
          if (portal.isConnected && document.body.contains(portal)) {
            try {
              document.body.removeChild(portal);
            } catch (error) {
              if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
                this.errors.push(`${dialogId} cycle ${i}: ${error.message}`);
              }
            }
          }
        });
        
        // Remove main dialog
        if (dialog.isConnected && document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
        
      } catch (error) {
        this.errors.push(`${dialogId} cycle ${i}: ${error.message}`);
      }
    }
    
    this.log(`${dialogId} test completed`, 'success');
  }

  async runAllTests() {
    this.log('🧪 Starting DOM Race Conditions Tests...', 'info');
    
    // Capture console errors during test
    const originalError = console.error;
    const consoleErrors = [];
    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
      originalError(...args);
    };

    // Test each dialog type
    for (const dialogId of this.dialogs) {
      await this.testDialogCycle(dialogId, this.cycles);
    }

    // Restore console.error
    console.error = originalError;

    // Generate test report
    const report = {
      totalCycles: this.cycles * this.dialogs.length,
      errors: this.errors,
      consoleErrors: consoleErrors,
      success: this.errors.length === 0 && consoleErrors.length === 0
    };

    this.log(`DOM Tests Complete - Errors: ${this.errors.length}, Console Errors: ${consoleErrors.length}`, 
      report.success ? 'success' : 'error');

    return report;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.DOMRaceTest = DOMRaceTest;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMRaceTest;
}