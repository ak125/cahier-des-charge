/**
 * generate-layer-interfaces.ts
 *
 * Outil pour générer les interfaces TypeScript des trois couches de l'architecture MCP OS
 *
 * Cet outil définit les contrats d'interface pour chaque type d'agent dans chacune des couches:
 * - Orchestration: gestion des workflows, coordination de haut niveau
 * - Coordination: enregistrement des agents, logs, propagation de statut
 * - Business: agents analytiques, générateurs, stratégies
 *
 * Les interfaces sont générées avec une documentation JSDoc complète et
 * servent de base pour les futurs développements et la standardisation.
 */

import * as fs from 'fs';
import * as path from 'path';

// Répertoire de base des interfaces
const INTERFACES_DIR = path.join(process.cwd(), 'src', 'core', 'interfaces');

// Configurer les interfaces pour chaque couche
interface LayerDefinition {
  name: string;
  description: string;
  responsibility: string;
  agentTypes: Record<string, AgentTypeConfig>;
}

// Définition d'une méthode d'agent
interface AgentMethod {
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  returnType: string;
  returnDescription?: string;
}

// Définition d'un type d'agent
interface AgentTypeConfig {
  name: string;
  description: string;
  extends?: string;
  methods: AgentMethod[];
  properties?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
}

// Définitions des couches et types d'agents
const layers: LayerDefinition[] = [
  {
    name: 'orchestration',
    description: "Couche d'orchestration - Gestion des workflows et coordination de haut niveau",
    responsibility:
      "Gérer le cycle de vie des workflows, coordonner l'exécution des agents, et assurer la fiabilité du système",
    agentTypes: {
      orchestrator: {
        name: 'OrchestratorAgent',
        description: 'Agent responsable de la coordination et du séquencement des workflows',
        extends: 'BaseAgent',
        methods: [
          {
            name: 'startWorkflow',
            description: 'Démarre un workflow avec les entrées spécifiées',
            parameters: [
              {
                name: 'workflowDefinition',
                type: 'WorkflowDefinition',
                description: 'La définition du workflow à exécuter',
                required: true,
              },
              {
                name: 'input',
                type: 'Record<string, any>',
                description: "Les données d'entrée pour le workflow",
                required: true,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: "L'identifiant du workflow démarré",
          },
          {
            name: 'getStatus',
            description: "Obtient l'état actuel d'un workflow",
            parameters: [
              {
                name: 'workflowId',
                type: 'string',
                description: "L'identifiant du workflow",
                required: true,
              },
            ],
            returnType: 'Promise<WorkflowStatus>',
            returnDescription: "L'état actuel du workflow",
          },
          {
            name: 'cancelWorkflow',
            description: "Annule un workflow en cours d'exécution",
            parameters: [
              {
                name: 'workflowId',
                type: 'string',
                description: "L'identifiant du workflow",
                required: true,
              },
              {
                name: 'reason',
                type: 'string',
                description: "La raison de l'annulation",
                required: false,
              },
            ],
            returnType: 'Promise<boolean>',
            returnDescription: 'Vrai si le workflow a bien été annulé',
          },
        ],
      },
      scheduler: {
        name: 'SchedulerAgent',
        description:
          "Agent responsable de la planification et de l'exécution périodique des tâches",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'schedule',
            description: 'Planifie une tâche pour une exécution future',
            parameters: [
              {
                name: 'task',
                type: 'TaskDefinition',
                description: 'La définition de la tâche à planifier',
                required: true,
              },
              {
                name: 'scheduleOptions',
                type: 'ScheduleOptions',
                description: 'Les options de planification (cron, délai, etc.)',
                required: true,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: "L'identifiant de la tâche planifiée",
          },
          {
            name: 'cancelScheduledTask',
            description: 'Annule une tâche planifiée',
            parameters: [
              {
                name: 'taskId',
                type: 'string',
                description: "L'identifiant de la tâche planifiée",
                required: true,
              },
            ],
            returnType: 'Promise<boolean>',
            returnDescription: 'Vrai si la tâche planifiée a bien été annulée',
          },
          {
            name: 'getScheduledTasks',
            description: 'Obtient la liste des tâches planifiées',
            parameters: [],
            returnType: 'Promise<ScheduledTask[]>',
            returnDescription: 'La liste des tâches planifiées',
          },
        ],
      },
      monitor: {
        name: 'MonitorAgent',
        description:
          'Agent responsable de la surveillance et du reporting des performances et des erreurs système',
        extends: 'BaseAgent',
        methods: [
          {
            name: 'startMonitoring',
            description: "Démarre la surveillance d'un composant ou d'un processus",
            parameters: [
              {
                name: 'target',
                type: 'MonitoringTarget',
                description: 'La cible à surveiller',
                required: true,
              },
              {
                name: 'options',
                type: 'MonitoringOptions',
                description: 'Les options de surveillance',
                required: false,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: "L'identifiant de la session de surveillance",
          },
          {
            name: 'stopMonitoring',
            description: 'Arrête la surveillance',
            parameters: [
              {
                name: 'monitoringId',
                type: 'string',
                description: "L'identifiant de la session de surveillance",
                required: true,
              },
            ],
            returnType: 'Promise<void>',
            returnDescription: 'Une promesse qui se résout lorsque la surveillance est arrêtée',
          },
          {
            name: 'getMetrics',
            description: 'Récupère les métriques de surveillance',
            parameters: [
              {
                name: 'monitoringId',
                type: 'string',
                description: "L'identifiant de la session de surveillance",
                required: true,
              },
              {
                name: 'timeRange',
                type: 'TimeRange',
                description: 'La plage de temps pour laquelle récupérer les métriques',
                required: false,
              },
            ],
            returnType: 'Promise<MetricsData>',
            returnDescription: 'Les données de métriques collectées',
          },
        ],
      },
    },
  },
  {
    name: 'coordination',
    description:
      'Couche de coordination - Enregistrement des agents, logs, propagation de statut, fallback',
    responsibility:
      "Assurer la communication entre les agents, gérer l'enregistrement, et coordonner les interactions du système",
    agentTypes: {
      bridge: {
        name: 'BridgeAgent',
        description:
          "Agent responsable de l'intégration et de la communication entre différents systèmes",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'connect',
            description: 'Établit une connexion avec un système externe',
            parameters: [
              {
                name: 'connectionConfig',
                type: 'ConnectionConfig',
                description: 'La configuration de connexion',
                required: true,
              },
            ],
            returnType: 'Promise<Connection>',
            returnDescription: 'La connexion établie',
          },
          {
            name: 'disconnect',
            description: 'Ferme une connexion avec un système externe',
            parameters: [
              {
                name: 'connectionId',
                type: 'string',
                description: "L'identifiant de la connexion",
                required: true,
              },
            ],
            returnType: 'Promise<boolean>',
            returnDescription: 'Vrai si la connexion a été fermée avec succès',
          },
          {
            name: 'transfer',
            description: "Transfère des données d'un système à un autre",
            parameters: [
              {
                name: 'sourceConnectionId',
                type: 'string',
                description: "L'identifiant de la connexion source",
                required: true,
              },
              {
                name: 'targetConnectionId',
                type: 'string',
                description: "L'identifiant de la connexion cible",
                required: true,
              },
              {
                name: 'data',
                type: 'any',
                description: 'Les données à transférer',
                required: true,
              },
            ],
            returnType: 'Promise<TransferResult>',
            returnDescription: 'Le résultat du transfert',
          },
        ],
      },
      adapter: {
        name: 'AdapterAgent',
        description: "Agent responsable de l'adaptation des interfaces entre différents systèmes",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'adapt',
            description: "Adapte des données d'un format à un autre",
            parameters: [
              {
                name: 'sourceData',
                type: 'any',
                description: 'Les données sources à adapter',
                required: true,
              },
              {
                name: 'targetFormat',
                type: 'string',
                description: 'Le format cible',
                required: true,
              },
            ],
            returnType: 'Promise<any>',
            returnDescription: 'Les données adaptées',
          },
          {
            name: 'getSupportedFormats',
            description: "Récupère la liste des formats supportés par l'adaptateur",
            parameters: [],
            returnType: 'Promise<string[]>',
            returnDescription: 'La liste des formats supportés',
          },
        ],
      },
      registry: {
        name: 'RegistryAgent',
        description:
          "Agent responsable de l'enregistrement et du suivi des services et agents disponibles",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'register',
            description: 'Enregistre un agent ou un service dans le registre',
            parameters: [
              {
                name: 'serviceInfo',
                type: 'ServiceInfo',
                description: 'Les informations sur le service à enregistrer',
                required: true,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: "L'identifiant d'enregistrement",
          },
          {
            name: 'unregister',
            description: 'Désinscrit un agent ou un service du registre',
            parameters: [
              {
                name: 'serviceId',
                type: 'string',
                description: "L'identifiant du service",
                required: true,
              },
            ],
            returnType: 'Promise<boolean>',
            returnDescription: 'Vrai si le service a été désinscrit avec succès',
          },
          {
            name: 'discover',
            description: 'Découvre des services selon des critères spécifiques',
            parameters: [
              {
                name: 'criteria',
                type: 'DiscoveryCriteria',
                description: 'Les critères de découverte',
                required: true,
              },
            ],
            returnType: 'Promise<ServiceInfo[]>',
            returnDescription: 'La liste des services correspondant aux critères',
          },
        ],
      },
    },
  },
  {
    name: 'business',
    description:
      'Couche métier - Agents analytiques, générateurs, stratégies, outils de migration/QA/SEO',
    responsibility:
      "Implémenter les fonctionnalités métier spécifiques, l'analyse des données, la génération de contenu, etc.",
    agentTypes: {
      analyzer: {
        name: 'AnalyzerAgent',
        description: "Agent responsable de l'analyse de données et de l'extraction d'informations",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'analyze',
            description: 'Analyse des données selon un contexte spécifique',
            parameters: [
              {
                name: 'data',
                type: 'any',
                description: 'Les données à analyser',
                required: true,
              },
              {
                name: 'options',
                type: 'AnalysisOptions',
                description: "Les options d'analyse",
                required: false,
              },
            ],
            returnType: 'Promise<AnalysisResult>',
            returnDescription: "Le résultat de l'analyse",
          },
          {
            name: 'getInsights',
            description: "Récupère les insights d'une analyse",
            parameters: [
              {
                name: 'analysisId',
                type: 'string',
                description: "L'identifiant de l'analyse",
                required: true,
              },
            ],
            returnType: 'Promise<Insight[]>',
            returnDescription: "Les insights extraits de l'analyse",
          },
          {
            name: 'explainAnalysis',
            description: "Fournit une explication détaillée d'une analyse",
            parameters: [
              {
                name: 'analysisId',
                type: 'string',
                description: "L'identifiant de l'analyse",
                required: true,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: "L'explication de l'analyse",
          },
        ],
      },
      generator: {
        name: 'GeneratorAgent',
        description: 'Agent responsable de la génération de code, contenu ou autres artefacts',
        extends: 'BaseAgent',
        methods: [
          {
            name: 'generate',
            description: 'Génère du contenu à partir de spécifications',
            parameters: [
              {
                name: 'specifications',
                type: 'GenerationSpec',
                description: 'Les spécifications pour la génération',
                required: true,
              },
            ],
            returnType: 'Promise<GeneratedContent>',
            returnDescription: 'Le contenu généré',
          },
          {
            name: 'validate',
            description: 'Valide un contenu généré',
            parameters: [
              {
                name: 'content',
                type: 'GeneratedContent',
                description: 'Le contenu à valider',
                required: true,
              },
            ],
            returnType: 'Promise<ValidationResult>',
            returnDescription: 'Le résultat de la validation',
          },
          {
            name: 'getGenerationHistory',
            description: "Récupère l'historique des générations",
            parameters: [
              {
                name: 'filters',
                type: 'HistoryFilters',
                description: "Les filtres pour l'historique",
                required: false,
              },
            ],
            returnType: 'Promise<GenerationRecord[]>',
            returnDescription: "L'historique des générations",
          },
        ],
      },
      validator: {
        name: 'ValidatorAgent',
        description: 'Agent responsable de la validation et du contrôle qualité',
        extends: 'BaseAgent',
        methods: [
          {
            name: 'validate',
            description: 'Valide du contenu ou des données selon des règles spécifiques',
            parameters: [
              {
                name: 'content',
                type: 'any',
                description: 'Le contenu à valider',
                required: true,
              },
              {
                name: 'rules',
                type: 'ValidationRules',
                description: 'Les règles de validation',
                required: true,
              },
            ],
            returnType: 'Promise<ValidationResult>',
            returnDescription: 'Le résultat de la validation',
          },
          {
            name: 'getSuggestions',
            description: "Obtient des suggestions d'amélioration",
            parameters: [
              {
                name: 'content',
                type: 'any',
                description: 'Le contenu à améliorer',
                required: true,
              },
            ],
            returnType: 'Promise<Suggestion[]>',
            returnDescription: "Les suggestions d'amélioration",
          },
          {
            name: 'applyFixes',
            description: 'Applique des corrections automatiques',
            parameters: [
              {
                name: 'content',
                type: 'any',
                description: 'Le contenu à corriger',
                required: true,
              },
              {
                name: 'fixOptions',
                type: 'FixOptions',
                description: 'Les options de correction',
                required: false,
              },
            ],
            returnType: 'Promise<CorrectedContent>',
            returnDescription: 'Le contenu corrigé',
          },
        ],
      },
      parser: {
        name: 'ParserAgent',
        description: "Agent responsable de l'analyse syntaxique et de la transformation de formats",
        extends: 'BaseAgent',
        methods: [
          {
            name: 'parse',
            description: 'Analyse et transforme du contenu structuré ou non',
            parameters: [
              {
                name: 'content',
                type: 'string | Buffer',
                description: 'Le contenu à analyser',
                required: true,
              },
              {
                name: 'options',
                type: 'ParseOptions',
                description: "Les options d'analyse",
                required: false,
              },
            ],
            returnType: 'Promise<ParseResult>',
            returnDescription: "Le résultat de l'analyse",
          },
          {
            name: 'serialize',
            description: 'Transforme un objet en chaîne de caractères formatée',
            parameters: [
              {
                name: 'data',
                type: 'any',
                description: "L'objet à sérialiser",
                required: true,
              },
              {
                name: 'format',
                type: 'string',
                description: 'Le format de sortie',
                required: true,
              },
            ],
            returnType: 'Promise<string>',
            returnDescription: 'La représentation sérialisée',
          },
        ],
      },
    },
  },
];

