/**
 * Script para migrar console.* para safeConsole.*
 * Fase 1: Correções Críticas - Console Logs Migration
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ConsoleReplacement {
  pattern: RegExp;
  replacement: string;
}

const CONSOLE_REPLACEMENTS: ConsoleReplacement[] = [
  {
    pattern: /console\.error\(/g,
    replacement: 'safeConsole.error('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'safeConsole.warn('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'safeConsole.info('
  },
  {
    pattern: /console\.log\(/g,
    replacement: 'safeConsole.log('
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'safeConsole.debug('
  }
];

const IMPORT_PATTERN = /^import.*from.*['"].*['"];?$/gm;

function addSafeConsoleImport(content: string): string {
  // Check if safeConsole import already exists
  if (content.includes("from '@/lib/safe-console'")) {
    return content;
  }

  // Find the last import statement
  const imports = content.match(IMPORT_PATTERN);
  if (!imports || imports.length === 0) {
    // No imports found, add at the beginning
    return `import { safeConsole } from '@/lib/safe-console';\n\n${content}`;
  }

  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertIndex = lastImportIndex + lastImport.length;

  return (
    content.slice(0, insertIndex) +
    `\nimport { safeConsole } from '@/lib/safe-console';` +
    content.slice(insertIndex)
  );
}

function migrateConsoleInFile(filePath: string): { 
  changed: boolean; 
  replacements: number; 
} {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacements = 0;
    let hasConsole = false;

    // Check if file has any console.* calls
    for (const { pattern } of CONSOLE_REPLACEMENTS) {
      if (pattern.test(content)) {
        hasConsole = true;
        break;
      }
    }

    if (!hasConsole) {
      return { changed: false, replacements: 0 };
    }

    // Add safeConsole import if needed
    content = addSafeConsoleImport(content);

    // Replace console.* calls
    for (const { pattern, replacement } of CONSOLE_REPLACEMENTS) {
      const matches = content.match(pattern);
      if (matches) {
        replacements += matches.length;
        content = content.replace(pattern, replacement);
      }
    }

    // Write back the file
    fs.writeFileSync(filePath, content, 'utf8');

    return { changed: true, replacements };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { changed: false, replacements: 0 };
  }
}

async function migrateAllConsoles() {
  console.log('🔧 Starting Console Logs Migration...\n');

  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
  ];

  const excludePatterns = [
    'src/lib/safe-console.ts',
    'src/lib/logger.ts',
    'src/components/ConsoleCleanupDemo.tsx', // Keep for demo purposes
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/node_modules/**',
  ];

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalReplacements = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: excludePatterns });
    
    for (const file of files) {
      const { changed, replacements } = migrateConsoleInFile(file);
      totalFiles++;
      
      if (changed) {
        modifiedFiles++;
        totalReplacements += replacements;
        console.log(`✅ ${file}: ${replacements} replacements`);
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log('\n✨ Console logs migration completed!');
}

// Execute migration
migrateAllConsoles().catch(console.error);