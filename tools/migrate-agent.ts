#!/usr/bin/env ts-node
/**
 * migrate-agent.ts
 * 
 * Script assistant pour migrer un agent vers l'architecture à trois couches.
 * Ce script analyse un fichier d'agent existant et génère un squelette de code
 * pour l'adapter à l'interface appropriée.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Configuration
const INTERFACE_LAYERS = {
    'Orchestration': ['OrchestrationAgent', 'OrchestratorAgent', 'MonitorAgent', 'SchedulerAgent'],
    'Coordination': ['CoordinationAgent', 'AdapterAgent', 'BridgeAgent', 'RegistryAgent'],
    'Business': ['BusinessAgent', 'AnalyzerAgent', 'GeneratorAgent', 'ValidatorAgent', 'ParserAgent']
};

// Types d'interfaces avec leurs méthodes requises
const INTERFACE_METHODS: Record<string, string[]> = {
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

// Propriétés requises par type d'agent
const INTERFACE_PROPERTIES: Record<string, string[]> = {
    'BaseAgent': ['id', 'name', 'type', 'version'],
};

// Types des méthodes par interface
const METHOD_SIGNATURES: Record<string, string> = {
    'initialize': 'async initialize(options?: Record<string, any>): Promise<void>',
    'isReady': 'isReady(): boolean',
    'shutdown': 'async shutdown(): Promise<void>',
    'getMetadata': 'getMetadata(): Record<string, any>',
    'orchestrate': 'async orchestrate(workflow: string | object, context: Record<string, any>): Promise<AgentResult>',
    'reportStatus': 'async reportStatus(workflowId: string, status: "started" | "running" | "completed" | "failed", metadata?: Record<string, any>): Promise<void>',
    'coordinate': 'async coordinate(sources: string[], targets: string[], data: Record<string, any>): Promise<AgentResult>',
    'process': 'async process(operation: string, context: Record<string, any>): Promise<AgentResult>',
    'executeSequence': 'async executeSequence(agents: string[], inputs: Record<string, any>, options?: Record<string, any>): Promise<AgentResult>',
    'handleFailure': 'async handleFailure(workflowId: string, errorContext: Record<string, any>): Promise<AgentResult>',
    'monitorExecution': 'async monitorExecution(targets: string[]): Promise<void>',
    'generateReport': 'async generateReport(analysisResult: Record<string, any>, format: string): Promise<string>',
    'schedule': 'async schedule(target: string, schedule: string, inputs: Record<string, any>): Promise<string>',
    'cancelSchedule': 'async cancelSchedule(scheduleId: string): Promise<boolean>',
    'adapt': 'async adapt(input: any, sourceFormat: string, targetFormat: string): Promise<any>',
    'checkCompatibility': 'async checkCompatibility(sourceFormat: string, targetFormat: string): Promise<boolean>',
    'bridge': 'async bridge(sourceSystem: string, targetSystem: string, config: Record<string, any>): Promise<AgentResult>',
    'synchronize': 'async synchronize(source: string, target: string, dataTypes: string[]): Promise<boolean>',
    'register': 'async register(agent: string, metadata: Record<string, any>): Promise<string>',
    'discover': 'async discover(criteria: Record<string, any>): Promise<Record<string, any>[]>',
    'analyze': 'async analyze(data: any, criteria: Record<string, any>): Promise<Record<string, any>>',
    'generate': 'async generate(spec: Record<string, any>, options?: Record<string, any>): Promise<any>',
    'validateSpec': 'async validateSpec(spec: Record<string, any>): Promise<boolean>',
    'validate': 'async validate(data: any, schema: any): Promise<{ valid: boolean; errors?: Array<Record<string, any>> }>',
    'normalize': 'async normalize(data: any): Promise<any>',
    'parse': 'async parse(input: any, options?: Record<string, any>): Promise<any>',
    'convert': 'async convert(data: any, sourceFormat: string, targetFormat: string): Promise<any>',
};

/**
 * Options pour la génération de migration d'agent
 */
interface MigrationOptions {
    /**
     * Chemin du fichier source à migrer
     */
    sourcePath: string;

    /**
     * Interface cible pour l'agent
     */
    targetInterface?: string;

    /**
     * Chemin cible pour le fichier migré (optionnel)
     */
    targetPath?: string;

