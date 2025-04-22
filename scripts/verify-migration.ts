/**
 * verify-migration.ts
 * 
 * Script pour vérifier et valider la migration vers l'architecture MCP OS en 3 couches
 * Ce script:
 * 1. Vérifie la structure des répertoires
 * 2. Valide que les agents ont bien été migrés
 * 3. Détecte les conflits et doublons
 * 4. Génère un rapport de validation post-migration
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import LayeredAgentAuditor from '../packages/mcp-agents/tools/LayeredAgentAuditor/LayeredAgentAuditor';

const execAsync = promisify(exec);
const logger = {
  info: (msg: string) => console.log(`\x1b[36mINFO\x1b[0m: ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33mWARN\x1b[0m: ${msg}`),
  error: (msg: string) => console.log(`\x1b[31mERROR\x1b[0m: ${msg}`),
  success: (msg: string) => console.log(`\x1b[32mSUCCESS\x1b[0m: ${msg}`)
};

// Constantes
const WORKSPACE_ROOT = process.cwd();
const AGENTS_DIR = path.join(WORKSPACE_ROOT, 'agents');
const MCP_AGENTS_DIR = path.join(WORKSPACE_ROOT, 'packages', 'mcp-agents');
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'reports', 'migration');
const VERIFICATION_REPORT = path.join(REPORT_DIR, `migration-verification-${new Date().toISOString().split('T')[0]}.md`);

interface VerificationResult {
  directoryStructure: {
    valid: boolean;
    missingDirs: string[];
  };
  migrationStatus: {
    total: number;
    migrated: number;
    notMigrated: string[];
  };
  agentAudit: any;
  interfaceImplementation: {
    total: number;
    implementsCorrectly: number;
    missingImplementation: Array<{ path: string; missingInterfaces: string[] }>;
  };
}

/**
 * Vérifie la structure de répertoires attendue pour l'architecture en 3 couches
 */
async function verifyDirectoryStructure(): Promise<{
  valid: boolean;
  missingDirs: string[];
}> {
  const expectedDirs = [
    // Orchestration
    path.join(MCP_AGENTS_DIR, 'orchestration', 'orchestrators'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'schedulers'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'monitors'),
    path.join(MCP_AGENTS_DIR, 'orchestration', 'misc'),

    // Coordination
    path.join(MCP_AGENTS_DIR, 'coordination', 'bridges'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'adapters'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'registries'),
    path.join(MCP_AGENTS_DIR, 'coordination', 'misc'),

    // Business
    path.join(MCP_AGENTS_DIR, 'business', 'analyzers'),
    path.join(MCP_AGENTS_DIR, 'business', 'generators'),
    path.join(MCP_AGENTS_DIR, 'business', 'validators'),
    path.join(MCP_AGENTS_DIR, 'business', 'parsers'),
    path.join(MCP_AGENTS_DIR, 'business', 'misc'),

    // Core interfaces
    path.join(WORKSPACE_ROOT, 'src', 'core', 'interfaces')
  ];

  const missingDirs: string[] = [];

  for (const dir of expectedDirs) {
    try {
      const exists = await fs.pathExists(dir);
      if (!exists) {
        missingDirs.push(dir);
      }
    } catch (error) {
      missingDirs.push(dir);
    }
  }

  return {
    valid: missingDirs.length === 0,
    missingDirs
  };
}

/**
 * Vérifie le statut de la migration des agents
 */
async function verifyMigrationStatus(): Promise<{
  total: number;
  migrated: number;
  notMigrated: string[];
}> {
  try {
    // Lire le rapport de migration
    const reportPath = path.join(WORKSPACE_ROOT, 'MigrationReport.json');
    const report = await fs.readJson(reportPath);

    // Compter combien d'agents ont été effectivement migrés
    const notMigrated: string[] = [];

    for (const agent of report.agents) {
      // Vérifier si le fichier existe au chemin de migration
      const exists = await fs.pathExists(agent.migrationPath);
      if (!exists) {
        notMigrated.push(agent.id);
      }
    }

    return {
      total: report.totalAgents,
      migrated: report.totalAgents - notMigrated.length,
      notMigrated
    };
  } catch (error) {
    logger.error("Impossible de lire le rapport de migration. La migration a-t-elle été exécutée ?");
    return {
      total: 0,
      migrated: 0,
      notMigrated: []
    };
  }
}

