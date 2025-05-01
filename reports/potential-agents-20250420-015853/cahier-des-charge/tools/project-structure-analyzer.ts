#!/usr/bin/env node

/**
 * Analyseur de Structure de Projet NestJS + Remix
 *
 * Ce script analyse un monorepo NestJS + Remix pour générer une cartographie
 * complète de sa structure, modules, routes, composants et dépendances.
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import * as glob from 'glob';
import { ClassDeclaration, Decorator, Project, SourceFile } from 'ts-morph';

// Types
interface ProjectStructure {
  backend: {
    modules: string[];
    controllers: string[];
    services: string[];
    dto: string[];
    pipes?: string[];
    guards?: string[];
    interceptors?: string[];
    entities?: string[];
    repositories?: string[];
  };
  frontend: {
    routes: Array<{
      path: string;
      file: string;
      hasLoader: boolean;
      hasAction: boolean;
      hasMeta: boolean;
      imports: string[];
    }>;
    components: string[];
    hooks?: string[];
    utils?: string[];
    styles?: string[];
  };
  prisma: {
    models: string[];
    relations: string[];
    enums?: string[];
  };
  shared: {
    packages: string[];
    dependencies?: Record<string, string[]>;
  };
  files?: {
    total: number;
    byType: Record<string, number>;
  };
}

interface ModuleInfo {
  name: string;
  path: string;
  description?: string;
  dependencies?: string[];
  models?: string[];
}

// Configuration du programme
program
  .name('project-structure-analyzer')
  .description('Analyze NestJS + Remix project structure')
  .version('1.0.0')
  .option('-p, --project <path>', 'Project root directory', process.cwd())
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--backend <path>', 'Backend directory', 'apps/backend')
  .option('--frontend <path>', 'Frontend directory', 'apps/frontend')
  .option('--prisma <path>', 'Prisma schema path', 'prisma/schema.prisma')
  .option('--no-markdown', 'Skip markdown output', false);

program.parse();
const options = program.opts();

// Chemins principaux
const projectRoot = path.resolve(options.project);
const backendPath = path.join(projectRoot, options.backend);
const frontendPath = path.join(projectRoot, options.frontend);
const prismaSchemaPath = path.join(projectRoot, options.prisma);
const outputDir = path.resolve(options.output);

// Création du dossier de sortie si nécessaire
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Point d'entrée principal
async function main() {
  console.log('🔍 Analyzing project structure...');
  console.log(`📁 Project root: ${projectRoot}`);

  // Structure du projet (résultat final)
  const projectStructure: ProjectStructure = {
    backend: {
      modules: [],
      controllers: [],
      services: [],
      dto: [],
    },
    frontend: {
      routes: [],
      components: [],
    },
    prisma: {
      models: [],
      relations: [],
    },
    shared: {
      packages: [],
    },
    files: {
      total: 0,
      byType: {},
    },
  };

  // Stockage des informations détaillées des modules
  const moduleInfos: ModuleInfo[] = [];

  try {
    // Analyse du backend (NestJS)
    if (fs.existsSync(backendPath)) {
      console.log('🔍 Analyzing NestJS backend...');
      await analyzeNestJSBackend(backendPath, projectStructure, moduleInfos);
    } else {
      console.warn(`⚠️ Backend path not found: ${backendPath}`);
    }

    // Analyse du frontend (Remix)
    if (fs.existsSync(frontendPath)) {
      console.log('🔍 Analyzing Remix frontend...');
      await analyzeRemixFrontend(frontendPath, projectStructure);
    } else {
      console.warn(`⚠️ Frontend path not found: ${frontendPath}`);
    }

    // Analyse du schéma Prisma
    if (fs.existsSync(prismaSchemaPath)) {
      console.log('🔍 Analyzing Prisma schema...');
      analyzePrismaSchema(prismaSchemaPath, projectStructure);
    } else {
      console.warn(`⚠️ Prisma schema not found: ${prismaSchemaPath}`);
    }

    // Analyse des packages partagés
    console.log('🔍 Analyzing shared packages...');
    analyzeSharedPackages(projectRoot, projectStructure);

    // Statistiques des fichiers
    console.log('🔍 Collecting file statistics...');
    collectFileStatistics(projectRoot, projectStructure);

    // Écriture des fichiers de sortie
    const structureOutputPath = path.join(outputDir, 'project_structure.json');
    fs.writeFileSync(structureOutputPath, JSON.stringify(projectStructure, null, 2));
    console.log(`✅ Project structure written to ${structureOutputPath}`);

    // Génération du markdown si requis
    if (options.markdown !== false) {
      const markdownOutputPath = path.join(outputDir, 'module_map.md');
      const markdown = generateModuleMap(projectStructure, moduleInfos);
      fs.writeFileSync(markdownOutputPath, markdown);
      console.log(`✅ Module map written to ${markdownOutputPath}`);
    }

    console.log('✅ Analysis completed successfully');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

/**
 * Analyse le backend NestJS
 */
