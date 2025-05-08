#!/usr/bin/env ts-node

import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';
import * as ts from 'typescriptstructure-agent';

// Configuration
const PACKAGES_DIR = '/workspaces/cahier-des-charge/packagesDoDotmcp-agents';
const AGENTS_DIR = '/workspaces/cahier-des-charge/agents';
const REPORT_DIR = '/workspaces/cahier-des-charge/reports/validation';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_FILE = path.join(REPORT_DIR, `interface-validation-${TIMESTAMP}.md`);

// Structure des interfaces et méthodes requises
const REQUIRED_METHODS = {
  BaseAgent: [
    'initialize',
    'validate',
    'execute',
    'run',
    'cancel',
    'getStatus',
    'getLastResult',
    'getMetrics',
  ],
  BusinessAgent: ['process', 'validateInput', 'formatOutput'],
  OrchestrationAgent: ['orchestrate', 'registerAgent', 'unregisterAgent', 'getRegisteredAgents'],
  CoordinationAgent: ['coordinate', 'connect', 'disconnect'],
  AnalyzerAgent: ['analyze', 'getAnalysisReport'],
  GeneratorAgent: ['generate', 'getGenerationOptions'],
  ValidatorAgent: ['validateData', 'getValidationRules'],
  MonitorAgent: ['monitor', 'getMonitoringStatus'],
  OrchestratorAgent: ['manageWorkflow', 'getWorkflowStatus'],
  SchedulerAgent: ['schedule', 'reschedule', 'cancel'],
  BridgeAgent: ['bridge', 'translate'],
  AdapterAgent: ['adapt', 'getCompatibilityInfo'],
  RegistryAgent: ['register', 'unregister', 'lookup'],
  ParserAgent: ['parse', 'getParsingOptions'],
};

// Statistiques pour le rapport
const stats = {
  total: 0,
  compliant: 0,
  nonCompliant: 0,
  details: {} as Record<
    string,
    {
      implements: string[];
      missingMethods: Record<string, string[]>;
      isCompliant: boolean;
    }
  >,
};

// Assurez-vous que le répertoire de rapport existe
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * Analyser le fichier TypeScript et vérifier les implémentations d'interfaces
 */
