import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  remixDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/frontend'),
  nestjsDir: path.join(process.cwd(), 'remix-nestjs-monorepo/apps/backend'),
  mcpDir: path.join(process.cwd(), 'apps/mcp-server'),
  outputWorkflowPath: path.join(process.cwd(), '.github/workflows/ci-migration.yml'),
  outputReportPath: path.join(process.cwd(), 'reports/ci_check_report.md'),
  outputLastRunPath: path.join(process.cwd(), 'reports/ci_last_run.json'),
  packageJsonPath: path.join(process.cwd(), 'package.json'),
  workspacePackages: [
    'remix-nestjs-monorepo/apps/frontend/package.json',
    'remix-nestjs-monorepo/apps/backend/package.json',
    'apps/mcp-server/package.json',
    'apps/frontend/package.json',
    'apps/backend/package.json',
  ]
};

// Types pour les résultats
interface CITest {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

interface PackageScripts {
  [packageName: string]: {
    [scriptName: string]: string;
  };
}

interface CIReport {
  status: 'success' | 'warning' | 'error';
  generatedFiles: string[];
  packageScripts: PackageScripts;
  detectedTests: CITest[];
  timestamp: string;
  logs: string[];
}

// Agent principal
export const ciTesterAgent = {
  name: 'ci-tester',
  description: 'Générateur de Pipeline CI GitHub pour monorepo NestJS + Remix',
  category: 'ci',
  
  async run(options?: { 
    generateWorkflow?: boolean;
    validateCurrentSetup?: boolean;
    installGitHubApps?: boolean;
  }): Promise<CIReport> {
    const logs: string[] = [];
    const report: CIReport = {
      status: 'success',
      generatedFiles: [],
      packageScripts: {},
      detectedTests: [],
      timestamp: new Date().toISOString(),
      logs: []
    };
    
    try {
      logs.push('🚀 Lancement de l\'agent ci-tester...');
      
      // Déterminer quelles actions exécuter
      const generateWorkflow = options?.generateWorkflow !== undefined 
        ? options.generateWorkflow 
        : true;
      
      const validateCurrentSetup = options?.validateCurrentSetup !== undefined 
        ? options.validateCurrentSetup 
        : true;
        
      const installGitHubApps = options?.installGitHubApps !== undefined 
        ? options.installGitHubApps 
        : false;
      
      // 1. Analyser les scripts disponibles dans package.json
      logs.push('🔍 Analyse des scripts disponibles dans package.json...');
      const packageScripts = await analyzePackageScripts();
      report.packageScripts = packageScripts;
      
      // 2. Détecter les tests et commandes CI à exécuter
      logs.push('🔍 Détection des tests et commandes CI...');
      const detectedTests = detectCITests(packageScripts);
      report.detectedTests = detectedTests;
      
      // Afficher les tests détectés
      if (detectedTests.length > 0) {
        logs.push(`✅ ${detectedTests.length} commandes CI détectées :`);
        detectedTests.forEach(test => {
          logs.push(`  - ${test.name}: \`${test.command}\` ${test.required ? '(Requis)' : '(Optionnel)'}`);
        });
      } else {
        logs.push('⚠️ Aucune commande CI détectée. Vérifiez vos scripts package.json.');
        report.status = 'warning';
      }
      
      // 3. Générer le fichier workflow GitHub Actions
      if (generateWorkflow) {
        logs.push('🔧 Génération du fichier workflow GitHub Actions...');
        const workflowContent = generateGitHubWorkflow(detectedTests);
        
        // Créer le répertoire .github/workflows s'il n'existe pas
        const workflowDir = path.dirname(CONFIG.outputWorkflowPath);
        if (!fs.existsSync(workflowDir)) {
          fs.mkdirSync(workflowDir, { recursive: true });
          logs.push(`📁 Création du répertoire ${workflowDir}`);
        }
        
        // Écrire le fichier workflow
        fs.writeFileSync(CONFIG.outputWorkflowPath, workflowContent);
        logs.push(`✅ Fichier workflow GitHub Actions généré : ${CONFIG.outputWorkflowPath}`);
        report.generatedFiles.push(CONFIG.outputWorkflowPath);
      }
      
      // 4. Valider la configuration actuelle
      if (validateCurrentSetup) {
        logs.push('🔍 Validation de la configuration actuelle...');
        const validationResults = validateSetup(detectedTests);
        
        const missingRequired = validationResults.filter(result => !result.present && result.test.required);
        
        if (missingRequired.length > 0) {
          logs.push('❌ Tests requis manquants :');
          missingRequired.forEach(result => {
            logs.push(`  - ${result.test.name}: \`${result.test.command}\` est requis mais non configuré`);
          });
          report.status = 'error';
        } else {
          logs.push('✅ Tous les tests requis sont configurés');
          
          const missingOptional = validationResults.filter(result => !result.present && !result.test.required);
          if (missingOptional.length > 0) {
            logs.push('⚠️ Tests optionnels manquants :');
            missingOptional.forEach(result => {
              logs.push(`  - ${result.test.name}: \`${result.test.command}\` est recommandé`);
            });
            
            if (report.status === 'success') {
              report.status = 'warning';
            }
          }
        }
      }
      
      // 5. Installer les GitHub Apps si demandé
      if (installGitHubApps) {
        logs.push('🔧 Installation des applications GitHub recommandées...');
        const appsToInstall = [
          { name: 'Codecov', url: 'https://github.com/apps/codecov' },
          { name: 'Dependabot', url: 'https://github.com/apps/dependabot' },
          { name: 'SonarCloud', url: 'https://github.com/apps/sonarcloud' }
        ];
        
        logs.push('Pour installer ces applications, veuillez visiter les liens suivants :');
        appsToInstall.forEach(app => {
          logs.push(`  - ${app.name}: ${app.url}`);
        });
        
        logs.push('⚠️ L\'installation automatique des GitHub Apps n\'est pas possible. Veuillez suivre les liens manuellement.');
      }
      
      // 6. Générer le rapport CI
      logs.push('📝 Génération du rapport CI...');
      await generateCIReport(report, logs);
      logs.push(`✅ Rapport CI généré : ${CONFIG.outputReportPath}`);
      report.generatedFiles.push(CONFIG.outputReportPath);
      
      // 7. Sauvegarder les informations de la dernière exécution
      const lastRunInfo = {
        timestamp: report.timestamp,
        status: report.status,
        detectedTests: report.detectedTests.length,
        requiredTestsConfigured: validateCurrentSetup 
          ? validateSetup(detectedTests).filter(r => r.test.required && r.present).length 
          : 'non vérifié',
        generatedFiles: report.generatedFiles
      };
      
      const lastRunDir = path.dirname(CONFIG.outputLastRunPath);
      if (!fs.existsSync(lastRunDir)) {
        fs.mkdirSync(lastRunDir, { recursive: true });
      }
      
      fs.writeFileSync(CONFIG.outputLastRunPath, JSON.stringify(lastRunInfo, null, 2));
      logs.push(`✅ Informations de dernière exécution sauvegardées : ${CONFIG.outputLastRunPath}`);
      report.generatedFiles.push(CONFIG.outputLastRunPath);
      
      // Résumé final
      logs.push(`\n📋 Résumé :`);
      logs.push(`  - Statut : ${report.status === 'success' ? '✅ Succès' : report.status === 'warning' ? '⚠️ Avertissement' : '❌ Erreur'}`);
      logs.push(`  - Tests détectés : ${report.detectedTests.length}`);
      logs.push(`  - Fichiers générés : ${report.generatedFiles.length}`);
      
      // Ajouter les logs au rapport final
      report.logs = logs;
      
      return report;
    } catch (error) {
      logs.push(`❌ Erreur lors de l'exécution de l'agent ci-tester: ${error.message}`);
      console.error(error);
      
      report.logs = logs;
      report.status = 'error';
      
      return report;
    }
  }
};

/**
 * Analyse les scripts disponibles dans les package.json
 */
async function analyzePackageScripts(): Promise<PackageScripts> {
  const result: PackageScripts = {};
  
  // Lire le package.json principal
  if (fs.existsSync(CONFIG.packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
      if (packageJson.scripts) {
        result.root = packageJson.scripts;
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du package.json principal: ${error.message}`);
    }
  }
  
  // Lire les package.json des workspaces
  for (const packageJsonPath of CONFIG.workspacePackages) {
    const fullPath = path.join(CONFIG.rootDir, packageJsonPath);
    if (fs.existsSync(fullPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (packageJson.scripts) {
          // Extraire le nom du package à partir du chemin
          const packageName = packageJsonPath.split('/').slice(-2)[0];
          result[packageName] = packageJson.scripts;
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture de ${packageJsonPath}: ${error.message}`);
      }
    }
  }
  
