import * as path from 'path';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import glob from 'glob';

const globAsync = promisify(glob);

interface MCPManifest {
  id: string;
  status: string;
  type?: string;
  route?: string;
  file?: string;
  generatedFiles?: string[];
  agentsExecuted?: string[];
  lastUpdated?: string;
}

interface AgentExecution {
  step: string;
  status: 'ok' | 'error' | 'missing';
  timestamp?: string;
  details?: any;
}

interface MigrationTrace {
  id: string;
  type?: string;
  route?: string;
  file?: string;
  status: string;
  trace: AgentExecution[];
  lastUpdated?: string;
  completionRate?: number;
}

interface PipelineConfig {
  version: string;
  migrationTypes: Record<
    string,
    {
      requiredSteps: string[];
      statusSequence: string[];
    }
  >;
  timeouts: Record<string, number>;
  metrics: {
    requiredForDashboard: string[];
  };
}

/**
 * Charge la configuration d'audit du pipeline
 */
async function loadPipelineConfig(): Promise<PipelineConfig> {
  try {
    const configContent = await fs.readFile('pipeline.audit.config.json', 'utf-8');
    return JSON.parse(configContent) as PipelineConfig;
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration du pipeline:', error);
    // Configuration par défaut
    return {
      version: '1.0.0',
      migrationTypes: {
        standard: {
          requiredSteps: [
            'php-analyzer',
            'structure-classifier-agent',
            'remix-generator',
            'qa-analyzer',
            'seo-checker',
            'pr-creator',
          ],
          statusSequence: [
            'planned',
            'detected',
            'analyzed',
            'structured',
            'generated',
            'validated',
            'integrated',
            'completed',
          ],
        },
      },
      timeouts: {
        planned: 14,
        detected: 7,
        analyzed: 5,
        structured: 3,
        generated: 3,
        validated: 5,
        integrated: 2,
      },
      metrics: {
        requiredForDashboard: [
          'completion_rate',
          'missing_agents_count',
          'blocked_migrations_count',
          'age_distribution',
        ],
      },
    };
  }
}

/**
 * Vérifie l'exécution des agents pour chaque migration et génère des fichiers trace.json
 */
export async function verifyMigrationTraces(): Promise<void> {
  console.log('🕵️ Vérification des traces de migration en cours...');

  // Charger la configuration
  const config = await loadPipelineConfig();
  console.log(
    `📝 Configuration chargée: ${
      config.migrationTypes ? Object.keys(config.migrationTypes).length : 0
    } types de migration définis`
  );

  // Recherche des manifestes
  const manifestFiles = await globAsync('**/MCPManifest.json', { ignore: 'node_modules/**' });
  console.log(`📄 ${manifestFiles.length} fichiers MCPManifest.json trouvés`);

  // Recherche des logs d'agent
  const agentLogFiles = await globAsync('**/logs/agent-*.log', { ignore: 'node_modules/**' });
  const agentLogs = await loadAgentLogs(agentLogFiles);
  console.log(`📊 ${agentLogFiles.length} fichiers de log d'agents trouvés`);

  let tracesGenerated = 0;
  let tracesWithMissing = 0;

  // Pour chaque manifeste, générer une trace
  for (const file of manifestFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const manifest = JSON.parse(content) as MCPManifest;

      // Déterminer le type de migration (par défaut: standard)
      const migrationType = manifest.type || 'standard';

      // Construire le chemin de trace
      const traceDir = path.dirname(file);
      const traceFilePath = path.join(traceDir, 'migration.trace.json');

      // Vérifier si le type de migration existe dans la configuration
      const typeConfig = config.migrationTypes[migrationType];
      if (!typeConfig) {
        console.warn(`⚠️ Type de migration non défini dans la configuration: ${migrationType}`);
        continue;
      }

      // Générer la trace
      const trace = await generateMigrationTrace(manifest, agentLogs, typeConfig);

      // Vérifier s'il y a des étapes manquantes
      const missingSteps = trace.trace.filter((step) => step.status === 'missing');
      if (missingSteps.length > 0) {
        tracesWithMissing++;
        console.log(`⚠️ Migration ${manifest.id} : ${missingSteps.length} étapes manquantes`);
      }

      // Écrire le fichier de trace
      await fs.writeFile(traceFilePath, JSON.stringify(trace, null, 2));
      tracesGenerated++;
    } catch (error) {
      console.error(`Erreur lors de la génération de trace pour ${file}:`, error);
    }
  }

  // Générer un rapport de synthèse
  const report = {
    timestamp: new Date().toISOString(),
    totalManifests: manifestFiles.length,
    tracesGenerated,
    tracesWithMissing,
    completionPercentage:
      tracesGenerated > 0
        ? Math.round(((tracesGenerated - tracesWithMissing) / tracesGenerated) * 100)
        : 0,
  };

  await fs.writeFile('trace-verification-report.json', JSON.stringify(report, null, 2));
  console.log(
    `✅ Vérification terminée : ${tracesGenerated} traces générées, ${tracesWithMissing} avec des étapes manquantes`
  );
  console.log(`📈 Taux de complétion: ${report.completionPercentage}%`);
}

