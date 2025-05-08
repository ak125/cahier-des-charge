#!/usr/bin/env ts-node
/**
 * identify-obsolete-agents.ts
 * 
 * Script d'analyse qui identifie les agents qui ne respectent pas la nouvelle
 * structure d'interfaces par couche et les potentiels doublons fonctionnels.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const AGENTS_DIRS = [
    'agents',
    'packages/*/src',
    'archives/legacy-agents',
    'apps/*/src',
];
const INTERFACE_FILE = path.join(ROOT_DIR, 'packages/mcp-types/src/layer-contracts.ts');
const OUTPUT_FILE = path.join(ROOT_DIR, 'cleanup-report/obsolete-agents-report.md');

// Types d'interfaces par couche
const INTERFACE_LAYERS = {
    'Orchestration': ['OrchestrationAgent', 'OrchestratorAgent', 'MonitorAgent', 'SchedulerAgent'],
    'Coordination': ['CoordinationAgent', 'AdapterAgent', 'BridgeAgent', 'RegistryAgent'],
    'Business': ['BusinessAgent', 'AnalyzerAgent', 'GeneratorAgent', 'ValidatorAgent', 'ParserAgent']
};

// Résultats
interface AgentAnalysisResult {
    filePath: string;
    type: 'obsolete' | 'non-compliant' | 'duplicate';
    issues: string[];
    recommendedAction: string;
    targetInterface?: string;
}

// Fonction récursive pour trouver tous les fichiers .ts et .js
function findFilesRecursively(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;

    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (error) {
        console.warn(`Avertissement: Impossible de lire le répertoire ${dir}: ${(error as Error).message}`);
        return fileList;
    }

    for (const file of files) {
        const filePath = path.join(dir, file);

        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                findFilesRecursively(filePath, fileList);
            } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
                fileList.push(filePath);
            }
        } catch (error) {
            console.warn(`Avertissement: Impossible d'accéder à ${filePath}: ${(error as Error).message}`);
        }
    }

    return fileList;
}

// Fonction pour résoudre les motifs de glob simples comme packages/*/src
function expandGlobPattern(pattern: string): string[] {
    const segments = pattern.split('/');
    let currentPath = ROOT_DIR;
    let results: string[] = [currentPath];

    for (const segment of segments) {
        if (segment === '*') {
            // Remplacer * par tous les répertoires dans le chemin actuel
            const tempResults: string[] = [];
            for (const result of results) {
                if (fs.existsSync(result)) {
                    const dirs = fs.readdirSync(result)
                        .filter(item => fs.statSync(path.join(result, item)).isDirectory())
                        .map(dir => path.join(result, dir));
                    tempResults.push(...dirs);
                }
            }
            results = tempResults;
        } else {
            // Ajouter le segment au chemin
            results = results.map(result => path.join(result, segment));
        }
    }

    return results.filter(dir => fs.existsSync(dir));
}

// Analyse le fichier TypeScript pour vérifier la conformité aux interfaces
function analyzeFile(filePath: string): AgentAnalysisResult | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const isAgent = /class\s+\w+(?:\s+extends\s+\w+)?\s+implements\s+\w+/m.test(fileContent) ||
        /agent/i.test(filePath);

    // Si ce n'est pas un fichier d'agent, on l'ignore
    if (!isAgent) {
        return null;
    }

    const issues: string[] = [];
    let targetInterface: string | undefined;
    let type: 'obsolete' | 'non-compliant' | 'duplicate' = 'non-compliant';

    // Vérifier si le fichier implémente une interface connue
    const hasInterface = Object.values(INTERFACE_LAYERS).flat().some(intf =>
        new RegExp(`implements\\s+${intf}`).test(fileContent)
    );

    if (!hasInterface) {
        issues.push("N'implémente pas une interface standardisée");

        // Essaie de déterminer quelle interface devrait être implémentée
        for (const [layer, interfaces] of Object.entries(INTERFACE_LAYERS)) {
            for (const intf of interfaces) {
                const interfaceKeywords = intf.replace(/Agent$/, '').toLowerCase();
                if (new RegExp(interfaceKeywords, 'i').test(filePath) ||
                    new RegExp(interfaceKeywords, 'i').test(fileContent)) {
                    targetInterface = intf;
                    break;
                }
            }
            if (targetInterface) break;
        }
    }

    // Vérifier si respecte la structure à trois couches
    const pathParts = filePath.split(path.sep);
    const isInCorrectLayer = pathParts.some(part =>
        ['orchestration', 'coordination', 'business'].includes(part.toLowerCase())
    );

    if (!isInCorrectLayer) {
        issues.push("N'est pas placé dans la structure à trois couches");
    }

    // Vérifier si obsolète (dans répertoires d'archives ou legacy)
    if (filePath.includes('legacy') || filePath.includes('archives')) {
        type = 'obsolete';
        issues.push("Fichier dans un répertoire legacy ou archives");
    }

    // Génère une recommandation
    let recommendedAction = '';
    if (type === 'obsolete') {
        recommendedAction = "Supprimer après vérification de non-utilisation";
    } else if (!hasInterface && targetInterface) {
        recommendedAction = `Migrer vers l'interface ${targetInterface}`;
    } else if (!hasInterface) {
        recommendedAction = "Déterminer l'interface appropriée et l'implémenter";
    } else if (!isInCorrectLayer) {
        recommendedAction = "Déplacer vers le répertoire approprié dans la structure à trois couches";
    }

    return {
        filePath,
        type,
        issues,
        recommendedAction,
        targetInterface
    };
}