// Interface commune à tous les agents
const baseAgentInterface = `/**
 * Agent de base - Interface commune à tous les agents MCP
 * 
 * Cette interface définit les méthodes et propriétés de base que tous
 * les agents MCP doivent implémenter, quelle que soit leur couche ou type.
 */
export interface BaseAgent {
  /**
   * Identifiant unique de l'agent
   */
  id: string;

  /**
   * Nom descriptif de l'agent
   */
  name: string;

  /**
   * Type d'agent (analyzer, generator, validator, etc.)
   */
  type: string;

  /**
   * Version de l'agent
   */
  version: string;

  /**
   * Initialise l'agent avec des options spécifiques
   * @param options Options d'initialisation
   */
  initialize(options?: Record<string, any>): Promise<void>;

  /**
   * Indique si l'agent est prêt à être utilisé
   * @returns Vrai si l'agent est prêt
   */
  isReady(): boolean;

  /**
   * Arrête et nettoie l'agent
   */
  shutdown(): Promise<void>;

  /**
   * Récupère les métadonnées de l'agent
   * @returns Les métadonnées
   */
  getMetadata(): Record<string, any>;
}

/**
 * Types communs pour les agents MCP
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: Array<any>;
  [key: string]: any;
}

export interface WorkflowStatus {
  id: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  [key: string]: any;
}

export interface TaskDefinition {
  id: string;
  name: string;
  handler: string;
  data?: any;
  [key: string]: any;
}

export interface ScheduleOptions {
  cron?: string;
  delay?: number;
  repeat?: boolean;
  startAt?: Date;
  endAt?: Date;
  [key: string]: any;
}

export interface ScheduledTask {
  id: string;
  taskDefinition: TaskDefinition;
  options: ScheduleOptions;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'canceled';
  nextRunTime?: Date;
  [key: string]: any;
}

export interface MonitoringTarget {
  id: string;
  type: 'workflow' | 'agent' | 'service' | 'system';
  address?: string;
  [key: string]: any;
}

export interface MonitoringOptions {
  interval?: number;
  metrics?: string[];
  alertThresholds?: Record<string, number>;
  [key: string]: any;
}

export interface TimeRange {
  from: Date;
  to: Date;
}

export interface MetricsData {
  [key: string]: any;
}

export interface ConnectionConfig {
  id: string;
  type: string;
  url?: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
  [key: string]: any;
}

export interface Connection {
  id: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  [key: string]: any;
}

export interface TransferResult {
  success: boolean;
  error?: string;
  transferredCount?: number;
  [key: string]: any;
}

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  endpoints?: string[];
  capabilities?: string[];
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface DiscoveryCriteria {
  type?: string;
  status?: string;
  capabilities?: string[];
  [key: string]: any;
}

export interface AnalysisOptions {
  depth?: number;
  focus?: string[];
  excludePatterns?: string[];
  includeDetails?: boolean;
  [key: string]: any;
}

export interface AnalysisResult {
  id: string;
  summary: string;
  details?: any;
  insights?: Insight[];
  createdAt: Date;
  [key: string]: any;
}

export interface Insight {
  id: string;
  type: string;
  description: string;
  confidence: number;
  evidence?: any;
  [key: string]: any;
}

export interface GenerationSpec {
  type: string;
  template?: string;
  inputs: Record<string, any>;
  options?: Record<string, any>;
  [key: string]: any;
}

export interface GeneratedContent {
  id: string;
  type: string;
  content: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: Array<{
    code: string;
    message: string;
    path?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings?: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
  [key: string]: any;
}

export interface ValidationRules {
  schema?: any;
  patterns?: Array<{
    pattern: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  customRules?: Array<{
    id: string;
    validator: (content: any) => Promise<boolean>;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  [key: string]: any;
}

export interface Suggestion {
  id: string;
  type: string;
  description: string;
  path?: string;
  replacements?: Array<{
    text: string;
    description?: string;
  }>;
  [key: string]: any;
}

export interface FixOptions {
  autoFix?: boolean;
  fixTypes?: string[];
  maxChanges?: number;
  [key: string]: any;
}

export interface CorrectedContent {
  content: any;
  changeCount: number;
  changes: Array<{
    path: string;
    before: any;
    after: any;
    reason: string;
  }>;
  [key: string]: any;
}

export interface ParseOptions {
  format?: string;
  strict?: boolean;
  [key: string]: any;
}

export interface ParseResult {
  data: any;
  errors?: Array<{
    message: string;
    line?: number;
    column?: number;
  }>;
  [key: string]: any;
}

export interface HistoryFilters {
  from?: Date;
  to?: Date;
  type?: string;
  status?: string;
  [key: string]: any;
}

export interface GenerationRecord {
  id: string;
  spec: GenerationSpec;
  result: GeneratedContent;
  timestamp: Date;
  status: 'success' | 'failure';
  error?: string;
  [key: string]: any;
}
`;