async function analyzeNestJSBackend(
  backendPath: string,
  projectStructure: ProjectStructure,
  moduleInfos: ModuleInfo[]
): Promise<void> {
  // Initialisation du projet ts-morph
  const project = new Project({
    tsConfigFilePath: path.join(backendPath, 'tsconfig.json'),
  });

  // Ajouter les fichiers source
  project.addSourceFilesAtPaths([
    path.join(backendPath, 'src/**/*.ts'),
    '!' + path.join(backendPath, 'src/**/*.spec.ts'),
    '!' + path.join(backendPath, 'src/**/*.test.ts'),
  ]);

  // Analyser les fichiers source
  const sourceFiles = project.getSourceFiles();

  // Collecter les classes avec décorateurs NestJS
  for (const sourceFile of sourceFiles) {
    // Obtenir les classes dans le fichier
    const classes = sourceFile.getClasses();

    for (const cls of classes) {
      // Obtenir les décorateurs
      const decorators = cls.getDecorators();

      // Vérifier chaque décorateur
      for (const decorator of decorators) {
        const decoratorName = decorator.getName();
        const className = cls.getName();

        if (!className) continue; // Ignorer les classes sans nom

        // Analyser en fonction du type de décorateur
        switch (decoratorName) {
          case 'Module':
            projectStructure.backend.modules.push(className);
            analyzeNestJSModule(cls, decorator, moduleInfos, sourceFile);
            break;
          case 'Controller':
            projectStructure.backend.controllers.push(className);
            break;
          case 'Injectable':
            // Les services et autres injectables ont le décorateur @Injectable
            if (className.endsWith('Service')) {
              projectStructure.backend.services.push(className);
            } else if (className.endsWith('Repository')) {
              projectStructure.backend.repositories = projectStructure.backend.repositories || [];
              projectStructure.backend.repositories.push(className);
            } else if (className.endsWith('Guard')) {
              projectStructure.backend.guards = projectStructure.backend.guards || [];
              projectStructure.backend.guards.push(className);
            } else if (className.endsWith('Interceptor')) {
              projectStructure.backend.interceptors = projectStructure.backend.interceptors || [];
              projectStructure.backend.interceptors.push(className);
            } else if (className.endsWith('Pipe')) {
              projectStructure.backend.pipes = projectStructure.backend.pipes || [];
              projectStructure.backend.pipes.push(className);
            } else {
              // Autre injectable
              projectStructure.backend.services.push(className);
            }
            break;
        }
      }

      // Détecter les DTOs (généralement des classes sans décorateurs mais avec pattern de nommage)
      if (cls.getName()?.endsWith('Dto') && !cls.getDecorators().length) {
        projectStructure.backend.dto.push(cls.getName()!);
      }
    }
  }
}

/**
 * Analyse un module NestJS en détail
 */
