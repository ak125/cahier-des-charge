import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * Analyseur de structure de monorepo
 * Détecte automatiquement les patterns Remix, NestJS, Prisma, etc.
 */

interface CodeStyleProfile {
  indentation: {
    type: 'spaces' | 'tabs';
    size: number;
  };
  quotes: 'single' | 'double';
  semicolons: boolean;
  lineLength: number;
  componentNaming: string;
  functionNaming: string;
  importOrder: string[];
  importSeparation: boolean;
  lineBreaks: 'LF' | 'CRLF';
}

interface MonorepoConfig {
  rootPath: string;
  outputPath: string;
  scanExclusions: string[];
  filesLimit: number;
}

class MonorepoAnalyzer {
  private config: MonorepoConfig;
  
  constructor(config: MonorepoConfig) {
    this.config = config;
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(this.config.outputPath)) {
      fs.mkdirSync(this.config.outputPath, { recursive: true });
    }
  }
  
  /**
   * Point d'entrée principal pour l'analyse
   */
  public async analyze(): Promise<void> {
    console.log('🔍 Démarrage de l\'analyse du monorepo...');
    
    try {
      const codeStyle = await this.detectCodeStyle();
      const remixPatterns = await this.analyzeRemixStructure();
      const nestjsPatterns = await this.analyzeNestJSStructure();
      const dependencies = await this.analyzeDependencies();
      
      // Écriture des résultats dans des fichiers JSON
      this.writeResults('code_style_profile.json', codeStyle);
      this.writeResults('remix_component_patterns.json', remixPatterns);
      this.writeResults('nestjs_module_patterns.json', nestjsPatterns);
      this.writeResults('monorepo_dependencies.json', dependencies);
      
      console.log('✅ Analyse terminée avec succès.');
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error);
      process.exit(1);
    }
  }
  
  /**
   * Détecte le style de code utilisé dans le projet
   */
  private async detectCodeStyle(): Promise<CodeStyleProfile> {
    console.log('👉 Détection du style de code...');
    
    // Trouver des fichiers TypeScript pour analyse
    const tsFiles = await this.findFiles('**/*.{ts,tsx}');
    const sampleFiles = tsFiles.slice(0, Math.min(this.config.filesLimit, tsFiles.length));
    
    // Analyser les fichiers pour détecter le style
    const indentationType = await this.detectIndentation(sampleFiles);
    const quotesStyle = await this.detectQuotesStyle(sampleFiles);
    const useSemicolons = await this.detectSemicolons(sampleFiles);
    const lineLength = await this.detectLineLength(sampleFiles);
    const namingConventions = await this.detectNamingConventions(sampleFiles);
    const importOrderRules = await this.detectImportOrder(sampleFiles);
    
    return {
      indentation: indentationType,
      quotes: quotesStyle,
      semicolons: useSemicolons,
      lineLength,
      componentNaming: namingConventions.components,
      functionNaming: namingConventions.functions,
      importOrder: importOrderRules.order,
      importSeparation: importOrderRules.useSeparation,
      lineBreaks: await this.detectLineBreaks(sampleFiles)
    };
  }
  
  /**
   * Analyse la structure des composants Remix
   */
  private async analyzeRemixStructure(): Promise<any> {
    console.log('👉 Analyse de la structure Remix...');
    
    // Trouver les fichiers de routes Remix
    const routeFiles = await this.findFiles('**/app/routes/**/*.{ts,tsx}');
    
    // Détection du style de routage (plat ou imbriqué)
    const routeStructure = this.detectRouteStructure(routeFiles);
    
    // Analyse des loaders et actions
    const loaderPattern = await this.analyzeLoaderPattern(routeFiles);
    const actionPattern = await this.analyzeActionPattern(routeFiles);
    
    // Analyse des types de composants
    const componentTypes = await this.detectComponentTypes();
    
    // Extraire des exemples représentatifs
    const examples = await this.extractPatternExamples(routeFiles);
    
    return {
      routePatterns: {
        naming: this.detectRouteNaming(routeFiles),
        structure: routeStructure,
        indexRoutes: await this.hasIndexRoutes(routeFiles)
      },
      loaderPattern,
      actionPattern,
      componentTypes,
      examples
    };
  }
  
  /**
   * Analyse la structure des modules NestJS
   */
  private async analyzeNestJSStructure(): Promise<any> {
    console.log('👉 Analyse de la structure NestJS...');
    
    // Rechercher les modules NestJS
    const moduleFiles = await this.findFiles('**/src/**/*.module.ts');
    
    // Analyser les conventions de nommage et organisation
    const moduleStructure = await this.analyzeModuleStructure(moduleFiles);
    const decoratorUsage = await this.analyzeDecoratorUsage();
    const diPattern = await this.analyzeDependencyInjection();
    const errorHandling = await this.analyzeErrorHandling();
    
    // Extraire des exemples représentatifs
    const examples = await this.extractNestJSExamples();
    
    return {
      moduleStructure,
      decoratorUsage,
      dependencyInjection: diPattern,
      errorHandling,
      examples
    };
  }
  
  /**
   * Analyse les dépendances du monorepo
   */
  private async analyzeDependencies(): Promise<any> {
    console.log('👉 Analyse des dépendances...');
    
    // Analyser le package.json racine
    const rootPackageJson = JSON.parse(
      fs.readFileSync(path.join(this.config.rootPath, 'package.json'), 'utf8')
    );
    
    // Rechercher tous les package.json dans les apps et packages
    const packageJsonFiles = await this.findFiles('**/package.json');
    
    const appDeps = {};
    const packageDeps = {};
    
    // Analyser chaque package.json trouvé
    for (const file of packageJsonFiles) {
      // Ignorer le package.json racine qui a déjà été analysé
      if (path.dirname(file) === this.config.rootPath) continue;
      
      const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
      const relativePath = path.relative(this.config.rootPath, path.dirname(file));
      
      // Déterminer s'il s'DoDoDoDotgit d'une app ou d'un package
      if (relativePath.startsWith('apps/')) {
        const appName = relativePath.replace('apps/', '').split('/')[0];
        appDeps[appName] = {
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {}
        };
      } else if (relativePath.startsWith('packages/')) {
        const pkgName = relativePath.replace('packages/', '').split('/')[0];
        packageDeps[pkgName] = {
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {}
        };
      }
    }
    
    return {
      rootDependencies: {
        ...rootPackageJson.dependencies,
        ...rootPackageJson.devDependencies
      },
      apps: appDeps,
      packages: packageDeps
    };
  }
  
  // Méthodes utilitaires
  
  private async findFiles(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob(pattern, {
        cwd: this.config.rootPath,
        ignore: this.config.scanExclusions,
        absolute: true
      }, (err, matches) => {
        if (err) return reject(err);
        resolve(matches);
      });
    });
  }
  
  private writeResults(filename: string, data: any): void {
    const outputPath = path.join(this.config.outputPath, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Résultats écrits dans ${outputPath}`);
  }
  
  // Méthodes de détection (implémentations simplifiées pour l'exemple)
  
  private async detectIndentation(files: string[]): Promise<{ type: 'spaces' | 'tabs', size: number }> {
    // Implémentation simplifiée
    return { type: 'spaces', size: 2 };
  }
  
  private async detectQuotesStyle(files: string[]): Promise<'single' | 'double'> {
    // Implémentation simplifiée
    return 'single';
  }
  
  private async detectSemicolons(files: string[]): Promise<boolean> {
    // Implémentation simplifiée
    return true;
  }
  
  private async detectLineLength(files: string[]): Promise<number> {
    // Implémentation simplifiée
    return 100;
  }
  
  private async detectNamingConventions(files: string[]): Promise<{ components: string, functions: string }> {
    // Implémentation simplifiée
    return {
      components: 'PascalCase',
      functions: 'camelCase'
    };
  }
  
  private async detectImportOrder(files: string[]): Promise<{ order: string[], useSeparation: boolean }> {
    // Implémentation simplifiée
    return {
      order: ['react', '^@core/', '^@server/', '^@ui/', '^[./]'],
      useSeparation: true
    };
  }
  
  private async detectLineBreaks(files: string[]): Promise<'LF' | 'CRLF'> {
    // Implémentation simplifiée
    return 'LF';
  }
  
  // Autres méthodes d'analyse de patterns (implémentations simplifiées)
  
  private detectRouteStructure(routeFiles: string[]): string {
    // Implémentation simplifiée
    return 'flat';
  }
  
  private async analyzeLoaderPattern(routeFiles: string[]): Promise<any> {
    // Implémentation simplifiée
    return {
      errorHandling: 'throw',
      dataFetching: 'service'
    };
  }
  
  private async analyzeActionPattern(routeFiles: string[]): Promise<any> {
    // Implémentation simplifiée
    return {
      validation: 'zod',
      errorHandling: 'throw'
    };
  }
  
  private async detectComponentTypes(): Promise<any> {
    // Implémentation simplifiée
    return {
      ui: 'apps/web/app/components/ui',
      layout: 'apps/web/app/components/layout',
      shared: 'packages/ui/src/components'
    };
  }
  
  private extractPatternExamples(files: string[]): Promise<any> {
    // Implémentation simplifiée
    return Promise.resolve({
      loader: '// Exemple de loader',
      action: '// Exemple d\'action',
      component: '// Exemple de composant'
    });
  }
  
  private detectRouteNaming(routeFiles: string[]): string {
    // Implémentation simplifiée
    return 'kebab-case';
  }
  
  private async hasIndexRoutes(routeFiles: string[]): Promise<boolean> {
    // Implémentation simplifiée
    return true;
  }
  
  private async analyzeModuleStructure(moduleFiles: string[]): Promise<any> {
    // Implémentation simplifiée
    return {
      controllers: 'products.controller.ts',
      services: 'products.service.ts',
      entities: 'entities/product.entity.ts',
      dto: 'dto/create-product.dto.ts'
    };
  }
  
  private async analyzeDecoratorUsage(): Promise<any> {
    // Implémentation simplifiée
    return {
      controller: '@Controller(\'products\')',
      method: '@Get(\':id\')',
      param: '@Param(\'id\')',
      body: '@Body()'
    };
  }
  
  private async analyzeDependencyInjection(): Promise<any> {
    // Implémentation simplifiée
    return {
      pattern: 'constructor-based',
      providerRegistration: 'module-providers'
    };
  }
  
  private async analyzeErrorHandling(): Promise<any> {
    // Implémentation simplifiée
    return {
      exceptions: 'nest-exceptions',
      filters: 'global'
    };
  }
  
  private async extractNestJSExamples(): Promise<any> {
    // Implémentation simplifiée
    return {
      module: '// Exemple de module',
      controller: '// Exemple de controller',
      service: '// Exemple de service'
    };
  }
}

// Configuration par défaut
const defaultConfig: MonorepoConfig = {
  rootPath: process.env.MONOREPO_PATH || process.cwd(),
  outputPath: process.env.OUTPUT_PATH || path.join(process.cwd(), 'profil'),
  scanExclusions: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/DoDoDoDotgit/**'],
  filesLimit: 100 // Limite le nombre de fichiers à analyser pour les performances
};

// Point d'entrée du script
async function main() {
  try {
    // Charger la configuration depuis les arguments ou utiliser les valeurs par défaut
    const config = {
      ...defaultConfig,
      // Ajouter ici le parsing des arguments CLI si nécessaire
    };
    
    console.log('📊 Configuration:', config);
    
    const analyzer = new MonorepoAnalyzer(config);
    await analyzer.analyze();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
