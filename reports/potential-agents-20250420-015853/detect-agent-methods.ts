#!/usr/bin/env ts-node

/**
 * Détecteur automatique des méthodes implémentées par les agents
 *
 * Ce script analyse les fichiers d'agents MCP pour déterminer:
 * 1. Si la classe est abstraite
 * 2. Si le module exporte une classe ou un objet
 * 3. Quelles méthodes sont réellement implémentées
 *
 * Il génère un rapport JSON qui pourra être utilisé pour adapter les tests
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';

// Configurations
const PACKAGES_DIR = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const AGENTS_DIR = '/workspaces/cahier-des-charge/agents';
const REPORT_DIR = '/workspaces/cahier-des-charge/reports/analysis';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_PATH = path.join(REPORT_DIR, `agent-methods-${TIMESTAMP}.json`);

// Liste des méthodes standard à rechercher
const STANDARD_METHODS = [
  'initialize',
  'validate',
  'execute',
  'run',
  'process',
  'analyze',
  'generate',
  'validateData',
  'getStatus',
  'cleanup',
];

// Interfaces pour les résultats
interface AgentAnalysis {
  filePath: string;
  className: string;
  isAbstract: boolean;
  isExportedAsInstance: boolean;
  exportType: 'class' | 'instance' | 'none';
  implementedMethods: string[];
  properties: string[];
  missingMethods: string[];
  inheritance?: string;
  interfaces?: string[];
}

interface AnalysisReport {
  timestamp: string;
  agentsAnalyzed: number;
  abstractClasses: number;
  instanceExports: number;
  classExports: number;
  noExports: number;
  agents: AgentAnalysis[];
}

// Initialisation du rapport
const report: AnalysisReport = {
  timestamp: new Date().toISOString(),
  agentsAnalyzed: 0,
  abstractClasses: 0,
  instanceExports: 0,
  classExports: 0,
  noExports: 0,
  agents: [],
};

/**
 * Crée le compilateur TypeScript pour analyser le code
 */
function createTypeScriptCompiler(files: string[]): ts.Program {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
  };

  return ts.createProgram(files, compilerOptions);
}

/**
 * Analyse le fichier source d'un agent
 */
function analyzeAgentFile(sourceFile: ts.SourceFile, program: ts.Program): AgentAnalysis | null {
  const checker = program.getTypeChecker();
  let agentClass: ts.ClassDeclaration | undefined;
  let isExportedAsInstance = false;
  let exportType: 'class' | 'instance' | 'none' = 'none';

  // Trouver la classe d'agent dans le fichier
  ts.forEachChild(sourceFile, (node) => {
    if (
      ts.isClassDeclaration(node) &&
      node.name &&
      (node.name.text.includes('Agent') ||
        path.basename(sourceFile.fileName).toLowerCase().includes('agent'))
    ) {
      agentClass = node;
    }

    // Vérifier si l'export est une instance
    if (ts.isExportAssignment(node)) {
      const exportExpression = node.expression;
      if (ts.isNewExpression(exportExpression)) {
        isExportedAsInstance = true;
        exportType = 'instance';
      }
    }
  });

  if (!agentClass) {
    return null;
  }

  // Vérifier si la classe est exportée
  if (agentClass.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
    exportType = 'class';
  }

  const className = agentClass.name?.text || 'UnnamedAgent';
  const isAbstract = !!agentClass.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword);

  // Collecter les méthodes implémentées
  const implementedMethods: string[] = [];
  const properties: string[] = [];
  const interfaces: string[] = [];
  let inheritance: string | undefined;

  // Vérifier l'héritage
  if (agentClass.heritageClauses) {
    for (const clause of agentClass.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword && clause.types.length > 0) {
        inheritance = clause.types[0].expression.getText();
      } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
        for (const type of clause.types) {
          interfaces.push(type.expression.getText());
        }
      }
    }
  }

  // Collecter les membres
  for (const member of agentClass.members) {
    if (ts.isMethodDeclaration(member) && member.name) {
      const methodName = member.name.getText();
      implementedMethods.push(methodName);
    } else if (ts.isPropertyDeclaration(member) && member.name) {
      const propertyName = member.name.getText();
      properties.push(propertyName);
    }
  }

  // Déterminer les méthodes manquantes
  const missingMethods = STANDARD_METHODS.filter((method) => !implementedMethods.includes(method));

  return {
    filePath: sourceFile.fileName,
    className,
    isAbstract,
    isExportedAsInstance,
    exportType,
    implementedMethods,
    properties,
    missingMethods,
    inheritance,
    interfaces,
  };
}

/**
 * Trouve tous les fichiers TypeScript récursivement dans un répertoire
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function search(currentPath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          search(entryPath);
        }
      } else if (
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.spec.ts')
      ) {
        const content = fs.readFileSync(entryPath, 'utf8');
        // Vérifier s'il s'DoDoDoDotgit probablement d'un fichier d'agent
        if (
          (content.includes('class') && (content.includes('Agent') || content.includes('agent'))) ||
          entry.name.includes('Agent') ||
          entry.name.includes('agent')
        ) {
          files.push(entryPath);
        }
      }
    }
  }

  search(dir);
  return files;
}

/**
 * Programme principal
 */
async function main() {
  console.log('Détection des méthodes implémentées par les agents MCP...');

  // Créer le répertoire de rapport
  await fs.ensureDir(REPORT_DIR);

  // Trouver tous les fichiers d'agents
  console.log("Recherche des fichiers d'agents...");
  const packagesFiles = findTypeScriptFiles(PACKAGES_DIR);
  const agentFiles = findTypeScriptFiles(AGENTS_DIR);
  const allFiles = [...packagesFiles, ...agentFiles];

  console.log(`Trouvé ${allFiles.length} fichiers potentiels d'agents`);

  // Créer le programme TypeScript pour analyser les fichiers
  console.log('Création du compilateur TypeScript...');
  const program = createTypeScriptCompiler(allFiles);

  // Analyser chaque fichier
  console.log('Analyse des fichiers...');
  for (const filePath of allFiles) {
    const sourceFile = program.getSourceFile(filePath);
    if (sourceFile) {
      const analysis = analyzeAgentFile(sourceFile, program);
      if (analysis) {
        report.agentsAnalyzed++;
        report.agents.push(analysis);

        if (analysis.isAbstract) {
          report.abstractClasses++;
        }

        if (analysis.exportType === 'instance') {
          report.instanceExports++;
        } else if (analysis.exportType === 'class') {
          report.classExports++;
        } else {
          report.noExports++;
        }

        console.log(
          `  ✓ Analysé: ${analysis.className} (${analysis.implementedMethods.length} méthodes)`
        );
      }
    }
  }

  // Écriture du rapport
  console.log(`Génération du rapport dans ${REPORT_PATH}...`);
  await fs.writeJson(REPORT_PATH, report, { spaces: 2 });

  console.log("\nRésumé de l'analyse:");
  console.log(`  - Agents analysés: ${report.agentsAnalyzed}`);
  console.log(`  - Classes abstraites: ${report.abstractClasses}`);
  console.log(`  - Exports de classes: ${report.classExports}`);
  console.log(`  - Exports d'instances: ${report.instanceExports}`);
  console.log(`  - Sans exports: ${report.noExports}`);
  console.log(`\nRapport complet enregistré dans: ${REPORT_PATH}`);
}

// Exécuter le programme principal
main().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});