  return result;
}

/**
 * Détecte les commandes CI à exécuter en fonction des scripts disponibles
 */
function detectCITests(packageScripts: PackageScripts): CITest[] {
  const tests: CITest[] = [];
  
  // Ajouter les commandes de base toujours présentes
  tests.push({
    name: 'Installation des dépendances',
    command: 'npm ci || npm install',
    description: 'Installation des dépendances du projet',
    required: true
  });
  
  // Vérifier les scripts de lint
  if (hasScript(packageScripts, 'lint')) {
    tests.push({
      name: 'Lint du code',
      command: 'npm run lint',
      description: 'Vérification du style de code avec ESLint',
      required: true
    });
  } else if (hasScript(packageScripts, 'lint:check') || hasScript(packageScripts, 'eslint')) {
    const lintCommand = hasScript(packageScripts, 'lint:check') ? 'npm run lint:check' : 'npm run eslint';
    tests.push({
      name: 'Lint du code',
      command: lintCommand,
      description: 'Vérification du style de code avec ESLint',
      required: true
    });
  }
  
  // Vérifier les scripts de TypeScript
  tests.push({
    name: 'Vérification TypeScript',
    command: 'npx tsc --noEmit',
    description: 'Vérification des types TypeScript sans génération de code',
    required: true
  });
  
  // Vérifier les scripts de build
  if (hasWorkspaces(packageScripts)) {
    tests.push({
      name: 'Build du projet',
      command: 'npm run build --workspaces',
      description: 'Compilation du frontend et backend',
      required: true
    });
  } else if (hasScript(packageScripts, 'build')) {
    tests.push({
      name: 'Build du projet',
      command: 'npm run build',
      description: 'Compilation du projet',
      required: true
    });
  } else {
    const buildCommands = [];
    
    if (hasScript(packageScripts, 'build:frontend') || hasPackageScript(packageScripts, 'frontend', 'build')) {
      buildCommands.push(hasScript(packageScripts, 'build:frontend') ? 'npm run build:frontend' : 'npm run build -w frontend');
    }
    
    if (hasScript(packageScripts, 'build:backend') || hasPackageScript(packageScripts, 'backend', 'build')) {
      buildCommands.push(hasScript(packageScripts, 'build:backend') ? 'npm run build:backend' : 'npm run build -w backend');
    }
    
    if (buildCommands.length > 0) {
      tests.push({
        name: 'Build du projet',
        command: buildCommands.join(' && '),
        description: 'Compilation du frontend et backend',
        required: true
      });
    }
  }
  
  // Vérifier les scripts de test
  if (hasScript(packageScripts, 'test')) {
    tests.push({
      name: 'Tests unitaires',
      command: 'npm test',
      description: 'Exécution des tests unitaires',
      required: true
    });
  } else {
    const testCommands = [];
    
    if (hasScript(packageScripts, 'test:backend') || hasPackageScript(packageScripts, 'backend', 'test')) {
      testCommands.push(hasScript(packageScripts, 'test:backend') ? 'npm run test:backend' : 'npm test -w backend');
    }
    
    if (hasScript(packageScripts, 'test:frontend') || hasPackageScript(packageScripts, 'frontend', 'test')) {
      testCommands.push(hasScript(packageScripts, 'test:frontend') ? 'npm run test:frontend' : 'npm test -w frontend');
    }
    
    if (testCommands.length > 0) {
      tests.push({
        name: 'Tests unitaires',
        command: testCommands.join(' && '),
        description: 'Exécution des tests unitaires',
        required: true
      });
    }
  }
  
  // Vérifier les scripts de test e2e
  if (hasScript(packageScripts, 'test:e2e')) {
    tests.push({
      name: 'Tests end-to-end',
      command: 'npm run test:e2e',
      description: 'Exécution des tests end-to-end',
      required: false
    });
  } else if (hasPackageScript(packageScripts, 'frontend', 'test:e2e') || hasPackageScript(packageScripts, 'backend', 'test:e2e')) {
    const e2eCommands = [];
    
    if (hasPackageScript(packageScripts, 'frontend', 'test:e2e')) {
      e2eCommands.push('npm run test:e2e -w frontend');
    }
    
    if (hasPackageScript(packageScripts, 'backend', 'test:e2e')) {
      e2eCommands.push('npm run test:e2e -w backend');
    }
    
    if (e2eCommands.length > 0) {
      tests.push({
        name: 'Tests end-to-end',
        command: e2eCommands.join(' && '),
        description: 'Exécution des tests end-to-end',
        required: false
      });
    }
  }
  
  // Vérifier si Prisma est utilisé
  if (fs.existsSync(path.join(CONFIG.rootDir, 'prisma/schema.prisma'))) {
    tests.push({
      name: 'Vérification des migrations Prisma',
      command: 'npx prisma validate && npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations-directory prisma/migrations --exit-code',
      description: 'Validation du schéma Prisma et vérification des migrations',
      required: false
    });
  }
  
  // Vérifier si des tests de sécurité sont disponibles
  if (hasScript(packageScripts, 'security') || hasScript(packageScripts, 'audit')) {
    const securityCommand = hasScript(packageScripts, 'security') ? 'npm run security' : 'npm run audit';
    tests.push({
      name: 'Audit de sécurité',
      command: securityCommand,
      description: 'Vérification des vulnérabilités de sécurité',
      required: false
    });
  } else {
    tests.push({
      name: 'Audit de sécurité',
      command: 'npm audit --production --audit-level=high',
      description: 'Vérification des vulnérabilités de sécurité',
      required: false
    });
  }
  
  return tests;
}