/**
 * Vérifie si les agents implémentent correctement les interfaces
 */
async function verifyInterfaceImplementation(): Promise<{
  total: number;
  implementsCorrectly: number;
  missingImplementation: Array<{ path: string; missingInterfaces: string[] }>;
}> {
  const auditor = new LayeredAgentAuditor(WORKSPACE_ROOT);
  const result = await auditor.audit();

  return {
    total: result.totalAgents,
    implementsCorrectly: result.totalAgents - result.missingInterfaces.length,
    missingImplementation: result.missingInterfaces
  };
}

/**
 * Génère un rapport de vérification de migration au format Markdown
 */
async function generateVerificationReport(result: VerificationResult): Promise<string> {
  const report = `# Rapport de vérification de la migration MCP OS en 3 couches

Date: ${new Date().toISOString().split('T')[0]}

## Structure des répertoires

État: ${result.directoryStructure.valid ? '✅ Valide' : '❌ Incomplète'}

${result.directoryStructure.missingDirs.length > 0 ?
      `Répertoires manquants:
${result.directoryStructure.missingDirs.map(dir => `- \`${path.relative(WORKSPACE_ROOT, dir)}\``).join('\n')}` :
      'Tous les répertoires nécessaires sont présents.'}

## Statut de la migration

- **Total des agents**: ${result.migrationStatus.total}
- **Migrés avec succès**: ${result.migrationStatus.migrated} (${Math.round(result.migrationStatus.migrated / result.migrationStatus.total * 100)}%)
- **Non migrés**: ${result.migrationStatus.notMigrated.length} (${Math.round(result.migrationStatus.notMigrated.length / result.migrationStatus.total * 100)}%)

${result.migrationStatus.notMigrated.length > 0 ?
      `Agents à migrer:
${result.migrationStatus.notMigrated.map(id => `- ${id}`).join('\n')}` :
      'Tous les agents ont été migrés avec succès.'}

## Implémentation des interfaces

- **Total des agents**: ${result.interfaceImplementation.total}
- **Conformes**: ${result.interfaceImplementation.implementsCorrectly} (${Math.round(result.interfaceImplementation.implementsCorrectly / result.interfaceImplementation.total * 100)}%)
- **Non conformes**: ${result.interfaceImplementation.missingImplementation.length} (${Math.round(result.interfaceImplementation.missingImplementation.length / result.interfaceImplementation.total * 100)}%)

${result.interfaceImplementation.missingImplementation.length > 0 ?
      `Agents non conformes:
${result.interfaceImplementation.missingImplementation.map(item =>
        `- \`${path.relative(WORKSPACE_ROOT, item.path)}\` manque: ${item.missingInterfaces.join(', ')}`
      ).join('\n')}` :
      'Tous les agents implémentent correctement les interfaces requises.'}

## Récapitulatif par couche

| Couche | Nombre d'agents | % du total |
|--------|----------------|------------|
| Orchestration | ${result.agentAudit.byLayer.orchestration || 0} | ${Math.round(((result.agentAudit.byLayer.orchestration || 0) / result.agentAudit.totalAgents) * 100)}% |
| Coordination | ${result.agentAudit.byLayer.coordination || 0} | ${Math.round(((result.agentAudit.byLayer.coordination || 0) / result.agentAudit.totalAgents) * 100)}% |
| Business | ${result.agentAudit.byLayer.business || 0} | ${Math.round(((result.agentAudit.byLayer.business || 0) / result.agentAudit.totalAgents) * 100)}% |
| Non classé | ${result.agentAudit.byLayer.unknown || 0} | ${Math.round(((result.agentAudit.byLayer.unknown || 0) / result.agentAudit.totalAgents) * 100)}% |

## Recommandations

${result.directoryStructure.valid && result.migrationStatus.notMigrated.length === 0 && result.interfaceImplementation.missingImplementation.length === 0 ?
      '✅ La migration est complète et conforme à l\'architecture en 3 couches.' :
      `Pour finaliser la migration:

1. ${result.directoryStructure.missingDirs.length > 0 ?
        `Créer les répertoires manquants (${result.directoryStructure.missingDirs.length})` :
        '✅ Structure de répertoires complète'}
2. ${result.migrationStatus.notMigrated.length > 0 ?
        `Migrer les agents restants (${result.migrationStatus.notMigrated.length})` :
        '✅ Tous les agents sont migrés'}
3. ${result.interfaceImplementation.missingImplementation.length > 0 ?
        `Implémenter les interfaces manquantes pour les agents non conformes (${result.interfaceImplementation.missingImplementation.length})` :
        '✅ Tous les agents implémentent les interfaces correctement'}

Exécutez ce script à nouveau après avoir effectué ces actions pour vérifier que la migration est complète.`
    }
`;

  // Écrire le rapport dans un fichier
  await fs.ensureDir(path.dirname(VERIFICATION_REPORT));
  await fs.writeFile(VERIFICATION_REPORT, report);

  return report;
}