    /**
     * Si défini, écrit le résultat dans le fichier cible
     */
    write?: boolean;

    /**
     * Option pour analyser l'agent et détecter automatiquement l'interface appropriée
     */
    autoDetect?: boolean;
}

/**
 * Résultat de la migration d'agent
 */
interface MigrationResult {
    /**
     * Code généré pour l'agent migré
     */
    generatedCode: string;

    /**
     * Chemin où le code a été écrit si l'option write est true
     */
    writtenPath?: string;

    /**
     * Interface cible déterminée
     */
    targetInterface: string;

    /**
     * Méthodes manquantes qui doivent être implémentées
     */
    missingMethods: string[];

    /**
     * Propriétés manquantes qui doivent être ajoutées
     */
    missingProperties: string[];
}

/**
 * Informations extraites d'un agent
 */
interface AgentInfo {
    className: string;
    properties: string[];
    methods: string[];
    existingImports: string[];
    sourceCode: string;
    detectedLayer?: string;
}

/**
 * Détermine l'interface la plus appropriée pour un agent.
 * 
 * @param agentInfo Informations extraites de l'agent
 * @returns L'interface déterminée ou null
 */
function detectTargetInterface(agentInfo: AgentInfo): string | null {
    // Essaie de détecter par le nom de classe
    const className = agentInfo.className.toLowerCase();

    // Parcourir les interfaces par couche
    for (const [layer, interfaces] of Object.entries(INTERFACE_LAYERS)) {
        for (const intf of interfaces) {
            // Retirer 'Agent' du nom d'interface pour la comparaison
            const interfaceKeyword = intf.replace(/Agent$/, '').toLowerCase();

            // Plusieurs stratégies pour déterminer l'interface
            if (
                className.includes(interfaceKeyword) ||
                (className.includes('agent') && className.includes(interfaceKeyword))
            ) {
                agentInfo.detectedLayer = layer;
                return intf;
            }
        }
    }

    // Si le nom ne correspond pas clairement, essayons de déterminer par les méthodes
    for (const [intf, methods] of Object.entries(INTERFACE_METHODS)) {
        if (intf === 'BaseAgent') continue; // Skip la base qui est commune

        const matchedMethods = methods.filter(method =>
            agentInfo.methods.some(m => m.includes(method))
        );

        // Si plus de la moitié des méthodes correspondent, c'est probablement cette interface
        if (matchedMethods.length > methods.length / 2) {
            for (const [layer, interfaces] of Object.entries(INTERFACE_LAYERS)) {
                if (interfaces.includes(intf)) {
                    agentInfo.detectedLayer = layer;
                    return intf;
                }
            }
            return intf;
        }
    }

    // Par défaut, on utilise BusinessAgent pour la majorité des agents
    agentInfo.detectedLayer = 'Business';
    return 'BusinessAgent';
}

/**
 * Analyse un fichier source et extrait les informations de l'agent
 * 
 * @param sourceFilePath Chemin du fichier à analyser
 * @returns Informations extraites de l'agent
 */
function analyzeAgent(sourceFilePath: string): AgentInfo {
    const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

    // Configuration du compilateur TypeScript
    const program = ts.createProgram([sourceFilePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS
    });

    const sourceFile = program.getSourceFile(sourceFilePath);

    const className: string[] = [];
    const properties: string[] = [];
    const methods: string[] = [];
    const existingImports: string[] = [];

    // Parcourir l'AST
    function visit(node: ts.Node) {
        // Extraire les noms de classe
        if (ts.isClassDeclaration(node) && node.name) {
            className.push(node.name.text);
        }

        // Extraire les propriétés
        if (ts.isPropertyDeclaration(node) && node.name) {
            if (ts.isIdentifier(node.name)) {
                properties.push(node.name.text);
            }
        }

        // Extraire les méthodes
        if (ts.isMethodDeclaration(node) && node.name) {
            if (ts.isIdentifier(node.name)) {
                methods.push(node.name.text);
            }
        }

        // Extraire les imports
        if (ts.isImportDeclaration(node)) {
            if (node.importClause && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                existingImports.push(node.moduleSpecifier.text);
            }
        }

        ts.forEachChild(node, visit);
    }

    if (sourceFile) {
        visit(sourceFile);
    }

    return {
        className: className[0] || path.basename(sourceFilePath, path.extname(sourceFilePath)),
        properties,
        methods,
        existingImports,
        sourceCode
    };
}