function analyzeNestJSModule(
  moduleClass: ClassDeclaration,
  moduleDecorator: Decorator,
  moduleInfos: ModuleInfo[],
  sourceFile: SourceFile
): void {
  const moduleName = moduleClass.getName() || 'UnknownModule';
  const moduleFilePath = sourceFile.getFilePath();

  // Extraire les métadonnées du décorateur @Module
  const decoratorArgs = moduleDecorator.getArguments();
  if (decoratorArgs.length > 0) {
    try {
      // Extraire les imports, controllers, providers, exports
      const moduleObj = decoratorArgs[0].getText();

      // Créer l'info du module
      const moduleInfo: ModuleInfo = {
        name: moduleName,
        path: path.relative(process.cwd(), moduleFilePath),
        dependencies: [],
      };

      // Extraire les imports (dépendances)
      const importsMatch = moduleObj.match(/imports\s*:\s*\[([\s\S]*?)\]/);
      if (importsMatch) {
        const importsStr = importsMatch[1];
        const importsList = importsStr
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0 && i.endsWith('Module'));

        moduleInfo.dependencies = importsList;
      }

      // Ajouter aux infos des modules
      moduleInfos.push(moduleInfo);
    } catch (error) {
      console.warn(`⚠️ Error parsing module ${moduleName}:`, error);
    }
  }
}

/**
 * Analyse le frontend Remix
 */
async function analyzeRemixFrontend(
  frontendPath: string,
  projectStructure: ProjectStructure
): Promise<void> {
  // Analyser les routes Remix
  const routesPath = path.join(frontendPath, 'app/routes');
  if (fs.existsSync(routesPath)) {
    // Trouver tous les fichiers .tsx dans le dossier des routes
    const routeFiles = glob.sync('**/*.tsx', { cwd: routesPath });

    for (const routeFile of routeFiles) {
      const fullPath = path.join(routesPath, routeFile);
      const routeContent = fs.readFileSync(fullPath, 'utf-8');

      // Déduire le chemin de la route à partir du nom de fichier (en utilisant les conventions Remix)
      const routePath = routeFileToPath(routeFile);

      // Vérifier la présence de loader, action, et meta
      const hasLoader =
        routeContent.includes('export function loader') ||
        routeContent.includes('export const loader') ||
        routeContent.includes('export async function loader');

      const hasAction =
        routeContent.includes('export function action') ||
        routeContent.includes('export const action') ||
        routeContent.includes('export async function action');

      const hasMeta =
        routeContent.includes('export const meta') ||
        routeContent.includes('export function meta') ||
        routeContent.includes('export const meta =');

      // Extraire les imports
      const imports = extractImports(routeContent);

      // Ajouter la route
      projectStructure.frontend.routes.push({
        path: routePath,
        file: `app/routes/${routeFile}`,
        hasLoader,
        hasAction,
        hasMeta,
        imports,
      });
    }
  }

  // Analyser les composants React
  const componentsPath = path.join(frontendPath, 'app/components');
  if (fs.existsSync(componentsPath)) {
    const componentFiles = glob.sync('**/*.{tsx,jsx}', { cwd: componentsPath });

    for (const componentFile of componentFiles) {
      const fullPath = path.join(componentsPath, componentFile);
      const componentContent = fs.readFileSync(fullPath, 'utf-8');

      // Extraire le nom du composant (généralement le même que le nom du fichier)
      const componentName = path.basename(componentFile, path.extname(componentFile));

      // Ajouter le composant
      if (!projectStructure.frontend.components.includes(componentName)) {
        projectStructure.frontend.components.push(componentName);
      }
    }
  }
}

/**
 * Convertit un fichier de route Remix en chemin URL
 */
function routeFileToPath(routeFile: string): string {
  // Supprimer l'extension
  let pathName = routeFile.replace(/\.[^/.]+$/, '');

  // Gérer les routes imbriquées avec des dossiers
  pathName = pathName.replace(/\/index$/, '');

  // Gérer les routes avec des paramètres ($param)
  pathName = pathName.replace(/\$([^/]+)/g, ':$1');

  // Gérer les routes avec layout (_layout)
  pathName = pathName.replace(/\/_layout\b/g, '');

  // Gérer les fichiers index spéciaux
  if (pathName === 'index' || pathName === '_index') {
    return '/';
  }

  return '/' + pathName;
}

