#!/usr/bin/env node

/**
 * Script pour identifier les fichiers qui importent des interfaces dupliquées
 * depuis packages/mcp-types/src/layer-contracts.ts et qui doivent être migrés
 * vers les versions canoniques dans packages/core/interfaces/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Interfaces dépréciées que nous recherchons
const deprecatedInterfaces = [
    'OrchestrationAgent',
    'OrchestratorAgent',
    'MonitorAgent',
    'SchedulerAgent',
    'CoordinationAgent',
    'AdapterAgent',
    'BridgeAgent',
    'RegistryAgent',
    'BusinessAgent',
    'AnalyzerAgent',
    'GeneratorAgent',
    'ValidatorAgent',
    'ParserAgent'
];

// Chemin du fichier déprécié
const deprecatedFilePath = 'packages/mcp-types/src/layer-contracts';

// Structure pour stocker les résultats
const results = {
    totalImports: 0,
    filesByInterface: {},
    importLines: []
};

/**
 * Recherche les imports des interfaces dépréciées dans tous les fichiers
 */
async function findDeprecatedImports() {
    try {
        console.log('Recherche des imports dépréciés...');

        // Initialiser la structure des résultats
        for (const interfaceName of deprecatedInterfaces) {
            results.filesByInterface[interfaceName] = [];
        }

        // Rechercher les imports pour chaque interface
        for (const interfaceName of deprecatedInterfaces) {
            const pattern = `import.*{[^}]*${interfaceName}[^}]*}.*from.*${deprecatedFilePath}`;
            const { stdout } = await execPromise(`grep -r "${pattern}" --include="*.ts" --include="*.js" ${projectRoot}/packages ${projectRoot}/apps || echo ""`);

            if (stdout.trim()) {
                const lines = stdout.trim().split('\n').filter(Boolean);

                for (const line of lines) {
                    // Format: file:matching line
                    const [file, ...rest] = line.split(':');
                    const matchingLine = rest.join(':');

                    if (file && !results.filesByInterface[interfaceName].includes(file)) {
                        results.filesByInterface[interfaceName].push(file);
                        results.totalImports++;

                        if (!results.importLines.some(item => item.file === file && item.line === matchingLine)) {
                            results.importLines.push({
                                file,
                                line: matchingLine,
                                interfaces: deprecatedInterfaces.filter(i => matchingLine.includes(i))
                            });
                        }
                    }
                }
            }
        }

        console.log(`Recherche terminée. ${results.totalImports} imports dépréciés trouvés.`);

        // Générer un rapport
        generateReport();

        // Proposer des migrations
        suggestMigrations();
    } catch (err) {
        console.error('Erreur lors de la recherche des imports dépréciés:', err);
    }
}

/**
 * Génère un rapport des imports dépréciés
 */