// Recherche des doublons potentiels basé sur l'analyse des noms et de la fonctionnalité
function findPotentialDuplicates(results: AgentAnalysisResult[]): AgentAnalysisResult[] {
    const duplicates: AgentAnalysisResult[] = [];
    const nameMap: Map<string, string[]> = new Map();

    // Grouper les fichiers par noms similaires
    for (const result of results) {
        const filename = path.basename(result.filePath, path.extname(result.filePath));
        const normalizedName = filename.replace(/[-_]/g, '').toLowerCase();

        if (!nameMap.has(normalizedName)) {
            nameMap.set(normalizedName, []);
        }
        nameMap.get(normalizedName)!.push(result.filePath);
    }

    // Identifier les groupes avec plus d'un fichier (doublons potentiels)
    for (const [normalizedName, files] of nameMap.entries()) {
        if (files.length > 1) {
            for (const file of files) {
                duplicates.push({
                    filePath: file,
                    type: 'duplicate',
                    issues: [`Potentiel doublon avec: ${files.filter(f => f !== file).join(', ')}`],
                    recommendedAction: "Vérifier les fonctionnalités et consolider"
                });
            }
        }
    }

    return duplicates;
}

// Script principal
async function main() {
    console.log('Démarrage de l\'analyse des agents obsolètes...');

    // Trouver tous les fichiers à analyser
    let allFiles: string[] = [];

    for (const dirPattern of AGENTS_DIRS) {
        const dirs = expandGlobPattern(dirPattern);

        for (const dir of dirs) {
            const files = findFilesRecursively(dir);
            allFiles = [...allFiles, ...files];
        }
    }

    console.log(`${allFiles.length} fichiers trouvés pour analyse.`);

    // Analyser chaque fichier
    const results: AgentAnalysisResult[] = [];
    for (const file of allFiles) {
        const result = analyzeFile(file);
        if (result && result.issues.length > 0) {
            results.push(result);
        }
    }

    // Rechercher des doublons potentiels
    const duplicates = findPotentialDuplicates(results);

    // Fusionner les résultats
    const allResults = [...results, ...duplicates.filter(dup =>
        !results.some(res => res.filePath === dup.filePath)
    )];

    // Générer le rapport
    const report = generateReport(allResults);

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Écrire le rapport dans un fichier
    fs.writeFileSync(OUTPUT_FILE, report);

    console.log(`Analyse terminée. ${allResults.length} agents nécessitent une attention.`);
    console.log(`Rapport généré dans ${OUTPUT_FILE}`);
}