/**
 * Génère la trace de migration pour un manifeste
 */
async function generateMigrationTrace(
  manifest: MCPManifest,
  agentLogs: Record<string, any[]>,
  typeConfig: { requiredSteps: string[]; statusSequence: string[] }
): Promise<MigrationTrace> {
  const trace: MigrationTrace = {
    id: manifest.id,
    type: manifest.type || 'standard',
    route: manifest.route,
    file: manifest.file,
    status: manifest.status,
    trace: [],
    lastUpdated: manifest.lastUpdated,
  };

  // Pour chaque agent attendu selon le type, vérifier s'il a été exécuté
  let completedSteps = 0;
  const expectedAgents = getRequiredAgentsByType(typeConfig);

  for (const agent of expectedAgents) {
    const execution: AgentExecution = { step: agent, status: 'missing' };

    // Vérifier dans les logs si l'agent a traité cette migration
    if (agentLogs[agent]) {
      const logEntry = agentLogs[agent].find(
        (log) => log.migrationId === manifest.id || (manifest.file && log.file === manifest.file)
      );

      if (logEntry) {
        execution.status = logEntry.success ? 'ok' : 'error';
        execution.timestamp = logEntry.timestamp;
        execution.details = logEntry.details;

        if (execution.status === 'ok') {
          completedSteps++;
        }
      }
    }

    // Vérifier dans les agentsExecuted du manifest
    if (manifest.agentsExecuted?.includes(agent)) {
      // Si l'agent est listé mais pas trouvé dans les logs
      if (execution.status === 'missing') {
        execution.status = 'ok';
        completedSteps++;
      }
    }

    trace.trace.push(execution);
  }

  // Calculer le taux de complétion
  trace.completionRate = Math.round((completedSteps / expectedAgents.length) * 100);

  return trace;
}

/**
 * Obtient la liste des agents requis selon le type de migration
 */
function getRequiredAgentsByType(typeConfig: { requiredSteps: string[] }): string[] {
  return typeConfig.requiredSteps;
}

/**
 * Charge les données des logs d'agent
 */
async function loadAgentLogs(logFiles: string[]): Promise<Record<string, any[]>> {
  const logs: Record<string, any[]> = {};

  for (const file of logFiles) {
    try {
      // Extraire le nom de l'agent du nom du fichier
      const fileName = path.basename(file);
      const agentMatch = fileName.match(/agent-([^.]+)\.log/);
      if (!agentMatch) continue;

      const agentName = agentMatch[1];
      const content = await fs.readFile(file, 'utf-8');

      // Analyser chaque ligne comme un JSON
      const entries = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (_e) {
            return null;
          }
        })
        .filter(Boolean);

      logs[agentName] = entries;
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier de log ${file}:`, error);
    }
  }

  return logs;
}

// Exécuter si appelé directement
if (require.main === module) {
  verifyMigrationTraces()
    .then(() => console.log('🎯 Vérification des traces terminée'))
    .catch((error) => console.error('❌ Erreur pendant la vérification:', error));
}
