/**
 * Configuration centralisée pour le système de migration
 * 
 * Ce fichier définit la configuration utilisée par tous les composants
 * du système de migration : agents, orchestrateur, tableau de bord, etc.
 */

import * as path from pathstructure-agent';

/**
 * Configuration des chemins de fichiers et dossiers
 */
export const PATHS = {
  // Dossiers principaux
  ROOT: process.cwd(),
  REPORTS_DIR: path.join(process.cwd(), 'reports'),
  CONFIG_DIR: path.join(process.cwd(), 'config'),
  CAHIER_DES_CHARGES: path.join(process.cwd(), 'cahier-des-charges-backup-20250410-113108'),
  DASHBOARD_DIR: path.join(process.cwd(), 'dashboard'),
  LOGS_DIR: path.join(process.cwd(), 'logs'),
  
  // Sous-dossiers de rapports
  AUDIT_REPORTS: path.join(process.cwd(), 'reports', 'audits'),
  EXECUTION_REPORTS: path.join(process.cwd(), 'reports', 'execution'),
  MODULE_REPORTS: path.join(process.cwd(), 'reports', 'modules'),
  METRICS_REPORTS: path.join(process.cwd(), 'reports', 'metrics'),
  
  // Fichiers de configuration
  MIGRATION_CONFIG: path.join(process.cwd(), 'migration-config.json'),
  AGENT_CONFIG: path.join(process.cwd(), 'config', 'agent-config.json'),
};

/**
 * Configuration des agents
 */
export const AGENTS = {
  // Noms standardisés des agents
  BUSINESS: 'business',
  STRUCTURE: 'structure',
  DATA: 'data',
  DEPENDENCY: 'dependency',
  QUALITY: 'quality',
  STRATEGY: 'strategy',
  ASSEMBLER: 'assembler',
  
  // Ordre par défaut des agents
  DEFAULT_ORDER: ['structure', 'business', 'data', 'dependency', 'quality', 'strategy', 'assembler'],
  
  // Métadonnées des agents
  METADATA: {
    business: { 
      name: 'BusinessAgent', 
      description: 'Analyse le rôle fonctionnel métier du fichier PHP',
      dependencies: []
    },
    structure: { 
      name: 'StructureAgent', 
      description: 'Analyse la structure technique du fichier PHP',
      dependencies: []
    },
    data: { 
      name: 'DataAgent', 
      description: 'Analyse les données, SQL et entrées/sorties du fichier PHP',
      dependencies: []
    },
    dependency: { 
      name: 'DependencyAgent', 
      description: 'Analyse les dépendances externes du fichier PHP',
      dependencies: ['structure']
    },
    quality: { 
      name: 'QualityAgent', 
      description: 'Analyse la qualité du code et détecte les problèmes potentiels',
      dependencies: ['structure', 'data']
    },
    strategy: { 
      name: 'StrategyAgent', 
      description: 'Définit la stratégie de migration optimale pour le fichier',
      dependencies: ['business', 'structure', 'data', 'dependency', 'quality']
    },
    assembler: { 
      name: 'AssemblerAgent', 
      description: 'Génère le code TypeScript/NestJS/Remix équivalent',
      dependencies: ['business', 'structure', 'data', 'dependency', 'quality', 'strategy']
    }
  }
};

/**
 * Configuration du tableau de bord
 */
export const DASHBOARD = {
  PORT: process.env.PORT || 3333,
  HOST: process.env.HOST || 'localhost',
  UPDATE_INTERVAL: 10000, // ms
};

/**
 * Configuration de l'orchestrateur
 */
export const ORCHESTRATOR = {
  PARALLEL_EXECUTION: false,
  FORCE_RERUN: false,
  DEPENDENCY_CHECK: true,
  VALIDATE_CAHIER: true,
  MAX_RETRY_COUNT: 3,
  TIMEOUT: 300000, // 5 minutes en ms
};

/**
 * Configuration de la migration
 */
export const MIGRATION = {
  STEPS: [
    {
      name: 'Analyse initiale',
      description: 'Cartographie et audit du code legacy',
      agents: ['structure', 'business', 'data', 'dependency'],
      priority: 'high'
    },
    {
      name: 'Planification',
      description: 'Définition de la stratégie de migration module par module',
      agents: ['quality', 'strategy'],
      priority: 'high',
      dependsOn: ['Analyse initiale']
    },
    {
      name: 'Migration BDD',
      description: 'Migration de MySQL vers PostgreSQL avec Prisma',
      agents: ['data'],
      priority: 'high',
      dependsOn: ['Analyse initiale']
    },
    {
      name: 'Migration code',
      description: 'Migration du code PHP vers TypeScript (NestJS/Remix)',
      agents: ['assembler'],
      priority: 'high',
      dependsOn: ['Planification', 'Migration BDD']
    },
    {
      name: 'Tests et validation',
      description: 'Vérification fonctionnelle et tests de qualité',
      agents: ['quality'],
      priority: 'medium',
      dependsOn: ['Migration code']
    }
  ],
  
  TECHNOLOGIES: {
    backend: {
      from: 'PHP',
      to: 'TypeScript/NestJS',
      framework: 'NestJS',
      orm: 'Prisma'
    },
    database: {
      from: 'MySQL',
      to: 'PostgreSQL'
    },
    frontend: {
      from: 'PHP/HTML/CSS',
      to: 'TypeScript/Remix',
      framework: 'Remix'
    }
  }
};

/**
 * Configuration des journaux
 */
export const LOGS = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  ROTATION: {
    frequency: 'daily',
    maxFiles: 30
  },
  FORMAT: '[:time] :level - :message'
};

/**
 * Charge la configuration personnalisée depuis le fichier migration-config.json
 * et fait une fusion avec la configuration par défaut
 */
export function loadConfig() {
  try {
    const fs = require(fs-extrastructure-agent');
    
    if (fs.existsSync(PATHS.MIGRATION_CONFIG)) {
      const userConfig = JSON.parse(fs.readFileSync(PATHS.MIGRATION_CONFIG, 'utf8'));
      
      // Fusionner la configuration personnalisée avec les valeurs par défaut
      return {
        PATHS: { ...PATHS, ...userConfig.paths },
        AGENTS: { ...AGENTS, ...userConfig.agents },
        DASHBOARD: { ...DASHBOARD, ...userConfig.dashboard },
        ORCHESTRATOR: { ...ORCHESTRATOR, ...userConfig.orchestrator },
        MIGRATION: { ...MIGRATION, ...userConfig.migration },
        LOGS: { ...LOGS, ...userConfig.logs }
      };
    }
  } catch (error) {
    console.error(`Erreur lors du chargement de la configuration: ${error.message}`);
  }
  
  // Retourner la configuration par défaut si le chargement échoue
  return { PATHS, AGENTS, DASHBOARD, ORCHESTRATOR, MIGRATION, LOGS };
}