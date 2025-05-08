/**
 * layer-contracts.ts
 * 
 * Ce fichier définit les contrats d'interfaces entre les trois couches de l'architecture MCP OS:
 * - Couche d'Orchestration: Gestion des workflows et coordination de haut niveau
 * - Couche de Coordination: Communication entre agents et gestion des intégrations
 * - Couche Business: Logique métier et traitement des données
 * 
 * Ces contrats formalisent les interactions autorisées entre les couches
 * et garantissent une séparation claire des responsabilités.
 */

import { BaseAgent, AgentContext } from './base-agent';
import { AgentOptions, AgentResult } from './agent-types';

// -----------------------------------------------------------------------------
// INTERFACES DE LA COUCHE ORCHESTRATION
// -----------------------------------------------------------------------------

/**
 * Interface pour les agents de la couche d'orchestration
 * Responsable de la gestion des workflows et de la coordination de haut niveau
 */
export interface OrchestrationAgent extends BaseAgent {
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
}

/**
 * Interface spécifique pour les agents orchestrateurs
 */
export interface OrchestratorAgent extends OrchestrationAgent {
    /**
     * Coordonne l'exécution d'une séquence d'agents
     * @param agents Liste des agents à exécuter
     * @param inputs Données d'entrée pour la séquence
     * @param options Options de l'orchestration
     */
    executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>;

    /**
     * Gère les erreurs et reprises lors de l'exécution d'un workflow
     * @param workflowId ID du workflow à récupérer
     * @param errorContext Contexte de l'erreur
     */
    handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult>;
}

/**
 * Interface spécifique pour les agents de surveillance
 */
export interface MonitorAgent extends OrchestrationAgent {
    /**
     * Surveille l'exécution d'un ou plusieurs workflows
     * @param targets Identifiants des workflows à surveiller
     */
    monitorExecution(targets: string[]): Promise<void>;

    /**
     * Produit un rapport de monitoring sur un workflow
     * @param workflowId Identifiant du workflow
     */
    generateReport(workflowId: string): Promise<Record<string, any>>;
}

/**
 * Interface spécifique pour les agents planificateurs
 */
export interface SchedulerAgent extends OrchestrationAgent {
    /**
     * Planifie l'exécution d'un agent ou d'un workflow
     * @param target Agent ou workflow à planifier
     * @param schedule Expression cron ou timing de planification
     * @param inputs Données d'entrée pour l'exécution planifiée
     */
    schedule(target: string, schedule: string, inputs: Record<string, any>): Promise<string>;

    /**
     * Annule une tâche planifiée
     * @param scheduleId Identifiant de la planification
     */
    cancelSchedule(scheduleId: string): Promise<boolean>;
}

// -----------------------------------------------------------------------------
// INTERFACES DE LA COUCHE COORDINATION
// -----------------------------------------------------------------------------

/**
 * Interface pour les agents de la couche de coordination
 * Responsable de la communication et de l'intégration entre agents
 */
export interface CoordinationAgent extends BaseAgent {
    /**
     * Coordonne la communication entre deux ou plusieurs agents
     * @param sources Agents sources
     * @param targets Agents cibles
     * @param data Données à transmettre
     */
    coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<AgentResult>;

    /**
     * Transforme des données pour les adapter au format attendu
     * @param data Données à transformer
     * @param targetFormat Format cible
     */
    transformData?(data: any, targetFormat: string): Promise<any>;
}

/**
 * Interface spécifique pour les agents adaptateurs
 */
export interface AdapterAgent extends CoordinationAgent {
    /**
     * Adapte les données d'un format à un autre
     * @param input Données à adapter
     * @param sourceFormat Format source
     * @param targetFormat Format cible
     */
    adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any>;

    /**
     * Vérifie la compatibilité entre deux formats
     * @param sourceFormat Format source
     * @param targetFormat Format cible
     */
    checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean>;
}

/**
 * Interface spécifique pour les agents ponts d'intégration
 */
