#!/usr/bin/env node

/**
 * Script de préparation pour la consolidation des agents
 * 
 * Ce script prépare l'environnement pour la consolidation des agents en :
 * 1. S'assurant que tous les dossiers cibles existent
 * 2. Créant les fichiers d'interfaces de base nécessaires
 * 3. Copiant le contenu des implémentations les plus complètes vers les emplacements canoniques
 * 
 * Usage:
 * node prepare-agent-consolidation.js [--dry-run]
 * 
 * Options:
 *   --dry-run: Simule les actions sans effectuer de modifications réelles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const cleanupReportDir = path.join(projectRoot, 'cleanup-report');

// Analyser les arguments de la ligne de commande
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Structure des couches et sous-dossiers à créer
const layersStructure = {
    'orchestration': [
        'core',
        'monitors',
        'schedulers',
        'orchestrators',
        'bridges',
        'adapters'
    ],
    'coordination': [
        'core',
        'bridges',
        'registries',
        'adapters'
    ],
    'business': [
        'core',
        'analyzers',
        'generators',
        'validators',
        'parsers'
    ]
};

// Interfaces à créer ou mettre à jour
const baseInterfaces = {
    'base': {
        'base-agent.ts': `/**
 * Interface de base pour tous les agents du système
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
   * Type d'agent (orchestration, coordination, business, etc.)
   */
  type: string;

  /**
   * Version de l'implémentation de l'agent
   */
  version: string;

  /**
   * Initialise l'agent avec les options fournies
   * @param options Options de configuration pour l'agent
   */
  initialize(options?: Record<string, any>): Promise<void>;

  /**
   * Vérifie si l'agent est prêt à traiter des demandes
   */
  isReady(): boolean;

  /**
   * Arrête proprement l'agent et libère les ressources
   */
  shutdown(): Promise<void>;

  /**
   * Retourne les métadonnées de l'agent
   */
  getMetadata(): Record<string, any>;
}

/**
 * Structure de résultat standard pour les opérations d'agent
 */
export interface AgentResult {
  /**
   * Indique si l'opération a réussi
   */
  success: boolean;

  /**
   * Message d'erreur en cas d'échec
   */
  error?: string;

  /**
   * Données de résultat optionnelles
   */
  data?: any;

  /**
   * Métadonnées additionnelles sur l'exécution
   */
  metadata?: Record<string, any>;
}`,
        'agent-result.ts': `/**
 * Structure de résultat standard pour les opérations d'agent
 */
export interface AgentResult {
  /**
   * Indique si l'opération a réussi
   */
  success: boolean;

  /**
   * Message d'erreur en cas d'échec
   */
  error?: string;

  /**
   * Données de résultat optionnelles
   */
  data?: any;

  /**
   * Métadonnées additionnelles sur l'exécution
   */
  metadata?: Record<string, any>;
}`
    },
    'orchestration': {
        'monitor-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de surveillance dans la couche d'orchestration
 * Responsable de la surveillance des workflows et processus
 */
export interface MonitorAgent extends BaseAgent {
  /**
   * Surveille l'exécution des cibles spécifiées
   * @param targets Liste des identifiants de workflows ou processus à surveiller
   */
  monitorExecution(targets: string[]): Promise<void>;

  /**
   * Génère un rapport à partir des résultats d'analyse
   * @param analysisResult Résultat de l'analyse à formater
   * @param format Format du rapport souhaité (html, markdown, json)
   */
  generateReport(analysisResult: Record<string, any>, format: string): Promise<string>;
}`,
        'scheduler-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de planification dans la couche d'orchestration
 * Responsable de la planification et de l'exécution programmée des tâches
 */
export interface SchedulerAgent extends BaseAgent {
  /**
   * Planifie une tâche pour une exécution future
   * @param taskId Identifiant de la tâche
   * @param cronExpression Expression cron définissant la planification
   * @param taskData Données nécessaires pour l'exécution de la tâche
   */
  scheduleTask(taskId: string, cronExpression: string, taskData: Record<string, any>): Promise<AgentResult>;

