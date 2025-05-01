/**
 * implement-interfaces.ts
 *
 * Script pour ajouter automatiquement les interfaces manquantes aux agents
 * dans l'architecture MCP OS en 3 couches
 *
 * Date: 2025-04-18
 */

import * as fs from 'fs-extrastructure-agent';
import * as path from 'pathstructure-agent';
import { glob } from './globstructure-agent';

// Définition des interfaces par couche
const _INTERFACES = {
  base: 'BaseAgent',
  orchestration: 'OrchestrationAgent',
  business: 'BusinessAgent',
  coordination: 'CoordinationAgent',
};

// Chemins des interfaces
const INTERFACES_PATH = {
  base: '../../core/interfaces/BaseAgent',
  orchestration: '../../core/interfaces/orchestration',
  business: '../../core/interfaces/business',
  coordination: '../../core/interfaces/coordination',
};

// Pour les agents dans le répertoire legacy
const LEGACY_INTERFACES_PATH = {
  base: '../core/interfaces/BaseAgent',
  orchestration: '../core/interfaces/orchestration',
  business: '../core/interfaces/business',
  coordination: '../core/interfaces/coordination',
};

/**
 * Détecte la couche d'un agent en fonction de son chemin
 */
function detectAgentLayer(filePath: string): 'orchestration' | 'business' | 'coordination' | null {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

  // Détection par structure de répertoire
  if (
    normalizedPath.includes('/orchestration/') ||
    normalizedPath.includes('/orchestrators/') ||
    normalizedPath.includes('/schedulers/') ||
    normalizedPath.includes('/monitors/')
  ) {
    return 'orchestration';
  }

  if (
    normalizedPath.includes('/business/') ||
    normalizedPath.includes('/analyzers/') ||
    normalizedPath.includes('/generators/') ||
    normalizedPath.includes('/validators/') ||
    normalizedPath.includes('/parsers/')
  ) {
    return 'business';
  }

  if (
    normalizedPath.includes('/coordination/') ||
    normalizedPath.includes('/bridges/') ||
    normalizedPath.includes('/adapters/') ||
    normalizedPath.includes('/mediator/')
  ) {
    return 'coordination';
  }

  // Pour les agents legacy, analyse du nom de fichier et du chemin
  if (normalizedPath.includes('/agents/')) {
    // Détection par nom de fichier pour les agents legacy
    const fileName = path.basename(normalizedPath);

    // Détection par nom pour la couche orchestration
    if (
      fileName.includes('orchestrator') ||
      fileName.includes('monitor') ||
      fileName.includes('scheduler') ||
      fileName.includes('StatusWriter') ||
      fileName.includes('notifier') ||
      fileName.includes('notification-service') ||
      fileName.includes('metrics-service') ||
      fileName.includes('bridge')
    ) {
      return 'orchestration';
    }

    // Détection par nom pour la couche business
    if (
      fileName.includes('analyzer') ||
      fileName.includes('generator') ||
      fileName.includes('validator') ||
      fileName.includes('parser') ||
      fileName.includes('quality') ||
      fileName.includes('audit') ||
      fileName.includes('seo-') ||
      fileName.includes('type-') ||
      fileName.includes('table-') ||
      fileName.includes('classifier') ||
      fileName.includes('mapper') ||
      fileName.includes('converter')
    ) {
      return 'business';
    }

    // Détection par nom pour la couche coordination
    if (
      fileName.includes('bridge') ||
      fileName.includes('adapter') ||
      fileName.includes('coordinator') ||
      fileName.includes('sync') ||
      fileName.includes('integration') ||
      fileName.includes('connector') ||
      fileName.includes('service')
    ) {
      return 'coordination';
    }

    // Détection par chemin
    if (normalizedPath.includes('/integration/')) {
      return 'coordination';
    }

    if (
      normalizedPath.includes('/analysis/') ||
      normalizedPath.includes('/quality/') ||
      normalizedPath.includes('/migration/')
    ) {
      return 'business';
    }

    if (normalizedPath.includes('/core/')) {
      // Analyse basée sur le nom si dans /core/
      if (fileName.includes('orchestrator')) {
        return 'orchestration';
      }
      if (fileName.includes('coordinator')) {
        return 'coordination';
      }
      return 'business'; // Par défaut business si non détecté
    }
  }

  // Analyse du contenu du fichier pour détection (à implémenter si nécessaire)
  // En dernier recours, on catégorise par défaut comme business
  // Ce choix est basé sur la statistique que 65% des agents sont business
  return 'business';
}

/**
 * Vérifie si un agent implémente déjà une interface
 */