// Génère un rapport Markdown formaté
function generateReport(results: AgentAnalysisResult[]): string {
    const now = new Date().toISOString().split('T')[0];

    let report = `# Rapport d'Agents Obsolètes ou Non-Conformes (${now})

Ce rapport identifie les agents qui ne respectent pas la nouvelle architecture à trois couches
ou qui sont potentiellement obsolètes ou dupliqués.

## Synthèse

- **Agents obsolètes**: ${results.filter(r => r.type === 'obsolete').length}
- **Agents non conformes**: ${results.filter(r => r.type === 'non-compliant').length}
- **Agents dupliqués**: ${results.filter(r => r.type === 'duplicate').length}
- **Total**: ${results.length}

## Recommandations Générales

1. Migrer les agents non conformes vers les interfaces appropriées
2. Consolider les agents dupliqués
3. Supprimer les agents obsolètes après vérification

## Agents Obsolètes

| Chemin du Fichier | Problèmes | Action Recommandée |
|------------------|-----------|-------------------|
`;

    // Ajouter les agents obsolètes
    for (const result of results.filter(r => r.type === 'obsolete')) {
        report += `| ${result.filePath} | ${result.issues.join(', ')} | ${result.recommendedAction} |\n`;
    }

    report += `\n## Agents Non Conformes

| Chemin du Fichier | Problèmes | Interface Cible | Action Recommandée |
|------------------|-----------|----------------|-------------------|
`;

    // Ajouter les agents non conformes
    for (const result of results.filter(r => r.type === 'non-compliant')) {
        report += `| ${result.filePath} | ${result.issues.join(', ')} | ${result.targetInterface || 'N/A'} | ${result.recommendedAction} |\n`;
    }

    report += `\n## Agents Potentiellement Dupliqués

| Chemin du Fichier | Doublons Potentiels | Action Recommandée |
|------------------|---------------------|-------------------|
`;

    // Ajouter les agents dupliqués
    for (const result of results.filter(r => r.type === 'duplicate')) {
        // Vérification plus stricte pour éviter l'erreur TS2532
        const dupsInfo = result.issues && result.issues.length > 0 && result.issues[0]
            ? result.issues[0].replace('Potentiel doublon avec: ', '')
            : 'Information non disponible';
        report += `| ${result.filePath} | ${dupsInfo} | ${result.recommendedAction} |\n`;
    }

    report += `\n## Étapes Suivantes

1. Pour chaque agent non conforme, modifier le code pour implémenter l'interface appropriée
2. Pour chaque groupe de doublons, choisir un agent principal et migrer les fonctionnalités uniques
3. Déplacer tous les agents vers la structure de répertoires à trois couches
4. Mettre à jour les imports dans le code qui référence ces agents
5. Supprimer les agents obsolètes après vérification complète

## Comment Migrer un Agent

Pour migrer un agent vers la nouvelle architecture:

\`\`\`typescript
// Ancien agent
class MonAnalyseur {
  // Implémentation existante...
}

// Agent migré
import { AnalyzerAgent, AgentResult } from 'mcp-types';

class MonAnalyseur implements AnalyzerAgent {
  // Propriétés requises par BaseAgent
  id = 'mon-analyseur-001';
  name = 'Mon Analyseur';
  type = 'analyzer';
  version = '1.0.0';
  
  // Méthodes requises par BaseAgent
  async initialize(options?: Record<string, any>): Promise<void> {
    // Initialisation...
  }
  
  isReady(): boolean {
    return true;
  }
  
  async shutdown(): Promise<void> {
    // Nettoyage...
  }
  
  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version
    };
  }
  
  // Méthodes requises par BusinessAgent
  async process(operation: string, context: Record<string, any>): Promise<AgentResult> {
    // Déléguer aux méthodes spécifiques selon l'opération
    switch(operation) {
      case 'analyze':
        const result = await this.analyze(context.data, context.criteria);
        return { success: true, data: result };
      default:
        return { success: false, error: \`Opération \${operation} non supportée\` };
    }
  }
  
  // Méthodes spécifiques à AnalyzerAgent
  async analyze(data: any, criteria: Record<string, any>): Promise<Record<string, any>> {
    // Logique d'analyse spécifique
    return { result: 'Analyse terminée' };
  }
  
  async generateReport(analysisResult: Record<string, any>, format: string): Promise<string> {
    // Génération de rapport
    return JSON.stringify(analysisResult);
  }
}
\`\`\`

## Remarques Importantes

- Les interfaces définissent un contrat minimal que chaque agent doit respecter
- La migration doit préserver la fonctionnalité existante
- Les tests doivent être mis à jour pour refléter les nouvelles interfaces
- La documentation doit être mise à jour pour refléter l'architecture à trois couches
`;

    return report;
}

// Exécuter le script
main().catch(error => {
    console.error('Erreur lors de l\'analyse:', error);
    process.exit(1);
});