/**
 * Génère le code pour un agent migré
 * 
 * @param agentInfo Informations de l'agent
 * @param targetInterface Interface cible
 * @returns Code généré
 */
function generateMigratedCode(agentInfo: AgentInfo, targetInterface: string): string {
    // Déterminer toutes les interfaces nécessaires (hiérarchie)
    const allInterfaces = getInterfaceHierarchy(targetInterface);

    // Collecter toutes les méthodes requises
    const requiredMethods: string[] = [];
    for (const intf of allInterfaces) {
        if (INTERFACE_METHODS[intf]) {
            requiredMethods.push(...INTERFACE_METHODS[intf]);
        }
    }

    // Collecter toutes les propriétés requises
    const requiredProperties: string[] = [];
    for (const intf of allInterfaces) {
        if (INTERFACE_PROPERTIES[intf]) {
            requiredProperties.push(...INTERFACE_PROPERTIES[intf]);
        }
    }

    // Déterminer les méthodes et propriétés manquantes
    const missingMethods = requiredMethods.filter(method => !agentInfo.methods.includes(method));
    const missingProperties = requiredProperties.filter(prop => !agentInfo.properties.includes(prop));

    // Construire le code
    let code = '';

    // Ajouter les imports
    let needsAgentResultImport = false;
    if (!agentInfo.existingImports.includes('mcp-types')) {
        code += `import { ${targetInterface}, AgentResult } from 'mcp-types';\n\n`;
        needsAgentResultImport = true;
    }

    // Détecter les modèles existants et les conserver
    const hasContainer = agentInfo.sourceCode.includes('container.get(');
    if (hasContainer && !agentInfo.existingImports.some(i => i.includes('container') || i.includes('dependencyinjection'))) {
        code += `import { container } from '../../../core/dependencyinjection';\n\n`;
    }

    // Début de la classe
    code += `export class ${agentInfo.className} implements ${targetInterface} {\n`;

    // Ajouter les propriétés requises manquantes
    for (const prop of missingProperties) {
        switch (prop) {
            case 'id':
                code += `  id = '${agentInfo.className.toLowerCase()}-001';\n`;
                break;
            case 'name':
                code += `  name = '${agentInfo.className}';\n`;
                break;
            case 'type':
                code += `  type = '${targetInterface.toLowerCase().replace('agent', '')}';\n`;
                break;
            case 'version':
                code += `  version = '1.0.0';\n`;
                break;
            default:
                code += `  ${prop}: any; // TODO: Implement this property\n`;
        }
    }

    // Conserver les propriétés existantes
    if (missingProperties.length > 0) {
        code += '\n';
    }

    // Ajouter les méthodes requises manquantes
    for (const method of missingMethods) {
        const signature = METHOD_SIGNATURES[method];
        if (signature) {
            if (method === 'process') {
                // Cas spécial pour process() qui délègue aux méthodes spécifiques
                code += `  ${signature} {\n`;
                code += `    // Déléguer aux méthodes spécifiques selon l'opération\n`;
                code += `    switch(operation) {\n`;

                if (agentInfo.methods.includes('analyze')) {
                    code += `      case 'analyze':\n`;
                    code += `        return {\n`;
                    code += `          success: true,\n`;
                    code += `          data: await this.analyze(context.data, context.criteria)\n`;
                    code += `        };\n`;
                } else if (agentInfo.methods.includes('generate')) {
                    code += `      case 'generate':\n`;
                    code += `        return {\n`;
                    code += `          success: true,\n`;
                    code += `          data: await this.generate(context.spec, context.options)\n`;
                    code += `        };\n`;
                } else if (agentInfo.methods.includes('validate')) {
                    code += `      case 'validate':\n`;
                    code += `        const result = await this.validate(context.data, context.schema);\n`;
                    code += `        return {\n`;
                    code += `          success: result.valid,\n`;
                    code += `          data: result,\n`;
                    code += `          error: result.valid ? undefined : { errors: result.errors }\n`;
                    code += `        };\n`;
                } else if (agentInfo.methods.includes('parse')) {
                    code += `      case 'parse':\n`;
                    code += `        return {\n`;
                    code += `          success: true,\n`;
                    code += `          data: await this.parse(context.input, context.options)\n`;
                    code += `        };\n`;
                }

                code += `      default:\n`;
                code += `        return {\n`;
                code += `          success: false,\n`;
                code += `          error: \`Opération \${operation} non supportée\`\n`;
                code += `        };\n`;
                code += `    }\n`;
                code += `  }\n\n`;
            } else if (method === 'orchestrate' && agentInfo.methods.includes('executeSequence')) {
                // Cas spécial pour orchestrate() qui délègue à executeSequence
                code += `  ${signature} {\n`;
                code += `    // Convertir le workflow en séquence d'agents\n`;
                code += `    const workflowDef = typeof workflow === 'string' ? { id: workflow } : workflow;\n`;
                code += `    const agents = Array.isArray(workflowDef.sequence) ? workflowDef.sequence : [];\n\n`;
                code += `    return this.executeSequence(agents, context, {\n`;
                code += `      workflowId: workflowDef.id,\n`;
                code += `      ...context.options\n`;
                code += `    });\n`;
                code += `  }\n\n`;
            } else {
                code += `  ${signature} {\n`;
                code += `    // TODO: Implement ${method}\n`;

                // Ajouter une implémentation minimale selon la méthode
                switch (method) {
                    case 'initialize':
                        code += `    // Initialisation de l'agent\n`;
                        code += `    return Promise.resolve();\n`;
                        break;
                    case 'isReady':
                        code += `    return true;\n`;
                        break;
                    case 'shutdown':
                        code += `    // Nettoyage des ressources\n`;
                        code += `    return Promise.resolve();\n`;
                        break;
                    case 'getMetadata':
                        code += `    return {\n`;
                        code += `      id: this.id,\n`;
                        code += `      name: this.name,\n`;
                        code += `      type: this.type,\n`;
                        code += `      version: this.version\n`;
                        code += `    };\n`;
                        break;
                    default:
                        // Pour les autres méthodes qui retournent un AgentResult
                        if (signature.indexOf('AgentResult') !== -1) {
                            code += `    return { success: false, error: 'Non implémenté' };\n`;
                        } else if (signature.indexOf('Promise<boolean>') !== -1) {
                            code += `    return Promise.resolve(false);\n`;
                        } else if (signature.indexOf('Promise<string>') !== -1) {
                            code += `    return Promise.resolve('');\n`;
                        } else if (signature.indexOf('Promise<void>') !== -1) {
                            code += `    return Promise.resolve();\n`;
                        } else if (signature.indexOf('Promise<any>') !== -1 || signature.indexOf('Promise<Record<string, any>') !== -1) {
                            code += `    return Promise.resolve({});\n`;
                        } else if (signature.indexOf('Promise<Array') !== -1) {
                            code += `    return Promise.resolve([]);\n`;
                        }
                }

                code += `  }\n\n`;
            }
        }
    }

    // Fin de la classe
    code += `}\n`;

    return code;
}

