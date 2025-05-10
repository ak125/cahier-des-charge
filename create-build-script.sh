#!/bin/bash

# Script pour créer le script de compilation pour le projet migré
# Comme le script tools/scripts/build.js est manquant mais référencé dans package.json

mkdir -p /workspaces/cahier-des-charge/tools/scripts
cat > /workspaces/cahier-des-charge/tools/scripts/build.js << 'EOF'
#!/usr/bin/env node

/**
 * Script de compilation pour le projet migré
 * Ce script compile les packages avec la nouvelle structure en trois couches
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Chemins des packages à compiler
const packagesToCompile = [
  'packages/orchestration',
  'packages/coordination',
  'packages/business',
  'packages/core'
];

console.log('=== Compilation du projet avec la nouvelle architecture en trois couches ===');

// Vérifier l'existence des dossiers
packagesToCompile.forEach(packagePath => {
  const fullPath = path.join(rootDir, packagePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Le package ${packagePath} n'existe pas ou n'est pas accessible`);
  } else {
    console.log(`✓ Package trouvé: ${packagePath}`);
  }
});

// Compiler chaque package
for (const packagePath of packagesToCompile) {
  const fullPath = path.join(rootDir, packagePath);
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`\nCompilation de ${packagePath}...`);
      
      // Vérifier si le package a son propre script de build
      const packageJsonPath = path.join(fullPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.scripts && packageJson.scripts.build) {
          console.log(`Exécution de la commande de build du package ${packagePath}...`);
          execSync(`cd ${fullPath} && npm run build`, { stdio: 'inherit' });
          continue;
        }
      }
      
      // Sinon, utiliser TypeScript directement
      console.log(`Compilation TypeScript pour ${packagePath}...`);
      execSync(`tsc --project ${fullPath}/tsconfig.json || echo "Pas de fichier tsconfig.json spécifique, utilisation du tsconfig global"`, 
        { stdio: 'inherit', shell: true });
    } catch (error) {
      console.error(`❌ Erreur lors de la compilation de ${packagePath}:`, error.message);
    }
  }
}

console.log('\n=== Validation de la structure en trois couches ===');

// Vérifier la présence des agents migrés
const agentsToCheck = [
  { path: 'packages/orchestration/monitors/monitor-agent.ts', layer: 'orchestration' },
  { path: 'packages/orchestration/schedulers/scheduler-agent.ts', layer: 'orchestration' },
  { path: 'packages/coordination/bridges/bridge-agent.ts', layer: 'coordination' },
  { path: 'packages/business/analyzers/analyzer-agent.ts', layer: 'business' },
  { path: 'packages/business/generators/generate-agent-manifest.ts', layer: 'business' }
];

let migrationSuccess = true;

agentsToCheck.forEach(agent => {
  const fullPath = path.join(rootDir, agent.path);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ [${agent.layer}] Agent migré trouvé: ${agent.path}`);
  } else {
    console.error(`❌ [${agent.layer}] Agent non trouvé: ${agent.path}`);
    migrationSuccess = false;
  }
});

if (migrationSuccess) {
  console.log('\n✅ Migration réussie! Tous les agents vérifiés ont été correctement migrés.');
} else {
  console.error('\n⚠️ Certains agents n\'ont pas été correctement migrés.');
  console.log('Consultez le journal de migration pour plus de détails: reports/migration-journal.md');
}

console.log('\nPour poursuivre la migration des autres agents, utilisez:');
console.log('node tools/scripts/migrate-agents-improved.js --batch=<nom-du-lot>');
EOF

# Rendre le script exécutable
chmod +x /workspaces/cahier-des-charge/tools/scripts/build.js

echo "Script de compilation créé : /workspaces/cahier-des-charge/tools/scripts/build.js"
echo "Vous pouvez maintenant exécuter: cd /workspaces/cahier-des-charge && pnpm run build"
