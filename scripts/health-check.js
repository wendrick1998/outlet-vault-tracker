#!/usr/bin/env node

/**
 * Health Check Final - Raio-X pós-correções
 * Validação completa de PWA, SW, Lazy Chunks, IA e DOM
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HealthChecker {
  constructor() {
    this.results = {
      build: { status: '❌', issues: [] },
      pwa: { status: '❌', issues: [] },
      serviceWorker: { status: '❌', issues: [] },
      ai: { status: '❌', issues: [] },
      dom: { status: '❌', issues: [] },
      routes: { status: '❌', issues: [] }
    };
    this.patches = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      patch: '🔧'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // 1. Build & Cache Validation
  async checkBuildAndCache() {
    this.log('Checking Build & Cache...', 'info');
    
    const distPath = path.join(__dirname, '../dist');
    const assetsPath = path.join(distPath, 'assets');
    
    if (!fs.existsSync(assetsPath)) {
      this.results.build.issues.push('Assets folder não encontrada');
      return;
    }

    const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
    this.log(`Found ${jsFiles.length} JS assets: ${jsFiles.join(', ')}`, 'info');

    // Check for lazy route chunks
    const expectedChunks = ['History', 'Admin', 'ActiveLoans', 'BatchOutflow', 'SearchAndOperate'];
    const foundChunks = [];
    
    expectedChunks.forEach(chunk => {
      const hasChunk = jsFiles.some(file => file.toLowerCase().includes(chunk.toLowerCase()));
      if (hasChunk) {
        foundChunks.push(chunk);
      } else {
        this.results.build.issues.push(`Missing lazy chunk for: ${chunk}`);
      }
    });

    // Check chunk naming stability
    const hasStableNaming = jsFiles.every(file => {
      return file.includes('-') && file.match(/^[a-zA-Z0-9-]+\.[a-f0-9]{8}\.js$/);
    });

    if (!hasStableNaming) {
      this.results.build.issues.push('Chunk naming not stable - needs assets/<name>-[hash].js format');
      this.patches.push({
        file: 'vite.config.ts',
        description: 'Apply stable chunk naming',
        fix: 'chunkFileNames: "assets/[name]-[hash].js"'
      });
    }

    this.results.build.status = this.results.build.issues.length === 0 ? '✅' : '⚠️';
    this.log(`Build check: ${this.results.build.status}`, 'info');
  }

  // 2. PWA Validation
  async checkPWA() {
    this.log('Checking PWA configuration...', 'info');
    
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    const icon192Path = path.join(__dirname, '../public/icons/icon-192.png');
    const icon512Path = path.join(__dirname, '../public/icons/icon-512.png');

    // Check manifest exists
    if (!fs.existsSync(manifestPath)) {
      this.results.pwa.issues.push('manifest.json not found');
      return;
    }

    // Check icons exist
    if (!fs.existsSync(icon192Path)) {
      this.results.pwa.issues.push('icon-192.png not found');
    }
    if (!fs.existsSync(icon512Path)) {
      this.results.pwa.issues.push('icon-512.png not found');
    }

    // Parse manifest
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      requiredFields.forEach(field => {
        if (!manifest[field]) {
          this.results.pwa.issues.push(`Missing manifest field: ${field}`);
        }
      });

      // Check icons in manifest
      const hasRequiredIcons = manifest.icons?.some(icon => 
        icon.sizes === '192x192' && icon.src.includes('192')
      ) && manifest.icons?.some(icon => 
        icon.sizes === '512x512' && icon.src.includes('512')
      );

      if (!hasRequiredIcons) {
        this.results.pwa.issues.push('Missing required icon sizes in manifest');
      }

    } catch (error) {
      this.results.pwa.issues.push(`Invalid manifest.json: ${error.message}`);
    }

    this.results.pwa.status = this.results.pwa.issues.length === 0 ? '✅' : '❌';
    this.log(`PWA check: ${this.results.pwa.status}`, 'info');
  }

  // 3. Service Worker Validation
  async checkServiceWorker() {
    this.log('Checking Service Worker...', 'info');
    
    const swPath = path.join(__dirname, '../public/sw.js');
    
    if (!fs.existsSync(swPath)) {
      this.results.serviceWorker.issues.push('sw.js not found');
      return;
    }

    const swContent = fs.readFileSync(swPath, 'utf8');
    
    // Check for cache versioning
    if (!swContent.includes('CACHE_NAME') && !swContent.includes('CACHE_VERSION')) {
      this.results.serviceWorker.issues.push('No cache versioning found');
      this.patches.push({
        file: 'public/sw.js',
        description: 'Add cache versioning with skipWaiting and claim',
        fix: 'const CACHE_VERSION = "v" + Date.now()'
      });
    }

    // Check for skipWaiting
    if (!swContent.includes('skipWaiting')) {
      this.results.serviceWorker.issues.push('skipWaiting not implemented');
    }

    // Check for clients.claim
    if (!swContent.includes('clients.claim')) {
      this.results.serviceWorker.issues.push('clients.claim not implemented');
    }

    this.results.serviceWorker.status = this.results.serviceWorker.issues.length === 0 ? '✅' : '⚠️';
    this.log(`Service Worker check: ${this.results.serviceWorker.status}`, 'info');
  }

  // 4. AI Rate Limiting Check
  async checkAIRateLimiting() {
    this.log('Checking AI Rate Limiting...', 'info');
    
    // Check if useAIWithRetry exists and has proper retry logic
    const useAIPath = path.join(__dirname, '../src/hooks/useAIWithRetry.ts');
    
    if (!fs.existsSync(useAIPath)) {
      this.results.ai.issues.push('useAIWithRetry hook not found');
      return;
    }

    const aiContent = fs.readFileSync(useAIPath, 'utf8');
    
    // Check for exponential backoff
    if (!aiContent.includes('exponential') || !aiContent.includes('backoff')) {
      this.results.ai.issues.push('Exponential backoff not implemented');
    }

    // Check for retry-after handling
    if (!aiContent.includes('retryAfter') || !aiContent.includes('429')) {
      this.results.ai.issues.push('429/retry-after handling not implemented');
    }

    // Check for insufficient_quota handling
    if (!aiContent.includes('insufficient_quota')) {
      this.results.ai.issues.push('insufficient_quota handling not implemented');
      this.patches.push({
        file: 'src/hooks/useAIWithRetry.ts',
        description: 'Add insufficient_quota handling with 15min cooldown',
        fix: 'Handle insufficient_quota with automatic 15min disable'
      });
    }

    this.results.ai.status = this.results.ai.issues.length === 0 ? '✅' : '⚠️';
    this.log(`AI Rate Limiting check: ${this.results.ai.status}`, 'info');
  }

  // 5. DOM Race Conditions Check
  async checkDOMRaceConditions() {
    this.log('Checking DOM Race Conditions...', 'info');
    
    const portalPath = path.join(__dirname, '../src/components/ui/enhanced-portal.tsx');
    
    if (!fs.existsSync(portalPath)) {
      this.results.dom.issues.push('Enhanced Portal not found');
      return;
    }

    const portalContent = fs.readFileSync(portalPath, 'utf8');
    
    // Check for proper cleanup guards
    if (!portalContent.includes('isConnected')) {
      this.results.dom.issues.push('isConnected check missing in portal cleanup');
    }

    if (!portalContent.includes('contains')) {
      this.results.dom.issues.push('contains check missing in portal cleanup');
    }

    if (!portalContent.includes('NotFoundError')) {
      this.results.dom.issues.push('NotFoundError handling missing');
    }

    this.results.dom.status = this.results.dom.issues.length === 0 ? '✅' : '⚠️';
    this.log(`DOM Race Conditions check: ${this.results.dom.status}`, 'info');
  }

  // 6. Routes & Lazy Chunks Check
  async checkRoutesAndChunks() {
    this.log('Checking Routes & Lazy Chunks...', 'info');
    
    // Check lazy route definitions
    const lazyDir = path.join(__dirname, '../src/pages/lazy');
    
    if (!fs.existsSync(lazyDir)) {
      this.results.routes.issues.push('Lazy pages directory not found');
      return;
    }

    const lazyFiles = fs.readdirSync(lazyDir).filter(f => f.endsWith('.tsx'));
    const expectedLazyFiles = ['LazyHistory.tsx', 'LazyAdmin.tsx', 'LazyActiveLoans.tsx', 'LazyBatchOutflow.tsx', 'LazySearchAndOperate.tsx'];
    
    expectedLazyFiles.forEach(file => {
      if (!lazyFiles.includes(file)) {
        this.results.routes.issues.push(`Missing lazy component: ${file}`);
      }
    });

    // Check for prefetch directives
    const appPath = path.join(__dirname, '../src/App.tsx');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      if (!appContent.includes('webpackPrefetch') && !appContent.includes('prefetch')) {
        this.results.routes.issues.push('No prefetch optimization found');
        this.patches.push({
          file: 'src/App.tsx',
          description: 'Add route prefetching',
          fix: 'import(/* webpackPrefetch: true */ "./pages/...")'
        });
      }
    }

    this.results.routes.status = this.results.routes.issues.length === 0 ? '✅' : '⚠️';
    this.log(`Routes & Chunks check: ${this.results.routes.status}`, 'info');
  }

  // Generate comprehensive report
  generateReport() {
    const timestamp = new Date().toISOString();
    const reportDir = path.join(__dirname, '../reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const overallStatus = Object.values(this.results).every(r => r.status === '✅') ? 'GO ✅' : 'NO-GO ❌';
    
    const report = `# Health Check Final Report
Generated: ${timestamp}

## Overall Status: ${overallStatus}

## Summary

| Component | Status | Issues |
|-----------|--------|---------|
| Build & Cache | ${this.results.build.status} | ${this.results.build.issues.length} |
| PWA | ${this.results.pwa.status} | ${this.results.pwa.issues.length} |
| Service Worker | ${this.results.serviceWorker.status} | ${this.results.serviceWorker.issues.length} |
| AI Rate Limiting | ${this.results.ai.status} | ${this.results.ai.issues.length} |
| DOM Race Conditions | ${this.results.dom.status} | ${this.results.dom.issues.length} |
| Routes & Chunks | ${this.results.routes.status} | ${this.results.routes.issues.length} |

## Detailed Results

### Build & Cache ${this.results.build.status}
Issues: ${this.results.build.issues.length === 0 ? 'None' : this.results.build.issues.map(i => `- ${i}`).join('\n')}

### PWA ${this.results.pwa.status}
Issues: ${this.results.pwa.issues.length === 0 ? 'None' : this.results.pwa.issues.map(i => `- ${i}`).join('\n')}

### Service Worker ${this.results.serviceWorker.status}
Issues: ${this.results.serviceWorker.issues.length === 0 ? 'None' : this.results.serviceWorker.issues.map(i => `- ${i}`).join('\n')}

### AI Rate Limiting ${this.results.ai.status}
Issues: ${this.results.ai.issues.length === 0 ? 'None' : this.results.ai.issues.map(i => `- ${i}`).join('\n')}

### DOM Race Conditions ${this.results.dom.status}
Issues: ${this.results.dom.issues.length === 0 ? 'None' : this.results.dom.issues.map(i => `- ${i}`).join('\n')}

### Routes & Chunks ${this.results.routes.status}
Issues: ${this.results.routes.issues.length === 0 ? 'None' : this.results.routes.issues.map(i => `- ${i}`).join('\n')}

## Patches Applied

${this.patches.length === 0 ? 'No patches needed.' : this.patches.map(p => `### ${p.file}\n**Description:** ${p.description}\n**Fix:** ${p.fix}\n`).join('\n')}

## Criteria Check

- [ ] Lighthouse PWA "Installable ✅"
- [ ] 0 erros no console após ciclo de modais
- [ ] 0 404 em assets/chunks
- [ ] IA resiliente: 429 tratado com backoff, contador e fallback
- [ ] SW versionado e atualizando sem stale cache

## Next Steps

${overallStatus === 'GO ✅' ? 
  '🎉 Sistema aprovado para produção!' : 
  '⚠️ Correções necessárias antes de aprovar para produção.'}
`;

    const reportPath = path.join(reportDir, 'health-check.md');
    fs.writeFileSync(reportPath, report);
    
    this.log(`Report generated: ${reportPath}`, 'success');
    return reportPath;
  }

  // Run all checks
  async runAll() {
    this.log('🚀 Starting Final Health Check...', 'info');
    
    await this.checkBuildAndCache();
    await this.checkPWA();
    await this.checkServiceWorker();
    await this.checkAIRateLimiting();
    await this.checkDOMRaceConditions();
    await this.checkRoutesAndChunks();
    
    const reportPath = this.generateReport();
    
    this.log('🏁 Health Check Complete!', 'success');
    return reportPath;
  }
}

// Export for use in other scripts
export { HealthChecker };

// Run if called directly
if (process.argv[1] === __filename) {
  const checker = new HealthChecker();
  checker.runAll().catch(console.error);
}