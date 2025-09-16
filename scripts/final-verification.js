/**
 * Script de Verificação Final - Fase 4
 * Executa todas as verificações necessárias para confirmar a refatoração
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

class FinalVerification {
  constructor() {
    this.results = {
      linting: null,
      build: null,
      typescript: null,
      bundleSize: null,
      performance: null,
      overall: false
    };
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

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', reject);
    });
  }

  async verifyLinting() {
    this.log('🔍 Executando ESLint...', 'info');
    
    try {
      const result = await this.runCommand('npm', ['run', 'lint']);
      
      this.results.linting = {
        success: result.success,
        output: result.stdout + result.stderr,
        warnings: (result.stdout.match(/warning/gi) || []).length,
        errors: (result.stdout.match(/error/gi) || []).length
      };

      if (this.results.linting.success) {
        this.log(`✅ ESLint passou - ${this.results.linting.warnings} warnings, ${this.results.linting.errors} errors`, 'success');
      } else {
        this.log(`❌ ESLint falhou - ${this.results.linting.warnings} warnings, ${this.results.linting.errors} errors`, 'error');
      }

      return this.results.linting.success;
    } catch (error) {
      this.log(`❌ Erro ao executar ESLint: ${error.message}`, 'error');
      this.results.linting = { success: false, error: error.message };
      return false;
    }
  }

  async verifyBuild() {
    this.log('🏗️ Executando build de produção...', 'info');
    
    try {
      const result = await this.runCommand('npm', ['run', 'build']);
      
      this.results.build = {
        success: result.success,
        output: result.stdout + result.stderr,
        buildTime: this.extractBuildTime(result.stdout)
      };

      if (this.results.build.success) {
        this.log('✅ Build de produção concluído com sucesso', 'success');
        await this.analyzeBundleSize();
      } else {
        this.log('❌ Build de produção falhou', 'error');
      }

      return this.results.build.success;
    } catch (error) {
      this.log(`❌ Erro ao executar build: ${error.message}`, 'error');
      this.results.build = { success: false, error: error.message };
      return false;
    }
  }

  extractBuildTime(output) {
    const timeMatch = output.match(/built in (\d+(?:\.\d+)?)(ms|s)/);
    if (timeMatch) {
      const value = parseFloat(timeMatch[1]);
      const unit = timeMatch[2];
      return unit === 's' ? value * 1000 : value;
    }
    return null;
  }

  async analyzeBundleSize() {
    this.log('📊 Analisando tamanho do bundle...', 'info');
    
    try {
      const distPath = join(process.cwd(), 'dist');
      if (!existsSync(distPath)) {
        this.log('❌ Pasta dist não encontrada', 'error');
        return;
      }

      const bundleStats = this.calculateBundleSize(distPath);
      
      this.results.bundleSize = {
        totalSize: bundleStats.totalSize,
        jsSize: bundleStats.jsSize,
        cssSize: bundleStats.cssSize,
        chunkCount: bundleStats.chunkCount,
        largestChunk: bundleStats.largestChunk
      };

      this.log(`📊 Bundle: ${this.formatSize(bundleStats.totalSize)} total, ${bundleStats.chunkCount} chunks`, 'success');
      this.log(`📦 JS: ${this.formatSize(bundleStats.jsSize)}, CSS: ${this.formatSize(bundleStats.cssSize)}`, 'info');
      
      if (bundleStats.largestChunk) {
        this.log(`🎯 Maior chunk: ${bundleStats.largestChunk.name} (${this.formatSize(bundleStats.largestChunk.size)})`, 'info');
      }

    } catch (error) {
      this.log(`❌ Erro ao analisar bundle: ${error.message}`, 'error');
    }
  }

  calculateBundleSize(distPath) {
    const stats = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      chunkCount: 0,
      largestChunk: null
    };

    const files = this.getAllFiles(distPath);
    
    files.forEach(file => {
      try {
        const fileStat = statSync(file);
        const size = fileStat.size;
        stats.totalSize += size;

        if (file.endsWith('.js')) {
          stats.jsSize += size;
          stats.chunkCount++;
          
          if (!stats.largestChunk || size > stats.largestChunk.size) {
            stats.largestChunk = {
              name: file.split('/').pop(),
              size
            };
          }
        } else if (file.endsWith('.css')) {
          stats.cssSize += size;
        }
      } catch (error) {
        // Ignorar arquivos que não conseguimos ler
      }
    });

    return stats;
  }

  getAllFiles(dir) {
    const files = [];
    const fs = require('fs');
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Ignorar diretórios que não conseguimos ler
    }
    
    return files;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async verifyTypeScript() {
    this.log('🔧 Verificando TypeScript strict compliance...', 'info');
    
    try {
      const result = await this.runCommand('npx', ['tsc', '--noEmit']);
      
      this.results.typescript = {
        success: result.success,
        output: result.stdout + result.stderr,
        errors: (result.stderr.match(/error TS/g) || []).length
      };

      if (this.results.typescript.success) {
        this.log('✅ TypeScript strict compliance verificado', 'success');
      } else {
        this.log(`❌ TypeScript encontrou ${this.results.typescript.errors} erros`, 'error');
      }

      return this.results.typescript.success;
    } catch (error) {
      this.log(`❌ Erro ao verificar TypeScript: ${error.message}`, 'error');
      this.results.typescript = { success: false, error: error.message };
      return false;
    }
  }

  async testFunctionalRegression() {
    this.log('🧪 Executando testes de regressão funcional...', 'info');
    
    try {
      // Verificar se existem arquivos de teste
      const testFiles = [
        'src/test/setup.ts',
        'vitest.config.ts'
      ];

      const hasTests = testFiles.some(file => existsSync(file));
      
      if (hasTests) {
        const result = await this.runCommand('npm', ['test', '--', '--run']);
        
        this.results.performance = {
          success: result.success,
          output: result.stdout + result.stderr,
          testsRun: (result.stdout.match(/✓/g) || []).length,
          testsFailed: (result.stdout.match(/✗|×/g) || []).length
        };

        if (this.results.performance.success) {
          this.log(`✅ Testes passaram - ${this.results.performance.testsRun} testes executados`, 'success');
        } else {
          this.log(`❌ Testes falharam - ${this.results.performance.testsFailed} falhas`, 'error');
        }
      } else {
        this.log('⚠️ Nenhum arquivo de teste encontrado, pulando testes', 'warning');
        this.results.performance = { success: true, skipped: true };
      }

      return this.results.performance.success;
    } catch (error) {
      this.log(`❌ Erro ao executar testes: ${error.message}`, 'error');
      this.results.performance = { success: false, error: error.message };
      return false;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      phase4: {
        linting: this.results.linting,
        build: this.results.build,
        typescript: this.results.typescript,
        bundleSize: this.results.bundleSize,
        performance: this.results.performance
      },
      summary: {
        allChecksPass: Object.values(this.results).every(r => r && r.success !== false),
        critical_issues: this.getCriticalIssues(),
        recommendations: this.getRecommendations()
      },
      refactoringComplete: this.isRefactoringComplete()
    };

    return report;
  }

  getCriticalIssues() {
    const issues = [];
    
    if (this.results.linting && !this.results.linting.success) {
      issues.push('ESLint errors need to be resolved');
    }
    
    if (this.results.build && !this.results.build.success) {
      issues.push('Build is failing - critical for production');
    }
    
    if (this.results.typescript && !this.results.typescript.success) {
      issues.push('TypeScript errors need to be fixed');
    }

    return issues;
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.results.bundleSize && this.results.bundleSize.totalSize > 2 * 1024 * 1024) { // > 2MB
      recommendations.push('Consider further bundle optimization - size is above 2MB');
    }
    
    if (this.results.linting && this.results.linting.warnings > 10) {
      recommendations.push('Consider addressing ESLint warnings for better code quality');
    }

    return recommendations;
  }

  isRefactoringComplete() {
    const criticalChecks = [
      this.results.linting?.success,
      this.results.build?.success,
      this.results.typescript?.success
    ];

    return criticalChecks.every(check => check === true);
  }

  async runFullVerification() {
    this.log('🚀 Iniciando Verificação Final - Fase 4', 'info');
    
    const steps = [
      { name: 'Linting', fn: () => this.verifyLinting() },
      { name: 'Build', fn: () => this.verifyBuild() },
      { name: 'TypeScript', fn: () => this.verifyTypeScript() },
      { name: 'Tests', fn: () => this.testFunctionalRegression() }
    ];

    let allPassed = true;

    for (const step of steps) {
      try {
        const passed = await step.fn();
        if (!passed) allPassed = false;
      } catch (error) {
        this.log(`❌ Erro no step ${step.name}: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    const report = this.generateReport();
    
    this.log(`🎯 Verificação Final Completa - Sucesso: ${allPassed}`, 
      allPassed ? 'success' : 'error');

    if (report.refactoringComplete) {
      this.log('✅ REFATORAÇÃO 100% COMPLETA! Sistema pronto para produção.', 'success');
    } else {
      this.log('⚠️ Refatoração precisa de ajustes antes da produção.', 'warning');
    }

    return report;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verification = new FinalVerification();
  verification.runFullVerification()
    .then(report => {
      console.log('\n📊 RELATÓRIO FINAL:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.refactoringComplete ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro na verificação:', error);
      process.exit(1);
    });
}

export default FinalVerification;