/**
 * Fonction principale d'exécution
 */
async function main() {
  logger.info("Vérification de la migration MCP OS en 3 couches...");

  // Vérifier la structure des répertoires
  logger.info("Vérification de la structure des répertoires...");
  const directoryStructure = await verifyDirectoryStructure();
  if (directoryStructure.valid) {
    logger.success("✅ Structure de répertoires valide");
  } else {
    logger.warn(`⚠️ Structure de répertoires incomplète (${directoryStructure.missingDirs.length} répertoires manquants)`);
  }

  // Vérifier le statut de la migration
  logger.info("Vérification du statut de la migration...");
  const migrationStatus = await verifyMigrationStatus();
  if (migrationStatus.total > 0) {
    const percentage = Math.round((migrationStatus.migrated / migrationStatus.total) * 100);
    if (percentage === 100) {
      logger.success(`✅ Migration complète: ${migrationStatus.migrated}/${migrationStatus.total} agents migrés (100%)`);
    } else {
      logger.warn(`⚠️ Migration partielle: ${migrationStatus.migrated}/${migrationStatus.total} agents migrés (${percentage}%)`);
    }
  } else {
    logger.error("❌ Aucune information de migration trouvée");
  }

  // Exécuter l'audit des agents
  logger.info("Audit des agents...");
  const auditor = new LayeredAgentAuditor(WORKSPACE_ROOT);
  const agentAudit = await auditor.audit();
  logger.info(`Total des agents dans la nouvelle structure: ${agentAudit.totalAgents}`);

  // Vérifier l'implémentation des interfaces
  logger.info("Vérification de l'implémentation des interfaces...");
  const interfaceImplementation = await verifyInterfaceImplementation();
  if (interfaceImplementation.missingImplementation.length === 0) {
    logger.success(`✅ Tous les agents implémentent correctement les interfaces`);
  } else {
    logger.warn(`⚠️ ${interfaceImplementation.missingImplementation.length} agents n'implémentent pas toutes les interfaces requises`);
  }

  // Générer le rapport de vérification
  logger.info("Génération du rapport de vérification...");
  const result: VerificationResult = {
    directoryStructure,
    migrationStatus,
    agentAudit,
    interfaceImplementation
  };

  await generateVerificationReport(result);

  logger.success(`Rapport de vérification généré: ${path.relative(WORKSPACE_ROOT, VERIFICATION_REPORT)}`);

  // Afficher un résumé final
  if (directoryStructure.valid && migrationStatus.notMigrated.length === 0 && interfaceImplementation.missingImplementation.length === 0) {
    logger.success("✅ Migration réussie! L'architecture en 3 couches est correctement implémentée.");
  } else {
    logger.warn("⚠️ Migration incomplète. Consultez le rapport pour les prochaines étapes.");

    // Afficher les statistiques de migration
    const pctStructure = directoryStructure.missingDirs.length > 0 ?
      Math.round((1 - directoryStructure.missingDirs.length / 14) * 100) : 100;

    const pctMigrated = migrationStatus.total > 0 ?
      Math.round((migrationStatus.migrated / migrationStatus.total) * 100) : 0;

    const pctInterfaces = interfaceImplementation.total > 0 ?
      Math.round((interfaceImplementation.implementsCorrectly / interfaceImplementation.total) * 100) : 0;

    const totalPct = Math.round((pctStructure + pctMigrated + pctInterfaces) / 3);

    logger.info(`Progrès global de la migration: ${totalPct}%`);
    logger.info(`- Structure: ${pctStructure}%`);
    logger.info(`- Migration des agents: ${pctMigrated}%`);
    logger.info(`- Implémentation des interfaces: ${pctInterfaces}%`);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  logger.error(`Erreur lors de la vérification: ${error.message}`);
  process.exit(1);
});