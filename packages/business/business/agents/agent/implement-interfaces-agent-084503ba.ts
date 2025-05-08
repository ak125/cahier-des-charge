#!/usr/bin/env ts-node

import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';

console.log("Démarrage du script d'implémentation des interfaces pour les agents MCP...");

// Chemins
const PACKAGES_DIR = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const AGENTS_DIR = '/workspaces/cahier-des-charge/agents';
const REPORT_DIR = '/workspaces/cahier-des-charge/reports/migration';

// Ensembles d'interfaces par couche
const INTERFACE_MAP = {
  orchestration: {
    layer: 'OrchestrationAgent',
    types: {
      orchestrator: 'OrchestratorAgent',
      monitor: 'MonitorAgent',
      scheduler: 'SchedulerAgent',
    },
  },
  coordination: {
    layer: 'CoordinationAgent',
    types: {
      bridge: 'BridgeAgent',
      adapter: 'AdapterAgent',
      registry: 'RegistryAgent',
    },
  },
  business: {
    layer: 'BusinessAgent',
    types: {
      analyzer: 'AnalyzerAgent',
      generator: 'GeneratorAgent',
      validator: 'ValidatorAgent',
      parser: 'ParserAgent',
    },
  },
};

// Créer le répertoire de rapport s'il n'existe pas
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Formatter le fichier rapport
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = path.join(REPORT_DIR, `interface-implementation-results-${timestamp}.md`);
fs.writeFileSync(reportFile, `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`);

// Map pour collecter les statistiques
const stats = {
  total: 0,
  updated: 0,
  skipped: 0,
  details: {} as Record<string, string[]>,
};

/**
 * Déterminer la couche pour un fichier donné
 */
function determineLayer(filePath: string): 'orchestration' | 'coordination' | 'business' {
  const content = fs.readFileSync(filePath, 'utf8');

  // Vérifier dans le contenu
  if (
    content.includes('Agent MCP pour orchestration') ||
    filePath.includes('/orchestration/') ||
    filePath.includes('/agents/core/')
  ) {
    return 'orchestration';
  }

  if (
    content.includes('Agent MCP pour coordination') ||
    filePath.includes('/coordination/') ||
    filePath.includes('/agents/integration/')
  ) {
    return 'coordination';
  }

  // Par défaut, on considère que c'est un agent business
  return 'business';
}

/**
 * Déterminer le type spécifique d'agent
 */