function analyzeFile(filePath: string) {
  stats.total++;

  console.log(`Analyse de ${filePath}`);

  try {
    // Lire le fichier
    const content = fs.readFileSync(filePath, 'utf8');

    // Créer un programme TypeScript
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    // Rechercher les déclarations de classe
    const classes: ts.ClassDeclaration[] = [];

    function visitNode(node: ts.Node) {
      if (ts.isClassDeclaration(node)) {
        classes.push(node);
      }
      ts.forEachChild(node, visitNode);
    }

    visitNode(sourceFile);

    // Si pas de classe, ignorer ce fichier
    if (classes.length === 0) {
      console.log(`  Aucune classe trouvée dans ${filePath}`);
      return;
    }

    // Vérifier chaque classe
    classes.forEach((classDecl) => {
      const className = classDecl.name ? classDecl.name.text : 'AnonymousClass';

      // Obtenir les clauses "implements"
      const implementedInterfaces: string[] = [];

      if (classDecl.heritageClauses) {
        classDecl.heritageClauses.forEach((clause) => {
          if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
            clause.types.forEach((type) => {
              // Obtenir juste le nom de l'interface (pas les paramètres de type)
              const interfaceName = type.expression.getText(sourceFile);
              implementedInterfaces.push(interfaceName);
            });
          }
        });
      }

      // Si pas d'interfaces implémentées, ignorer cette classe
      if (implementedInterfaces.length === 0) {
        console.log(`  La classe ${className} n'implémente aucune interface`);
        return;
      }

      // Obtenir toutes les méthodes de la classe
      const classMethods: string[] = [];

      classDecl.members.forEach((member) => {
        if (ts.isMethodDeclaration(member) && member.name) {
          classMethods.push(member.name.getText(sourceFile));
        }
      });

      // Vérifier les méthodes manquantes pour chaque interface
      const missingMethods: Record<string, string[]> = {};
      let hasAllMethods = true;

      implementedInterfaces.forEach((interfaceName) => {
        // Nettoyer le nom de l'interface (par exemple BaseAgent<any>)
        const cleanInterfaceName = interfaceName.replace(/<.*>$/, '');

        // Vérifier si l'interface est connue
        if (REQUIRED_METHODS[cleanInterfaceName]) {
          const requiredMethods = REQUIRED_METHODS[cleanInterfaceName];
          const missing = requiredMethods.filter((method) => !classMethods.includes(method));

          if (missing.length > 0) {
            missingMethods[cleanInterfaceName] = missing;
            hasAllMethods = false;
          }
        }
      });

      // Enregistrer les statistiques
      stats.details[`${filePath}:${className}`] = {
        implements: implementedInterfaces,
        missingMethods,
        isCompliant: hasAllMethods,
      };

      // Mettre à jour les compteurs
      if (hasAllMethods) {
        stats.compliant++;
        console.log(
          `  ✓ La classe ${className} implémente correctement toutes les méthodes requises`
        );
      } else {
        stats.nonCompliant++;
        console.log(`  ✗ La classe ${className} n'implémente pas toutes les méthodes requises`);

        // Afficher les méthodes manquantes
        Object.entries(missingMethods).forEach(([interfaceName, methods]) => {
          console.log(`    Interface ${interfaceName}: méthodes manquantes: ${methods.join(', ')}`);
        });
      }
    });
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}:`, error);
  }
}

/**
 * Trouver tous les fichiers d'agents
 */
function findAgentFiles(dirs: string[]): string[] {
  const agentFiles: string[] = [];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Le répertoire ${dir} n'existe pas.`);
      return;
    }

    // Fonction récursive pour parcourir les dossiers
    const findFiles = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);

      files.forEach((file) => {
        const filePath = path.join(currentDir, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
          findFiles(filePath);
        } else if (
          file.endsWith('.ts') &&
          !file.endsWith('.test.ts') &&
          !file.endsWith('.spec.ts')
        ) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Vérifier si c'est un fichier agent (contient une classe et le mot "Agent" ou "implements")
          if (
            (content.includes('class') &&
              (content.includes('Agent') || content.toLowerCase().includes('agent'))) ||
            content.includes('implements')
          ) {
            agentFiles.push(filePath);
          }
        }
      });
    };

    try {
      findFiles(dir);
    } catch (error) {
      console.error(`Erreur lors de la recherche dans ${dir}:`, error);
    }
  });

  return agentFiles;
}

/**
 * Générer un rapport de validation
 */
function generateReport() {
  let report = `# Rapport de validation des implémentations d'interfaces - ${new Date().toISOString()}\n\n`;

  report += '## Résumé\n\n';
  report += `- Total des fichiers traités: ${stats.total}\n`;
  report += `- Classes conformes: ${stats.compliant}\n`;
  report += `- Classes non conformes: ${stats.nonCompliant}\n\n`;

  report += '## Détails\n\n';

  Object.entries(stats.details).forEach(([classId, details]) => {
    const [filePath, className] = classId.split(':');

    report += `### ${className} (${filePath})\n\n`;
    report += `- Interfaces implémentées: ${details.implements.join(', ')}\n`;

    if (details.isCompliant) {
      report += '- ✅ Toutes les méthodes requises sont implémentées\n\n';
    } else {
      report += '- ❌ Méthodes manquantes:\n';

      Object.entries(details.missingMethods).forEach(([interfaceName, methods]) => {
        report += `  - ${interfaceName}: ${methods.join(', ')}\n`;
      });

      report += '\n';
    }
  });

  // Écrire le rapport dans un fichier
  fs.writeFileSync(REPORT_FILE, report);

  console.log(`\nRapport généré: ${REPORT_FILE}`);
}

// Programme principal
async function main() {
  console.log("Validation des implémentations d'interfaces...");

  // Trouver tous les fichiers d'agents
  const agentFiles = findAgentFiles([PACKAGES_DIR, AGENTS_DIR]);

  console.log(`Trouvé ${agentFiles.length} fichiers d'agents.`);

  // Analyser chaque fichier
  agentFiles.forEach(analyzeFile);

  // Générer le rapport
  generateReport();

  console.log('\nValidation terminée!');
  console.log(`Classes conformes: ${stats.compliant}/${stats.total}`);
  console.log(`Classes non conformes: ${stats.nonCompliant}/${stats.total}`);
}

// Exécuter le programme principal
main().catch((err) => {
  console.error('Erreur non gérée:', err);
});