/**
 * Obtient la hiérarchie d'interfaces pour le type spécifié
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
 * Migre un agent vers la nouvelle architecture à trois couches
 * 
 * @param options Options de migration
 * @returns Résultat de la migration
 */
function migrateAgent(options: MigrationOptions): MigrationResult {
    if (!fs.existsSync(options.sourcePath)) {
        throw new Error(`Le fichier source '${options.sourcePath}' n'existe pas`);
    }

    // Analyser le fichier source
    const agentInfo = analyzeAgent(options.sourcePath);

    // Déterminer l'interface cible
    const targetInterface = options.targetInterface || (options.autoDetect ? detectTargetInterface(agentInfo) : null);

    if (!targetInterface) {
        throw new Error(`Interface cible non spécifiée et auto-détection désactivée`);
    }

    // Générer le code
    const generatedCode = generateMigratedCode(agentInfo, targetInterface);

    // Déterminer les méthodes et propriétés manquantes
    const allInterfaces = getInterfaceHierarchy(targetInterface);

    // Collecter toutes les méthodes requises
    const requiredMethods: string[] = [];
    for (const intf of allInterfaces) {
        if (INTERFACE_METHODS[intf]) {
            requiredMethods.push(...INTERFACE_METHODS[intf]);
        }
    }

    // Collecter toutes les propriétés requises
    const requiredProperties: string[] = [];
    for (const intf of allInterfaces) {
        if (INTERFACE_PROPERTIES[intf]) {
            requiredProperties.push(...INTERFACE_PROPERTIES[intf]);
        }
    }

    const missingMethods = requiredMethods.filter(method => !agentInfo.methods.includes(method));
    const missingProperties = requiredProperties.filter(prop => !agentInfo.properties.includes(prop));

    // Déterminer le chemin cible
    let writtenPath: string | undefined;

    if (options.write) {
        const targetPath = options.targetPath || options.sourcePath;
        fs.writeFileSync(targetPath, generatedCode, 'utf-8');
        writtenPath = targetPath;
    }

    return {
        generatedCode,
        writtenPath,
        targetInterface,
        missingMethods,
        missingProperties,
    };
}