// Générer l'interface pour une couche
function generateLayerInterface(layer: LayerDefinition): string {
  let output = `/**
 * ${layer.description}
 * 
 * Responsabilité: ${layer.responsibility}
 */

import { BaseAgent } from '../base-agent';

`;

  // Générer les interfaces pour chaque type d'agent
  for (const [_typeKey, agentType] of Object.entries(layer.agentTypes)) {
    output += `/**
 * ${agentType.description}
 */
export interface ${agentType.name} extends ${agentType.extends || 'BaseAgent'} {
`;

    // Ajouter les propriétés
    if (agentType.properties && agentType.properties.length > 0) {
      for (const prop of agentType.properties) {
        output += `  /**
   * ${prop.description}
   */
  ${prop.name}${prop.required === false ? '?' : ''}: ${prop.type};

`;
      }
    }

    // Ajouter les méthodes
    for (const method of agentType.methods) {
      output += `  /**
   * ${method.description}
   *${
     method.parameters
       ? method.parameters
            .map(
              (param) => `
   * @param ${param.name} ${param.description}`
            )
            .join('')
       : ''
   }
   * @returns ${method.returnDescription || method.returnType}
   */
  ${method.name}(${
    method.parameters
      ? method.parameters
          .map((param) => `${param.name}${param.required === false ? '?' : ''}: ${param.type}`)
          .join(', ')
      : ''
  }): ${method.returnType};

`;
    }

    output += '}\n\n';
  }

  return output;
}

