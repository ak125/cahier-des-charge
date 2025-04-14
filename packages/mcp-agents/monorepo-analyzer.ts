#!/usr/bin/env ts-node
/**
 * 🧠 monorepo-analyzer.ts — Analyseur de base du monorepo
 * 
 * Cet outil analyse la structure complète d'un monorepo NestJS + Remix,
 * et génère des fichiers JSON d'analyse qui servent de référence pour
 * tous les autres agents de génération de code.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { promisify } from 'util';
import * as ts from 'typescript';
import { parseModule } from '@nestjs/common/utils/load-package.util';
import { parse as parseTSX } from '@typescript-eslint/typescript-estree';
import * as minimist from 'minimist';

// Conversion de glob en Promise
const globAsync = promisify(glob);

// Interface pour les options en ligne de commande
interface CliOptions {
  root: string;
  configPath?: string;
  outputDir?: string;
}

// Structures pour l'analyse des modules NestJS
interface NestJSModuleInfo {
  name: string;
  filePath: string;
  imports: string[];
  exports: string[];
  controllers: string[];
  providers: string[];
  decorators: string[];
}

// Structures pour l'analyse des routes Remix
interface RemixRouteInfo {
  routePath: string;
  filePath: string;
  hasLoader: boolean;
  hasAction: boolean;
  hasLinks: boolean;
  hasForm: boolean;
  hasUseLoaderData: boolean;
  hasClientSideValidation: boolean;
  hasServerSideValidation: boolean;
  componentsUsed: string[];
}

// Structures pour l'analyse des composants Remix
interface RemixComponentInfo {
  name: string;
  filePath: string;
  props: string[];
  hooks: string[];
  importsFrom: string[];
  exportsTo: string[];
}

// Structure pour les alias d'import
interface ImportAlias {
  alias: string;
  path: string;
  usage: number;
}

// Structure pour les tokens Tailwind
interface TailwindToken {
  type: string; // 'color', 'spacing', 'breakpoint', etc.
  name: string;
  value: string;
}

// Structure principale du projet
interface ProjectStructure {
  root: string;
  apps: {
    [appName: string]: {
      type: 'backend' | 'frontend' | 'mcp-server' | 'other';
      path: string;
      modules?: NestJSModuleInfo[];
      routes?: RemixRouteInfo[];
      components?: RemixComponentInfo[];
      controllers?: string[];
      services?: string[];
      dtos?: string[];
      guards?: string[];
      pipes?: string[];
      config?: any;
    };
  };
  packages: {
    [packageName: string]: {
      path: string;
      exports: string[];
      dependencies: string[];
      devDependencies: string[];
    };
  };
  monorepoConfig: {
    turbo?: any;
    tsconfig?: any;
    eslint?: any;
    prettier?: any;
    tailwind?: any;
  };
  prisma?: {
    models: PrismaModelInfo[];
    dataSourceProvider: string;
    migrations: string[];
  };
  tests?: {
    framework: string;
    coverageReport?: TestCoverageInfo[];
    e2eTestsPresent: boolean;
    unitTestsPresent: boolean;
  };
  documentation?: {
    apiDocs: boolean;
    componentDocs: boolean;
    readmeFiles: string[];
  };
  cicd?: {
    provider: string;
    workflows: string[];
    stages: string[];
  };
  performance?: {
    routes: RoutePerformanceInfo[];
    serverResponseTimes?: Record<string, number>;
  };
  security?: {
    authMechanisms: string[];
    apiProtection: string[];
    vulnerabilities: Array<{
      type: string;
      location: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }>;
  };
}

// Structure pour les dépendances du monorepo
interface MonorepoDependencies {
  internal: {
    [fromPackage: string]: string[];
  };
  external: {
    [packageName: string]: string;
  };
  devDependencies: {
    [packageName: string]: string;
  };
  peerDependencies?: {
    [packageName: string]: string;
  };
}

// Structure pour le style de code
interface CodeStyleProfile {
  indentation: {
    type: 'spaces' | 'tabs';
    size: number;
  };
  quotes: 'single' | 'double';
  semicolons: boolean;
  maxLineLength: number;
  componentNaming: 'PascalCase' | 'camelCase' | 'kebab-case';
  importOrder: string[];
  braceStyle: 'same-line' | 'new-line';
  trailingComma: boolean;
}

// Structure pour l'analyse de schéma Prisma
interface PrismaModelInfo {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    isUnique: boolean;
    isId: boolean;
    hasDefault: boolean;
    relations: string[];
  }>;
  relations: Array<{
    name: string;
    relatedModel: string;
    relationType: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  }>;
}

// Structure pour les performances des routes
interface RoutePerformanceInfo {
  routePath: string;
  averageLoadTime: number;
  bundleSize: number;
  serverDependencies: number;
  clientDependencies: number;
  potentialOptimizations: string[];
}

// Structure pour les tests
interface TestCoverageInfo {
  filePath: string;
  hasCoverage: boolean;
  testFiles: string[];
  coveragePercentage?: number;
  uncoveredLines?: number[];
}

/**
 * Classe principale d'analyse du monorepo
 */
class MonorepoAnalyzer {
  private projectStructure: ProjectStructure;
  private monorepoDependencies: MonorepoDependencies;
  private codeStyleProfile: CodeStyleProfile;
  private importPathsMap: { [alias: string]: string };
  private remixComponentPatterns: any;
  private nestJSModulePatterns: any;
  private tailwindTokens: TailwindToken[];
  private logger: Console;

  constructor(private options: CliOptions) {
    this.projectStructure = {
      root: options.root,
      apps: {},
      packages: {},
      monorepoConfig: {}
    };

    this.monorepoDependencies = {
      internal: {},
      external: {},
      devDependencies: {}
    };

    this.importPathsMap = {};
    this.remixComponentPatterns = {};
    this.nestJSModulePatterns = {};
    this.tailwindTokens = [];

    // Style de code par défaut, sera mis à jour après analyse
    this.codeStyleProfile = {
      indentation: { type: 'spaces', size: 2 },
      quotes: 'single',
      semicolons: true,
      maxLineLength: 100,
      componentNaming: 'PascalCase',
      importOrder: ['react', 'remix', 'nestjs', 'node', 'external', 'internal', 'parent', 'sibling', 'index'],
      braceStyle: 'same-line',
      trailingComma: true
    };

    this.logger = console;
  }