/**
 * Extraire les imports d'un fichier TypeScript/TSX
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:{[\s\w,]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Analyse le schéma Prisma
 */
function analyzePrismaSchema(schemaPath: string, projectStructure: ProjectStructure): void {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Extraire les modèles
  const modelRegex = /model\s+(\w+)\s+{([\s\S]*?)}/g;
  let modelMatch;

  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];

    // Ajouter le modèle
    projectStructure.prisma.models.push(modelName);

    // Extraire les relations
    const relationRegex = /@relation\([\s\S]*?\)/g;
    const relationMatches = modelBody.match(relationRegex);

    if (relationMatches) {
      for (const relationMatch of relationMatches) {
        // Trouver le champ associé à la relation
        const fieldLine = modelBody.split('\n').find((line) => line.includes(relationMatch));

        if (fieldLine) {
          const fieldMatch = fieldLine.match(/(\w+)\s+(\w+)/);
          if (fieldMatch) {
            const relatedModel = fieldMatch[1];
            const relationName = fieldMatch[2];

            projectStructure.prisma.relations.push(`${modelName} -> ${relatedModel}`);
          }
        }
      }
    }
  }

  // Extraire les enums
  const enumRegex = /enum\s+(\w+)\s+{([\s\S]*?)}/g;
  let enumMatch;

  projectStructure.prisma.enums = projectStructure.prisma.enums || [];

  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const enumName = enumMatch[1];
    projectStructure.prisma.enums.push(enumName);
  }
}

/**
 * Analyse les packages partagés
 */
function analyzeSharedPackages(projectRoot: string, projectStructure: ProjectStructure): void {
  // Chercher les packages dans les dossiers courants
  const packagesLocations = ['packages', 'libs', 'shared'];

  for (const location of packagesLocations) {
    const packagesPath = path.join(projectRoot, location);

    if (fs.existsSync(packagesPath)) {
      const packageDirs = fs
        .readdirSync(packagesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const packageName of packageDirs) {
        // Vérifier si c'est un package avec un package.json
        const packageJsonPath = path.join(packagesPath, packageName, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const packageFullName = packageJson.name || packageName;

            // Ajouter le package à la liste
            projectStructure.shared.packages.push(packageFullName);

            // Ajouter les dépendances du package
            if (packageJson.dependencies) {
              projectStructure.shared.dependencies = projectStructure.shared.dependencies || {};
              projectStructure.shared.dependencies[packageFullName] = Object.keys(
                packageJson.dependencies
              );
            }
          } catch (error) {
            console.warn(`⚠️ Error parsing package.json for ${packageName}:`, error);
          }
        } else {
          // Considérer comme un package même sans package.json
          projectStructure.shared.packages.push(packageName);
        }
      }
    }
  }
}

/**
 * Collecte des statistiques sur les fichiers du projet
 */
function collectFileStatistics(projectRoot: string, projectStructure: ProjectStructure): void {
  // Extensions à surveiller
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.prisma'];

  // Compteurs
  let totalFiles = 0;
  const byType: Record<string, number> = {};

  // Initialiser les compteurs
  for (const ext of extensions) {
    byType[ext] = 0;
  }

  // Fonction récursive pour parcourir les dossiers
  function traverseDirectory(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Ignorer node_modules, DoDoDoDotgit, etc.
      if (entry.name === 'node_modules' || entry.name === 'DoDogit' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        traverseDirectory(fullPath);
      } else if (entry.isFile()) {
        totalFiles++;

        const ext = path.extname(entry.name);
        if (ext in byType) {
          byType[ext]++;
        }
      }
    }
  }

  traverseDirectory(projectRoot);

  // Mettre à jour les statistiques
  projectStructure.files = {
    total: totalFiles,
    byType,
  };
}

/**
 * Génère une carte des modules au format Markdown
 */
