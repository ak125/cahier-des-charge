import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { CIReport, CITest, PackageScripts } from './types';

const execAsync = promisify(exec);

/**
 * Détecte les tests CI disponibles dans le projet
 * @returns Liste des tests CI détectés
 */
export async function detectCITests(rootDir: string = process.cwd()): Promise<CITest[]> {
  const tests: CITest[] = [];
  const packageJsonPath = path.join(rootDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`⚠️ Aucun fichier package.json trouvé dans ${rootDir}`);
    return tests;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};

    // Tests unitaires
    if (scripts.test) {
      tests.push({
        name: 'Tests Unitaires',
        command: 'npm test',
        description: 'Exécute les tests unitaires avec la commande configurée dans package.json',
        required: true,
      });
    }

    // ESLint
    if (
      scripts.lint ||
      fs.existsSync(path.join(rootDir, '.eslintrc')) ||
      fs.existsSync(path.join(rootDir, '.eslintrc.js')) ||
      fs.existsSync(path.join(rootDir, '.eslintrc.json'))
    ) {
      tests.push({
        name: 'Linting (ESLint)',
        command: scripts.lint || 'npx eslint .',
        description: 'Vérifie la qualité du code avec ESLint',
        required: false,
      });
    }

    // TypeScript
    if (
      scripts['typecheck'] ||
      scripts['check-types'] ||
      fs.existsSync(path.join(rootDir, 'tsconfig.json'))
    ) {
      tests.push({
        name: 'Vérification TypeScript',
        command: scripts['typecheck'] || scripts['check-types'] || 'npx tsc --noEmit',
        description: 'Vérifie les types TypeScript',
        required: fs.existsSync(path.join(rootDir, 'tsconfig.json')),
      });
    }

    // Prettier
    if (
      scripts['format'] ||
      scripts['prettier'] ||
      fs.existsSync(path.join(rootDir, '.prettierrc')) ||
      fs.existsSync(path.join(rootDir, '.prettierrc.js')) ||
      fs.existsSync(path.join(rootDir, '.prettierrc.json'))
    ) {
      tests.push({
        name: 'Formatage (Prettier)',
        command:
          scripts['format'] ||
          scripts['prettier'] ||
          'npx prettier --check "**/*.{js,ts,tsx,json,md}"',
        description: 'Vérifie le formatage du code avec Prettier',
        required: false,
      });
    }

    // Build
    if (scripts.build) {
      tests.push({
        name: 'Build',
        command: 'npm run build',
        description: 'Compile le projet',
        required: true,
      });
    }

    return tests;
  } catch (error) {
    console.error(`⚠️ Erreur lors de l'analyse du package.json: ${error}`);
    return tests;
  }
}

/**
 * Valide le setup actuel des tests CI en vérifiant si les scripts nécessaires sont présents
 * @param tests Liste des tests à valider
 * @param packageScripts Scripts disponibles dans les package.json
 * @returns Résultats de validation pour chaque test
 */
export function validateSetup(
  tests: CITest[],
  packageScripts: PackageScripts
): Array<{ test: CITest; present: boolean }> {
  return tests.map((test) => {
    const commandParts = test.command.split(' ');
    let present = false;

    if (commandParts[0] === 'npm' && commandParts[1] === 'run') {
      // Cherche le script dans n'importe quel package
      const scriptName = commandParts[2];
      present = Object.values(packageScripts).some((pkg) => Object.keys(pkg).includes(scriptName));
    } else if (commandParts[0] === 'npm' && commandParts[1] === 'test') {
      // Cherche si test existe
      present = Object.values(packageScripts).some((pkg) => Object.keys(pkg).includes('test'));
    } else if (commandParts[0] === 'npx') {
      // Vérifie si le binaire existe dans node_modules/.bin
      try {
        const binPath = path.join(process.cwd(), 'node_modules', '.bin', commandParts[1]);
        present = fs.existsSync(binPath);
      } catch (error) {
        present = false;
      }
    } else {
      // Commande système, suppose qu'elle existe
      present = true;
    }

    return { test, present };
  });
}

/**
 * Génère un workflow GitHub Actions pour les tests CI
 * @param tests Liste des tests à inclure dans le workflow
 * @param outputPath Chemin de sortie pour le workflow
 * @param branches Branches sur lesquelles exécuter le workflow
 * @returns Chemin du fichier généré
 */
export function generateGitHubWorkflow(
  tests: CITest[],
  outputPath = 'DoDoDoDoDoDotgithub/workflows/ci.yml',
  branches: { push: string[]; pullRequest: string[] } = { push: ['main'], pullRequest: ['*'] }
): string {
  const workflowDir = path.dirname(outputPath);
  const fullWorkflowDir = path.join(process.cwd(), workflowDir);

  if (!fs.existsSync(fullWorkflowDir)) {
    fs.mkdirSync(fullWorkflowDir, { recursive: true });
  }

  const workflow = `# Workflow CI généré automatiquement parDoDotmcp-agents-ci-tester
name: CI Tests

on:
  push:
    branches: [${branches.push.map((b) => `'${b}'`).join(', ')}]
  pull_request:
    branches: [${branches.pullRequest.map((b) => `'${b}'`).join(', ')}]

jobs:
  test:
    name: Tests CI
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configuration de Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Installation des dépendances
        run: npm ci
      
${tests
  .map(
    (test) => `      - name: ${test.name}
        run: ${test.command}`
  )
  .join('\n\n')}
`;

  const fullOutputPath = path.join(process.cwd(), outputPath);
  fs.writeFileSync(fullOutputPath, workflow);

  return fullOutputPath;
}

/**
 * Analyse les scripts disponibles dans les package.json du projet
 * @param workspacePackages Chemins des packages (pour les monorepos)
 * @returns Scripts disponibles dans les package.json
 */
export async function analyzePackageScripts(
  workspacePackages: string[] = []
): Promise<PackageScripts> {
  const scripts: PackageScripts = {};
  const rootPackagePath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(rootPackagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      scripts['root'] = packageJson.scripts || {};
    } catch (error) {
      console.error(`⚠️ Erreur lors de la lecture du package.json racine: ${error}`);
    }
  }

  // Analyser les packages de l'espace de travail
  if (workspacePackages.length > 0) {
    for (const pkg of workspacePackages) {
      const packageJsonPath = path.join(process.cwd(), pkg, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const packageName = packageJson.name || path.basename(pkg);
          scripts[packageName] = packageJson.scripts || {};
        } catch (error) {
          console.error(`⚠️ Erreur lors de la lecture du package.json de ${pkg}: ${error}`);
        }
      }
    }
  }

  return scripts;
}

/**
 * Génère un rapport détaillé sur les tests CI
 * @param options Options pour la génération du rapport
 * @returns Rapport complet sur la configuration CI
 */
export function generateCIReport(options: {
  detectedTests: CITest[];
  customTests?: CITest[];
  packageScripts: PackageScripts;
  generatedFiles: string[];
  logs: string[];
  status: 'success' | 'warning' | 'error';
}): CIReport {
  return {
    status: options.status,
    detectedTests: options.detectedTests,
    customTests: options.customTests || [],
    packageScripts: options.packageScripts,
    generatedFiles: options.generatedFiles,
    timestamp: new Date().toISOString(),
    logs: options.logs,
  };
}