  /**
   * Point d'entrée principal de l'analyse
   */
  public async analyze(): Promise<void> {
    this.logger.info('🔍 Début de l\'analyse du monorepo...');

    // Création du dossier de sortie
    const outputDir = this.options.outputDir || path.join(this.options.root, 'audit', 'monorepo-analyzer');
    await fs.mkdir(outputDir, { recursive: true });

    try {
      // Lecture des configurations globales
      await this.readMonorepoConfigs();

      // Analyse des applications
      await this.analyzeApps();

      // Analyse des packages partagés
      await this.analyzePackages();

      // Analyse des dépendances croisées
      await this.analyzeDependencies();

      // Analyse du style de code global
      await this.analyzeCodeStyle();

      // Analyse des chemins d'import et alias
      await this.analyzeImportPaths();

      // Analyse des patterns de composants Remix
      await this.analyzeRemixPatterns();

      // Analyse des patterns de modules NestJS
      await this.analyzeNestJSPatterns();

      // Analyse des tokens Tailwind
      await this.analyzeTailwindTokens();

      // NOUVELLES FONCTIONNALITÉS
      
      // Analyse du schéma Prisma
      await this.analyzePrismaSchema();
      
      // Analyse des tests et de la couverture
      await this.analyzeTests();
      
      // Analyse de la documentation
      await this.analyzeDocumentation();
      
      // Analyse CI/CD
      await this.analyzeCICD();
      
      // Analyse des performances
      await this.analyzePerformance();
      
      // Analyse de sécurité
      await this.analyzeSecurity();
      
      // Analyse des librairies utilisées et version/vulnérabilités
      await this.analyzeLibraries();
      
      // Analyse GraphQL si applicable
      await this.analyzeGraphQL();

      // Écriture des fichiers de résultats
      await this.writeResults(outputDir);

      this.logger.info('✅ Analyse terminée avec succès!');
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'analyse:', error);
      throw error;
    }
  }

  /**
   * Lecture de toutes les configurations du monorepo
   */
  private async readMonorepoConfigs(): Promise<void> {
    this.logger.info('📚 Lecture des configurations du monorepo...');

    // Lecture de turbo.json
    try {
      const turboPath = path.join(this.options.root, 'turbo.json');
      const turboContent = await fs.readFile(turboPath, 'utf8');
      this.projectStructure.monorepoConfig.turbo = JSON.parse(turboContent);
      this.logger.info('✅ turbo.json chargé avec succès');
    } catch (error) {
      this.logger.warn('⚠️ Pas de fichier turbo.json trouvé ou erreur de lecture');
    }

    // Lecture de tsconfig.json
    try {
      const tsconfigPath = this.options.configPath 
        ? path.join(this.options.root, this.options.configPath, 'tsconfig.json')
        : path.join(this.options.root, 'tsconfig.json');
      
      const tsconfigContent = await fs.readFile(tsconfigPath, 'utf8');
      this.projectStructure.monorepoConfig.tsconfig = JSON.parse(tsconfigContent);
      
      // Extraction des alias depuis tsconfig
      if (this.projectStructure.monorepoConfig.tsconfig.compilerOptions?.paths) {
        const { paths, baseUrl } = this.projectStructure.monorepoConfig.tsconfig.compilerOptions;
        const basePath = baseUrl || '.';
        
        for (const [alias, pathValues] of Object.entries(paths)) {
          const aliasKey = alias.replace(/\/\*$/, '');
          const pathValue = Array.isArray(pathValues) ? pathValues[0] : pathValues;
          const resolvedPath = pathValue.replace(/\/\*$/, '');
          
          this.importPathsMap[aliasKey] = path.join(this.options.root, basePath, resolvedPath);
        }
      }
      
      this.logger.info('✅ tsconfig.json chargé avec succès');
    } catch (error) {
      this.logger.warn('⚠️ Pas de fichier tsconfig.json trouvé ou erreur de lecture');
    }

    // Autres fichiers de configuration à analyser si besoin (eslint, prettier, etc.)
  }

  /**
   * Analyse des applications dans le monorepo
   */
  private async analyzeApps(): Promise<void> {
    this.logger.info('🔍 Analyse des applications...');
    
    const appsDir = path.join(this.options.root, 'apps');
    
    try {
      const appFolders = await fs.readdir(appsDir);
      
      for (const appName of appFolders) {
        const appPath = path.join(appsDir, appName);
        const stats = await fs.stat(appPath);
        
        if (stats.isDirectory()) {
          this.logger.info(`📂 Analyse de l'application: ${appName}`);
          
          // Détection du type d'application (backend, frontend, mcp-server)
          let appType: 'backend' | 'frontend' | 'mcp-server' | 'other' = 'other';
          
          // Vérification des indices spécifiques à NestJS
          const nestIndices = await globAsync(path.join(appPath, '**/*.module.ts'));
          const hasNestJSModules = nestIndices.length > 0;
          
          // Vérification des indices spécifiques à Remix
          const remixIndices = await globAsync(path.join(appPath, 'app/routes/**/*.tsx'));
          const hasRemixRoutes = remixIndices.length > 0;
          
          // Détermination du type d'application
          if (hasNestJSModules) {
            appType = appName.includes('mcp') ? 'mcp-server' : 'backend';
          } else if (hasRemixRoutes) {
            appType = 'frontend';
          }
          
          // Initialisation de l'entrée pour cette application
          this.projectStructure.apps[appName] = {
            type: appType,
            path: appPath
          };
          
          // Analyse spécifique selon le type d'application
          if (appType === 'backend' || appType === 'mcp-server') {
            await this.analyzeNestJSApp(appName);
          } else if (appType === 'frontend') {
            await this.analyzeRemixApp(appName);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de l'analyse des applications: ${error.message}`);
    }
  }

  /**
   * Analyse d'une application NestJS
   */
  private async analyzeNestJSApp(appName: string): Promise<void> {
    const appInfo = this.projectStructure.apps[appName];
    const modules: NestJSModuleInfo[] = [];
    const controllers: string[] = [];
    const services: string[] = [];
    const dtos: string[] = [];
    const guards: string[] = [];
    const pipes: string[] = [];
    
    // Recherche des modules NestJS
    const moduleFiles = await globAsync(path.join(appInfo.path, '**/*.module.ts'));
    
    for (const moduleFile of moduleFiles) {
      try {
        const content = await fs.readFile(moduleFile, 'utf8');
        
        // Analyse simplifiée pour extraire les infos de base
        const moduleNameMatch = content.match(/export class (\w+Module)/);
        const moduleName = moduleNameMatch ? moduleNameMatch[1] : path.basename(moduleFile, '.module.ts');
        
        // Extraire les imports, controllers, providers
        const importsMatch = content.match(/imports:\s*\[([\s\S]*?)\]/);
        const controllersMatch = content.match(/controllers:\s*\[([\s\S]*?)\]/);
        const providersMatch = content.match(/providers:\s*\[([\s\S]*?)\]/);
        const exportsMatch = content.match(/exports:\s*\[([\s\S]*?)\]/);
        
        const extractNames = (match: RegExpMatchArray | null): string[] => {
          if (!match) return [];
          return match[1]
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        };
        
        // Construction de l'objet d'information sur le module
        const moduleInfo: NestJSModuleInfo = {
          name: moduleName,
          filePath: moduleFile,
          imports: extractNames(importsMatch),
          controllers: extractNames(controllersMatch),
          providers: extractNames(providersMatch),
          exports: extractNames(exportsMatch),
          decorators: ['@Module']
        };
        
        modules.push(moduleInfo);
        
        // Ajouter les contrôleurs à la liste globale
        moduleInfo.controllers.forEach(controller => {
          if (!controllers.includes(controller)) {
            controllers.push(controller);
          }
        });
        
        // Ajouter les services à la liste globale
        moduleInfo.providers.forEach(provider => {
          if (provider.endsWith('Service') && !services.includes(provider)) {
            services.push(provider);
          }
        });
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse du module ${moduleFile}: ${error.message}`);
      }
    }
    
    // Recherche des DTOs
    const dtoFiles = await globAsync(path.join(appInfo.path, '**/*.dto.ts'));
    dtoFiles.forEach(dtoFile => {
      const dtoName = path.basename(dtoFile, '.dto.ts');
      dtos.push(`${dtoName}Dto`);
    });
    
    // Recherche des guards
    const guardFiles = await globAsync(path.join(appInfo.path, '**/*.guard.ts'));
    guardFiles.forEach(guardFile => {
      const guardName = path.basename(guardFile, '.guard.ts');
      guards.push(`${guardName}Guard`);
    });
    
    // Recherche des pipes
    const pipeFiles = await globAsync(path.join(appInfo.path, '**/*.pipe.ts'));
    pipeFiles.forEach(pipeFile => {
      const pipeName = path.basename(pipeFile, '.pipe.ts');
      pipes.push(`${pipeName}Pipe`);
    });
    
    // Mise à jour des informations de l'application
    this.projectStructure.apps[appName].modules = modules;
    this.projectStructure.apps[appName].controllers = controllers;
    this.projectStructure.apps[appName].services = services;
    this.projectStructure.apps[appName].dtos = dtos;
    this.projectStructure.apps[appName].guards = guards;
    this.projectStructure.apps[appName].pipes = pipes;
    
    this.logger.info(`✅ Analyse de l'application NestJS ${appName} terminée: ${modules.length} modules, ${controllers.length} controllers, ${services.length} services`);
  }

  /**
   * Analyse d'une application Remix
   */
  private async analyzeRemixApp(appName: string): Promise<void> {
    const appInfo = this.projectStructure.apps[appName];
    const routes: RemixRouteInfo[] = [];
    const components: RemixComponentInfo[] = [];
    
    // Recherche des routes Remix
    // Supporte à la fois la structure app/routes/ et app/routes.tsx pour remix-flat-routes
    const routePatterns = [
      path.join(appInfo.path, 'app/routes/**/*.tsx'),
      path.join(appInfo.path, 'app/routes.tsx')
    ];
    
    for (const pattern of routePatterns) {
      const routeFiles = await globAsync(pattern);
      
      for (const routeFile of routeFiles) {
        try {
          const content = await fs.readFile(routeFile, 'utf8');
          
          // Extraction du chemin de la route à partir du chemin du fichier
          let routePath = routeFile
            .replace(path.join(appInfo.path, 'app/routes'), '')
            .replace(/\.tsx$/, '')
            .replace(/\/index$/, '/')
            .replace(/\/_index$/, '');
          
          // Gestion des routes dynamiques
          routePath = routePath.replace(/\/\$([\w]+)/g, '/:$1');
          
          // Détection des fonctionnalités Remix
          const hasLoader = content.includes('export const loader');
          const hasAction = content.includes('export const action');
          const hasLinks = content.includes('export const links');
          const hasForm = content.includes('<Form') || content.includes('useForm');
          const hasUseLoaderData = content.includes('useLoaderData');
          const hasClientSideValidation = content.includes('zod') || content.includes('validate') || content.includes('conform');
          const hasServerSideValidation = content.includes('ValidationError') || content.includes('z.object');
          
          // Extraction des composants utilisés
          const componentsUsedRegex = /<([A-Z][a-zA-Z0-9]*)/g;
          const componentsUsed: string[] = [];
          let match;
          
          while ((match = componentsUsedRegex.exec(content)) !== null) {
            const componentName = match[1];
            if (!componentsUsed.includes(componentName)) {
              componentsUsed.push(componentName);
            }
          }
          
          // Construction de l'objet d'information sur la route
          const routeInfo: RemixRouteInfo = {
            routePath,
            filePath: routeFile,
            hasLoader,
            hasAction,
            hasLinks,
            hasForm,
            hasUseLoaderData,
            hasClientSideValidation,
            hasServerSideValidation,
            componentsUsed
          };
          
          routes.push(routeInfo);
        } catch (error) {
          this.logger.warn(`⚠️ Erreur lors de l'analyse de la route ${routeFile}: ${error.message}`);
        }
      }
    }
    
    // Recherche des composants Remix
    const componentFiles = await globAsync(path.join(appInfo.path, 'app/components/**/*.tsx'));
    
    for (const componentFile of componentFiles) {
      try {
        const content = await fs.readFile(componentFile, 'utf8');
        
        // Extraction du nom du composant
        const componentNameMatch = content.match(/export (?:default )?function (\w+)/);
        const componentName = componentNameMatch 
          ? componentNameMatch[1] 
          : path.basename(componentFile, '.tsx');
        
        // Extraction des props
        const propsRegex = /interface (\w+Props) \{([^}]*)\}/;
        const propsMatch = content.match(propsRegex);
        const props: string[] = [];
        
        if (propsMatch) {
          const propsContent = propsMatch[2];
          const propLines = propsContent.split('\n');
          
          for (const line of propLines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//')) {
              const propName = trimmedLine.split(':')[0]?.trim();
              if (propName) {
                props.push(propName);
              }
            }
          }
        }
        
        // Extraction des hooks utilisés
        const hooksRegex = /use[A-Z]\w+/g;
        const hooks: string[] = [];
        let hookMatch;
        
        while ((hookMatch = hooksRegex.exec(content)) !== null) {
          const hookName = hookMatch[0];
          if (!hooks.includes(hookName)) {
            hooks.push(hookName);
          }
        }
        
        // Extraction des imports
        const importsRegex = /import .* from ['"]([^'"]*)['"]/g;
        const importsFrom: string[] = [];
        let importMatch;
        
        while ((importMatch = importsRegex.exec(content)) !== null) {
          const importPath = importMatch[1];
          if (!importsFrom.includes(importPath)) {
            importsFrom.push(importPath);
          }
        }
        
        // Construction de l'objet d'information sur le composant
        const componentInfo: RemixComponentInfo = {
          name: componentName,
          filePath: componentFile,
          props,
          hooks,
          importsFrom,
          exportsTo: [] // Sera complété lors de l'analyse des dépendances
        };
        
        components.push(componentInfo);
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse du composant ${componentFile}: ${error.message}`);
      }
    }
    
    // Mise à jour des informations de l'application
    this.projectStructure.apps[appName].routes = routes;
    this.projectStructure.apps[appName].components = components;
    
    this.logger.info(`✅ Analyse de l'application Remix ${appName} terminée: ${routes.length} routes, ${components.length} composants`);
  }

  /**
   * Analyse des packages partagés
   */
  private async analyzePackages(): Promise<void> {
    this.logger.info('🔍 Analyse des packages partagés...');
    
    const packagesDir = path.join(this.options.root, 'packages');
    
    try {
      const packageFolders = await fs.readdir(packagesDir);
      
      for (const packageName of packageFolders) {
        const packagePath = path.join(packagesDir, packageName);
        const stats = await fs.stat(packagePath);
        
        if (stats.isDirectory()) {
          this.logger.info(`📂 Analyse du package: ${packageName}`);
          
          // Lecture du package.json
          const packageJsonPath = path.join(packagePath, 'package.json');
          
          try {
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            
            // Extraction des exports, dépendances, etc.
            const exports = packageJson.exports 
              ? Object.keys(packageJson.exports) 
              : (packageJson.main ? [packageJson.main] : []);
            
            const dependencies = packageJson.dependencies 
              ? Object.keys(packageJson.dependencies) 
              : [];
            
            const devDependencies = packageJson.devDependencies 
              ? Object.keys(packageJson.devDependencies) 
              : [];
            
            // Mise à jour des informations du package
            this.projectStructure.packages[packageName] = {
              path: packagePath,
              exports,
              dependencies,
              devDependencies
            };
            
            // Mise à jour des dépendances du monorepo
            this.monorepoDependencies.internal[packageName] = [];
            
            // Ajouter les dépendances externes
            if (packageJson.dependencies) {
              for (const [dep, version] of Object.entries(packageJson.dependencies)) {
                this.monorepoDependencies.external[dep] = version as string;
              }
            }
            
            // Ajouter les dépendances de développement
            if (packageJson.devDependencies) {
              for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
                this.monorepoDependencies.devDependencies[dep] = version as string;
              }
            }
          } catch (error) {
            this.logger.warn(`⚠️ Pas de package.json trouvé ou erreur de lecture pour ${packageName}`);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de l'analyse des packages: ${error.message}`);
    }
  }

  /**
   * Analyse des dépendances croisées entre les packages et applications
   */
  private async analyzeDependencies(): Promise<void> {
    this.logger.info('🔍 Analyse des dépendances croisées...');
    
    // Analyser les dépendances entre packages
    for (const [packageName, packageInfo] of Object.entries(this.projectStructure.packages)) {
      for (const dependency of packageInfo.dependencies) {
        // Vérifier si c'est une dépendance interne
        for (const potentialInternalDep of Object.keys(this.projectStructure.packages)) {
          if (dependency === potentialInternalDep || dependency === `@fafa/${potentialInternalDep}`) {
            this.monorepoDependencies.internal[packageName].push(potentialInternalDep);
          }
        }
      }
    }
    
    // Analyser les références de composants dans les routes Remix
    for (const [appName, appInfo] of Object.entries(this.projectStructure.apps)) {
      if (appInfo.type === 'frontend' && appInfo.routes && appInfo.components) {
        for (const route of appInfo.routes) {
          for (const componentUsed of route.componentsUsed) {
            for (const component of appInfo.components) {
              if (component.name === componentUsed) {
                if (!component.exportsTo.includes(route.filePath)) {
                  component.exportsTo.push(route.filePath);
                }
              }
            }
          }
        }
      }
    }
    
    this.logger.info('✅ Analyse des dépendances croisées terminée');
  }

  /**
   * Analyse du style de code global
   */
  private async analyzeCodeStyle(): Promise<void> {
    this.logger.info('🔍 Analyse du style de code global...');
    
    // Échantillons de fichiers pour l'analyse du style
    const tsFiles = await globAsync(path.join(this.options.root, '**/*.ts'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    const tsxFiles = await globAsync(path.join(this.options.root, '**/*.tsx'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    // Limiter à un nombre raisonnable de fichiers
    const sampleTsFiles = tsFiles.slice(0, 50);
    const sampleTsxFiles = tsxFiles.slice(0, 50);
    const sampleFiles = [...sampleTsFiles, ...sampleTsxFiles];
    
    // Compteurs pour les statistiques
    let spacesCount = 0;
    let tabsCount = 0;
    let singleQuotesCount = 0;
    let doubleQuotesCount = 0;
    let semicolonsCount = 0;
    let noSemicolonsCount = 0;
    let sameLine = 0;
    let newLine = 0;
    let lineLength: number[] = [];
    let trailingComma = 0;
    let noTrailingComma = 0;
    
    // Détection des modèles de nommage des composants
    let pascalCaseCount = 0;
    let camelCaseCount = 0;
    let kebabCaseCount = 0;
    
    // Ordre des imports
    const importGroups: { [prefix: string]: number } = {
      'react': 0,
      '@remix-run': 0,
      '@nestjs': 0,
      '@fafa': 0,
      '~': 0,
      './': 0,
      '../': 0
    };
    
    // Analyser chaque fichier échantillon
    for (const file of sampleFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        
        // Indentation
        const indentMatch = lines.find(line => line.match(/^\s+/))?.match(/^(\s+)/);
        if (indentMatch) {
          const indent = indentMatch[1];
          if (indent.includes('\t')) {
            tabsCount++;
          } else {
            spacesCount++;
            // Détecter la taille d'indentation (2 ou 4 espaces)
          }
        }
        
        // Guillemets
        singleQuotesCount += (content.match(/'/g) || []).length;
        doubleQuotesCount += (content.match(/"/g) || []).length;
        
        // Point-virgules
        semicolonsCount += (content.match(/;\s*(?:\/\/|\/\*|$)/g) || []).length;
        noSemicolonsCount += (content.match(/[^\s;]\s*(?:\/\/|\/\*|$)/g) || []).length;
        
        // Style d'accolades
        sameLine += (content.match(/\)\s*{/g) || []).length;
        newLine += (content.match(/\)\s*\n\s*{/g) || []).length;
        
        // Longueur de ligne
        for (const line of lines) {
          if (line.trim().length > 0) {
            lineLength.push(line.length);
          }
        }
        
        // Virgules terminales
        trailingComma += (content.match(/,\s*\n\s*\}/g) || []).length;
        noTrailingComma += (content.match(/[^,]\s*\n\s*\}/g) || []).length;
        
        // Nommage des composants (pour .tsx)
        if (file.endsWith('.tsx')) {
          const componentDeclarations = content.match(/export (?:default )?function (\w+)/g) || [];
          for (const decl of componentDeclarations) {
            const name = decl.replace(/export (?:default )?function /, '');
            if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
              pascalCaseCount++;
            } else if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
              camelCaseCount++;
            } else if (/^[a-z]+(-[a-z]+)*$/.test(name)) {
              kebabCaseCount++;
            }
          }
        }
        
        // Ordre des imports
        const importLines = content.match(/import .* from ['"]([^'"]*)['"]/g) || [];
        for (const importLine of importLines) {
          const importPath = importLine.match(/from ['"]([^'"]*)['"]/)[1];
          
          for (const [prefix, _] of Object.entries(importGroups)) {
            if (importPath.startsWith(prefix)) {
              importGroups[prefix]++;
              break;
            }
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse du style de ${file}: ${error.message}`);
      }
    }
    
    // Détermination du style dominant
    const indentationType = spacesCount > tabsCount ? 'spaces' : 'tabs';
    const indentationSize = indentationType === 'spaces' ? 2 : 1; // Par défaut 2 espaces
    const quoteStyle = singleQuotesCount > doubleQuotesCount ? 'single' : 'double';
    const useSemicolons = semicolonsCount > noSemicolonsCount;
    const braceStyle = sameLine > newLine ? 'same-line' : 'new-line';
    const useTrailingComma = trailingComma > noTrailingComma;
    
    // Calcul de la longueur de ligne médiane
    lineLength.sort((a, b) => a - b);
    const medianLineLength = lineLength[Math.floor(lineLength.length / 2)] || 80;
    
    // Détermination du style de nommage des composants
    let componentNaming: 'PascalCase' | 'camelCase' | 'kebab-case' = 'PascalCase';
    if (camelCaseCount > pascalCaseCount && camelCaseCount > kebabCaseCount) {
      componentNaming = 'camelCase';
    } else if (kebabCaseCount > pascalCaseCount && kebabCaseCount > camelCaseCount) {
      componentNaming = 'kebab-case';
    }
    
    // Détermination de l'ordre des imports
    const importOrder = Object.entries(importGroups)
      .sort((a, b) => b[1] - a[1])
      .map(([prefix]) => prefix);
    
    // Mise à jour du profil de style de code
    this.codeStyleProfile = {
      indentation: {
        type: indentationType,
        size: indentationSize
      },
      quotes: quoteStyle,
      semicolons: useSemicolons,
      maxLineLength: medianLineLength,
      componentNaming,
      importOrder,
      braceStyle,
      trailingComma: useTrailingComma
    };
    
    this.logger.info('✅ Analyse du style de code terminée');
  }

  /**
   * Analyse des chemins d'import et alias
   */
  private async analyzeImportPaths(): Promise<void> {
    this.logger.info('🔍 Analyse des chemins d\'import et alias...');
    
    // Alias déjà détectés depuis tsconfig.json
    const aliasUsageCount: { [alias: string]: number } = {};
    Object.keys(this.importPathsMap).forEach(alias => {
      aliasUsageCount[alias] = 0;
    });
    
    // Recherche de tous les fichiers TypeScript/TSX
    const tsFiles = await globAsync(path.join(this.options.root, '**/*.{ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    // Analyser chaque fichier pour les imports
    for (const file of tsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Recherche des imports
        const importRegex = /import .* from ['"]([^'"]*)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          
          // Vérifier si l'import utilise un alias connu
          for (const alias of Object.keys(this.importPathsMap)) {
            if (importPath.startsWith(alias)) {
              aliasUsageCount[alias]++;
              break;
            }
          }
          
          // Détecter d'autres patterns d'alias potentiels
          if (importPath.startsWith('@/') || 
              importPath.startsWith('~/') || 
              importPath.startsWith('#/')) {
            const newAlias = importPath.split('/')[0];
            if (!this.importPathsMap[newAlias]) {
              // Ajouter un alias potentiel
              this.importPathsMap[newAlias] = '[chemin non résolu]';
              aliasUsageCount[newAlias] = 1;
            } else {
              aliasUsageCount[newAlias]++;
            }
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse des imports dans ${file}: ${error.message}`);
      }
    }
    
    // Mise à jour des usages d'alias
    for (const [alias, count] of Object.entries(aliasUsageCount)) {
      this.logger.info(`📊 Alias '${alias}' utilisé ${count} fois`);
    }
    
    this.logger.info('✅ Analyse des chemins d\'import terminée');
  }

  /**
   * Analyse des patterns de composants Remix
   */
  private async analyzeRemixPatterns(): Promise<void> {
    this.logger.info('🔍 Analyse des patterns de composants Remix...');
    
    // Structure pour stocker les patterns
    const componentPatterns = {
      common: {
        imports: {},
        hooks: {},
        props: {},
        naming: this.codeStyleProfile.componentNaming
      },
      types: {
        form: [],
        layout: [],
        display: [],
        navigation: []
      },
      bestPractices: []
    };
    
    // Collecter tous les composants de toutes les apps Remix
    const allComponents: RemixComponentInfo[] = [];
    
    for (const appInfo of Object.values(this.projectStructure.apps)) {
      if (appInfo.type === 'frontend' && appInfo.components) {
        allComponents.push(...appInfo.components);
      }
    }
    
    // Compteurs pour les imports, hooks et props
    const importCounts: { [importPath: string]: number } = {};
    const hookCounts: { [hookName: string]: number } = {};
    const propCounts: { [propName: string]: number } = {};
    
    // Analyser les patterns des composants
    for (const component of allComponents) {
      // Comptage des imports
      for (const importPath of component.importsFrom) {
        importCounts[importPath] = (importCounts[importPath] || 0) + 1;
      }
      
      // Comptage des hooks
      for (const hook of component.hooks) {
        hookCounts[hook] = (hookCounts[hook] || 0) + 1;
      }
      
      // Comptage des props
      for (const prop of component.props) {
        propCounts[prop] = (propCounts[prop] || 0) + 1;
      }
      
      // Catégorisation des composants par type
      if (component.name.includes('Form') || component.name.includes('Input') ||
          component.props.includes('onSubmit') || component.props.includes('validation')) {
        if (!componentPatterns.types.form.includes(component.name)) {
          componentPatterns.types.form.push(component.name);
        }
      } else if (component.name.includes('Layout') || component.name.includes('Container') ||
                component.props.includes('children')) {
        if (!componentPatterns.types.layout.includes(component.name)) {
          componentPatterns.types.layout.push(component.name);
        }
      } else if (component.name.includes('Card') || component.name.includes('Display') ||
                component.name.includes('View')) {
        if (!componentPatterns.types.display.includes(component.name)) {
          componentPatterns.types.display.push(component.name);
        }
      } else if (component.name.includes('Nav') || component.name.includes('Menu') ||
                component.name.includes('Link') || component.name.includes('Button')) {
        if (!componentPatterns.types.navigation.includes(component.name)) {
          componentPatterns.types.navigation.push(component.name);
        }
      }
    }
    
    // Trier et limiter aux plus fréquents
    const sortAndLimit = (counts: { [key: string]: number }, limit: number = 20) => {
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .reduce((acc, [key, count]) => {
          acc[key] = count;
          return acc;
        }, {} as { [key: string]: number });
    };
    
    // Mise à jour des patterns
    componentPatterns.common.imports = sortAndLimit(importCounts);
    componentPatterns.common.hooks = sortAndLimit(hookCounts);
    componentPatterns.common.props = sortAndLimit(propCounts);
    
    // Ajouter quelques bonnes pratiques basées sur l'analyse
    componentPatterns.bestPractices = [
      'Les composants suivent la convention de nommage ' + this.codeStyleProfile.componentNaming,
      'Les props sont typées avec des interfaces TypeScript',
      'Les hooks React sont préférés aux classes',
      'Les composants sont organisés par fonction (form, layout, etc.)'
    ];
    
    // Stocker les patterns
    this.remixComponentPatterns = componentPatterns;
    
    this.logger.info('✅ Analyse des patterns de composants Remix terminée');
  }

  /**
   * Analyse des patterns de modules NestJS
   */
  private async analyzeNestJSPatterns(): Promise<void> {
    this.logger.info('🔍 Analyse des patterns de modules NestJS...');
    
    // Structure pour stocker les patterns
    const modulePatterns = {
      common: {
        decorators: {},
        imports: {},
        naming: {
          controllers: [],
          services: [],
          modules: []
        }
      },
      structure: {
        controllers: {},
        services: {},
        dtos: {},
        guards: {}
      },
      bestPractices: []
    };
    
    // Collecter tous les modules de toutes les apps NestJS
    const allModules: NestJSModuleInfo[] = [];
    const allControllers: string[] = [];
    const allServices: string[] = [];
    const allDtos: string[] = [];
    const allGuards: string[] = [];
    
    for (const appInfo of Object.values(this.projectStructure.apps)) {
      if ((appInfo.type === 'backend' || appInfo.type === 'mcp-server') && appInfo.modules) {
        allModules.push(...appInfo.modules);
        
        if (appInfo.controllers) allControllers.push(...appInfo.controllers);
        if (appInfo.services) allServices.push(...appInfo.services);
        if (appInfo.dtos) allDtos.push(...appInfo.dtos);
        if (appInfo.guards) allGuards.push(...appInfo.guards);
      }
    }
    
    // Compteurs pour les décorateurs et imports
    const decoratorCounts: { [decoratorName: string]: number } = {};
    const importCounts: { [importName: string]: number } = {};
    
    // Analyser les patterns des modules
    for (const module of allModules) {
      // Comptage des décorateurs
      for (const decorator of module.decorators) {
        decoratorCounts[decorator] = (decoratorCounts[decorator] || 0) + 1;
      }
      
      // Comptage des imports
      for (const importName of module.imports) {
        importCounts[importName] = (importCounts[importName] || 0) + 1;
      }
      
      // Analyse du nommage des modules
      if (!modulePatterns.common.naming.modules.includes(module.name) &&
          modulePatterns.common.naming.modules.length < 10) {
        modulePatterns.common.naming.modules.push(module.name);
      }
    }
    
    // Analyse des conventions de nommage
    for (const controller of allControllers) {
      if (!modulePatterns.common.naming.controllers.includes(controller) &&
          modulePatterns.common.naming.controllers.length < 10) {
        modulePatterns.common.naming.controllers.push(controller);
      }
    }
    
    for (const service of allServices) {
      if (!modulePatterns.common.naming.services.includes(service) &&
          modulePatterns.common.naming.services.length < 10) {
        modulePatterns.common.naming.services.push(service);
      }
    }
    
    // Trier et limiter aux plus fréquents
    const sortAndLimit = (counts: { [key: string]: number }, limit: number = 10) => {
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .reduce((acc, [key, count]) => {
          acc[key] = count;
          return acc;
        }, {} as { [key: string]: number });
    };
    
    // Mise à jour des patterns
    modulePatterns.common.decorators = sortAndLimit(decoratorCounts);
    modulePatterns.common.imports = sortAndLimit(importCounts);
    
    // Structure typique
    modulePatterns.structure = {
      controllers: {
        suffix: 'Controller',
        decorators: ['@Controller'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      services: {
        suffix: 'Service',
        decorators: ['@Injectable'],
        patterns: ['constructor injection', 'async/await']
      },
      dtos: {
        suffix: 'Dto',
        decorators: ['@IsString', '@IsNumber', '@IsOptional', '@ValidateNested'],
        validation: 'class-validator'
      },
      guards: {
        suffix: 'Guard',
        decorators: ['@Injectable', '@CanActivate'],
        patterns: ['JWT', 'Role-based']
      }
    };
    
    // Ajouter quelques bonnes pratiques basées sur l'analyse
    modulePatterns.bestPractices = [
      'Les modules suivent une structure logique et cohérente',
      'Utilisation de l\'injection de dépendances via le constructeur',
      'Séparation claire entre controllers, services et DTOs',
      'Validation des données avec class-validator',
      'Pattern Repository pour l\'accès aux données'
    ];
    
    // Stocker les patterns
    this.nestJSModulePatterns = modulePatterns;
    
    this.logger.info('✅ Analyse des patterns de modules NestJS terminée');
  }

  /**
   * Analyse des tokens Tailwind
   */
  private async analyzeTailwindTokens(): Promise<void> {
    this.logger.info('🔍 Analyse des tokens Tailwind...');
    
    // Recherche du fichier de configuration Tailwind
    const tailwindConfigPaths = [
      path.join(this.options.root, 'tailwind.config.js'),
      path.join(this.options.root, 'tailwind.config.ts')
    ];
    
    let tailwindConfigPath = '';
    for (const configPath of tailwindConfigPaths) {
      try {
        await fs.access(configPath);
        tailwindConfigPath = configPath;
        break;
      } catch {
        // Fichier non trouvé, continuer
      }
    }
    
    if (!tailwindConfigPath) {
      this.logger.warn('⚠️ Pas de fichier de configuration Tailwind trouvé');
      return;
    }
    
    try {
      const content = await fs.readFile(tailwindConfigPath, 'utf8');
      
      // Extraction des couleurs
      const colorRegex = /colors:\s*{([^}]*)}/;
      const colorMatch = content.match(colorRegex);
      
      if (colorMatch) {
        const colorStr = colorMatch[1];
        const colorEntries = colorStr.split(',').map(entry => entry.trim());
        
        for (const entry of colorEntries) {
          const [key, value] = entry.split(':').map(part => part.trim());
          if (key && value) {
            this.tailwindTokens.push({
              type: 'color',
              name: key.replace(/['"]/g, ''),
              value: value.replace(/['"]/g, '')
            });
          }
        }
      }
      
      // Extraction des espacements
      const spacingRegex = /spacing:\s*{([^}]*)}/;
      const spacingMatch = content.match(spacingRegex);
      
      if (spacingMatch) {
        const spacingStr = spacingMatch[1];
        const spacingEntries = spacingStr.split(',').map(entry => entry.trim());
        
        for (const entry of spacingEntries) {
          const [key, value] = entry.split(':').map(part => part.trim());
          if (key && value) {
            this.tailwindTokens.push({
              type: 'spacing',
              name: key.replace(/['"]/g, ''),
              value: value.replace(/['"]/g, '')
            });
          }
        }
      }
      
      // Extraction des breakpoints
      const breakpointsRegex = /screens:\s*{([^}]*)}/;
      const breakpointsMatch = content.match(breakpointsRegex);
      
      if (breakpointsMatch) {
        const breakpointsStr = breakpointsMatch[1];
        const breakpointEntries = breakpointsStr.split(',').map(entry => entry.trim());
        
        for (const entry of breakpointEntries) {
          const [key, value] = entry.split(':').map(part => part.trim());
          if (key && value) {
            this.tailwindTokens.push({
              type: 'breakpoint',
              name: key.replace(/['"]/g, ''),
              value: value.replace(/['"]/g, '')
            });
          }
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de l'analyse du fichier Tailwind: ${error.message}`);
    }
    
    this.logger.info(`✅ Analyse des tokens Tailwind terminée: ${this.tailwindTokens.length} tokens trouvés`);
  }

  /**
   * Analyse du schéma Prisma
   */
  private async analyzePrismaSchema(): Promise<void> {
    this.logger.info('🔍 Analyse du schéma Prisma...');
    
    // Recherche du fichier schema.prisma
    const prismaSchemaPath = path.join(this.options.root, 'prisma', 'schema.prisma');
    
    try {
      // Vérifier si le fichier existe
      await fs.access(prismaSchemaPath);
      
      // Lire le contenu du fichier
      const content = await fs.readFile(prismaSchemaPath, 'utf8');
      
      // Initialiser les structures pour l'analyse Prisma
      const prismaModels: PrismaModelInfo[] = [];
      let dataSourceProvider = 'unknown';
      const migrations: string[] = [];
      
      // Extraction du fournisseur de base de données
      const providerMatch = content.match(/provider\s*=\s*["']([^"']+)["']/);
      if (providerMatch) {
        dataSourceProvider = providerMatch[1];
      }
      
      // Extraction des modèles
      const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
      let modelMatch;
      
      while ((modelMatch = modelRegex.exec(content)) !== null) {
        const modelName = modelMatch[1];
        const modelContent = modelMatch[2];
        
        // Analyse des champs
        const fields: PrismaModelInfo['fields'] = [];
        const fieldLines = modelContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        
        for (const line of fieldLines) {
          const fieldMatch = line.match(/(\w+)\s+(\w+)(\?)?(\[\])?(.+)?/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            const fieldType = fieldMatch[2] + (fieldMatch[4] || '');
            const isRequired = !fieldMatch[3];
            const restOfLine = fieldMatch[5] || '';
            
            const isUnique = restOfLine.includes('@unique');
            const isId = restOfLine.includes('@id');
            const hasDefault = restOfLine.includes('@default');
            
            // Détection des relations
            const relations: string[] = [];
            const relationMatch = restOfLine.match(/@relation\([^)]*ref:\s*\[([^\]]+)\]/);
            if (relationMatch) {
              relations.push(relationMatch[1]);
            }
            
            fields.push({
              name: fieldName,
              type: fieldType,
              isRequired,
              isUnique,
              isId,
              hasDefault,
              relations
            });
          }
        }
        
        // Analyse des relations
        const relations: PrismaModelInfo['relations'] = [];
        const relationRegex = /@relation\(([^)]+)\)/g;
        const modelContentStr = modelContent.toString();
        let relationMatch;
        
        while ((relationMatch = relationRegex.exec(modelContentStr)) !== null) {
          const relationContent = relationMatch[1];
          
          const nameMatch = relationContent.match(/name:\s*["']([^"']+)["']/);
          const refMatch = relationContent.match(/references:\s*\[([^\]]+)\]/);
          
          if (nameMatch && refMatch) {
            // Déterminer le type de relation
            let relationType: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany' = 'oneToOne';
            
            if (relationContent.includes('fields: [') && !modelContentStr.includes('[]')) {
              relationType = 'manyToOne';
            } else if (!relationContent.includes('fields: [') && modelContentStr.includes('[]')) {
              relationType = 'oneToMany';
            } else if (relationContent.includes('fields: [') && modelContentStr.includes('[]')) {
              relationType = 'manyToMany';
            }
            
            relations.push({
              name: nameMatch[1],
              relatedModel: refMatch[1].split('.')[0],
              relationType
            });
          }
        }
        
        prismaModels.push({
          name: modelName,
          fields,
          relations
        });
      }
      
      // Lister les migrations
      const migrationsDir = path.join(this.options.root, 'prisma', 'migrations');
      try {
        const migrationFolders = await fs.readdir(migrationsDir);
        
        for (const folder of migrationFolders) {
          const migrationPath = path.join(migrationsDir, folder);
          const stats = await fs.stat(migrationPath);
          
          if (stats.isDirectory()) {
            migrations.push(folder);
          }
        }
      } catch (error) {
        this.logger.warn('⚠️ Pas de dossier migrations trouvé ou erreur de lecture');
      }
      
      // Mettre à jour la structure du projet
      this.projectStructure.prisma = {
        models: prismaModels,
        dataSourceProvider,
        migrations
      };
      
      this.logger.info(`✅ Analyse du schéma Prisma terminée: ${prismaModels.length} modèles, ${migrations.length} migrations`);
    } catch (error) {
      this.logger.warn('⚠️ Pas de schéma Prisma trouvé ou erreur d\'analyse');
    }
  }

  /**
   * Analyse des tests et de la couverture
   */
  private async analyzeTests(): Promise<void> {
    this.logger.info('🔍 Analyse des tests...');
    
    // Détection du framework de test
    let testFramework = 'unknown';
    const packageJsonPath = path.join(this.options.root, 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      const devDependencies = packageJson.devDependencies || {};
      
      if (devDependencies.jest) {
        testFramework = 'jest';
      } else if (devDependencies.vitest) {
        testFramework = 'vitest';
      } else if (devDependencies.mocha) {
        testFramework = 'mocha';
      } else if (devDependencies['@testing-library/react']) {
        testFramework = 'testing-library';
      } else if (devDependencies.cypress) {
        testFramework = 'cypress';
      }
    } catch (error) {
      this.logger.warn('⚠️ Pas de package.json trouvé ou erreur de lecture');
    }
    
    // Recherche des fichiers de test
    const testFilePatterns = [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/tests/**/*.{js,jsx,ts,tsx}',
      '**/e2e/**/*.{js,jsx,ts,tsx}',
      '**/cypress/**/*.{js,jsx,ts,tsx}'
    ];
    
    const testFiles = [];
    
    for (const pattern of testFilePatterns) {
      const files = await globAsync(path.join(this.options.root, pattern), {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
      });
      
      testFiles.push(...files);
    }
    
    // Vérifier les types de tests
    const e2eTestsPresent = testFiles.some(file => 
      file.includes('/e2e/') || 
      file.includes('/cypress/') || 
      file.includes('.e2e.') ||
      file.includes('/integration/')
    );
    
    const unitTestsPresent = testFiles.some(file => 
      !file.includes('/e2e/') && 
      !file.includes('/cypress/') && 
      !file.includes('.e2e.') &&
      !file.includes('/integration/')
    );
    
    // Analyse sommaire de la couverture de tests
    const coverageReport: TestCoverageInfo[] = [];
    
    // Lister les fichiers source qui devraient avoir des tests
    const sourceFiles = await globAsync(path.join(this.options.root, '**/*.{js,jsx,ts,tsx}'), {
      ignore: [
        '**/node_modules/**', 
        '**/dist/**', 
        '**/.next/**', 
        '**/build/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/tests/**',
        '**/e2e/**',
        '**/cypress/**'
      ]
    });
    
    // Pour chaque fichier source, vérifier s'il existe un test correspondant
    for (const sourceFile of sourceFiles) {
      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const dirName = path.dirname(sourceFile);
      
      // Chercher des tests qui correspondent à ce fichier source
      const relatedTestFiles = testFiles.filter(testFile => {
        const testBaseName = path.basename(testFile, path.extname(testFile))
          .replace('.test', '')
          .replace('.spec', '');
        
        return testBaseName === baseName || testFile.includes(`/${baseName}.`);
      });
      
      if (relatedTestFiles.length > 0) {
        coverageReport.push({
          filePath: sourceFile,
          hasCoverage: true,
          testFiles: relatedTestFiles
        });
      } else {
        coverageReport.push({
          filePath: sourceFile,
          hasCoverage: false,
          testFiles: []
        });
      }
    }
    
    // Mettre à jour la structure du projet
    this.projectStructure.tests = {
      framework: testFramework,
      coverageReport,
      e2eTestsPresent,
      unitTestsPresent
    };
    
    const fileWithCoverage = coverageReport.filter(report => report.hasCoverage).length;
    const totalFiles = coverageReport.length;
    const coveragePercentage = totalFiles > 0 ? (fileWithCoverage / totalFiles) * 100 : 0;
    
    this.logger.info(`✅ Analyse des tests terminée: ${testFiles.length} fichiers de test trouvés, couverture approximative: ${coveragePercentage.toFixed(2)}%`);
  }

  /**
   * Analyse de la documentation
   */
  private async analyzeDocumentation(): Promise<void> {
    this.logger.info('🔍 Analyse de la documentation...');
    
    // Recherche des fichiers README
    const readmeFiles = await globAsync(path.join(this.options.root, '**/README.md'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    // Vérifier la présence de docs API (ex: Swagger, OpenAPI)
    const apiDocPatterns = [
      '**/swagger.json',
      '**/openapi.json',
      '**/swagger.yaml',
      '**/openapi.yaml',
      '**/api-docs/**',
      '**/docs/api/**'
    ];
    
    let apiDocsPresent = false;
    
    for (const pattern of apiDocPatterns) {
      const files = await globAsync(path.join(this.options.root, pattern), {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
      });
      
      if (files.length > 0) {
        apiDocsPresent = true;
        break;
      }
    }
    
    // Vérifier la présence de docs de composants (ex: Storybook)
    const componentDocPatterns = [
      '**/.storybook/**',
      '**/stories/**',
      '**/*.stories.{js,jsx,ts,tsx}',
      '**/docs/components/**'
    ];
    
    let componentDocsPresent = false;
    
    for (const pattern of componentDocPatterns) {
      const files = await globAsync(path.join(this.options.root, pattern), {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
      });
      
      if (files.length > 0) {
        componentDocsPresent = true;
        break;
      }
    }
    
    // Mettre à jour la structure du projet
    this.projectStructure.documentation = {
      apiDocs: apiDocsPresent,
      componentDocs: componentDocsPresent,
      readmeFiles
    };
    
    this.logger.info(`✅ Analyse de la documentation terminée: ${readmeFiles.length} fichiers README, API docs: ${apiDocsPresent ? 'Oui' : 'Non'}, Component docs: ${componentDocsPresent ? 'Oui' : 'Non'}`);
  }

  /**
   * Analyse CI/CD
   */
  private async analyzeCICD(): Promise<void> {
    this.logger.info('🔍 Analyse CI/CD...');
    
    // Détection du système CI/CD utilisé
    let cicdProvider = 'unknown';
    const workflows: string[] = [];
    const stages: string[] = [];
    
    // GitHub Actions
    const githubWorkflowsDir = path.join(this.options.root, '.github', 'workflows');
    try {
      const workflowFiles = await fs.readdir(githubWorkflowsDir);
      
      if (workflowFiles.length > 0) {
        cicdProvider = 'github-actions';
        
        // Analyser chaque workflow
        for (const file of workflowFiles) {
          workflows.push(file);
          
          // Lire le fichier pour extraire les étapes
          const filePath = path.join(githubWorkflowsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Extraire les jobs
          const jobsMatch = content.match(/jobs:([\s\S]+?)(?:on:|$)/);
          if (jobsMatch) {
            const jobsContent = jobsMatch[1];
            const jobNames = jobsContent.match(/\s+(\w+):/g);
            
            if (jobNames) {
              for (const jobName of jobNames) {
                const name = jobName.trim().replace(':', '');
                if (!stages.includes(name)) {
                  stages.push(name);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Pas de GitHub Actions
    }
    
    // GitLab CI
    const gitlabCIPath = path.join(this.options.root, '.gitlab-ci.yml');
    try {
      await fs.access(gitlabCIPath);
      cicdProvider = 'gitlab-ci';
      
      const content = await fs.readFile(gitlabCIPath, 'utf8');
      
      // Extraire les étapes
      const stageMatch = content.match(/stages:([\s\S]+?)(?:\w+:|$)/);
      if (stageMatch) {
        const stagesContent = stageMatch[1];
        const stageMatches = stagesContent.match(/\s+- (\w+)/g);
        
        if (stageMatches) {
          for (const stageMatch of stageMatches) {
            const stage = stageMatch.trim().replace('- ', '');
            if (!stages.includes(stage)) {
              stages.push(stage);
            }
          }
        }
      }
      
      workflows.push('.gitlab-ci.yml');
    } catch (error) {
      // Pas de GitLab CI
    }
    
    // CircleCI
    const circleCIPath = path.join(this.options.root, '.circleci', 'config.yml');
    try {
      await fs.access(circleCIPath);
      cicdProvider = 'circleci';
      
      const content = await fs.readFile(circleCIPath, 'utf8');
      
      // Extraire les jobs
      const jobsMatch = content.match(/jobs:([\s\S]+?)(?:\w+:|$)/);
      if (jobsMatch) {
        const jobsContent = jobsMatch[1];
        const jobMatches = jobsContent.match(/\s+(\w+):/g);
        
        if (jobMatches) {
          for (const jobMatch of jobMatches) {
            const job = jobMatch.trim().replace(':', '');
            if (!stages.includes(job)) {
              stages.push(job);
            }
          }
        }
      }
      
      workflows.push('config.yml');
    } catch (error) {
      // Pas de CircleCI
    }
    
    // Mettre à jour la structure du projet
    this.projectStructure.cicd = {
      provider: cicdProvider,
      workflows,
      stages
    };
    
    this.logger.info(`✅ Analyse CI/CD terminée: Provider: ${cicdProvider}, ${workflows.length} workflows, ${stages.length} stages`);
  }

  /**
   * Analyse des performances
   */
  private async analyzePerformance(): Promise<void> {
    this.logger.info('🔍 Analyse des performances (statique)...');
    
    const routePerformance: RoutePerformanceInfo[] = [];
    
    // Obtenir toutes les routes frontend pour l'analyse
    for (const appInfo of Object.values(this.projectStructure.apps)) {
      if (appInfo.type === 'frontend' && appInfo.routes) {
        for (const route of appInfo.routes) {
          try {
            const content = await fs.readFile(route.filePath, 'utf8');
            
            // Estimation simplifiée de la taille du bundle (nombre de lignes * caractères moyens)
            const lines = content.split('\n');
            const bundleSize = lines.length * 40; // Estimation approximative
            
            // Nombre de dépendances côté serveur
            const serverDependencies = (content.match(/export const loader/g) || []).length +
                                      (content.match(/export const action/g) || []).length;
            
            // Nombre de dépendances côté client
            const clientDependencies = (content.match(/import /g) || []).length;
            
            // Potentielles optimisations
            const potentialOptimizations: string[] = [];
            
            if (content.includes('import { useEffect }') && !content.includes('useEffect(() => {')) {
              potentialOptimizations.push('Hooks useEffect inutilisés');
            }
            
            if (content.includes('console.log')) {
              potentialOptimizations.push('Appels console.log à supprimer');
            }
            
            if ((content.match(/\bimport\s+.*\bfrom\b/g) || []).length > 10) {
              potentialOptimizations.push('Nombreux imports - vérifier fractionnement du code');
            }
            
            if (content.includes('<img ') && !content.includes('loading=') && !content.includes('lazy')) {
              potentialOptimizations.push('Images sans chargement différé');
            }
            
            routePerformance.push({
              routePath: route.routePath,
              averageLoadTime: -1, // Non mesurable statiquement
              bundleSize,
              serverDependencies,
              clientDependencies,
              potentialOptimizations
            });
          } catch (error) {
            this.logger.warn(`⚠️ Erreur lors de l'analyse des performances pour ${route.routePath}: ${error.message}`);
          }
        }
      }
    }
    
    // Mettre à jour la structure du projet
    this.projectStructure.performance = {
      routes: routePerformance
    };
    
    this.logger.info(`✅ Analyse des performances terminée: ${routePerformance.length} routes analysées`);
  }

  /**
   * Analyse de sécurité
   */
  private async analyzeSecurity(): Promise<void> {
    this.logger.info('🔍 Analyse de sécurité...');
    
    const authMechanisms: string[] = [];
    const apiProtection: string[] = [];
    const vulnerabilities: Array<{
      type: string;
      location: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: string;
    }> = [];
    
    // Recherche des mécanismes d'authentification
    const authPatterns = [
      { pattern: 'jwt', name: 'JWT' },
      { pattern: 'passport', name: 'Passport.js' },
      { pattern: 'auth0', name: 'Auth0' },
      { pattern: 'firebase.auth', name: 'Firebase Auth' },
      { pattern: 'session', name: 'Sessions' },
      { pattern: 'cookie', name: 'Cookies' },
      { pattern: 'bcrypt', name: 'Bcrypt' },
      { pattern: 'oauth', name: 'OAuth' }
    ];
    
    // Recherche des mécanismes de protection d'API
    const apiProtectionPatterns = [
      { pattern: 'helmet', name: 'Helmet.js' },
      { pattern: 'cors', name: 'CORS' },
      { pattern: 'csrf', name: 'CSRF Protection' },
      { pattern: 'rate limit', name: 'Rate Limiting' },
      { pattern: 'recaptcha', name: 'ReCAPTCHA' },
      { pattern: 'sanitize', name: 'Input Sanitization' }
    ];
    
    // Motifs de vulnérabilités potentielles
    const vulnerabilityPatterns = [
      { 
        pattern: 'eval\\(', 
        type: 'Injection de code',
        severity: 'critical',
        recommendation: 'Éviter d\'utiliser eval(). Utiliser des alternatives plus sûres.' 
      },
      { 
        pattern: 'innerHTML', 
        type: 'XSS',
        severity: 'high',
        recommendation: 'Préférer textContent ou des alternatives plus sûres comme DOMPurify.' 
      },
      { 
        pattern: 'process.env', 
        type: 'Fuite de données sensibles',
        severity: 'medium',
        recommendation: 'Vérifier que les variables d\'environnement sensibles ne sont pas exposées au client.' 
      },
      { 
        pattern: 'SELECT.*FROM.*WHERE', 
        type: 'Injection SQL potentielle',
        severity: 'high',
        recommendation: 'Utiliser des requêtes paramétrées ou un ORM.' 
      },
      { 
        pattern: '\\.exec\\(', 
        type: 'Injection de commande potentielle',
        severity: 'critical',
        recommendation: 'Éviter d\'exécuter des commandes avec des entrées utilisateur.' 
      }
    ];
    
    // Analyser les fichiers pertinents
    const securityRelevantFiles = await globAsync(path.join(this.options.root, '**/*.{js,jsx,ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}']
    });
    
    for (const file of securityRelevantFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Vérifier les mécanismes d'authentification
        for (const { pattern, name } of authPatterns) {
          if (content.includes(pattern) && !authMechanisms.includes(name)) {
            authMechanisms.push(name);
          }
        }
        
        // Vérifier les mécanismes de protection d'API
        for (const { pattern, name } of apiProtectionPatterns) {
          if (content.includes(pattern) && !apiProtection.includes(name)) {
            apiProtection.push(name);
          }
        }
        
        // Vérifier les vulnérabilités
        for (const { pattern, type, severity, recommendation } of vulnerabilityPatterns) {
          const regex = new RegExp(pattern, 'g');
          let match;
          
          while ((match = regex.exec(content)) !== null) {
            vulnerabilities.push({
              type,
              location: `${file}:${this.getLineNumber(content, match.index)}`,
              severity: severity as 'low' | 'medium' | 'high' | 'critical',
              recommendation
            });
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse de sécurité pour ${file}: ${error.message}`);
      }
    }
    
    // Mettre à jour la structure du projet
    this.projectStructure.security = {
      authMechanisms,
      apiProtection,
      vulnerabilities
    };
    
    this.logger.info(`✅ Analyse de sécurité terminée: ${authMechanisms.length} mécanismes d'auth, ${apiProtection.length} protections API, ${vulnerabilities.length} vulnérabilités potentielles`);
  }

  /**
   * Analyse des librairies utilisées
   */
  private async analyzeLibraries(): Promise<void> {
    this.logger.info('🔍 Analyse des librairies et dépendances...');
    
    // Structure pour stocker l'info des librairies
    interface LibraryInfo {
      name: string;
      version: string;
      type: 'prod' | 'dev';
      location: 'root' | string;
      usage: number;
    }
    
    const libraries: LibraryInfo[] = [];
    
    // Lire le package.json racine
    const rootPackageJsonPath = path.join(this.options.root, 'package.json');
    
    try {
      const content = await fs.readFile(rootPackageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      
      // Extraire les dépendances
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      for (const [name, version] of Object.entries(dependencies)) {
        libraries.push({
          name,
          version: version as string,
          type: 'prod',
          location: 'root',
          usage: 0
        });
      }
      
      for (const [name, version] of Object.entries(devDependencies)) {
        libraries.push({
          name,
          version: version as string,
          type: 'dev',
          location: 'root',
          usage: 0
        });
      }
    } catch (error) {
      this.logger.warn(`⚠️ Pas de package.json racine trouvé ou erreur de lecture: ${error.message}`);
    }
    
    // Lire les package.json des sous-packages
    for (const [appName, appInfo] of Object.entries(this.projectStructure.apps)) {
      const packageJsonPath = path.join(appInfo.path, 'package.json');
      
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        // Extraire les dépendances
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        
        for (const [name, version] of Object.entries(dependencies)) {
          libraries.push({
            name,
            version: version as string,
            type: 'prod',
            location: appName,
            usage: 0
          });
        }
        
        for (const [name, version] of Object.entries(devDependencies)) {
          libraries.push({
            name,
            version: version as string,
            type: 'dev',
            location: appName,
            usage: 0
          });
        }
      } catch (error) {
        // Pas de package.json dans cette app ou erreur de lecture
      }
    }
    
    // Analyser l'utilisation des librairies dans le code
    const allFiles = await globAsync(path.join(this.options.root, '**/*.{js,jsx,ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Vérifier chaque librairie
        for (const library of libraries) {
          // Recherche d'imports standards
          const importRegex = new RegExp(`import .* from ['"]${library.name}(?:/.*)?['"]`, 'g');
          const requireRegex = new RegExp(`require\\(['"]${library.name}(?:/.*)?['"]\\)`, 'g');
          
          const importMatches = content.match(importRegex) || [];
          const requireMatches = content.match(requireRegex) || [];
          
          library.usage += importMatches.length + requireMatches.length;
        }
      } catch (error) {
        this.logger.warn(`⚠️ Erreur lors de l'analyse des librairies pour ${file}: ${error.message}`);
      }
    }
    
    // Mettre à jour les dépendances du monorepo
    this.monorepoDependencies.libraryUsage = libraries.sort((a, b) => b.usage - a.usage);
    
    const mostUsedLibraries = libraries
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)
      .map(lib => `${lib.name} (${lib.usage} usages)`);
    
    this.logger.info(`✅ Analyse des librairies terminée: ${libraries.length} librairies trouvées.`);
    this.logger.info(`📊 Top 10 des librairies les plus utilisées: ${mostUsedLibraries.join(', ')}`);
  }

  /**
   * Analyse GraphQL
   */
  private async analyzeGraphQL(): Promise<void> {
    this.logger.info('🔍 Analyse GraphQL...');
    
    // Structure pour GraphQL
    interface GraphQLSchema {
      types: string[];
      queries: string[];
      mutations: string[];
      subscriptions: string[];
      directives: string[];
    }
    
    // Recherche de fichiers de schéma GraphQL
    const graphqlFiles = await globAsync(path.join(this.options.root, '**/*.{graphql,gql}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    // Également rechercher le schéma dans des fichiers TS/JS
    const tsGraphqlFiles = await globAsync(path.join(this.options.root, '**/{schema,typeDefs}.{ts,js}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
    
    graphqlFiles.push(...tsGraphqlFiles);
    
    if (graphqlFiles.length > 0) {
      const schema: GraphQLSchema = {
        types: [],
        queries: [],
        mutations: [],
        subscriptions: [],
        directives: []
      };
      
      for (const file of graphqlFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          
          // Extraire les types
          const typeRegex = /type\s+(\w+)/g;
          let typeMatch;
          while ((typeMatch = typeRegex.exec(content)) !== null) {
            const typeName = typeMatch[1];
            if (!schema.types.includes(typeName)) {
              schema.types.push(typeName);
            }
          }
          
          // Extraire les queries
          const queryRegex = /type\s+Query\s*{([^}]*)}/;
          const queryMatch = content.match(queryRegex);
          if (queryMatch) {
            const queryContent = queryMatch[1];
            const queryLines = queryContent.split('\n').map(line => line.trim()).filter(Boolean);
            
            for (const line of queryLines) {
              const queryNameMatch = line.match(/(\w+)/);
              if (queryNameMatch && !schema.queries.includes(queryNameMatch[1])) {
                schema.queries.push(queryNameMatch[1]);
              }
            }
          }
          
          // Extraire les mutations
          const mutationRegex = /type\s+Mutation\s*{([^}]*)}/;
          const mutationMatch = content.match(mutationRegex);
          if (mutationMatch) {
            const mutationContent = mutationMatch[1];
            const mutationLines = mutationContent.split('\n').map(line => line.trim()).filter(Boolean);
            
            for (const line of mutationLines) {
              const mutationNameMatch = line.match(/(\w+)/);
              if (mutationNameMatch && !schema.mutations.includes(mutationNameMatch[1])) {
                schema.mutations.push(mutationNameMatch[1]);
              }
            }
          }
          
          // Extraire les subscriptions
          const subscriptionRegex = /type\s+Subscription\s*{([^}]*)}/;
          const subscriptionMatch = content.match(subscriptionRegex);
          if (subscriptionMatch) {
            const subscriptionContent = subscriptionMatch[1];
            const subscriptionLines = subscriptionContent.split('\n').map(line => line.trim()).filter(Boolean);
            
            for (const line of subscriptionLines) {
              const subscriptionNameMatch = line.match(/(\w+)/);
              if (subscriptionNameMatch && !schema.subscriptions.includes(subscriptionNameMatch[1])) {
                schema.subscriptions.push(subscriptionNameMatch[1]);
              }
            }
          }
          
          // Extraire les directives
          const directiveRegex = /directive\s+@(\w+)/g;
          let directiveMatch;
          while ((directiveMatch = directiveRegex.exec(content)) !== null) {
            const directiveName = directiveMatch[1];
            if (!schema.directives.includes(directiveName)) {
              schema.directives.push(directiveName);
            }
          }
        } catch (error) {
          this.logger.warn(`⚠️ Erreur lors de l'analyse GraphQL pour ${file}: ${error.message}`);
        }
      }
      
      // Mettre à jour la structure du projet
      this.projectStructure.graphql = schema;
      
      this.logger.info(`✅ Analyse GraphQL terminée: ${schema.types.length} types, ${schema.queries.length} queries, ${schema.mutations.length} mutations`);
    } else {
      this.logger.info('ℹ️ Aucun fichier GraphQL trouvé');
    }
  }

  /**
   * Obtenir le numéro de ligne à partir de l'index du caractère
   */
  private getLineNumber(content: string, charIndex: number): number {
    const lines = content.slice(0, charIndex).split('\n');
    return lines.length;
  }

  /**
   * Écriture des fichiers de résultats
   */
  private async writeResults(outputDir: string): Promise<void> {
    this.logger.info('📝 Écriture des fichiers de résultats...');
    
    // Écriture de project_structure.json
    await fs.writeFile(
      path.join(outputDir, 'project_structure.json'),
      JSON.stringify(this.projectStructure, null, 2),
      'utf8'
    );
    this.logger.info('✅ project_structure.json généré');
    
    // Écriture de monorepo_dependencies.json
    await fs.writeFile(
      path.join(outputDir, 'monorepo_dependencies.json'),
      JSON.stringify(this.monorepoDependencies, null, 2),
      'utf8'
    );
    this.logger.info('✅ monorepo_dependencies.json généré');
    
    // Écriture de import_paths_map.json
    await fs.writeFile(
      path.join(outputDir, 'import_paths_map.json'),
      JSON.stringify(this.importPathsMap, null, 2),
      'utf8'
    );
    this.logger.info('✅ import_paths_map.json généré');
    
    // Écriture de remix_component_patterns.json
    await fs.writeFile(
      path.join(outputDir, 'remix_component_patterns.json'),
      JSON.stringify(this.remixComponentPatterns, null, 2),
      'utf8'
    );
    this.logger.info('✅ remix_component_patterns.json généré');
    
    // Écriture de nestjs_module_patterns.json
    await fs.writeFile(
      path.join(outputDir, 'nestjs_module_patterns.json'),
      JSON.stringify(this.nestJSModulePatterns, null, 2),
      'utf8'
    );
    this.logger.info('✅ nestjs_module_patterns.json généré');
    
    // Écriture de tailwind_tokens.json
    await fs.writeFile(
      path.join(outputDir, 'tailwind_tokens.json'),
      JSON.stringify(this.tailwindTokens, null, 2),
      'utf8'
    );
    this.logger.info('✅ tailwind_tokens.json généré');
    
    // Écriture de code_style_profile.json
    await fs.writeFile(
      path.join(outputDir, 'code_style_profile.json'),
      JSON.stringify(this.codeStyleProfile, null, 2),
      'utf8'
    );
    this.logger.info('✅ code_style_profile.json généré');
    
    // NOUVEAUX FICHIERS GÉNÉRÉS
    
    // Écriture de prisma_models.json si applicable
    if (this.projectStructure.prisma) {
      await fs.writeFile(
        path.join(outputDir, 'prisma_models.json'),
        JSON.stringify(this.projectStructure.prisma, null, 2),
        'utf8'
      );
      this.logger.info('✅ prisma_models.json généré');
    }
    
    // Écriture de tests_coverage.json
    if (this.projectStructure.tests) {
      await fs.writeFile(
        path.join(outputDir, 'tests_coverage.json'),
        JSON.stringify(this.projectStructure.tests, null, 2),
        'utf8'
      );
      this.logger.info('✅ tests_coverage.json généré');
    }
    
    // Écriture de security_analysis.json
    if (this.projectStructure.security) {
      await fs.writeFile(
        path.join(outputDir, 'security_analysis.json'),
        JSON.stringify(this.projectStructure.security, null, 2),
        'utf8'
      );
      this.logger.info('✅ security_analysis.json généré');
    }
    
    // Écriture de performance_insights.json
    if (this.projectStructure.performance) {
      await fs.writeFile(
        path.join(outputDir, 'performance_insights.json'),
        JSON.stringify(this.projectStructure.performance, null, 2),
        'utf8'
      );
      this.logger.info('✅ performance_insights.json généré');
    }
    
    // Écriture de documentation_status.json
    if (this.projectStructure.documentation) {
      await fs.writeFile(
        path.join(outputDir, 'documentation_status.json'),
        JSON.stringify(this.projectStructure.documentation, null, 2),
        'utf8'
      );
      this.logger.info('✅ documentation_status.json généré');
    }
    
    // Écriture de library_usage.json
    if (this.monorepoDependencies.libraryUsage) {
      await fs.writeFile(
        path.join(outputDir, 'library_usage.json'),
        JSON.stringify(this.monorepoDependencies.libraryUsage, null, 2),
        'utf8'
      );
      this.logger.info('✅ library_usage.json généré');
    }
    
    // Écriture de graphql_schema.json si applicable
    if (this.projectStructure.graphql) {
      await fs.writeFile(
        path.join(outputDir, 'graphql_schema.json'),
        JSON.stringify(this.projectStructure.graphql, null, 2),
        'utf8'
      );
      this.logger.info('✅ graphql_schema.json généré');
    }
    
    // Génération d'un rapport sommaire en markdown
    const summaryContent = this.generateSummaryReport();
    await fs.writeFile(
      path.join(outputDir, 'analysis_summary.md'),
      summaryContent,
      'utf8'
    );
    this.logger.info('✅ analysis_summary.md généré');
    
    this.logger.info('🎉 Tous les fichiers de résultats ont été générés avec succès dans ' + outputDir);
  }

  /**
   * Génération d'un rapport sommaire en markdown
   */
  private generateSummaryReport(): string {
    const now = new Date().toISOString();
    
    let summary = `# Rapport d'analyse du monorepo\n\n`;
    summary += `Date de génération: ${now}\n\n`;
    summary += `## Structure du projet\n\n`;
    
    // Apps
    summary += `### Applications\n\n`;
    summary += `| Nom | Type | Modules | Routes | Composants |\n`;
    summary += `|-----|------|---------|--------|------------|\n`;
    
    for (const [appName, appInfo] of Object.entries(this.projectStructure.apps)) {
      const modulesCount = appInfo.modules?.length || 0;
      const routesCount = appInfo.routes?.length || 0;
      const componentsCount = appInfo.components?.length || 0;
      
      summary += `| ${appName} | ${appInfo.type} | ${modulesCount} | ${routesCount} | ${componentsCount} |\n`;
    }
    
    // Packages
    summary += `\n### Packages partagés\n\n`;
    summary += `| Nom | Exports | Dépendances |\n`;
    summary += `|-----|---------|-------------|\n`;
    
    for (const [packageName, packageInfo] of Object.entries(this.projectStructure.packages)) {
      const exportsCount = packageInfo.exports.length;
      const dependenciesCount = packageInfo.dependencies.length;
      
      summary += `| ${packageName} | ${exportsCount} | ${dependenciesCount} |\n`;
    }
    
    // Schéma Prisma
    if (this.projectStructure.prisma) {
      summary += `\n## Schéma Prisma\n\n`;
      summary += `Base de données: ${this.projectStructure.prisma.dataSourceProvider}\n\n`;
      summary += `Modèles: ${this.projectStructure.prisma.models.length}\n\n`;
      
      summary += `| Modèle | Champs | Relations |\n`;
      summary += `|--------|--------|----------|\n`;
      
      for (const model of this.projectStructure.prisma.models) {
        summary += `| ${model.name} | ${model.fields.length} | ${model.relations.length} |\n`;
      }
    }
    
    // Tests
    if (this.projectStructure.tests) {
      summary += `\n## Tests\n\n`;
      summary += `Framework: ${this.projectStructure.tests.framework}\n\n`;
      
      const fileWithCoverage = this.projectStructure.tests.coverageReport?.filter(report => report.hasCoverage).length || 0;
      const totalFiles = this.projectStructure.tests.coverageReport?.length || 0;
      const coveragePercentage = totalFiles > 0 ? (fileWithCoverage / totalFiles) * 100 : 0;
      
      summary += `Couverture de tests: ${coveragePercentage.toFixed(2)}% (${fileWithCoverage}/${totalFiles} fichiers)\n\n`;
      summary += `Tests E2E: ${this.projectStructure.tests.e2eTestsPresent ? '✅' : '❌'}\n\n`;
      summary += `Tests unitaires: ${this.projectStructure.tests.unitTestsPresent ? '✅' : '❌'}\n\n`;
    }
    
    // Sécurité
    if (this.projectStructure.security) {
      summary += `\n## Sécurité\n\n`;
      
      summary += `### Mécanismes d'authentification\n\n`;
      for (const mechanism of this.projectStructure.security.authMechanisms) {
        summary += `- ${mechanism}\n`;
      }
      
      summary += `\n### Protection API\n\n`;
      for (const protection of this.projectStructure.security.apiProtection) {
        summary += `- ${protection}\n`;
      }
      
      summary += `\n### Vulnérabilités potentielles\n\n`;
      summary += `| Type | Sévérité | Emplacement | Recommandation |\n`;
      summary += `|------|----------|-------------|----------------|\n`;
      
      for (const vuln of this.projectStructure.security.vulnerabilities) {
        summary += `| ${vuln.type} | ${vuln.severity} | ${vuln.location} | ${vuln.recommendation} |\n`;
      }
    }
    
    // Documentation
    if (this.projectStructure.documentation) {
      summary += `\n## Documentation\n\n`;
      summary += `Documentation API: ${this.projectStructure.documentation.apiDocs ? '✅' : '❌'}\n\n`;
      summary += `Documentation des composants: ${this.projectStructure.documentation.componentDocs ? '✅' : '❌'}\n\n`;
      
      summary += `### Fichiers README\n\n`;
      for (const readme of this.projectStructure.documentation.readmeFiles) {
        summary += `- ${readme.replace(this.options.root, '')}\n`;
      }
    }
    
    // Performances
    if (this.projectStructure.performance) {
      summary += `\n## Performances\n\n`;
      
      summary += `### Routes avec potentiel d'optimisation\n\n`;
      summary += `| Route | Taille bundle | Dépendances | Optimisations possibles |\n`;
      summary += `|-------|--------------|-------------|------------------------|\n`;
      
      for (const route of this.projectStructure.performance.routes) {
        if (route.potentialOptimizations.length > 0) {
          const optimizations = route.potentialOptimizations.join(', ');
          summary += `| ${route.routePath} | ${(route.bundleSize / 1024).toFixed(2)} KB | ${route.clientDependencies + route.serverDependencies} | ${optimizations} |\n`;
        }
      }
    }
    
    // Librairies
    if (this.monorepoDependencies.libraryUsage) {
      summary += `\n## Librairies les plus utilisées\n\n`;
      summary += `| Librairie | Version | Type | Utilisation |\n`;
      summary += `|-----------|---------|------|------------|\n`;
      
      const topLibraries = this.monorepoDependencies.libraryUsage
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 20);
      
      for (const lib of topLibraries) {
        summary += `| ${lib.name} | ${lib.version} | ${lib.type} | ${lib.usage} |\n`;
      }
    }
    
    // Recommandations
    summary += `\n## Recommandations\n\n`;
    
    if (this.projectStructure.tests && this.projectStructure.tests.coverageReport) {
      const fileWithCoverage = this.projectStructure.tests.coverageReport.filter(report => report.hasCoverage).length;
      const totalFiles = this.projectStructure.tests.coverageReport.length;
      const coveragePercentage = (fileWithCoverage / totalFiles) * 100;
      
      if (coveragePercentage < 50) {
        summary += `- ⚠️ **Augmenter la couverture de tests**: Actuellement à ${coveragePercentage.toFixed(2)}%\n`;
      }
    }
    
    if (this.projectStructure.security && this.projectStructure.security.vulnerabilities.length > 0) {
      summary += `- 🔒 **Corriger les vulnérabilités de sécurité**: ${this.projectStructure.security.vulnerabilities.length} vulnérabilités potentielles détectées\n`;
    }
    
    if (this.projectStructure.documentation && !this.projectStructure.documentation.apiDocs) {
      summary += `- 📚 **Ajouter une documentation API**: Aucune documentation API détectée\n`;
    }
    
    if (this.projectStructure.performance) {
      const routesWithOptimizations = this.projectStructure.performance.routes.filter(
        route => route.potentialOptimizations.length > 0
      );
      
      if (routesWithOptimizations.length > 0) {
        summary += `- ⚡ **Optimiser les performances**: ${routesWithOptimizations.length} routes avec des opportunités d'optimisation\n`;
      }
    }
    
    // TODO: Ajouter d'autres recommandations basées sur l'analyse
    
    return summary;
  }
}

/**
 * Fonction principale
 */
async function main() {
  // Analyse des arguments de ligne de commande
  const args = minimist(process.argv.slice(2));
  
  if (!args.root) {
    console.error('❌ Erreur: Le paramètre --root est requis.');
    console.log('Utilisation: node monorepo-analyzer.ts --root=/chemin/vers/monorepo [--configPath=chemin/vers/config] [--outputDir=chemin/sortie]');
    process.exit(1);
  }
  
  const options: CliOptions = {
    root: args.root,
    configPath: args.configPath,
    outputDir: args.outputDir
  };
  
  console.log(`🔍 Analyse du monorepo à partir de: ${options.root}`);
  
  try {
    const analyzer = new MonorepoAnalyzer(options);
    await analyzer.analyze();
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  }
}

// Exécution de la fonction principale
if (require.main === module) {
  main();
}

// Export pour les tests et l'utilisation comme module
export { MonorepoAnalyzer };