export interface BridgeAgent extends CoordinationAgent {
    /**
     * Établit un pont entre deux systèmes ou agents
     * @param sourceSystem Système source
     * @param targetSystem Système cible
     * @param config Configuration du pont
     */
    bridge(sourceSystem: string, targetSystem: string, config: Record<string, any>): Promise<AgentResult>;

    /**
     * Synchronise les données entre deux systèmes
     * @param source Système source
     * @param target Système cible
     * @param dataTypes Types de données à synchroniser
     */
    synchronize(source: string, target: string, dataTypes: string[]): Promise<boolean>;
}

/**
 * Interface spécifique pour les agents de registre
 */
export interface RegistryAgent extends CoordinationAgent {
    /**
     * Enregistre un agent dans le registre
     * @param agent Agent à enregistrer
     * @param metadata Métadonnées de l'agent
     */
    register(agent: string, metadata: Record<string, any>): Promise<string>;

    /**
     * Recherche des agents dans le registre
     * @param criteria Critères de recherche
     */
    discover(criteria: Record<string, any>): Promise<Record<string, any>[]>;
}

// -----------------------------------------------------------------------------
// INTERFACES DE LA COUCHE BUSINESS
// -----------------------------------------------------------------------------

/**
 * Interface pour les agents de la couche business
 * Responsable de la logique métier et du traitement des données
 */
export interface BusinessAgent extends BaseAgent {
    /**
     * Exécute une opération métier
     * @param operation Opération à exécuter
     * @param context Contexte d'exécution
     */
    process(operation: string, context: Record<string, any>): Promise<AgentResult>;

    /**
     * Valide les données d'entrée selon les règles métier
     * @param data Données à valider
     * @param rules Règles de validation
     */
    validateBusinessRules?(data: any, rules: Record<string, any>): Promise<boolean>;
}

/**
 * Interface spécifique pour les agents d'analyse
 */
export interface AnalyzerAgent extends BusinessAgent {
    /**
     * Analyse des données selon des critères spécifiques
     * @param data Données à analyser
     * @param criteria Critères d'analyse
     */
    analyze(data: any, criteria: Record<string, any>): Promise<Record<string, any>>;

    /**
     * Génère un rapport d'analyse
     * @param analysisResult Résultat d'analyse
     * @param format Format du rapport
     */
    generateReport(analysisResult: Record<string, any>, format: string): Promise<string>;
}

/**
 * Interface spécifique pour les agents générateurs
 */
export interface GeneratorAgent extends BusinessAgent {
    /**
     * Génère du contenu à partir d'une spécification
     * @param spec Spécification de génération
     * @param options Options de génération
     */
    generate(spec: Record<string, any>, options?: Record<string, any>): Promise<any>;

    /**
     * Vérifie si une spécification est valide pour la génération
     * @param spec Spécification à vérifier
     */
    validateSpec(spec: Record<string, any>): Promise<boolean>;
}

/**
 * Interface spécifique pour les agents validateurs
 */
export interface ValidatorAgent extends BusinessAgent {
    /**
     * Valide des données selon un schéma ou des règles
     * @param data Données à valider
     * @param schema Schéma de validation ou règles
     */
    validate(data: any, schema: any): Promise<{
        valid: boolean;
        errors?: Array<Record<string, any>>;
    }>;

    /**
     * Nettoie et normalise des données
     * @param data Données à normaliser
     */
    normalize(data: any): Promise<any>;
}

/**
 * Interface spécifique pour les agents d'analyse syntaxique
 */
export interface ParserAgent extends BusinessAgent {
    /**
     * Analyse syntaxiquement des données
     * @param input Données à analyser syntaxiquement
     * @param options Options d'analyse syntaxique
     */
    parse(input: any, options?: Record<string, any>): Promise<any>;

    /**
     * Convertit des données d'un format à un autre
     * @param data Données à convertir
     * @param sourceFormat Format source
     * @param targetFormat Format cible
     */
    convert(data: any, sourceFormat: string, targetFormat: string): Promise<any>;
}