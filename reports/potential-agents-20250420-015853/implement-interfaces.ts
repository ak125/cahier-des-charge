#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

console.log("Démarrage du script d'implémentation des interfaces...");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface AgentInfo {
  filePath: string;
  layer: 'orchestration' | 'coordination' | 'business';
  type: string;
  name: string;
}

/**
 * Interface manquante pour chaque fichier agent
 */
async function getRequiredInterfaces(filePath: string): Promise<string[]> {
  const fileContent = await readFile(filePath, 'utf-8');

  // Déterminer la couche en fonction du contenu ou du chemin du fichier
  let layer: string | null = null;
  const layerMatch = fileContent.match(/Agent MCP pour (\w+)/);
  if (layerMatch) {
    layer = layerMatch[1];
  } else if (filePath.includes('/orchestration/') || filePath.includes('/agents/core/')) {
    layer = 'orchestration';
  } else if (filePath.includes('/coordination/') || filePath.includes('/agents/integration/')) {
    layer = 'coordination';
  } else if (
    filePath.includes('/business/') ||
    filePath.includes('/agents/analysis/') ||
    filePath.includes('/agents/migration/') ||
    filePath.includes('/agents/quality/') ||
    filePath.includes('/agents/utils/')
  ) {
    layer = 'business';
  }

  // Déterminer le type d'agent
  let type = 'unknown';
  const typeMatch = fileContent.match(/type = ['"](\w+)['"]/);
  if (typeMatch) {
    type = typeMatch[1];
  } else if (filePath.includes('analyzer') || filePath.includes('/analysis/')) {
    type = 'analyzer';
  } else if (filePath.includes('generator')) {
    type = 'generator';
  } else if (filePath.includes('monitor')) {
    type = 'monitor';
  } else if (filePath.includes('orchestrator')) {
    type = 'orchestrator';
  } else if (filePath.includes('validator')) {
    type = 'validator';
  } else if (filePath.includes('parser')) {
    type = 'parser';
  } else if (filePath.includes('bridge')) {
    type = 'bridge';
  }

  const missingInterfaces: string[] = [];

  if (layer === 'orchestration') {
    if (!fileContent.includes('OrchestrationAgent')) {
      missingInterfaces.push('OrchestrationAgent');
    }

    // Ajout du type spécifique si nécessaire
    switch (type) {
      case 'orchestrator':
        if (!fileContent.includes('OrchestratorAgent')) {
          missingInterfaces.push('OrchestratorAgent');
        }
        break;
      case 'monitor':
        if (!fileContent.includes('MonitorAgent')) {
          missingInterfaces.push('MonitorAgent');
        }
        break;
      case 'scheduler':
        if (!fileContent.includes('SchedulerAgent')) {
          missingInterfaces.push('SchedulerAgent');
        }
        break;
    }
  } else if (layer === 'coordination') {
    if (!fileContent.includes('CoordinationAgent')) {
      missingInterfaces.push('CoordinationAgent');
    }

    // Ajout du type spécifique si nécessaire
    switch (type) {
      case 'bridge':
        if (!fileContent.includes('BridgeAgent')) {
          missingInterfaces.push('BridgeAgent');
        }
        break;
      case 'adapter':
        if (!fileContent.includes('AdapterAgent')) {
          missingInterfaces.push('AdapterAgent');
        }
        break;
      case 'registry':
        if (!fileContent.includes('RegistryAgent')) {
          missingInterfaces.push('RegistryAgent');
        }
        break;
    }
  } else if (layer === 'business') {
    if (!fileContent.includes('BusinessAgent')) {
      missingInterfaces.push('BusinessAgent');
    }

    // Ajout du type spécifique si nécessaire
    switch (type) {
      case 'analyzer':
        if (!fileContent.includes('AnalyzerAgent')) {
          missingInterfaces.push('AnalyzerAgent');
        }
        break;
      case 'generator':
        if (!fileContent.includes('GeneratorAgent')) {
          missingInterfaces.push('GeneratorAgent');
        }
        break;
      case 'validator':
        if (!fileContent.includes('ValidatorAgent')) {
          missingInterfaces.push('ValidatorAgent');
        }
        break;
      case 'parser':
        if (!fileContent.includes('ParserAgent')) {
          missingInterfaces.push('ParserAgent');
        }
        break;
    }
  }

  // Si aucune interface de couche n'est trouvée, ajouter l'interface BaseAgent de base
  if (missingInterfaces.length === 0 && !fileContent.includes('BaseAgent')) {
    missingInterfaces.push('BaseAgent');
  }

  return missingInterfaces;
}

/**
 * Recherche récursivement tous les fichiers agents dans un répertoire
 */
async function findAgentFiles(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = await readdir(dir);
  const agentFiles: string[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const subDirFiles = await findAgentFiles(filePath);
      agentFiles.push(...subDirFiles);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      const content = await readFile(filePath, 'utf-8');

      // Vérifier si c'est un fichier agent (contient une classe qui hérite d'Agent ou a "Agent" dans son nom)
      if (
        content.includes('class') &&
        (content.includes('implements') || content.includes('extends')) &&
        (content.includes('Agent') || file.toLowerCase().includes('agent'))
      ) {
        agentFiles.push(filePath);
      }
    }
  }

  return agentFiles;
}

/**
 * Détermine la couche d'un agent à partir de son chemin de fichier
 */
function identifyLayer(filePath: string): 'orchestration' | 'coordination' | 'business' {
  if (filePath.includes('/orchestration/') || filePath.includes('/agents/core/')) {
    return 'orchestration';
  } else if (filePath.includes('/coordination/') || filePath.includes('/agents/integration/')) {
    return 'coordination';
  } else {
    // Par défaut, les agents sont dans la couche business
    return 'business';
  }
}

/**
 * Détermine le type d'un agent à partir de son contenu
 */
async function identifyType(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');

  const typeMatch = content.match(/type = ['"](\w+)['"]/);
  if (typeMatch) {
    return typeMatch[1];
  }

  // Déduire le type en fonction du nom de fichier ou du chemin
  if (filePath.includes('analyzer') || filePath.includes('/analysis/')) {
    return 'analyzer';
  } else if (filePath.includes('generator')) {
    return 'generator';
  } else if (filePath.includes('monitor')) {
    return 'monitor';
  } else if (filePath.includes('orchestrator')) {
    return 'orchestrator';
  } else if (filePath.includes('validator')) {
    return 'validator';
  } else if (filePath.includes('parser')) {
    return 'parser';
  } else if (filePath.includes('bridge')) {
    return 'bridge';
  }

  return 'unknown';
}

/**
 * Ajoute les interfaces manquantes à un fichier agent
 */
async function implementInterfaces(filePath: string, interfaces: string[]): Promise<boolean> {
  if (interfaces.length === 0) return false;

  let content = await readFile(filePath, 'utf-8');
  const layer = identifyLayer(filePath);

  // Ajouter les imports manquants
  for (const iface of interfaces) {
    let importPath;
    switch (iface) {
      case 'BaseAgent':
        if (!content.includes('import { BaseAgent }')) {
          importPath = '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
          // Ajouter l'import au début du fichier
          const lines = content.split('\n');
          let insertIndex = 0;

          // Trouver la position après les commentaires et imports existants
          for (let i = 0; i < lines.length; i++) {
            if (
              !lines[i].trim().startsWith('import ') &&
              !lines[i].trim().startsWith('//') &&
              !lines[i].trim().startsWith('/*') &&
              lines[i].trim() !== ''
            ) {
              insertIndex = i;
              break;
            }
            if (lines[i].trim().startsWith('import ')) {
              insertIndex = i + 1;
            }
          }

          lines.splice(insertIndex, 0, `import { BaseAgent } from '${importPath}';`);
          content = lines.join('\n');
        }
        break;
      case 'OrchestrationAgent':
        if (!content.includes('import { OrchestrationAgent }')) {
          importPath = '@workspaces/cahier-des-charge/src/core/interfaces/orchestration';
          if (content.includes('import { BaseAgent }')) {
            content = content.replace(
              /import import { BaseAgent }  from '.*?';/,
              `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';\nimport { OrchestrationAgent } from '${importPath}';`
            );
          } else {
            const lines = content.split('\n');
            let insertIndex = 0;

            // Trouver la position après les commentaires initiaux
            for (let i = 0; i < lines.length; i++) {
              if (
                !lines[i].trim().startsWith('//') &&
                !lines[i].trim().startsWith('/*') &&
                lines[i].trim() !== ''
              ) {
                insertIndex = i;
                break;
              }
            }

            lines.splice(insertIndex, 0, `import { OrchestrationAgent } from '${importPath}';`);
            content = lines.join('\n');
          }
        }
        break;
      case 'CoordinationAgent':
        if (!content.includes('import { CoordinationAgent }')) {
          importPath = '@workspaces/cahier-des-charge/src/core/interfaces/coordination';
          if (content.includes('import { BaseAgent }')) {
            content = content.replace(
              /import import { BaseAgent }  from '.*?';/,
              `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';\nimport { CoordinationAgent } from '${importPath}';`
            );
          } else {
            const lines = content.split('\n');
            let insertIndex = 0;

            // Trouver la position après les commentaires initiaux
            for (let i = 0; i < lines.length; i++) {
              if (
                !lines[i].trim().startsWith('//') &&
                !lines[i].trim().startsWith('/*') &&
                lines[i].trim() !== ''
              ) {
                insertIndex = i;
                break;
              }
            }

            lines.splice(insertIndex, 0, `import { CoordinationAgent } from '${importPath}';`);
            content = lines.join('\n');
          }
        }
        break;
      case 'BusinessAgent':
        if (!content.includes('import { BusinessAgent }')) {
          importPath = '@workspaces/cahier-des-charge/src/core/interfaces/business';
          if (content.includes('import { BaseAgent }')) {
            content = content.replace(
              /import import { BaseAgent }  from '.*?';/,
              `import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';\nimport { BusinessAgent } from '${importPath}';`
            );
          } else {
            const lines = content.split('\n');
            let insertIndex = 0;

            // Trouver la position après les commentaires initiaux
            for (let i = 0; i < lines.length; i++) {
              if (
                !lines[i].trim().startsWith('//') &&
                !lines[i].trim().startsWith('/*') &&
                lines[i].trim() !== ''
              ) {
                insertIndex = i;
                break;
              }
            }

            lines.splice(insertIndex, 0, `import { BusinessAgent } from '${importPath}';`);
            content = lines.join('\n');
          }
        }
        break;
      default:
        // Pour les types spécifiques (MonitorAgent, OrchestratorAgent, etc.)
        if (!content.includes(`import { ${iface} }`)) {
          if (layer === 'orchestration') {
            importPath = '@workspaces/cahier-des-charge/src/core/interfaces/orchestration';
          } else if (layer === 'coordination') {
            importPath = '@workspaces/cahier-des-charge/src/core/interfaces/coordination';
          } else {
            importPath = '@workspaces/cahier-des-charge/src/core/interfaces/business';
          }

          // Vérifier si nous avons déjà importé depuis ce chemin
          const existingImport = new RegExp(
            `import.*from\\s+['"]${importPath.replace('/', '\\/')}['"]`
          );
          if (content.match(existingImport)) {
            // Modifier l'import existant pour ajouter la nouvelle interface
            content = content.replace(existingImport, (match) => {
              if (match.includes('{') && match.includes('}')) {
                return match.replace(/\{([^}]*)\}/, (m, g) => `{${g}, ${iface}}`);
              } else {
                return match;
              }
            });
          } else {
            // Ajouter un nouvel import
            const lines = content.split('\n');
            let insertIndex = 0;

            // Trouver la position après les commentaires initiaux et les imports existants
            for (let i = 0; i < lines.length; i++) {
              if (
                !lines[i].trim().startsWith('import ') &&
                !lines[i].trim().startsWith('//') &&
                !lines[i].trim().startsWith('/*') &&
                lines[i].trim() !== ''
              ) {
                insertIndex = i;
                break;
              }
              if (lines[i].trim().startsWith('import ')) {
                insertIndex = i + 1;
              }
            }

            lines.splice(insertIndex, 0, `import { ${iface} } from '${importPath}';`);
            content = lines.join('\n');
          }
        }
        break;
    }
  }

  // Ajouter les interfaces à l'implémentation de la classe
  const classRegex = /class\s+(\w+)(?:\s+implements\s+([^{]*))?/;
  const classMatch = content.match(classRegex);

  if (classMatch) {
    const className = classMatch[1];
    const hasImplements = classMatch[2] !== undefined;

    if (hasImplements) {
      // Il y a déjà une clause implements, on ajoute les nouvelles interfaces
      const implementsList = classMatch[2];

      // Filtrer pour ne pas ajouter d'interfaces déjà présentes
      const alreadyImplemented = implementsList.split(',').map((i) => i.trim());
      const interfacesToAdd = interfaces.filter((i) => !alreadyImplemented.includes(i));

      if (interfacesToAdd.length > 0) {
        const updatedImplements = `${implementsList}, ${interfacesToAdd.join(', ')}`;
        content = content.replace(classRegex, `class ${className} implements ${updatedImplements}`);
      }
    } else {
      // Il n'y a pas de clause implements, on en ajoute une
      content = content.replace(
        classRegex,
        `class ${className} implements ${interfaces.join(', ')}`
      );
    }
  }

  await writeFile(filePath, content, 'utf-8');
  return true;
}

/**
 * Générer un rapport des modifications
 */
async function generateReport(updatedFiles: string[], notUpdatedFiles: string[]): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportContent = `# Rapport d'implémentation des interfaces - ${timestamp}

## Résumé
- Fichiers mis à jour: ${updatedFiles.length}
- Fichiers déjà conformes: ${notUpdatedFiles.length}

## Détails des fichiers mis à jour
${updatedFiles.map((file) => `- ${file}`).join('\n')}

## Fichiers déjà conformes
${notUpdatedFiles.map((file) => `- ${file}`).join('\n')}
`;

  const reportDir = path.join(process.cwd(), 'reports', 'migration');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `interface-implementation-${timestamp}.md`);
  await writeFile(reportPath, reportContent, 'utf-8');

  console.log(`Rapport généré: ${reportPath}`);
}

/**
 * Génère un rapport détaillé avec les interfaces ajoutées pour chaque fichier
 */
async function generateDetailedReport(fileUpdates: Record<string, string[]>): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  let reportContent = `# Rapport d'implémentation des interfaces - ${timestamp}\n\n`;
  reportContent += `## Résumé\n`;
  reportContent += `- Total des fichiers traités: ${Object.keys(fileUpdates).length}\n`;
  reportContent += `- Fichiers mis à jour: ${
    Object.keys(fileUpdates).filter((file) => fileUpdates[file].length > 0).length
  }\n`;
  reportContent += `- Fichiers déjà conformes: ${
    Object.keys(fileUpdates).filter((file) => fileUpdates[file].length === 0).length
  }\n\n`;

  reportContent += `## Détails\n\n`;

  for (const [file, interfaces] of Object.entries(fileUpdates)) {
    reportContent += `### ${file}\n`;

    if (interfaces.length > 0) {
      reportContent += `- Ajout des imports pour: ${interfaces.join(', ')}\n`;
      reportContent += `- Ajout des interfaces à la classe: ${interfaces.join(', ')}\n`;
      reportContent += `- Ajout des méthodes requises par les interfaces\n\n`;
    } else {
      reportContent += `- Déjà conforme, aucun changement\n\n`;
    }
  }

  const reportDir = path.join(process.cwd(), 'reports', 'migration');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `interface-implementation-details-${timestamp}.md`);
  await writeFile(reportPath, reportContent, 'utf-8');

  console.log(`Rapport détaillé généré: ${reportPath}`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('Recherche des fichiers agents...');

    // Tous les répertoires contenant des agents
    const directories = [
      '/workspaces/cahier-des-charge/packagesDoDotmcp-agents',
      '/workspaces/cahier-des-charge/agents',
    ];

    let allAgentFiles: string[] = [];

    for (const dir of directories) {
      console.log(`Scan du répertoire: ${dir}`);
      if (!fs.existsSync(dir)) {
        console.log(`Le répertoire ${dir} n'existe pas. Ignoré.`);
        continue;
      }
      const agentFiles = await findAgentFiles(dir);
      console.log(`${agentFiles.length} fichiers trouvés dans ${dir}`);
      allAgentFiles = [...allAgentFiles, ...agentFiles];
    }

    console.log(`Trouvé ${allAgentFiles.length} fichiers agents au total.`);

    const updatedFiles: string[] = [];
    const notUpdatedFiles: string[] = [];
    const fileUpdates: Record<string, string[]> = {};

    for (const filePath of allAgentFiles) {
      try {
        console.log(`Analyse du fichier: ${filePath}`);
        const requiredInterfaces = await getRequiredInterfaces(filePath);
        fileUpdates[filePath] = requiredInterfaces;

        if (requiredInterfaces.length > 0) {
          console.log(
            `Mise à jour du fichier ${filePath} avec les interfaces: ${requiredInterfaces.join(
              ', '
            )}`
          );
          const updated = await implementInterfaces(filePath, requiredInterfaces);

          if (updated) {
            updatedFiles.push(filePath);
          } else {
            notUpdatedFiles.push(filePath);
          }
        } else {
          console.log(`Le fichier ${filePath} possède déjà toutes les interfaces requises.`);
          notUpdatedFiles.push(filePath);
        }
      } catch (err) {
        console.error(`Erreur lors du traitement du fichier ${filePath}:`, err);
      }
    }

    try {
      await generateReport(updatedFiles, notUpdatedFiles);
      await generateDetailedReport(fileUpdates);
    } catch (err) {
      console.error('Erreur lors de la génération des rapports:', err);
    }

    console.log('Terminé !');
    console.log(`${updatedFiles.length} fichiers mis à jour.`);
    console.log(`${notUpdatedFiles.length} fichiers déjà conformes.`);
  } catch (err) {
    console.error('Erreur principale:', err);
  }
}

main().catch((err) => {
  console.error('Erreur non gérée:', err);
});
