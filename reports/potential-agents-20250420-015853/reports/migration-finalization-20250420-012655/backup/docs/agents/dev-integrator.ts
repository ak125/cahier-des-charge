// filepath: /workspaces/cahier-des-charge/agents/dev-integrator.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as glob from 'glob';

// Types pour l'agent
interface IntegratorContext {
  feature?: string;
  component?: string;
  all?: boolean;
  autoFix?: boolean;
  generateReport?: boolean;
  targetBranch?: string;
}

interface IntegrationResult {
  name: string;
  type: 'feature' | 'component' | 'route' | 'api';
  status: 'ready' | 'conflits' | 'incomplet' | 'erreur';
  files: string[];
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  lintIssues: string[];
  typeIssues: string[];
  buildIssues: string[];
  missingDependencies: string[];
  conflitsFichiers: string[];
  remediationSuggestions?: string[];
  integrationDate: string;
}

interface IntegratorIndex {
  lastUpdated: string;
  totalIntegrations: number;
  readyCount: number;
  conflitsCount: number;
  incompletCount: number;
  erreurCount: number;
  features: {
    [featureName: string]: {
      status: 'ready' | 'conflits' | 'incomplet' | 'erreur';
      integrationDate: string;
      reportPath: string;
    };
  };
}

export const devIntegratorAgent = {
  name: 'dev-integrator',
  description: 'Assiste dans l\'intégration des nouvelles fonctionnalités au projet principal',
  category: 'development',
  
  async run(context: IntegratorContext) {
    const logs: string[] = [];
    let elementsToIntegrate: string[] = [];
    
    try {
      logs.push(`🚀 Démarrage de l'agent d'intégration`);
      
      // Déterminer quels éléments intégrer
      if (context.feature) {
        // Intégrer une fonctionnalité spécifique
        const featurePath = this.resolveFeaturePath(context.feature);
        if (fs.existsSync(featurePath)) {
          elementsToIntegrate = [featurePath];
          logs.push(`📦 Fonctionnalité à intégrer: ${featurePath}`);
        } else {
          logs.push(`❌ Fonctionnalité non trouvée: ${featurePath}`);
          return { status: 'error', logs, error: `Fonctionnalité non trouvée: ${featurePath}` };
        }
      } else if (context.component) {
        // Intégrer un composant spécifique
        const componentPath = this.resolveComponentPath(context.component);
        if (fs.existsSync(componentPath)) {
          elementsToIntegrate = [componentPath];
          logs.push(`🧩 Composant à intégrer: ${componentPath}`);
        } else {
          logs.push(`❌ Composant non trouvé: ${componentPath}`);
          return { status: 'error', logs, error: `Composant non trouvé: ${componentPath}` };
        }
      } else if (context.all) {
        // Intégrer toutes les fonctionnalités en attente
        const pendingFeatures = this.findPendingFeatures();
        elementsToIntegrate = pendingFeatures;
        logs.push(`🔍 Intégration de toutes les fonctionnalités en attente: ${pendingFeatures.length} trouvées`);
      } else {
        logs.push(`❓ Aucune fonctionnalité ou composant spécifié, veuillez fournir une fonctionnalité, un composant ou activer le mode 'all'`);
        return { status: 'error', logs, error: 'Aucune fonctionnalité ou composant spécifié' };
      }
      
      if (elementsToIntegrate.length === 0) {
        logs.push(`✅ Aucun élément à intégrer`);
        return { status: 'success', logs, message: 'Aucun élément à intégrer' };
      }
      
      // Préparation pour stocker tous les résultats
      const results: IntegrationResult[] = [];
      let readyCount = 0;
      let conflitsCount = 0;
      let incompletCount = 0;
      let erreurCount = 0;
      
      // Intégration de chaque élément
      for (const element of elementsToIntegrate) {
        logs.push(`\n🔄 Intégration de: ${element}`);
        
        try {
          // Vérifier la présence de tous les fichiers nécessaires
          const filesCheck = this.checkRequiredFiles(element);
          if (!filesCheck.success) {
            logs.push(`⚠️ Fichiers manquants: ${filesCheck.missing.join(', ')}`);
            
            const result: IntegrationResult = {
              name: path.basename(element),
              type: this.determineElementType(element),
              status: 'incomplet',
              files: filesCheck.found,
              tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
              lintIssues: [],
              typeIssues: [],
              buildIssues: [],
              missingDependencies: [],
              conflitsFichiers: [],
              remediationSuggestions: [`Ajouter les fichiers manquants: ${filesCheck.missing.join(', ')}`],
              integrationDate: new Date().toISOString()
            };
            
            results.push(result);
            incompletCount++;
            continue;
          }
          
          // Exécuter les tests
          const testResults = await this.runTests(element);
          logs.push(`🧪 Tests: ${testResults.passed}/${testResults.total} réussis, ${testResults.failed} échoués, ${testResults.skipped} ignorés`);
          
          // Vérifier les problèmes de lint
          const lintIssues = await this.checkLintIssues(element);
          if (lintIssues.length > 0) {
            logs.push(`🔍 ${lintIssues.length} problèmes de lint détectés`);
          }
          
          // Vérifier les problèmes de typage
          const typeIssues = await this.checkTypeIssues(element);
          if (typeIssues.length > 0) {
            logs.push(`📝 ${typeIssues.length} problèmes de typage détectés`);
          }
          
          // Vérifier si le build passe
          const buildIssues = await this.checkBuild(element);
          if (buildIssues.length > 0) {
            logs.push(`🏗️ Problèmes de build détectés`);
          }
          
          // Vérifier les dépendances manquantes
          const missingDeps = this.checkDependencies(element);
          if (missingDeps.length > 0) {
            logs.push(`📦 Dépendances manquantes: ${missingDeps.join(', ')}`);
          }
          
          // Vérifier les conflits potentiels avec la branche cible
          const conflits = await this.checkConflits(element, context.targetBranch || 'main');
          if (conflits.length > 0) {
            logs.push(`⚠️ Conflits potentiels détectés dans ${conflits.length} fichiers`);
          }
          
          // Déterminer le statut global
          let status: 'ready' | 'conflits' | 'incomplet' | 'erreur' = 'ready';
          if (conflits.length > 0) {
            status = 'conflits';
          } else if (testResults.failed > 0 || lintIssues.length > 0 || typeIssues.length > 0 || buildIssues.length > 0 || missingDeps.length > 0) {
            status = 'incomplet';
          }
          
          // Créer le résultat d'intégration
          const result: IntegrationResult = {
            name: path.basename(element),
            type: this.determineElementType(element),
            status,
            files: filesCheck.found,
            tests: testResults,
            lintIssues,
            typeIssues,
            buildIssues,
            missingDependencies: missingDeps,
            conflitsFichiers: conflits,
            remediationSuggestions: this.generateRemediationSuggestions({
              lintIssues, 
              typeIssues, 
              buildIssues, 
              missingDeps, 
              conflits
            }),
            integrationDate: new Date().toISOString()
          };
          
          results.push(result);
          
          // Mettre à jour les compteurs
          if (status === 'ready') readyCount++;
          else if (status === 'conflits') conflitsCount++;
          else if (status === 'incomplet') incompletCount++;
          else if (status === 'erreur') erreurCount++;
          
          // Appliquer les corrections automatiques si demandé
          if (context.autoFix && status !== 'ready') {
            await this.attemptAutoFix(result, logs);
          }
          
          // Sauvegarder le rapport d'intégration
          this.saveIntegrationReport(result);
          logs.push(`💾 Rapport d'intégration sauvegardé pour ${result.name}`);
        } catch (err: any) {
          logs.push(`❌ Erreur lors de l'intégration de ${element}: ${err.message}`);
          erreurCount++;
          
          results.push({
            name: path.basename(element),
            type: this.determineElementType(element),
            status: 'erreur',
            files: [],
            tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
            lintIssues: [],
            typeIssues: [],
            buildIssues: [err.message],
            missingDependencies: [],
            conflitsFichiers: [],
            remediationSuggestions: ['Vérifier les logs pour plus de détails sur l\'erreur'],
            integrationDate: new Date().toISOString()
          });
        }
      }
      
      // Mise à jour de l'index d'intégration
      this.updateIntegratorIndex(results);
      logs.push(`\n📊 Résumé de l'intégration:`);
      logs.push(`   ✅ Prêts: ${readyCount}`);
      logs.push(`   ⚠️ Conflits: ${conflitsCount}`);
      logs.push(`   🟠 Incomplets: ${incompletCount}`);
      logs.push(`   ❌ Erreurs: ${erreurCount}`);
      
      // Générer un rapport global si demandé
      if (context.generateReport) {
        this.generateGlobalReport(results, logs);
      }
      
      return {
        status: 'success',
        logs,
        summary: {
          total: elementsToIntegrate.length,
          ready: readyCount,
          conflits: conflitsCount,
          incomplet: incompletCount,
          erreur: erreurCount
        },
        results
      };
    } catch (err: any) {
      logs.push(`❌ Erreur générale: ${err.message}`);
      return { status: 'error', logs, error: err.message };
    }
  },
  
  /**
   * Résout le chemin complet d'une fonctionnalité
   */
  resolveFeaturePath(featureName: string): string {
    // Si le chemin est déjà absolu, le retourner tel quel
    if (path.isAbsolute(featureName)) {
      return featureName;
    }
    
    // Rechercher dans les emplacements standard des fonctionnalités
    const potentialLocations = [
      path.resolve('app/features', featureName),
      path.resolve('apps/frontend/src/features', featureName),
      path.resolve('apps/backend/src/features', featureName)
    ];
    
    for (const location of potentialLocations) {
      if (fs.existsSync(location)) {
        return location;
      }
    }
    
    // Si on ne trouve pas, retourner le chemin par défaut (pour pouvoir afficher une erreur claire)
    return path.resolve('app/features', featureName);
  },
  
  /**
   * Résout le chemin complet d'un composant
   */
  resolveComponentPath(componentName: string): string {
    // Si le chemin est déjà absolu, le retourner tel quel
    if (path.isAbsolute(componentName)) {
      return componentName;
    }
    
    // Rechercher dans les emplacements standard des composants
    const potentialLocations = [
      path.resolve('app/components', componentName),
      path.resolve('apps/frontend/src/components', componentName),
      path.resolve('packages/ui/components', componentName)
    ];
    
    for (const location of potentialLocations) {
      if (fs.existsSync(location)) {
        return location;
      }
    }
    
    // Si on ne trouve pas, retourner le chemin par défaut
    return path.resolve('app/components', componentName);
  },
  
  /**
   * Trouve les fonctionnalités en attente d'intégration
   */
  findPendingFeatures(): string[] {
    try {
      // Chercher dans les dossiers de features pour des marqueurs d'intégration en attente
      // Par exemple, un fichier .integration-ready ou .ready-for-integration
      const featurePaths = [
        ...glob.sync('app/features/*/.integration-ready'),
        ...glob.sync('apps/frontend/src/features/*/.integration-ready'),
        ...glob.sync('apps/backend/src/features/*/.integration-ready')
      ];
      
      return featurePaths.map(p => path.dirname(p));
    } catch (err) {
      console.error('Erreur lors de la recherche des fonctionnalités en attente:', err);
      return [];
    }
  },
  
  /**
   * Vérifie la présence des fichiers requis pour l'intégration
   */
  checkRequiredFiles(elementPath: string): { success: boolean; found: string[]; missing: string[] } {
    try {
      const type = this.determineElementType(elementPath);
      const required = [];
      const elementName = path.basename(elementPath);
      
      if (type === 'feature') {
        // Fichiers requis pour une fonctionnalité
        required.push(
          path.join(elementPath, 'index.ts'),
          path.join(elementPath, `${elementName}.tsx`),
          path.join(elementPath, `${elementName}.test.tsx`)
        );
      } else if (type === 'component') {
        // Fichiers requis pour un composant
        required.push(
          path.join(elementPath, 'index.ts'),
          path.join(elementPath, `${elementName}.tsx`),
          path.join(elementPath, `${elementName}.test.tsx`),
          path.join(elementPath, `${elementName}.module.css`)
        );
      } else if (type === 'route') {
        // Fichiers requis pour une route
        required.push(
          path.join(elementPath, 'index.tsx'),
          path.join(elementPath, 'route.tsx')
        );
      } else if (type === 'api') {
        // Fichiers requis pour un endpoint API
        required.push(
          path.join(elementPath, 'index.ts'),
          path.join(elementPath, 'controller.ts'),
          path.join(elementPath, 'service.ts'),
          path.join(elementPath, 'dto.ts'),
          path.join(elementPath, 'spec.ts')
        );
      }
      
      const found = required.filter(f => fs.existsSync(f));
      const missing = required.filter(f => !fs.existsSync(f));
      
      return {
        success: missing.length === 0,
        found,
        missing
      };
    } catch (err) {
      console.error('Erreur lors de la vérification des fichiers:', err);
      return { success: false, found: [], missing: ['Erreur lors de la vérification'] };
    }
  },
  
  /**
   * Détermine le type d'élément (fonctionnalité, composant, route, API)
   */
  determineElementType(elementPath: string): 'feature' | 'component' | 'route' | 'api' {
    if (elementPath.includes('/features/')) {
      return 'feature';
    } else if (elementPath.includes('/components/')) {
      return 'component';
    } else if (elementPath.includes('/routes/')) {
      return 'route';
    } else if (elementPath.includes('/api/')) {
      return 'api';
    } else {
      // Par défaut, considérer comme une fonctionnalité
      return 'feature';
    }
  },
  
  /**
   * Exécute les tests pour l'élément spécifié
   */
  async runTests(elementPath: string): Promise<{ total: number; passed: number; failed: number; skipped: number }> {
    try {
      // Trouver tous les fichiers de test
      const testFiles = glob.sync(path.join(elementPath, '**/*.{test,spec}.{ts,tsx,js,jsx}'));
      
      if (testFiles.length === 0) {
        return { total: 0, passed: 0, failed: 0, skipped: 0 };
      }
      
      // Exécuter les tests avec vitest, jest ou un autre framework de test
      const result = execSync(`npx vitest run ${testFiles.join(' ')} --reporter json`, { encoding: 'utf8' });
      const testResult = JSON.parse(result);
      
      return {
        total: testResult.numTotalTests,
        passed: testResult.numPassedTests,
        failed: testResult.numFailedTests,
        skipped: testResult.numPendingTests
      };
    } catch (err: any) {
      // En cas d'erreur, considérer que les tests ont échoué
      console.error('Erreur lors de l\'exécution des tests:', err);
      
      // Tenter de parser la sortie d'erreur pour extraire les résultats
      try {
        if (err.stdout) {
          const match = err.stdout.toString().match(/Tests: (\d+) failed, (\d+) passed, (\d+) total/);
          if (match) {
            const [, failed, passed, total] = match;
            return {
              total: parseInt(total, 10),
              passed: parseInt(passed, 10),
              failed: parseInt(failed, 10),
              skipped: 0
            };
          }
        }
      } catch (parseErr) {
        // Ignorer les erreurs de parsing
      }
      
      return { total: 1, passed: 0, failed: 1, skipped: 0 };
    }
  },
  
  /**
   * Vérifie les problèmes de lint dans l'élément
   */
  async checkLintIssues(elementPath: string): Promise<string[]> {
    try {
      const result = execSync(`npx eslint ${elementPath} --format json`, { encoding: 'utf8' });
      const lintResult = JSON.parse(result);
      
      // Extraire les messages d'erreur des résultats de lint
      const issues: string[] = [];
      for (const file of lintResult) {
        for (const message of file.messages) {
          issues.push(`${path.relative(elementPath, file.filePath)}:${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
        }
      }
      
      return issues;
    } catch (err: any) {
      // En cas d'erreur, tenter de parser la sortie d'erreur
      if (err.stdout) {
        try {
          const lintResult = JSON.parse(err.stdout.toString());
          const issues: string[] = [];
          
          for (const file of lintResult) {
            for (const message of file.messages) {
              issues.push(`${path.relative(elementPath, file.filePath)}:${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
            }
          }
          
          return issues;
        } catch (parseErr) {
          // Ignorer les erreurs de parsing
        }
      }
      
      console.error('Erreur lors de la vérification du lint:', err);
      return ['Erreur lors de l\'exécution du lint'];
    }
  },
  
  /**
   * Vérifie les problèmes de typage dans l'élément
   */
  async checkTypeIssues(elementPath: string): Promise<string[]> {
    try {
      const result = execSync(`npx tsc --noEmit --project tsconfig.json --pretty false ${elementPath}/**/*.{ts,tsx}`, { encoding: 'utf8' });
      // Si on arrive ici, aucune erreur de typage
      return [];
    } catch (err: any) {
      // Les erreurs de typage sont dans la sortie standard
      if (err.stdout) {
        const lines = err.stdout.toString().split('\n').filter(Boolean);
        return lines.map(line => {
          // Convertir les chemins absolus en chemins relatifs à l'élément
          return line.replace(new RegExp(elementPath, 'g'), '.');
        });
      }
      
      console.error('Erreur lors de la vérification des types:', err);
      return ['Erreur lors de la vérification des types'];
    }
  },
  
  /**
   * Vérifie si le build passe pour l'élément
   */
  async checkBuild(elementPath: string): Promise<string[]> {
    const type = this.determineElementType(elementPath);
    
    try {
      if (type === 'feature' || type === 'component' || type === 'route') {
        // Pour les éléments frontend, on utilise vite ou webpack
        execSync(`npx vite build --config apps/frontend/vite.config.ts`, { encoding: 'utf8' });
      } else if (type === 'api') {
        // Pour les éléments backend, on utilise nest build
        execSync(`npx nest build apps/backend`, { encoding: 'utf8' });
      }
      
      // Si on arrive ici, aucune erreur de build
      return [];
    } catch (err: any) {
      // Les erreurs de build sont dans la sortie standard ou d'erreur
      const output = err.stdout || err.stderr || '';
      
      // Extraire les lignes pertinentes
      const lines = output.toString().split('\n')
        .filter(line => line.includes('error'))
        .map(line => line.trim())
        .filter(Boolean);
      
      if (lines.length > 0) {
        return lines;
      }
      
      console.error('Erreur lors du build:', err);
      return ['Erreur lors du build'];
    }
  },
  
  /**
   * Vérifie les dépendances manquantes
   */
  checkDependencies(elementPath: string): string[] {
    try {
      // Trouver tous les fichiers source
      const sourceFiles = glob.sync(path.join(elementPath, '**/*.{ts,tsx,js,jsx}'), {
        ignore: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/node_modules/**']
      });
      
      // Lire le package.json du projet
      const packageJsonPath = path.resolve('package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return ['package.json non trouvé'];
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      // Analyser les imports dans les fichiers source
      const missingDeps = new Set<string>();
      
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Rechercher les imports de packages externes (non relatifs)
        const importRegex = /from\s+['"]([^./][^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const packageName = match[1].split('/')[0]; // Prendre la première partie pour les imports comme 'lodash/get'
          
          // Si le package n'est pas dans les dépendances
          if (packageName && packageName !== '' && !dependencies[packageName]) {
            missingDeps.add(packageName);
          }
        }
      }
      
      return Array.from(missingDeps);
    } catch (err) {
      console.error('Erreur lors de la vérification des dépendances:', err);
      return ['Erreur lors de la vérification des dépendances'];
    }
  },
  
  /**
   * Vérifie les conflits potentiels avec la branche cible
   */
  async checkConflits(elementPath: string, targetBranch: string): Promise<string[]> {
    try {
      // Vérifier si on est dans un repoDoDoDoDotgit
      const isGitRepo = fs.existsSync(path.resolve('DoDoDoDotgit'));
      if (!isGitRepo) {
        return ['Non dans un repoDoDoDoDotgit'];
      }
      
      // Créer une branche temporaire pour tester la fusion
      const currentBranch = execSync(DoDoDoDotgit rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const tempBranch = `temp-integration-check-${Date.now()}`;
      
      try {
        // Créer une branche temporaire basée sur la branche courante
        execSync(DoDoDoDotgit checkout -b ${tempBranch}`, { encoding: 'utf8' });
        
        // Tenter une fusion de la branche cible dans notre branche temporaire
        execSync(DoDoDoDotgit merge origin/${targetBranch} --no-commit --no-ff`, { encoding: 'utf8' });
        
        // Si on arrive ici, il n'y a pas de conflits
        
        // Annuler la fusion
        execSync(DoDoDoDotgit merge --abort', { encoding: 'utf8' });
        
        // Revenir à la branche d'origine et supprimer la branche temporaire
        execSync(DoDoDoDotgit checkout ${currentBranch}`, { encoding: 'utf8' });
        execSync(DoDoDoDotgit branch -D ${tempBranch}`, { encoding: 'utf8' });
        
        return [];
      } catch (err: any) {
        // Annuler toute opération en cours
        try {
          execSync(DoDoDoDotgit merge --abort', { encoding: 'utf8' });
        } catch (e) {
          // Ignorer
        }
        
        // Revenir à la branche d'origine et supprimer la branche temporaire
        execSync(DoDoDoDotgit checkout ${currentBranch}`, { encoding: 'utf8' });
        try {
          execSync(DoDoDoDotgit branch -D ${tempBranch}`, { encoding: 'utf8' });
        } catch (e) {
          // Ignorer
        }
        
        // Chercher les fichiers en conflit dans la sortie d'erreur
        const output = err.stdout || err.stderr || '';
        const conflictRegex = /CONFLICT \(content\): Merge conflict in (.+)/g;
        const conflicts: string[] = [];
        
        let match;
        while ((match = conflictRegex.exec(output)) !== null) {
          conflicts.push(match[1]);
        }
        
        // Filtrer pour n'inclure que les conflits dans l'élément spécifié
        return conflicts.filter(file => file.startsWith(elementPath));
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des conflits:', err);
      return ['Erreur lors de la vérification des conflits'];
    }
  },
  
  /**
   * Génère des suggestions de correction
   */
  generateRemediationSuggestions({ lintIssues, typeIssues, buildIssues, missingDeps, conflits }: {
    lintIssues: string[];
    typeIssues: string[];
    buildIssues: string[];
    missingDeps: string[];
    conflits: string[];
  }): string[] {
    const suggestions: string[] = [];
    
    if (lintIssues.length > 0) {
      suggestions.push(`Corriger les problèmes de lint: \`npx eslint --fix\``);
    }
    
    if (typeIssues.length > 0) {
      suggestions.push(`Corriger les erreurs de typage TypeScript`);
    }
    
    if (buildIssues.length > 0) {
      suggestions.push(`Résoudre les erreurs de build`);
    }
    
    if (missingDeps.length > 0) {
      suggestions.push(`Installer les dépendances manquantes: \`npm install ${missingDeps.join(' ')}\``);
    }
    
    if (conflits.length > 0) {
      suggestions.push(`Résoudre les conflitsDoDoDoDotgit dans les fichiers: ${conflits.join(', ')}`);
    }
    
    return suggestions;
  },
  
  /**
   * Tente d'appliquer des corrections automatiques
   */
  async attemptAutoFix(result: IntegrationResult, logs: string[]): Promise<void> {
    logs.push(`🔧 Tentative de correction automatique pour ${result.name}...`);
    
    try {
      // Corriger les problèmes de lint
      if (result.lintIssues.length > 0) {
        logs.push(`🔍 Correction des problèmes de lint...`);
        execSync(`npx eslint --fix ${result.files.join(' ')}`, { encoding: 'utf8' });
      }
      
      // Installer les dépendances manquantes
      if (result.missingDependencies.length > 0) {
        logs.push(`📦 Installation des dépendances manquantes: ${result.missingDependencies.join(', ')}...`);
        execSync(`npm install ${result.missingDependencies.join(' ')}`, { encoding: 'utf8' });
      }
      
      logs.push(`✅ Corrections automatiques appliquées`);
    } catch (err: any) {
      logs.push(`❌ Erreur lors de l'application des corrections automatiques: ${err.message}`);
    }
  },
  
  /**
   * Sauvegarde le rapport d'intégration
   */
  saveIntegrationReport(result: IntegrationResult): void {
    try {
      const reportsDir = path.resolve('reports/integration');
      
      // Créer le dossier des rapports s'il n'existe pas
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportPath = path.join(reportsDir, `${result.name}-${new Date().toISOString().replace(/:/g, '-')}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du rapport:', err);
    }
  },
  
  /**
   * Met à jour l'index de l'intégrateur
   */
  updateIntegratorIndex(results: IntegrationResult[]): void {
    try {
      const indexPath = path.resolve('reports/integration/index.json');
      let index: IntegratorIndex;
      
      // Charger l'index existant ou en créer un nouveau
      if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      } else {
        index = {
          lastUpdated: new Date().toISOString(),
          totalIntegrations: 0,
          readyCount: 0,
          conflitsCount: 0,
          incompletCount: 0,
          erreurCount: 0,
          features: {}
        };
      }
      
      // Mettre à jour avec les nouveaux résultats
      for (const result of results) {
        index.features[result.name] = {
          status: result.status,
          integrationDate: result.integrationDate,
          reportPath: path.join('reports/integration', `${result.name}-${result.integrationDate.replace(/:/g, '-')}.json`)
        };
      }
      
      // Recalculer les statistiques
      index.totalIntegrations = Object.keys(index.features).length;
      index.readyCount = Object.values(index.features).filter(f => f.status === 'ready').length;
      index.conflitsCount = Object.values(index.features).filter(f => f.status === 'conflits').length;
      index.incompletCount = Object.values(index.features).filter(f => f.status === 'incomplet').length;
      index.erreurCount = Object.values(index.features).filter(f => f.status === 'erreur').length;
      index.lastUpdated = new Date().toISOString();
      
      // Sauvegarder l'index mis à jour
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'index:', err);
    }
  },
  
  /**
   * Génère un rapport global sur l'intégration
   */
  generateGlobalReport(results: IntegrationResult[], logs: string[]): void {
    try {
      const reportsDir = path.resolve('reports/integration');
      
      // Créer le dossier des rapports s'il n'existe pas
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Statistiques globales
      const readyCount = results.filter(r => r.status === 'ready').length;
      const conflitsCount = results.filter(r => r.status === 'conflits').length;
      const incompletCount = results.filter(r => r.status === 'incomplet').length;
      const erreurCount = results.filter(r => r.status === 'erreur').length;
      
      // Construire le contenu du rapport global
      const reportContent = {
        date: new Date().toISOString(),
        summary: {
          total: results.length,
          ready: readyCount,
          conflits: conflitsCount,
          incomplet: incompletCount,
          erreur: erreurCount
        },
        details: results.map(r => ({
          name: r.name,
          type: r.type,
          status: r.status,
          tests: r.tests,
          issues: {
            lintIssues: r.lintIssues.length,
            typeIssues: r.typeIssues.length,
            buildIssues: r.buildIssues.length,
            missingDependencies: r.missingDependencies.length,
            conflitsFichiers: r.conflitsFichiers.length
          }
        }))
      };
      
      // Sauvegarder le rapport global
      const reportPath = path.join(reportsDir, `global-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
      
      logs.push(`📊 Rapport global généré: ${reportPath}`);
      
      // Générer également une version Markdown pour faciliter la lecture
      const mdReport = this.generateMarkdownReport(reportContent);
      const mdReportPath = path.join(reportsDir, `global-report-${new Date().toISOString().replace(/:/g, '-')}.md`);
      fs.writeFileSync(mdReportPath, mdReport);
      
      logs.push(`📝 Rapport Markdown généré: ${mdReportPath}`);
    } catch (err: any) {
      logs.push(`❌ Erreur lors de la génération du rapport global: ${err.message}`);
    }
  },
  
  /**
   * Génère un rapport au format Markdown
   */
  generateMarkdownReport(reportContent: any): string {
    const { date, summary, details } = reportContent;
    
    let markdown = `# Rapport d'intégration\n\n`;
    markdown += `**Date:** ${new Date(date).toLocaleString('fr-FR')}\n\n`;
    
    // Résumé
    markdown += `## Résumé\n\n`;
    markdown += `- **Total:** ${summary.total}\n`;
    markdown += `- **Prêts:** ${summary.ready}\n`;
    markdown += `- **Avec conflits:** ${summary.conflits}\n`;
    markdown += `- **Incomplets:** ${summary.incomplet}\n`;
    markdown += `- **En erreur:** ${summary.erreur}\n\n`;
    
    // Détails
    markdown += `## Détails\n\n`;
    
    // Table d'en-tête
    markdown += `| Nom | Type | Statut | Tests | Problèmes |\n`;
    markdown += `| --- | ---- | ------ | ----- | --------- |\n`;
    
    // Lignes de détails
    for (const item of details) {
      const tests = `${item.tests.passed}/${item.tests.total}`;
      const issues = [
        item.issues.lintIssues > 0 ? `${item.issues.lintIssues} lint` : '',
        item.issues.typeIssues > 0 ? `${item.issues.typeIssues} type` : '',
        item.issues.buildIssues > 0 ? `${item.issues.buildIssues} build` : '',
        item.issues.missingDependencies > 0 ? `${item.issues.missingDependencies} deps` : '',
        item.issues.conflitsFichiers > 0 ? `${item.issues.conflitsFichiers} conflits` : ''
      ].filter(Boolean).join(', ');
      
      markdown += `| ${item.name} | ${item.type} | ${item.status} | ${tests} | ${issues || 'Aucun'} |\n`;
    }
    
    // Recommandations
    markdown += `\n## Recommandations\n\n`;
    
    // Éléments prêts
    const readyItems = details.filter(d => d.status === 'ready');
    if (readyItems.length > 0) {
      markdown += `### Éléments prêts à être fusionnés\n\n`;
      markdown += readyItems.map(d => `- ${d.name} (${d.type})`).join('\n');
      markdown += `\n\n`;
    }
    
    // Éléments avec conflits
    const conflitsItems = details.filter(d => d.status === 'conflits');
    if (conflitsItems.length > 0) {
      markdown += `### Éléments nécessitant une résolution de conflits\n\n`;
      markdown += conflitsItems.map(d => `- ${d.name} (${d.type})`).join('\n');
      markdown += `\n\n`;
    }
    
    // Éléments incomplets
    const incompletItems = details.filter(d => d.status === 'incomplet');
    if (incompletItems.length > 0) {
      markdown += `### Éléments nécessitant des corrections\n\n`;
      markdown += incompletItems.map(d => `- ${d.name} (${d.type})`).join('\n');
      markdown += `\n\n`;
    }
    
    // Prochaines étapes
    markdown += `## Prochaines étapes\n\n`;
    markdown += `1. Résoudre les conflits dans les éléments identifiés\n`;
    markdown += `2. Corriger les problèmes de lint, typage et build\n`;
    markdown += `3. Ajouter les dépendances manquantes\n`;
    markdown += `4. Exécuter à nouveau l'intégrateur pour valider les corrections\n`;
    markdown += `5. Fusionner les éléments prêts\n`;
    
    return markdown;
  }
};