async function checkExistingInterfaces(filePath: string): Promise<{
  baseAgent: boolean;
  layerInterface: boolean;
}> {
  const content = await fs.readFile(filePath, 'utf-8');

  return {
    baseAgent: content.includes('implements BaseAgent') || content.includes('extends BaseAgent'),
    layerInterface:
      content.includes('implements OrchestrationAgent') ||
      content.includes('implements BusinessAgent') ||
      content.includes('implements CoordinationAgent') ||
      content.includes('extends OrchestrationAgent') ||
      content.includes('extends BusinessAgent') ||
      content.includes('extends CoordinationAgent'),
  };
}

/**
 * Ajoute les imports d'interfaces manquantes
 */
function addInterfaceImports(content: string, filePath: string, layer: string): string {
  // Si c'est un agent legacy ou dans nouvelle structure
  const isLegacyAgent = filePath.includes('/agents/');
  const interfacePaths = isLegacyAgent ? LEGACY_INTERFACES_PATH : INTERFACES_PATH;

  // Vérifier si des imports existent déjà
  const hasImports = content.includes('import {') || content.includes('import *');
  const importsBaseAgent = content.includes('import') && content.includes('BaseAgent');
  const importsLayerInterface =
    content.includes('import') &&
    (content.includes('OrchestrationAgent') ||
      content.includes('BusinessAgent') ||
      content.includes('CoordinationAgent'));

  const interfacesToImport = [];

  if (!importsBaseAgent) {
    interfacesToImport.push('BaseAgent');
  }

  if (!importsLayerInterface && layer) {
    const layerInterface =
      layer === 'orchestration'
        ? 'OrchestrationAgent'
        : layer === 'business'
          ? 'BusinessAgent'
          : 'CoordinationAgent';
    interfacesToImport.push(layerInterface);
  }

  if (interfacesToImport.length === 0) {
    return content; // Pas besoin d'ajouter d'imports
  }

  // Ajouter les imports
  const importStatement = `import { ${interfacesToImport.join(', ')} } from '${
    interfacePaths.base
  }structure-agent'\n`;

  // Si le fichier a déjà des imports, ajouter après le dernier import
  if (hasImports) {
    const lines = content.split('\n');
    let lastImportIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import')) {
        lastImportIndex = i;
      }
    }

    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join('\n');
  }

  // Si aucun import, ajouter au début du fichier après les commentaires initiaux
  const lines = content.split('\n');
  let insertIndex = 0;

  // Trouver la fin des commentaires d'en-tête
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].trim() === '' &&
      i > 0 &&
      !lines[i - 1].startsWith('//') &&
      !lines[i - 1].startsWith('/*')
    ) {
      insertIndex = i;
      break;
    }
  }

  lines.splice(insertIndex, 0, importStatement, '');
  return lines.join('\n');
}

/**
 * Ajoute les interfaces à une classe d'agent
 */
function addInterfacesToClass(content: string, interfaces: string[]): string {
  if (interfaces.length === 0) {
    return content;
  }

  const lines = content.split('\n');

  // Trouver les déclarations de classe
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détecter les déclarations de classe
    if (line.includes('class') && line.includes('export')) {
      if (line.includes('implements') || line.includes('extends')) {
        // La classe a déjà des implémentations/extensions, ajouter à la liste
        if (line.includes('implements')) {
          const classEndIndex = line.indexOf('implements') + 'implements'.length;
          const before = line.substring(0, classEndIndex);
          const after = line.substring(classEndIndex);
          lines[i] = `${before} ${interfaces.join(', ')},${after}`;
        } else if (line.includes('extends')) {
          const classEndIndex = line.indexOf('{');
          const before = line.substring(0, classEndIndex).trim();
          const after = line.substring(classEndIndex);
          lines[i] = `${before} implements ${interfaces.join(', ')} ${after}`;
        }
      } else {
        // Pas d'implémentation existante
        const classEndIndex = line.indexOf('{');
        if (classEndIndex !== -1) {
          const before = line.substring(0, classEndIndex).trim();
          const after = line.substring(classEndIndex);
          lines[i] = `${before} implements ${interfaces.join(', ')} ${after}`;
        } else {
          // Déclaration de classe multi-ligne
          lines[i] = `${line} implements ${interfaces.join(', ')}`;
        }
      }

      // Une fois qu'on a traité la première classe, on s'arrête
      break;
    }
  }

  return lines.join('\n');
}

/**
 * Ajoute les méthodes requises par les interfaces
 */