  /**
   * Annule une tâche planifiée
   * @param taskId Identifiant de la tâche à annuler
   */
  cancelTask(taskId: string): Promise<AgentResult>;

  /**
   * Récupère le statut d'une tâche planifiée
   * @param taskId Identifiant de la tâche
   */
  getTaskStatus(taskId: string): Promise<Record<string, any>>;
}`,
        'orchestrator-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents d'orchestration
 * Responsable de la gestion des workflows et de la coordination de haut niveau
 */
export interface OrchestratorAgent extends BaseAgent {
  /**
   * Démarre l'orchestration d'un workflow ou d'un processus
   * @param workflow Identifiant ou définition du workflow à orchestrer
   * @param context Contexte d'exécution incluant les paramètres nécessaires
   */
  orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>;

  /**
   * Enregistre l'état d'avancement d'un workflow
   * @param workflowId Identifiant du workflow
   * @param status État actuel du workflow
   * @param metadata Métadonnées additionnelles sur l'avancement
   */
  reportStatus(workflowId: string, status: 'started' | 'running' | 'completed' | 'failed', metadata?: Record<string, any>): Promise<void>;
}`
    },
    'coordination': {
        'coordination-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de coordination
 * Responsable de la coordination entre différents agents et services
 */
export interface CoordinationAgent extends BaseAgent {
  /**
   * Coordonne l'exécution d'une série d'actions entre différents agents
   * @param actionPlan Plan des actions à coordonner
   * @param context Contexte d'exécution partagé
   */
  coordinate(actionPlan: Record<string, any>[], context: Record<string, any>): Promise<AgentResult>;

  /**
   * Récupère l'état actuel d'une coordination en cours
   * @param coordinationId Identifiant de la coordination
   */
  getCoordinationStatus(coordinationId: string): Promise<Record<string, any>>;
}`,
        'registry-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de registre
 * Responsable de l'enregistrement et de la découverte des agents et services
 */
export interface RegistryAgent extends BaseAgent {
  /**
   * Enregistre un agent dans le registre
   * @param agent Métadonnées de l'agent à enregistrer
   */
  registerAgent(agent: Record<string, any>): Promise<AgentResult>;

  /**
   * Désenregistre un agent du registre
   * @param agentId Identifiant de l'agent à désenregistrer
   */
  unregisterAgent(agentId: string): Promise<AgentResult>;

  /**
   * Recherche des agents selon des critères
   * @param criteria Critères de recherche
   */
  findAgents(criteria: Record<string, any>): Promise<Record<string, any>[]>;
}`,
        'bridge-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de pont (bridge)
 * Responsable de la communication entre différentes couches et systèmes
 */
export interface BridgeAgent extends BaseAgent {
  /**
   * Transmet une requête d'un système à un autre
   * @param sourceSystem Système source de la requête
   * @param targetSystem Système cible de la requête
   * @param request Contenu de la requête à transmettre
   */
  forward(sourceSystem: string, targetSystem: string, request: Record<string, any>): Promise<AgentResult>;

  /**
   * Traduit un message d'un format à un autre
   * @param message Message à traduire
   * @param sourceFormat Format source du message
   * @param targetFormat Format cible pour la traduction
   */
  translate(message: Record<string, any>, sourceFormat: string, targetFormat: string): Promise<Record<string, any>>;
}`
    },
    'business': {
        'analyzer-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents d'analyse dans la couche business
 * Responsable de l'analyse des données et systèmes
 */
export interface AnalyzerAgent extends BaseAgent {
  /**
   * Analyse un ensemble de données ou un système
   * @param target Cible de l'analyse (données, système, fichier, etc.)
   * @param options Options spécifiques pour l'analyse
   */
  analyze(target: string | Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;

  /**
   * Valide les résultats d'une analyse selon des règles spécifiées
   * @param analysisResult Résultat d'analyse à valider
   * @param rules Règles de validation à appliquer
   */
  validateResults(analysisResult: Record<string, any>, rules?: Record<string, any>[]): Promise<AgentResult>;
}`,
        'generator-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de génération dans la couche business
 * Responsable de la génération de contenu, code, assets, etc.
 */
export interface GeneratorAgent extends BaseAgent {
  /**
   * Génère du contenu selon les spécifications fournies
   * @param spec Spécifications pour la génération
   * @param options Options supplémentaires pour la génération
   */
  generate(spec: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;

  /**
   * Valide que le contenu généré respecte les spécifications
   * @param generated Contenu généré à valider
   * @param spec Spécifications d'origine pour validation
   */
  validate(generated: string | Record<string, any>, spec: Record<string, any>): Promise<AgentResult>;
}`,
        'validator-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents de validation dans la couche business
 * Responsable de la validation des données et systèmes
 */
export interface ValidatorAgent extends BaseAgent {
  /**
   * Valide une cible selon des règles spécifiées
   * @param target Cible à valider (données, système, fichier, etc.)
   * @param rules Règles à appliquer pour la validation
   */
  validate(target: string | Record<string, any>, rules: Record<string, any>[]): Promise<AgentResult>;

  /**
   * Génère un rapport de validation
   * @param validationResult Résultat de validation à formater
   * @param format Format du rapport souhaité (html, markdown, json)
   */
  generateReport(validationResult: Record<string, any>, format: string): Promise<string>;
}`,
        'parser-agent.ts': `import { BaseAgent } from '../base/base-agent';
import { AgentResult } from '../base/agent-result';

/**
 * Interface pour les agents d'analyse syntaxique dans la couche business
 * Responsable du parsing de données structurées
 */
export interface ParserAgent extends BaseAgent {
  /**
   * Analyse syntaxiquement une chaîne ou un fichier
   * @param input Entrée à parser (chaîne, chemin de fichier)
   * @param options Options spécifiques pour l'analyse syntaxique
   */
  parse(input: string, options?: Record<string, any>): Promise<AgentResult>;

  /**
   * Convertit une structure parsée vers un autre format
   * @param parsedData Données parsées à convertir
   * @param targetFormat Format cible pour la conversion
   */
  convert(parsedData: Record<string, any>, targetFormat: string): Promise<Record<string, any>>;
}`
    }
};