/**
 * Vérifie si un script existe dans un des packages
 */
function hasScript(packageScripts: PackageScripts, scriptName: string): boolean {
  for (const packageName in packageScripts) {
    if (packageScripts[packageName][scriptName]) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifie si un script existe dans un package spécifique
 */
function hasPackageScript(packageScripts: PackageScripts, packageName: string, scriptName: string): boolean {
  return packageScripts[packageName] && packageScripts[packageName][scriptName] !== undefined;
}

/**
 * Vérifie si le projet utilise des workspaces npm
 */
function hasWorkspaces(packageScripts: PackageScripts): boolean {
  if (!fs.existsSync(CONFIG.packageJsonPath)) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
    return !!packageJson.workspaces;
  } catch (error) {
    return false;
  }
}

/**
 * Valide la configuration actuelle
 */
function validateSetup(tests: CITest[]): Array<{ test: CITest; present: boolean }> {
  return tests.map(test => {
    // Pour simplifier, on considère que le test est présent si le script existe
    const commandParts = test.command.split('&&').map(cmd => cmd.trim());
    const firstCommand = commandParts[0];
    
    if (firstCommand.startsWith('npm run ')) {
      const scriptName = firstCommand.replace('npm run ', '').split(' ')[0];
      return { test, present: hasScript(CONFIG.packageScripts, scriptName) };
    } else if (firstCommand.includes('-w ')) {
      const parts = firstCommand.split('-w ');
      const packageName = parts[1].split(' ')[0];
      const scriptName = parts[0].includes('run ') 
        ? parts[0].split('run ')[1].trim() 
        : parts[0].split('npm ')[1].trim();
      
      return { test, present: hasPackageScript(CONFIG.packageScripts, packageName, scriptName) };
    } else if (firstCommand.startsWith('npx ')) {
      // Pour les commandes npx, on vérifie si le package est installé
      const packageName = firstCommand.split('npx ')[1].split(' ')[0];
      
      try {
        execSync(`npm list ${packageName} || npm list -g ${packageName}`, { stdio: 'ignore' });
        return { test, present: true };
      } catch (error) {
        return { test, present: false };
      }
    }
    
    // Par défaut, on considère que le test est présent
    return { test, present: true };
  });
}

/**
 * Génère le fichier workflow GitHub Actions
 */
function generateGitHubWorkflow(tests: CITest[]): string {
  const workflow = `name: CI Migration Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-test-validate:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout repo
      uses: actions/checkout@v4

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'

${tests.map(test => `    - name: ${test.name}
      run: ${test.command}`).join('\n\n')}

    - name: Notify on Success
      if: success()
      uses: actions/github-script@v6
      with:
        github-token: \${{ secrets.GITHUB_TOKEN }}
        script: |
          const { issue, repo } = context;
          if (context.payload.pull_request) {
            github.rest.issues.createComment({
              issue_number: issue.number,
              owner: repo.owner,
              repo: repo.repo,
              body: '✅ CI Pipeline a réussi! Tous les tests et vérifications sont passés.'
            });
            github.rest.issues.addLabels({
              issue_number: issue.number,
              owner: repo.owner,
              repo: repo.repo,
              labels: ['ci:passed']
            });
          }

    - name: Notify on Failure
      if: failure()
      uses: actions/github-script@v6
      with:
        github-token: \${{ secrets.GITHUB_TOKEN }}
        script: |
          const { issue, repo } = context;
          if (context.payload.pull_request) {
            github.rest.issues.createComment({
              issue_number: issue.number,
              owner: repo.owner,
              repo: repo.repo,
              body: '❌ CI Pipeline a échoué! Veuillez consulter les logs pour plus de détails.'
            });
            github.rest.issues.addLabels({
              issue_number: issue.number,
              owner: repo.owner,
              repo: repo.repo,
              labels: ['ci:failed']
            });
          }
`;

  return workflow;
}

/**
 * Génère le rapport CI
 */
async function generateCIReport(report: CIReport, logs: string[]): Promise<void> {
  // Créer le répertoire de rapports s'il n'existe pas
  const reportsDir = path.dirname(CONFIG.outputReportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Récupérer la date pour le rapport
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Générer le contenu du rapport au format Markdown
  let reportContent = `# Rapport de CI - ${dateStr}\n\n`;
  
  // Ajouter un résumé
  reportContent += `## 📊 Résumé\n\n`;
  reportContent += `| État | Tests détectés | Fichiers générés |\n`;
  reportContent += `|------|----------------|-------------------|\n`;
  reportContent += `| ${report.status === 'success' ? '✅ Succès' : report.status === 'warning' ? '⚠️ Avertissement' : '❌ Erreur'} | ${report.detectedTests.length} | ${report.generatedFiles.length} |\n\n`;
  
  // Ajouter les tests détectés
  reportContent += `## 🧪 Tests CI détectés\n\n`;
  reportContent += `| Nom | Commande | Description | Requis |\n`;
  reportContent += `|-----|----------|-------------|--------|\n`;
  
  for (const test of report.detectedTests) {
    reportContent += `| ${test.name} | \`${test.command}\` | ${test.description} | ${test.required ? '✅' : '⚠️'} |\n`;
  }
  
  reportContent += `\n`;
  
  // Ajouter les scripts de package détectés
  reportContent += `## 📦 Scripts package.json détectés\n\n`;
  
  for (const packageName in report.packageScripts) {
    reportContent += `### Package: ${packageName}\n\n`;
    reportContent += `| Script | Commande |\n`;
    reportContent += `|--------|----------|\n`;
    
    for (const scriptName in report.packageScripts[packageName]) {
      reportContent += `| ${scriptName} | \`${report.packageScripts[packageName][scriptName]}\` |\n`;
    }
    
    reportContent += `\n`;
  }
  
  // Ajouter les fichiers générés
  reportContent += `## 📄 Fichiers générés\n\n`;
  for (const filePath of report.generatedFiles) {
    reportContent += `- \`${filePath}\`\n`;
  }
  
  reportContent += `\n`;
  
  // Ajouter les recommandations
  reportContent += `## 🧰 Recommandations\n\n`;
  
  if (report.status === 'error') {
    reportContent += `⚠️ **Attention**: Certains tests requis ne sont pas configurés. Veuillez les configurer pour assurer la qualité du code.\n\n`;
  } else if (report.status === 'warning') {
    reportContent += `⚠️ **Attention**: Certains tests optionnels ne sont pas configurés. Il est recommandé de les configurer pour améliorer la qualité du code.\n\n`;
  }
  
  reportContent += `### Pour GitHub Actions\n\n`;
  reportContent += `- Assurez-vous d'avoir activé GitHub Actions dans les paramètres de votre dépôt\n`;
  reportContent += `- Vérifiez que les secrets nécessaires sont configurés, notamment \`GITHUB_TOKEN\`\n`;
  reportContent += `- Considérez l'ajout d'applications GitHub comme Codecov, Dependabot et SonarCloud\n\n`;
  
  reportContent += `### Pour les tests\n\n`;
  reportContent += `- Assurez-vous que tous les tests passent localement avant de pousser vers GitHub\n`;
  reportContent += `- Ajoutez des tests unitaires pour les nouvelles fonctionnalités\n`;
  reportContent += `- Considérez l'ajout de tests d'intégration et end-to-end\n\n`;
  
  // Ajouter les logs
  reportContent += `## 📋 Logs\n\n`;
  reportContent += "```\n";
  reportContent += logs.join('\n');
  reportContent += "\n```\n";
  
  // Ajouter un pied de page
  reportContent += `\n---\n\n`;
  reportContent += `Rapport généré le ${now.toLocaleString()} par l'agent ci-tester.\n`;
  
  // Écrire le rapport dans un fichier
  fs.writeFileSync(CONFIG.outputReportPath, reportContent);
}

// Exporter les fonctions pour les tests et la réutilisation
export {
  analyzePackageScripts,
  detectCITests,
  validateSetup,
  generateGitHubWorkflow,
  generateCIReport,
  CONFIG
};

// Exécution directe si appelé comme script
if (require.main === module) {
  const options = {
    generateWorkflow: !process.argv.includes('--no-workflow'),
    validateCurrentSetup: !process.argv.includes('--no-validate'),
    installGitHubApps: process.argv.includes('--install-github-apps')
  };
  
  ciTesterAgent.run(options)
    .then(result => {
      console.log(result.logs.join('\n'));
      process.exit(result.status === 'success' ? 0 : result.status === 'warning' ? 1 : 2);
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(2);
    });
}