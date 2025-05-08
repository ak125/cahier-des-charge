/**
 * agent-validator.ts
 * 
 * Utilitaire pour valider qu'un agent est conforme à son interface déclarée.
 * Cet outil est utilisé pour vérifier la conformité des agents aux interfaces 
 * définies dans l'architecture à trois couches.
 */

import * as ts from 'typescript';

/**
 * Résultat de la validation d'un agent.
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Erreur détectée lors de la validation d'un agent.
 */
export interface ValidationError {
    type: 'missing-property' | 'missing-method' | 'invalid-type' | 'invalid-implementation';
    message: string;
    memberName: string;
}

/**
 * Liste des méthodes requises pour chaque type d'interface d'agent.
 */
const REQUIRED_METHODS: Record<string, string[]> = {
    // Base Agent (commun à tous)
    'BaseAgent': ['initialize', 'isReady', 'shutdown', 'getMetadata'],

    // Interfaces de couche
    'OrchestrationAgent': ['orchestrate', 'reportStatus'],
    'CoordinationAgent': ['coordinate'],
    'BusinessAgent': ['process'],

    // Interfaces spécifiques d'orchestration
    'OrchestratorAgent': ['executeSequence', 'handleFailure'],
    'MonitorAgent': ['monitorExecution', 'generateReport'],
    'SchedulerAgent': ['schedule', 'cancelSchedule'],

    // Interfaces spécifiques de coordination
    'AdapterAgent': ['adapt', 'checkCompatibility'],
    'BridgeAgent': ['bridge', 'synchronize'],
    'RegistryAgent': ['register', 'discover'],

    // Interfaces spécifiques business
    'AnalyzerAgent': ['analyze', 'generateReport'],
    'GeneratorAgent': ['generate', 'validateSpec'],
    'ValidatorAgent': ['validate', 'normalize'],
    'ParserAgent': ['parse', 'convert']
};

/**
 * Liste des propriétés requises pour chaque type d'agent.
 */
const REQUIRED_PROPERTIES: Record<string, string[]> = {
    // Propriétés communes à tous les agents
    'BaseAgent': ['id', 'name', 'type', 'version'],
};

/**
 * Vérifie si un agent est conforme à son interface.
 * 
 * @param agent L'instance d'agent à valider
 * @param interfaceType Le type d'interface que l'agent doit implémenter
 * @returns Résultat de la validation
 */
export function validateAgent(agent: any, interfaceType: string): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: []
    };

    // Déterminer tous les types d'interfaces que l'agent doit valider
    const interfaceTypes = getInterfaceHierarchy(interfaceType);

    // Vérifier les propriétés requises
    for (const type of interfaceTypes) {
        const requiredProps = REQUIRED_PROPERTIES[type] || [];
        for (const prop of requiredProps) {
            if (agent[prop] === undefined) {
                result.valid = false;
                result.errors.push({
                    type: 'missing-property',
                    message: `La propriété requise '${prop}' n'est pas définie`,
                    memberName: prop
                });
            }
        }
    }

    // Vérifier les méthodes requises
    for (const type of interfaceTypes) {
        const requiredMethods = REQUIRED_METHODS[type] || [];
        for (const method of requiredMethods) {
            if (typeof agent[method] !== 'function') {
                result.valid = false;
                result.errors.push({
                    type: 'missing-method',
                    message: `La méthode requise '${method}' n'est pas implémentée`,
                    memberName: method
                });
            }
        }
    }

    return result;
}

/**
 * Détermine la hiérarchie complète des interfaces pour un type donné.
 * Par exemple, OrchestratorAgent -> OrchestrationAgent -> BaseAgent
 * 
 * @param interfaceType Type d'interface
 * @returns Liste des interfaces dans l'ordre hiérarchique
 */
function getInterfaceHierarchy(interfaceType: string): string[] {
    const hierarchy: string[] = [interfaceType];

    // Ajouter l'interface de couche parente si applicable
    if (interfaceType.startsWith('Orchestrator') ||
        interfaceType === 'MonitorAgent' ||
        interfaceType === 'SchedulerAgent') {
        hierarchy.push('OrchestrationAgent');
    } else if (interfaceType.startsWith('Adapter') ||
        interfaceType === 'BridgeAgent' ||
        interfaceType === 'RegistryAgent') {
        hierarchy.push('CoordinationAgent');
    } else if (interfaceType === 'AnalyzerAgent' ||
        interfaceType === 'GeneratorAgent' ||
        interfaceType === 'ValidatorAgent' ||
        interfaceType === 'ParserAgent') {
        hierarchy.push('BusinessAgent');
    }

    // Tous les agents héritent de BaseAgent
    hierarchy.push('BaseAgent');

    return hierarchy;
}

/**
 * Analyse le fichier source TypeScript et extrait les informations sur les interfaces implémentées.
 * 
 * @param filePath Chemin du fichier à analyser
 * @returns Informations sur les interfaces implémentées
 */
export function analyzeImplementedInterfaces(filePath: string): {
    className: string;
    interfaces: string[];
}[] {
    // Configuration du compilateur TypeScript
    const program = ts.createProgram([filePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS
    });

    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        return [];
    }

    const result: { className: string; interfaces: string[] }[] = [];

    // Parcourir l'AST pour trouver les classes et leurs interfaces
    function visit(node: ts.Node) {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.text;
            const interfaces: string[] = [];

            // Extraire les interfaces implémentées
            if (node.heritageClauses) {
                for (const clause of node.heritageClauses) {
                    if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
                        for (const type of clause.types) {
                            if (ts.isIdentifier(type.expression)) {
                                interfaces.push(type.expression.text);
                            }
                        }
                    }
                }
            }

            result.push({ className, interfaces });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

/**
 * Génère un rapport de validation pour tous les agents dans un répertoire.
 * 
 * @param directory Répertoire à analyser
 * @returns Rapport de validation
 */
export function generateValidationReport(directory: string): string {
    // Cette fonction serait implémentée pour générer un rapport complet
    // sur tous les agents dans un répertoire donné
    return "Implémentation à venir";
}

/**
 * Exemple d'utilisation :
 * 
 * ```typescript
 * import { validateAgent } from './tools/agent-validator';
 * 
 * // Exemple de validation
 * const myAgent = new MyBusinessAgent();
 * const validationResult = validateAgent(myAgent, 'BusinessAgent');
 * 
 * if (validationResult.valid) {
 *   console.log('Agent conforme à son interface');
 * } else {
 *   console.error('Problèmes de conformité:', validationResult.errors);
 * }
 * ```
 */