/**
 * Vérifie si un fichier existe
 */
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

/**
 * Vérifie si un fichier est vide
 */
function isFileEmpty(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size === 0;
    } catch (err) {
        return true;
    }
}

/**
 * Créer un dossier s'il n'existe pas
 */
function ensureDirectoryExists(dirPath) {
    if (!fileExists(dirPath)) {
        console.log(`Création du dossier: ${path.relative(projectRoot, dirPath)}`);
        if (!dryRun) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    }
    return false;
}

/**
 * Crée ou met à jour un fichier d'interface
 */
function createOrUpdateInterface(category, fileName, content) {
    const interfacesDir = path.join(projectRoot, 'packages', 'core', 'interfaces', category);
    const filePath = path.join(interfacesDir, fileName);

    ensureDirectoryExists(interfacesDir);

    if (!fileExists(filePath) || isFileEmpty(filePath)) {
        console.log(`Création de l'interface: ${path.relative(projectRoot, filePath)}`);
        if (!dryRun) {
            fs.writeFileSync(filePath, content);
        }
        return true;
    } else {
        console.log(`L'interface existe déjà: ${path.relative(projectRoot, filePath)}`);
        return false;
    }
}

/**
 * Crée les dossiers pour chaque couche selon la structure définie
 */
function createLayerStructure() {
    console.log("\n=== Création de la structure des dossiers ===");
    let createdCount = 0;

    for (const [layer, subfolders] of Object.entries(layersStructure)) {
        const layerPath = path.join(projectRoot, 'packages', layer);

        if (ensureDirectoryExists(layerPath)) {
            createdCount++;
        }

        for (const subfolder of subfolders) {
            const subfolderPath = path.join(layerPath, subfolder);

            if (ensureDirectoryExists(subfolderPath)) {
                createdCount++;
            }
        }
    }

    console.log(`\n${createdCount} dossiers créés ou vérifiés`);
}

/**
 * Crée ou met à jour les fichiers d'interfaces de base
 */