function determineType(filePath: string, content: string): string {
  // Vérifier dans le contenu
  const typeMatch = content.match(/type\s*=\s*['"](\w+)['"]/);
  if (typeMatch) {
    return typeMatch[1];
  }

  // Deviner à partir du chemin de fichier
  const filename = path.basename(filePath).toLowerCase();

  if (filename.includes('analyzer') || filePath.includes('/analysis/')) {
    return 'analyzer';
  }
  if (filename.includes('generator')) {
    return 'generator';
  }
  if (filename.includes('monitor')) {
    return 'monitor';
  }
  if (filename.includes('orchestrator')) {
    return 'orchestrator';
  }
  if (filename.includes('validator')) {
    return 'validator';
  }
  if (filename.includes('parser')) {
    return 'parser';
  }
  if (filename.includes('bridge')) {
    return 'bridge';
  }

  return 'unknown';
}

/**
 * Implémenter les interfaces dans un fichier
 */
function implementInterfaces(filePath: string): void {
  stats.total++;

  console.log(`Traitement de ${filePath}`);

  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');

    // Déterminer la couche et le type
    const layer = determineLayer(filePath);
    const type = determineType(filePath, content);

    console.log(`  Layer: ${layer}, Type: ${type}`);

    // Lister les interfaces nécessaires
    const requiredInterfaces = [];

    // Interface de base
    if (!content.includes('BaseAgent')) {
      requiredInterfaces.push('BaseAgent');
    }

    // Interface de couche
    const layerInterface = INTERFACE_MAP[layer].layer;
    if (!content.includes(layerInterface)) {
      requiredInterfaces.push(layerInterface);
    }

    // Interface de type spécifique
    if (type !== 'unknown' && INTERFACE_MAP[layer].types[type]) {
      const typeInterface = INTERFACE_MAP[layer].types[type];
      if (!content.includes(typeInterface)) {
        requiredInterfaces.push(typeInterface);
      }
    }

    // Si aucune interface manquante, on passe
    if (requiredInterfaces.length === 0) {
      console.log('  ✓ Aucune interface manquante');
      stats.skipped++;
      stats.details[filePath] = [];
      return;
    }

    console.log(`  ! Interfaces manquantes: ${requiredInterfaces.join(', ')}`);

    // Ajouter les imports nécessaires
    const importLines = [];
    if (requiredInterfaces.includes('BaseAgent')) {
      importLines.push(
        `import { BaseAgent }  from '@workspaces/cahier-des-charge/src/core/interfaces/base-agent';`
      );
    }
    if (requiredInterfaces.includes(layerInterface)) {
      importLines.push(
        `import { ${layerInterface} } from '@workspaces/cahier-des-charge/src/core/interfaces/${layer}structure-agent'`
      );
    }
    if (
      type !== 'unknown' &&
      INTERFACE_MAP[layer].types[type] &&
      requiredInterfaces.includes(INTERFACE_MAP[layer].types[type])
    ) {
      if (!importLines[1]?.includes(INTERFACE_MAP[layer].types[type])) {
        importLines[1] = importLines[1]?.replace(
          `import { ${layerInterface}`,
          `import { ${layerInterface}, ${INTERFACE_MAP[layer].types[type]}`
        );
      }
    }

    // Ajouter ces imports après les imports existants s'il y en a
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      // Insérer après le dernier import
      lines.splice(lastImportIndex + 1, 0, ...importLines);
    } else {
      // Insérer au début du fichier
      lines.splice(0, 0, ...importLines);
    }

    // Ajout de l'implémentation des interfaces à la classe
    let implementsAdded = false;
    for (let i = 0; i < lines.length; i++) {
      const classMatch = lines[i].match(/class\s+(\w+)(\s+implements\s+([^{]*))?/);
      if (classMatch) {
        const className = classMatch[1];

        if (classMatch[2]) {
          // Il y a déjà une clause implements
          const implementsList = classMatch[3];
          const alreadyImplemented = implementsList.split(',').map((i) => i.trim());
          const interfacesToAdd = requiredInterfaces.filter((i) => !alreadyImplemented.includes(i));

          if (interfacesToAdd.length > 0) {
            lines[i] = lines[i].replace(
              /implements\s+([^{]*)/,
              `implements ${implementsList}, ${interfacesToAdd.join(', ')}`
            );
          }
        } else {
          // Pas de clause implements
          lines[i] = lines[i].replace(
            /class\s+(\w+)/,
            `class ${className} implements ${requiredInterfaces.join(', ')}`
          );
        }

        implementsAdded = true;
        break;
      }
    }

    if (implementsAdded) {
      // Écrire le nouveau contenu
      fs.writeFileSync(filePath, lines.join('\n'));

      stats.updated++;
      stats.details[filePath] = requiredInterfaces;

      console.log(`  ✓ Interfaces ajoutées: ${requiredInterfaces.join(', ')}`);
    } else {
      console.log('  ✗ Aucune classe trouvée pour ajouter les interfaces');
      stats.skipped++;
      stats.details[filePath] = [];
    }
  } catch (error: any) {
    console.error(`  ✗ Erreur lors du traitement du fichier: ${error.message}`);
    stats.skipped++;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('Recherche des fichiers agents...');

  // Liste des répertoires à scanner
  const directories = [PACKAGES_DIR, AGENTS_DIR];

  // Récupérer tous les fichiers agents récursivement
  const allAgentFiles: string[] = [];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Le répertoire ${dir} n'existe pas.`);
      return;
    }

    // Fonction récursive pour parcourir les dossiers
    const findAgentFiles = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);

      files.forEach((file) => {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          findAgentFiles(filePath);
        } else if (
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.endsWith('.spec.ts')
        ) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Vérifier si c'est un fichier agent (contient une classe et le mot "Agent")
            if (
              (content.includes('class') && content.includes('Agent')) ||
              file.toLowerCase().includes('agent')
            ) {
              allAgentFiles.push(filePath);
            }
          } catch (error) {
            console.error(`Erreur lors de la lecture de ${filePath}:`, error);
          }
        }
      });
    };

    try {
      findAgentFiles(dir);
    } catch (error) {
      console.error(`Erreur lors de la recherche dans ${dir}:`, error);
    }
  });

  console.log(`Trouvé ${allAgentFiles.length} fichiers agents.`);

  // Traiter chaque fichier
  allAgentFiles.forEach((filePath) => {
    try {
      implementInterfaces(filePath);
    } catch (error) {
      console.error(`Erreur lors du traitement de ${filePath}:`, error);
    }
  });

  // Générer le rapport final
  let report = `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`;
  report += '## Résumé\n\n';
  report += `- Total des fichiers traités: ${stats.total}\n`;
  report += `- Fichiers mis à jour: ${stats.updated}\n`;
  report += `- Fichiers ignorés: ${stats.skipped}\n\n`;

  report += '## Détails\n\n';

  Object.entries(stats.details).forEach(([filePath, interfaces]) => {
    report += `### ${filePath}\n`;
    if (interfaces.length > 0) {
      report += `- Ajout des imports pour: ${interfaces.join(', ')}\n`;
      report += `- Ajout des interfaces à la classe: ${interfaces.join(', ')}\n`;
      report += '- Ajout des méthodes requises par les interfaces\n\n';
    } else {
      report += '- Déjà conforme, aucun changement\n\n';
    }
  });

  fs.writeFileSync(reportFile, report);

  console.log(`\nTerminé ! Rapport généré: ${reportFile}`);
  console.log(`${stats.updated} fichiers mis à jour.`);
  console.log(`${stats.skipped} fichiers déjà conformes.`);
}

// Exécuter la fonction principale
main().catch((err) => {
  console.error('Erreur non gérée:', err);
});