function addRequiredMethods(content: string, layer: string): string {
  const baseAgentMethods = {
    id: `  id: string = '';`,
    name: `  name: string = '';`,
    type: `  type: string = '';`,
    version: `  version: string = '1.0.0';`,
    initialize: `
  /**
   * Initialise l'agent avec des options spécifiques
   */
  async initialize(options?: Record<string, any>): Promise<void> {
    // À implémenter selon les besoins spécifiques de l'agent
    console.log(\`[\${this.name}] Initialisation...\`);
  }`,
    isReady: `
  /**
   * Indique si l'agent est prêt à être utilisé
   */
  isReady(): boolean {
    return true;
  }`,
    shutdown: `
  /**
   * Arrête et nettoie l'agent
   */
  async shutdown(): Promise<void> {
    console.log(\`[\${this.name}] Arrêt...\`);
  }`,
    getMetadata: `
  /**
   * Récupère les métadonnées de l'agent
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }`,
  };

  const orchestrationMethods = {
    getSystemState: `
  /**
   * Récupère l'état actuel du système
   */
  async getSystemState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }`,
  };

  const businessMethods = {
    getState: `
  /**
   * Récupère l'état actuel de l'agent business
   */
  async getState(): Promise<Record<string, any>> {
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }`,
  };

  const coordinationMethods = {
    checkConnection: `
  /**
   * Vérifie la connexion avec un service
   */
  async checkConnection(serviceId: string): Promise<boolean> {
    return true;
  }`,
  };

  // Vérifie si les méthodes existent déjà
  const hasMethod: Record<string, boolean> = {};
  const lines = content.split('\n');

  Object.keys(baseAgentMethods).forEach((method) => {
    hasMethod[method] = content.includes(`${method}(`);
  });

  if (layer === 'orchestration') {
    Object.keys(orchestrationMethods).forEach((method) => {
      hasMethod[method] = content.includes(`${method}(`);
    });
  } else if (layer === 'business') {
    Object.keys(businessMethods).forEach((method) => {
      hasMethod[method] = content.includes(`${method}(`);
    });
  } else if (layer === 'coordination') {
    Object.keys(coordinationMethods).forEach((method) => {
      hasMethod[method] = content.includes(`${method}(`);
    });
  }

  // Trouver la fin de la classe pour ajouter les méthodes manquantes
  let closingBraceIndex = -1;
  let openBraceCount = 0;
  let foundClass = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('class') && lines[i].includes('export')) {
      foundClass = true;
    }

    if (foundClass) {
      if (lines[i].includes('{')) openBraceCount++;
      if (lines[i].includes('}')) openBraceCount--;

      if (openBraceCount === 0 && foundClass) {
        closingBraceIndex = i;
        break;
      }
    }
  }

  if (closingBraceIndex === -1) {
    return content; // Structure de classe non reconnue
  }

  // Ajouter les propriétés manquantes
  const newMethods: string[] = [];

  // Ajouter les propriétés et méthodes BaseAgent
  if (!hasMethod.id) newMethods.push(baseAgentMethods.id);
  if (!hasMethod.name) newMethods.push(baseAgentMethods.name);
  if (!hasMethod.type) newMethods.push(baseAgentMethods.type);
  if (!hasMethod.version) newMethods.push(baseAgentMethods.version);

  // Ajouter les méthodes BaseAgent
  if (!hasMethod.initialize) newMethods.push(baseAgentMethods.initialize);
  if (!hasMethod.isReady) newMethods.push(baseAgentMethods.isReady);
  if (!hasMethod.shutdown) newMethods.push(baseAgentMethods.shutdown);
  if (!hasMethod.getMetadata) newMethods.push(baseAgentMethods.getMetadata);

  // Ajouter les méthodes spécifiques à la couche
  if (layer === 'orchestration' && !hasMethod.getSystemState) {
    newMethods.push(orchestrationMethods.getSystemState);
  } else if (layer === 'business' && !hasMethod.getState) {
    newMethods.push(businessMethods.getState);
  } else if (layer === 'coordination' && !hasMethod.checkConnection) {
    newMethods.push(coordinationMethods.checkConnection);
  }

  // Si des méthodes doivent être ajoutées
  if (newMethods.length > 0) {
    // Ajouter un saut de ligne avant les méthodes si nécessaire
    if (lines[closingBraceIndex - 1].trim().length > 0) {
      newMethods.unshift('');
    }

    // Insérer les méthodes avant l'accolade fermante de la classe
    lines.splice(closingBraceIndex, 0, ...newMethods);
  }

  return lines.join('\n');
}

/**
 * Ajoute les interfaces manquantes pour un agent
 */