function generateModuleMap(projectStructure: ProjectStructure, moduleInfos: ModuleInfo[]): string {
  let markdown = '# Carte des Modules du Projet\n\n';

  // Section Backend
  markdown += '## Backend NestJS\n\n';

  for (const moduleName of projectStructure.backend.modules) {
    const moduleInfo = moduleInfos.find((info) => info.name === moduleName);

    markdown += `### ✅ ${moduleName}\n`;

    if (moduleInfo) {
      markdown += `- 📁 ${moduleInfo.path}\n`;

      if (moduleInfo.dependencies && moduleInfo.dependencies.length > 0) {
        markdown += `- 🔗 Dépendances: ${moduleInfo.dependencies.join(', ')}\n`;
      }
    }

    // Trouver les contrôleurs associés
    const controllers = projectStructure.backend.controllers.filter((c) =>
      c.includes(moduleName.replace('Module', ''))
    );

    if (controllers.length > 0) {
      markdown += `- 🎮 Contrôleurs: ${controllers.join(', ')}\n`;
    }

    // Trouver les services associés
    const services = projectStructure.backend.services.filter((s) =>
      s.includes(moduleName.replace('Module', ''))
    );

    if (services.length > 0) {
      markdown += `- 🔧 Services: ${services.join(', ')}\n`;
    }

    markdown += '\n';
  }

  // Section Frontend
  markdown += '## Frontend Remix\n\n';

  // Regrouper les routes par préfixe
  const routeGroups: Record<string, Array<(typeof projectStructure.frontend.routes)[0]>> = {};

  for (const route of projectStructure.frontend.routes) {
    const parts = route.path.split('/').filter(Boolean);
    const prefix = parts.length > 0 ? parts[0] : 'root';

    if (!routeGroups[prefix]) {
      routeGroups[prefix] = [];
    }

    routeGroups[prefix].push(route);
  }

  // Afficher les routes par groupe
  for (const [prefix, routes] of Object.entries(routeGroups)) {
    markdown += `### 🔀 ${prefix === 'root' ? 'Routes racine' : `Routes /${prefix}`}\n\n`;

    for (const route of routes) {
      markdown += `#### 📄 \`${route.path}\`\n`;
      markdown += `- Fichier: \`${route.file}\`\n`;

      const features = [];
      if (route.hasLoader) features.push('loader');
      if (route.hasAction) features.push('action');
      if (route.hasMeta) features.push('meta');

      if (features.length > 0) {
        markdown += `- Fonctionnalités: ${features.join(', ')}\n`;
      }

      markdown += '\n';
    }
  }

  // Section Composants
  if (projectStructure.frontend.components.length > 0) {
    markdown += '### 🧩 Composants\n\n';

    for (const component of projectStructure.frontend.components) {
      markdown += `- ${component}\n`;
    }

    markdown += '\n';
  }

  // Section Prisma
  markdown += '## Modèles Prisma\n\n';

  for (const model of projectStructure.prisma.models) {
    markdown += `### 📊 ${model}\n`;

    // Trouver les relations de ce modèle
    const relations = projectStructure.prisma.relations.filter((r) => r.startsWith(`${model} ->`));

    if (relations.length > 0) {
      markdown += `- Relations: ${relations.join(', ')}\n`;
    }

    markdown += '\n';
  }

  // Section Packages Partagés
  markdown += '## Packages Partagés\n\n';

  for (const pkg of projectStructure.shared.packages) {
    markdown += `### 📦 \`${pkg}\`\n`;

    // Ajouter les dépendances si disponibles
    if (projectStructure.shared.dependencies && projectStructure.shared.dependencies[pkg]) {
      const dependencies = projectStructure.shared.dependencies[pkg];

      if (dependencies.length > 0) {
        markdown += `- Dépendances: ${dependencies.slice(0, 5).join(', ')}${
          dependencies.length > 5 ? '...' : ''
        }\n`;
      }
    }

    markdown += '\n';
  }

  return markdown;
}

// Exécuter le programme
if (require.main === module) {
  main();
}