function generateReport() {
    console.log('\n--- RAPPORT DES IMPORTS DÉPRÉCIÉS ---\n');
    console.log(`Nombre total de fichiers avec imports dépréciés: ${results.importLines.length}`);

    console.log('\nInterfaces importées par fichier:');
    for (const [interfaceName, files] of Object.entries(results.filesByInterface)) {
        if (files.length > 0) {
            console.log(`\n${interfaceName} (${files.length} fichiers):`);
            for (const file of files) {
                console.log(`  - ${file}`);
            }
        }
    }

    // Générer un rapport Markdown
    const reportPath = path.join(projectRoot, 'reports/deprecated-imports-report.md');
    let report = '# Rapport des imports dépréciés\n\n';
    report += `*Généré le ${new Date().toISOString()}*\n\n`;
    report += `## Résumé\n\n`;
    report += `- **Nombre total de fichiers avec imports dépréciés**: ${results.importLines.length}\n\n`;

    report += '## Imports par interface\n\n';
    for (const [interfaceName, files] of Object.entries(results.filesByInterface)) {
        if (files.length > 0) {
            report += `### ${interfaceName} (${files.length} fichiers)\n\n`;
            for (const file of files) {
                report += `- \`${file}\`\n`;
            }
            report += '\n';
        }
    }

    report += '## Détails des imports\n\n';
    report += '| Fichier | Ligne d\'import | Interfaces à migrer |\n';
    report += '|---------|----------------|--------------------|\n';

    for (const { file, line, interfaces } of results.importLines) {
        report += `| \`${file}\` | \`${line.trim()}\` | ${interfaces.join(', ')} |\n`;
    }

    // S'assurer que le répertoire reports existe
    const reportsDir = path.join(projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\nRapport détaillé généré: ${reportPath}`);
}

/**
 * Suggère des migrations pour remplacer les imports dépréciés
 */
function suggestMigrations() {
    console.log('\n--- SUGGESTIONS DE MIGRATION ---\n');

    const importMappings = {
        'OrchestrationAgent': "import { OrchestrationAgent } from '../../../core/interfaces/orchestration/orchestration-agent';",
        'OrchestratorAgent': "import { OrchestratorAgent } from '../../../core/interfaces/orchestration/orchestrator-agent';",
        'MonitorAgent': "import { MonitorAgent } from '../../../core/interfaces/orchestration/monitor-agent';",
        'SchedulerAgent': "import { SchedulerAgent } from '../../../core/interfaces/orchestration/scheduler-agent';",
        'CoordinationAgent': "import { CoordinationAgent } from '../../../core/interfaces/coordination/coordination-agent';",
        'AdapterAgent': "import { AdapterAgent } from '../../../core/interfaces/coordination/adapter-agent';",
        'BridgeAgent': "import { BridgeAgent } from '../../../core/interfaces/coordination/bridge-agent';",
        'RegistryAgent': "import { RegistryAgent } from '../../../core/interfaces/coordination/registry-agent';",
        'BusinessAgent': "import { BusinessAgent } from '../../../core/interfaces/business/business-agent';",
        'AnalyzerAgent': "import { AnalyzerAgent } from '../../../core/interfaces/business/analyzer-agent';",
        'GeneratorAgent': "import { GeneratorAgent } from '../../../core/interfaces/business/generator-agent';",
        'ValidatorAgent': "import { ValidatorAgent } from '../../../core/interfaces/business/validator-agent';",
        'ParserAgent': "import { ParserAgent } from '../../../core/interfaces/business/parser-agent';"
    };

    console.log('Exemple de migration pour un fichier:');
    console.log('\nAvant:');
    console.log("import { BusinessAgent, AnalyzerAgent } from 'packages/mcp-types/src/layer-contracts';");

    console.log('\nAprès:');
    console.log("import { BusinessAgent } from '../../../core/interfaces/business/business-agent';");
    console.log("import { AnalyzerAgent } from '../../../core/interfaces/business/analyzer-agent';");

    console.log('\nPour automatiser la migration, vous pourriez créer un script qui:');
    console.log('1. Analyse chaque fichier identifié');
    console.log('2. Identifie les interfaces importées depuis layer-contracts.ts');
    console.log('3. Remplace ces imports par des imports vers les versions canoniques');
    console.log('4. Vérifie que le code compile correctement après la migration');

    console.log('\nVoici un exemple de commande sed pour migrer un fichier:');
    console.log("sed -i 's/import { BusinessAgent } from \\'packages\\/mcp-types\\/src\\/layer-contracts\\'/import { BusinessAgent } from \\'..\\/..\\/..\\core\\/interfaces\\/business\\/business-agent\\'/' chemin/vers/fichier.ts");

    // Génération d'un script de migration
    const migrationScriptPath = path.join(projectRoot, 'tools/scripts/migrate-deprecated-imports.js');

    let migrationScript = `#!/usr/bin/env node

/**
 * Script pour migrer les imports des interfaces dépréciées
 * depuis packages/mcp-types/src/layer-contracts.ts vers les versions canoniques
 * dans packages/core/interfaces/
 */

import fs from 'fs';
import path from 'path';

// Liste des fichiers à migrer (issue du rapport)
const filesToMigrate = [
`;

    // Ajouter les fichiers à migrer
    for (const { file } of results.importLines) {
        migrationScript += `  '${file}',\n`;
    }

    migrationScript += `];

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
  console.log(\`Migration des imports dans: \${filePath}\`);
  
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Trouver tous les imports depuis le fichier déprécié
    const importRegex = /import\\s+{([^}]+)}\\s+from\\s+['"](?:.*?\\/)?packages\\/mcp-types\\/src\\/layer-contracts['"];?/g;
    const imports = Array.from(content.matchAll(importRegex));
    
    if (imports.length === 0) {
      console.log(\`  Aucun import déprécié trouvé dans \${filePath}\`);
      return;
    }
    
    // Pour chaque import trouvé
    for (const match of imports) {
      const importStatement = match[0];
      const importedInterfaces = match[1].split(',').map(i => i.trim());
      
      // Vérifier quelles interfaces sont dépréciées
      const deprecatedImports = importedInterfaces.filter(i => 
        deprecatedInterfaces.includes(i) || 
        deprecatedInterfaces.some(di => i.endsWith(\` as \${di}\`))
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
          newImports.push(\`import { \${interfaceName} } from '\${interfaceMapping[originalName]}';\`);
        }
      }
      
      // Remplacer l'import déprécié par les nouveaux imports
      content = content.replace(importStatement, newImports.join('\\n'));
    }
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, content);
    console.log(\`  Migration terminée pour \${filePath}\`);
  } catch (err) {
    console.error(\`  Erreur lors de la migration de \${filePath}:\`, err);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(\`Migration de \${filesToMigrate.length} fichiers...\`);
  
  // Migrer chaque fichier
  for (const file of filesToMigrate) {
    await migrateImports(file);
  }
  
  console.log('\\nMigration terminée!');
  console.log('Veuillez vérifier que le code compile correctement après la migration.');
}

// Exécuter la fonction principale
main().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});
`;

    fs.writeFileSync(migrationScriptPath, migrationScript);
    console.log(`\nScript de migration généré: ${migrationScriptPath}`);
    console.log('Vous pouvez l\'exécuter pour migrer automatiquement les imports dépréciés.');
}

// Exécuter la fonction principale
findDeprecatedImports().catch(err => {
    console.error('Erreur lors de l\'exécution du script:', err);
    process.exit(1);
});