function createBaseInterfaces() {
    console.log("\n=== Création des interfaces de base ===");
    let createdCount = 0;

    for (const [category, interfaces] of Object.entries(baseInterfaces)) {
        for (const [fileName, content] of Object.entries(interfaces)) {
            if (createOrUpdateInterface(category, fileName, content)) {
                createdCount++;
            }
        }
    }

    console.log(`\n${createdCount} interfaces créées ou mises à jour`);
}

/**
 * Crée les fichiers canoniques pour chaque agent à partir du plan de consolidation
 */
function createCanonicalFiles() {
    console.log("\n=== Création des fichiers canoniques ===");

    const planPath = path.join(projectRoot, 'reports', 'agent-consolidation-plan.md');

    if (!fileExists(planPath)) {
        console.error(`Plan de consolidation non trouvé: ${planPath}`);
        console.error(`Veuillez exécuter d'abord: node tools/scripts/plan-agent-consolidation.js`);
        return 0;
    }

    const content = fs.readFileSync(planPath, 'utf-8');
    let createdCount = 0;

    // Expression régulière pour trouver les sections de consolidation
    const sectionRegex = /#### Consolidation de "([^"]+)".*?\*\*Agent à conserver\*\*: `([^`]+)`.*?\*\*Chemin cible\*\*: `([^`]+)`.*?\| ([^|]+) \| `([^`]+)` \| ([^|]+) \|/gs;

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
        const group = match[1];
        const keepAgentClass = match[2];
        const targetPath = match[3];
        const duplicateClass = match[4].trim();
        const duplicatePath = match[5];
        const action = match[6].trim();

        if (action === 'migrate') {
            const targetFilePath = path.join(projectRoot, targetPath);
            const duplicateFilePath = duplicatePath;

            // Vérifier si le fichier cible existe et s'il est vide
            if (!fileExists(targetFilePath) || isFileEmpty(targetFilePath)) {
                // Vérifier si le fichier source existe
                if (fileExists(duplicateFilePath)) {
                    console.log(`Création du fichier canonique pour "${group}": ${path.relative(projectRoot, targetFilePath)}`);

                    if (!dryRun) {
                        // Créer le dossier cible si nécessaire
                        ensureDirectoryExists(path.dirname(targetFilePath));

                        // Copier le contenu du fichier dupliqué vers le fichier canonique
                        const content = fs.readFileSync(duplicateFilePath, 'utf-8');
                        fs.writeFileSync(targetFilePath, content);
                    }

                    createdCount++;
                } else {
                    console.warn(`Attention: Le fichier source n'existe pas: ${duplicateFilePath}`);
                }
            } else {
                console.log(`Le fichier canonique existe déjà: ${path.relative(projectRoot, targetFilePath)}`);
            }
        }
    }

    console.log(`\n${createdCount} fichiers canoniques créés`);
    return createdCount;
}

/**
 * Prépare l'environnement pour la consolidation des agents
 */
function prepareConsolidation() {
    console.log(`\n=== Préparation de l'environnement pour la consolidation des agents ===`);
    console.log(`Mode: ${dryRun ? 'Simulation (dry-run)' : 'Exécution réelle'}`);

    if (!dryRun) {
        // Créer le dossier pour les rapports
        ensureDirectoryExists(cleanupReportDir);
    }

    // Étape 1: Créer la structure des dossiers
    createLayerStructure();

    // Étape 2: Créer les interfaces de base
    createBaseInterfaces();

    // Étape 3: Créer les fichiers canoniques
    const canonicalCreatedCount = createCanonicalFiles();

    console.log(`\n=== Résumé de la préparation ===`);
    console.log(`Structure des dossiers créée selon l'architecture à trois couches`);
    console.log(`Interfaces de base créées et mises à jour`);
    console.log(`${canonicalCreatedCount} fichiers canoniques créés`);

    if (dryRun) {
        console.log(`\nExécutez sans l'option --dry-run pour appliquer réellement les changements.`);
    } else {
        console.log(`\nL'environnement est prêt pour la consolidation des agents.`);
        console.log(`Continuez avec: node tools/scripts/consolidate-duplicated-agents.js --dry-run`);
    }
}

// Lancer la préparation
prepareConsolidation();