/**
 * Point d'entrée du script
 */
function main() {
    const args = process.argv.slice(2);

    // Afficher l'aide
    if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        console.log(`
Usage: migrate-agent [options] <source-file>

Options:
  --target-interface, -i    Interface cible (par exemple 'AnalyzerAgent')
  --output, -o              Chemin de sortie (par défaut écrase le fichier d'entrée)
  --write, -w               Écrire le résultat dans un fichier
  --auto-detect, -a         Détecter automatiquement l'interface appropriée
  --help, -h                Afficher cette aide

Exemples:
  migrate-agent -a -w src/agents/my-analyzer.ts
  migrate-agent -i AnalyzerAgent -o src/business/analyzers/my-analyzer.ts src/agents/my-analyzer.ts
    `);
        return;
    }

    // Vérifier qu'il y a un argument qui n'est pas une option
    const sourceFilePath = args.find(arg => !arg.startsWith('-') &&
        !args[args.indexOf(arg) - 1]?.startsWith('-i') &&
        !args[args.indexOf(arg) - 1]?.startsWith('--target-interface') &&
        !args[args.indexOf(arg) - 1]?.startsWith('-o') &&
        !args[args.indexOf(arg) - 1]?.startsWith('--output'));

    if (!sourceFilePath) {
        console.error("Erreur: Veuillez spécifier un fichier source");
        process.exit(1);
    }

    // Analyser les arguments
    const options: MigrationOptions = {
        sourcePath: sourceFilePath,
        write: args.includes('--write') || args.includes('-w'),
        autoDetect: args.includes('--auto-detect') || args.includes('-a')
    };

    // Interface cible
    const targetInterfaceIndex = Math.max(args.indexOf('--target-interface'), args.indexOf('-i'));
    if (targetInterfaceIndex >= 0 && targetInterfaceIndex < args.length - 1) {
        options.targetInterface = args[targetInterfaceIndex + 1];
    }

    // Chemin de sortie
    const outputIndex = Math.max(args.indexOf('--output'), args.indexOf('-o'));
    if (outputIndex >= 0 && outputIndex < args.length - 1) {
        options.targetPath = args[outputIndex + 1];
    }

    try {
        const result = migrateAgent(options);

        // Afficher le résultat
        console.log(`Agent migré avec succès vers l'interface '${result.targetInterface}'`);

        if (result.missingMethods.length > 0 || result.missingProperties.length > 0) {
            console.log('\nChangements nécessaires:');

            if (result.missingProperties.length > 0) {
                console.log(`\n  Propriétés à ajouter: ${result.missingProperties.join(', ')}`);
            }

            if (result.missingMethods.length > 0) {
                console.log(`\n  Méthodes à implémenter: ${result.missingMethods.join(', ')}`);
            }
        }

        if (result.writtenPath) {
            console.log(`\nCode généré écrit dans '${result.writtenPath}'`);
        } else {
            console.log('\nCode généré:');
            console.log('\n-----------------------\n');
            console.log(result.generatedCode);
            console.log('\n-----------------------\n');
        }
    } catch (error) {
        console.error(`Erreur: ${(error as Error).message}`);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    main();
}

// Exporter les fonctions pour les tests
export {
    migrateAgent,
    analyzeAgent,
    detectTargetInterface,
    getInterfaceHierarchy
};