// Créer les répertoires s'ils n'existent pas
function ensureDirectories(): void {
  if (!fs.existsSync(INTERFACES_DIR)) {
    fs.mkdirSync(INTERFACES_DIR, { recursive: true });
  }

  layers.forEach((layer) => {
    const layerDir = path.join(INTERFACES_DIR, layer.name);
    if (!fs.existsSync(layerDir)) {
      fs.mkdirSync(layerDir, { recursive: true });
    }
  });
}

// Générer et sauvegarder les interfaces
function generateInterfaces(): void {
  ensureDirectories();

  // Générer l'interface de base
  fs.writeFileSync(path.join(INTERFACES_DIR, 'BaseAgent.ts'), baseAgentInterface, 'utf8');
  console.log('Interface BaseAgent générée avec succès.');

  // Générer les interfaces pour chaque couche
  for (const layer of layers) {
    const layerInterface = generateLayerInterface(layer);
    fs.writeFileSync(path.join(INTERFACES_DIR, `${layer.name}.ts`), layerInterface, 'utf8');
    console.log(`Interface pour la couche ${layer.name} générée avec succès.`);
  }

  // Créer un index.ts qui exporte toutes les interfaces
  let indexContent = `/**
 * Index des interfaces de l'architecture trois couches MCP OS
 */

export * from './base-agent';
`;

  for (const layer of layers) {
    indexContent += `export * from './${layer.name}';\n`;
  }

  fs.writeFileSync(path.join(INTERFACES_DIR, 'index.ts'), indexContent, 'utf8');
  console.log('Fichier index.ts généré avec succès.');
}

// Point d'entrée principal
(function main() {
  console.log("=== Génération des interfaces pour l'architecture trois couches MCP OS ===");

  try {
    generateInterfaces();
    console.log('\nGénération des interfaces terminée avec succès!');
  } catch (error) {
    console.error(`Erreur lors de la génération des interfaces: ${error}`);
    process.exit(1);
  }
})();