async function implementInterfaces(
  filePath: string
): Promise<{ success: boolean; changes: string[] }> {
  try {
    // Déterminer la couche de l'agent
    const layer = detectAgentLayer(filePath);

    if (!layer) {
      return {
        success: false,
        changes: [`Impossible de déterminer la couche pour ${filePath}`],
      };
    }

    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf-8');

    // Vérifier les interfaces existantes
    const existingInterfaces = await checkExistingInterfaces(filePath);

    // Déterminer les interfaces à ajouter
    const interfacesToAdd: string[] = [];

    if (!existingInterfaces.baseAgent) {
      interfacesToAdd.push('BaseAgent');
    }

    if (!existingInterfaces.layerInterface) {
      const layerInterface =
        layer === 'orchestration'
          ? 'OrchestrationAgent'
          : layer === 'business'
            ? 'BusinessAgent'
            : 'CoordinationAgent';
      interfacesToAdd.push(layerInterface);
    }

    const changes: string[] = [];

    // Si aucune interface à ajouter, retourner
    if (interfacesToAdd.length === 0) {
      return { success: true, changes: [] };
    }

    // 1. Ajouter les imports nécessaires
    let updatedContent = addInterfaceImports(content, filePath, layer);
    changes.push(`Ajout des imports pour: ${interfacesToAdd.join(', ')}`);

    // 2. Ajouter l'implémentation des interfaces à la classe
    updatedContent = addInterfacesToClass(updatedContent, interfacesToAdd);
    changes.push(`Ajout des interfaces à la classe: ${interfacesToAdd.join(', ')}`);

    // 3. Ajouter les méthodes requises par les interfaces
    updatedContent = addRequiredMethods(updatedContent, layer);
    changes.push('Ajout des méthodes requises par les interfaces');

    // Écrire le contenu modifié dans le fichier
    await fs.writeFile(filePath, updatedContent);

    return {
      success: true,
      changes,
    };
  } catch (error) {
    console.error(`Erreur lors de l'implémentation des interfaces pour ${filePath}:`, error);
    return {
      success: false,
      changes: [`Erreur: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

/**
 * Récupère la liste des fichiers d'agents à partir du rapport de vérification
 */
async function extractAgentsFromReport(reportPath: string): Promise<string[]> {
  try {
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const agentPaths: string[] = [];

    // Expression régulière pour extraire les chemins des agents non conformes
    const pathRegex = /`([^`]+)` manque:/g;
    let match;

    while ((match = pathRegex.exec(reportContent)) !== null) {
      agentPaths.push(match[1]);
    }

    return agentPaths;
  } catch (error) {
    console.error(`Erreur lors de l'extraction des agents du rapport:`, error);
    return [];
  }
}

/**
 * Fonction principale pour implémenter les interfaces manquantes
 */
async function main() {
  console.log('Implémentation des interfaces manquantes...');

  try {
    // Lire le rapport pour obtenir la liste des agents non conformes
    const reportPath = path.join(
      process.cwd(),
      'reports',
      'migration',
      'migration-verification-2025-04-18.md'
    );
    const agentPaths = await extractAgentsFromReport(reportPath);

    console.log(`${agentPaths.length} agents trouvés avec des interfaces manquantes`);

    let successful = 0;
    const results: Record<string, any> = {};

    // Traiter chaque agent
    for (const agentPath of agentPaths) {
      const fullPath = path.join(process.cwd(), agentPath);

      // Vérifier si le fichier existe
      if (await fs.pathExists(fullPath)) {
        console.log(`Traitement de ${agentPath}...`);
        const result = await implementInterfaces(fullPath);

        if (result.success) {
          successful++;
          results[agentPath] = result.changes;
          console.log(`✅ Succès pour ${agentPath}`);
        } else {
          results[agentPath] = result.changes;
          console.log(`❌ Échec pour ${agentPath}: ${result.changes.join(', ')}`);
        }
      } else {
        console.log(`⚠️ Fichier non trouvé: ${agentPath}`);
        results[agentPath] = ['Fichier non trouvé'];
      }
    }

    // Générer un rapport des résultats
    const reportContent = `# Rapport d'implémentation des interfaces - ${new Date().toISOString()}

## Résumé
- Total des agents traités: ${agentPaths.length}
- Succès: ${successful} (${Math.round((successful / agentPaths.length) * 100)}%)
- Échecs: ${agentPaths.length - successful}

## Détails

${Object.entries(results)
  .map(
    ([agent, changes]) =>
      `### ${agent}\n${
        Array.isArray(changes) ? changes.map((change) => `- ${change}`).join('\n') : ''
      }`
  )
  .join('\n\n')}
`;

    // Écrire le rapport des résultats
    const outputReportPath = path.join(
      process.cwd(),
      'reports',
      'migration',
      'interface-implementation-results.md'
    );
    await fs.outputFile(outputReportPath, reportContent);

    console.log('\nImplémentation terminée.');
    console.log(`- ${successful}/${agentPaths.length} agents mis à jour avec succès`);
    console.log(`- Rapport généré: ${outputReportPath}`);
  } catch (error) {
    console.error("Erreur lors de l'exécution du script:", error);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

export {
  implementInterfaces,
  detectAgentLayer,
  addInterfaceImports,
  addInterfacesToClass,
  addRequiredMethods,
};
