#!/usr/bin/env node

/**
 * Script pour migrer les imports des interfaces dépréciées
 * depuis packages/mcp-types/src/layer-contracts.ts vers les versions canoniques
 * dans packages/core/interfaces/
 */

import fs from 'fs';
import path from 'path';

// Liste des fichiers à migrer (issue du rapport)
const filesToMigrate = [
];

// Mapping des interfaces vers leur chemin canonique
const interfaceMapping = {
  'OrchestrationAgent': '../../../core/interfaces/orchestration/orchestration-agent',
  'OrchestratorAgent': '../../../core/interfaces/orchestration/orchestrator-agent',
  'MonitorAgent': '../../../core/interfaces/orchestration/monitor-agent',
  'SchedulerAgent': '../../../core/interfaces/orchestration/scheduler-agent',
  'CoordinationAgent': '../../../core/interfaces/coordination/coordination-agent',
  'AdapterAgent': '../../../core/interfaces/coordination/adapter-agent',
  'BridgeAgent': '../../../core/interfaces/coordination/bridge-agent',
  'RegistryAgent': '../../../core/interfaces/coordination/registry-agent',
  'BusinessAgent': '../../../core/interfaces/business/business-agent',
  'AnalyzerAgent': '../../../core/interfaces/business/analyzer-agent',
  'GeneratorAgent': '../../../core/interfaces/business/generator-agent',
  'ValidatorAgent': '../../../core/interfaces/business/validator-agent',
  'ParserAgent': '../../../core/interfaces/business/parser-agent',
};

// Interfaces dépréciées que nous recherchons
const deprecatedInterfaces = Object.keys(interfaceMapping);

/**
 * Migre les imports dans un fichier
 */
async function migrateImports(filePath) {
  console.log(`Migration des imports dans: ${filePath}`);
  
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Trouver tous les imports depuis le fichier déprécié
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"](?:.*?\/)?packages\/mcp-types\/src\/layer-contracts['"];?/g;
    const imports = Array.from(content.matchAll(importRegex));
    
    if (imports.length === 0) {
      console.log(`  Aucun import déprécié trouvé dans ${filePath}`);
      return;
    }
    
    // Pour chaque import trouvé
    for (const match of imports) {
      const importStatement = match[0];
      const importedInterfaces = match[1].split(',').map(i => i.trim());
      
      // Vérifier quelles interfaces sont dépréciées
      const deprecatedImports = importedInterfaces.filter(i => 
        deprecatedInterfaces.includes(i) || 
        deprecatedInterfaces.some(di => i.endsWith(` as ${di}`))
      );
      
      if (deprecatedImports.length === 0) continue;
      
      // Générer de nouveaux imports pour chaque interface dépréciée
      const newImports = [];
      for (let interfaceName of deprecatedImports) {
        // Gérer les cas de renommage (as)
        let originalName = interfaceName;
        if (interfaceName.includes(' as ')) {
          const parts = interfaceName.split(' as ');
          originalName = parts[1].trim();
          // Note: pour les imports renommés, il faudrait un traitement plus complexe
          // Actuellement, on se contente de prendre le nom après 'as'
        }
        
        if (interfaceMapping[originalName]) {
          newImports.push(`import { ${interfaceName} } from '${interfaceMapping[originalName]}';`);
        }
      }
      
      // Remplacer l'import déprécié par les nouveaux imports
      content = content.replace(importStatement, newImports.join('\n'));
    }
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, content);
    console.log(`  Migration terminée pour ${filePath}`);
  } catch (err) {
    console.error(`  Erreur lors de la migration de ${filePath}:`, err);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`Migration de ${filesToMigrate.length} fichiers...`);
  
  // Migrer chaque fichier
  for (const file of filesToMigrate) {
    await migrateImports(file);
  }
  
  console.log('\nMigration terminée!');
  console.log('Veuillez vérifier que le code compile correctement après la migration.');
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});
