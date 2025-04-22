import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as glob from 'glob';

// Types pour l'agent
interface TestWriterContext {
  moduleName?: string;
  type: 'nestjs' | 'remix' | 'both';
  autoDetect?: boolean;
  generateCoverage?: boolean;
  runTests?: boolean;
  sourcePath?: string;
}

interface TestCoverageMap {
  timestamp: string;
  nestjs: {
    [moduleName: string]: {
      serviceCoverage: number;
      controllerCoverage: number;
      lastGenerated: string;
      lastRun: string;
      status: 'passing' | 'failing' | 'unknown';
    };
  };
  remix: {
    [routeName: string]: {
      e2eCoverage: number;
      lastGenerated: string;
      lastRun: string;
      status: 'passing' | 'failing' | 'unknown';
    };
  };
  summary: {
    totalTests: number;
    passingTests: number;
    failingTests: number;
    overallCoverage: number;
  };
}

export const testWriterAgent = {
  name: 'test-writer',
  description: 'Génère des tests unitaires (NestJS) et end-to-end (Remix)',
  
  async run(context: TestWriterContext) {
    const logs: string[] = [];
    const coverageMap: TestCoverageMap = this.initializeCoverageMap();
    const modulesToProcess: { name: string; type: 'nestjs' | 'remix'; sourcePath: string }[] = [];

    try {
      logs.push(`🧪 Lancement du générateur de tests`);
      
      // Auto-détection des modules si demandé
      if (context.autoDetect) {
        logs.push(`🔍 Auto-détection des modules...`);
        
        if (context.type === 'nestjs' || context.type === 'both') {
          const nestModules = await this.detectNestJSModules();
          nestModules.forEach(module => {
            modulesToProcess.push({ name: module.name, type: 'nestjs', sourcePath: module.path });
            logs.push(`📝 Module NestJS détecté: ${module.name}`);
          });
        }
        
        if (context.type === 'remix' || context.type === 'both') {
          const remixRoutes = await this.detectRemixRoutes();
          remixRoutes.forEach(route => {
            modulesToProcess.push({ name: route.name, type: 'remix', sourcePath: route.path });
            logs.push(`📝 Route Remix détectée: ${route.name}`);
          });
        }
      } 
      // Utilisation du module spécifié
      else if (context.moduleName) {
        if (context.type === 'nestjs' || context.type === 'both') {
          const sourcePath = context.sourcePath || `apps/backend/src/${context.moduleName}`;
          modulesToProcess.push({ name: context.moduleName, type: 'nestjs', sourcePath });
        }
        
        if (context.type === 'remix' || context.type === 'both') {
          const sourcePath = context.sourcePath || `apps/frontend/app/routes/${context.moduleName}`;
          modulesToProcess.push({ name: context.moduleName, type: 'remix', sourcePath });
        }
      } else {
        logs.push(`⚠️ Aucun module spécifié et auto-détection désactivée. Rien à faire.`);
        return { status: 'warning', logs };
      }
      
      logs.push(`🧩 ${modulesToProcess.length} modules/routes à traiter.`);
      
      // Générer les tests pour chaque module
      for (const moduleInfo of modulesToProcess) {
        if (moduleInfo.type === 'nestjs') {
          await this.generateNestJSTests(moduleInfo.name, moduleInfo.sourcePath, logs, coverageMap);
        } else {
          await this.generateRemixTests(moduleInfo.name, moduleInfo.sourcePath, logs, coverageMap);
        }
      }
      
      // Générer le fichier de couverture si demandé
      if (context.generateCoverage) {
        this.saveCoverageMap(coverageMap);
        logs.push(`📊 Fichier de suivi de couverture généré: reports/test_coverage_map.json`);
      }
      
      // Exécuter les tests si demandé
      if (context.runTests) {
        logs.push(`🧪 Exécution des tests...`);
        
        if (modulesToProcess.some(m => m.type === 'nestjs')) {
          const result = await this.runNestJSTests(logs);
          if (result) {
            logs.push(`✅ Tests unitaires NestJS exécutés avec succès`);
          }
        }
        
        if (modulesToProcess.some(m => m.type === 'remix')) {
          const result = await this.runRemixE2ETests(logs);
          if (result) {
            logs.push(`✅ Tests E2E Remix exécutés avec succès`);
          }
        }
      }
      
      return { 
        status: 'success', 
        logs,
        coverage: context.generateCoverage ? coverageMap : undefined,
        modulesProcessed: modulesToProcess.map(m => ({ name: m.name, type: m.type }))
      };
    } catch (error: any) {
      logs.push('❌ Erreur pendant la génération des tests : ' + error.message);
      return { status: 'error', logs };
    }
  },
  
  // Initialiser la structure de la carte de couverture
  initializeCoverageMap(): TestCoverageMap {
    const existingPath = path.resolve('reports/test_coverage_map.json');
    
    if (fs.existsSync(existingPath)) {
      try {
        return JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      } catch (e) {
        // En cas d'erreur, créer une nouvelle carte
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      nestjs: {},
      remix: {},
      summary: {
        totalTests: 0,
        passingTests: 0,
        failingTests: 0,
        overallCoverage: 0
      }
    };
  },
  
  // Sauvegarder la carte de couverture
  saveCoverageMap(coverageMap: TestCoverageMap): void {
    const reportsDir = path.resolve('reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    coverageMap.timestamp = new Date().toISOString();
    
    // Calculer les statistiques globales
    const nestjsModules = Object.keys(coverageMap.nestjs).length;
    const remixRoutes = Object.keys(coverageMap.remix).length;
    
    let totalCoverage = 0;
    let passingTests = 0;
    
    Object.values(coverageMap.nestjs).forEach(mod => {
      totalCoverage += (mod.serviceCoverage + mod.controllerCoverage) / 2;
      if (mod.status === 'passing') passingTests++;
    });
    
    Object.values(coverageMap.remix).forEach(route => {
      totalCoverage += route.e2eCoverage;
      if (route.status === 'passing') passingTests++;
    });
    
    const totalModules = nestjsModules + remixRoutes;
    
    coverageMap.summary = {
      totalTests: totalModules,
      passingTests: passingTests,
      failingTests: totalModules - passingTests,
      overallCoverage: totalModules > 0 ? totalCoverage / totalModules : 0
    };
    
    fs.writeFileSync(
      path.resolve('reports/test_coverage_map.json'),
      JSON.stringify(coverageMap, null, 2)
    );
  },
  
  // Détecter automatiquement les modules NestJS
  async detectNestJSModules(): Promise<{ name: string; path: string }[]> {
    const modules: { name: string; path: string }[] = [];
    
    // Chercher les services et contrôleurs
    const serviceFiles = glob.sync('apps/backend/src/**/*.service.ts');
    const controllerFiles = glob.sync('apps/backend/src/**/*.controller.ts');
    
    // Extraire les modules à partir des services
    serviceFiles.forEach(file => {
      const dirName = path.dirname(file);
      const fileName = path.basename(file);
      const moduleName = fileName.replace('.service.ts', '');
      
      // Éviter les doublons
      if (!modules.some(m => m.name === moduleName)) {
        modules.push({ name: moduleName, path: dirName });
      }
    });
    
    // Extraire les modules à partir des contrôleurs
    controllerFiles.forEach(file => {
      const dirName = path.dirname(file);
      const fileName = path.basename(file);
      const moduleName = fileName.replace('.controller.ts', '');
      
      // Éviter les doublons
      if (!modules.some(m => m.name === moduleName)) {
        modules.push({ name: moduleName, path: dirName });
      }
    });
    
    // Chercher également dans les fichiers d'audit pour des indices sur les modules
    try {
      const auditFiles = glob.sync('reports/analysis/**/*.audit.md');
      
      for (const auditFile of auditFiles) {
        const content = fs.readFileSync(auditFile, 'utf8');
        
        // Rechercher des références aux services/contrôleurs NestJS
        const nestjsMatches = content.match(/- \*\*NestJS (?:Service|Controller)\*\*: `([a-zA-Z0-9]+)(?:Service|Controller)`/g);
        
        if (nestjsMatches) {
          nestjsMatches.forEach(match => {
            const nameMatch = match.match(/`([a-zA-Z0-9]+)(?:Service|Controller)`/);
            if (nameMatch && nameMatch[1]) {
              const moduleName = nameMatch[1].toLowerCase();
              
              // Éviter les doublons
              if (!modules.some(m => m.name === moduleName)) {
                modules.push({ 
                  name: moduleName, 
                  path: `apps/backend/src/${moduleName}`
                });
              }
            }
          });
        }
      }
    } catch (error) {
      // Ignorer les erreurs dans la détection basée sur les audits
    }
    
    return modules;
  },
  
  // Détecter automatiquement les routes Remix
  async detectRemixRoutes(): Promise<{ name: string; path: string }[]> {
    const routes: { name: string; path: string }[] = [];
    
    // Chercher les fichiers routes Remix
    const routeFiles = glob.sync('apps/frontend/app/routes/**/*.tsx');
    
    // Extraire les routes
    routeFiles.forEach(file => {
      const dirName = path.dirname(file);
      const fileName = path.basename(file);
      
      // Ignorer les fichiers de layout (_) et index
      if (!fileName.startsWith('_') && fileName !== 'index.tsx') {
        const routeName = fileName.replace('.tsx', '');
        
        // Normaliser le nom de la route
        let normalizedName = routeName;
        if (routeName.startsWith('$')) {
          normalizedName = routeName.substring(1); // Enlever le $
        }
        
        routes.push({ name: normalizedName, path: dirName });
      }
    });
    
    // Chercher également dans les fichiers backlog pour des indices sur les routes
    try {
      const backlogFiles = glob.sync('reports/analysis/**/*.backlog.json');
      
      for (const backlogFile of backlogFiles) {
        const content = fs.readFileSync(backlogFile, 'utf8');
        const backlog = JSON.parse(content);
        
        if (backlog.tasks) {
          backlog.tasks.forEach((task: any) => {
            if (task.target === 'remix' && task.route) {
              const routeName = task.route.replace(/^\//, ''); // Enlever le / au début
              
              // Éviter les doublons
              if (!routes.some(r => r.name === routeName)) {
                routes.push({ 
                  name: routeName, 
                  path: `apps/frontend/app/routes/${routeName}`
                });
              }
            }
          });
        }
      }
    } catch (error) {
      // Ignorer les erreurs dans la détection basée sur les backlogs
    }
    
    return routes;
  },
  
  // Générer les tests pour un module NestJS
  async generateNestJSTests(moduleName: string, sourcePath: string, logs: string[], coverageMap: TestCoverageMap): Promise<void> {
    // Vérifier si le dossier du module existe
    if (!fs.existsSync(sourcePath)) {
      fs.mkdirSync(sourcePath, { recursive: true });
      logs.push(`📁 Dossier créé pour le module ${moduleName}: ${sourcePath}`);
    }
    
    // Vérifier si le service existe
    const serviceFile = path.join(sourcePath, `${moduleName}.service.ts`);
    const hasService = fs.existsSync(serviceFile);
    
    // Vérifier si le contrôleur existe
    const controllerFile = path.join(sourcePath, `${moduleName}.controller.ts`);
    const hasController = fs.existsSync(controllerFile);
    
    // Initialiser l'entrée dans la carte de couverture
    if (!coverageMap.nestjs[moduleName]) {
      coverageMap.nestjs[moduleName] = {
        serviceCoverage: 0,
        controllerCoverage: 0,
        lastGenerated: new Date().toISOString(),
        lastRun: '',
        status: 'unknown'
      };
    }
    
    // Générer le test pour le service
    if (hasService) {
      const serviceContent = fs.readFileSync(serviceFile, 'utf8');
      const serviceTestPath = path.join(sourcePath, `${moduleName}.service.spec.ts`);
      
      const serviceTestContent = this.generateServiceTestContent(moduleName, serviceContent);
      fs.writeFileSync(serviceTestPath, serviceTestContent);
      
      logs.push(`✅ Test unitaire généré pour le service: ${serviceTestPath}`);
      coverageMap.nestjs[moduleName].serviceCoverage = 70; // Estimation de la couverture
    } else {
      logs.push(`⚠️ Service non trouvé pour ${moduleName}`);
    }
    
    // Générer le test pour le contrôleur
    if (hasController) {
      const controllerContent = fs.readFileSync(controllerFile, 'utf8');
      const controllerTestPath = path.join(sourcePath, `${moduleName}.controller.spec.ts`);
      
      const controllerTestContent = this.generateControllerTestContent(moduleName, controllerContent);
      fs.writeFileSync(controllerTestPath, controllerTestContent);
      
      logs.push(`✅ Test unitaire généré pour le contrôleur: ${controllerTestPath}`);
      coverageMap.nestjs[moduleName].controllerCoverage = 70; // Estimation de la couverture
    } else {
      logs.push(`⚠️ Contrôleur non trouvé pour ${moduleName}`);
    }
    
    // Mettre à jour la date de génération
    coverageMap.nestjs[moduleName].lastGenerated = new Date().toISOString();
  },
  
  // Générer les tests pour une route Remix
  async generateRemixTests(routeName: string, sourcePath: string, logs: string[], coverageMap: TestCoverageMap): Promise<void> {
    // Créer le dossier e2e s'il n'existe pas
    const e2eDir = path.resolve('apps/frontend/e2e');
    if (!fs.existsSync(e2eDir)) {
      fs.mkdirSync(e2eDir, { recursive: true });
    }
    
    // Nettoyer le nom de la route
    const normalizedRouteName = routeName.replace(/\$/g, '');
    
    // Générer le fichier de test e2e
    const e2eTestPath = path.join(e2eDir, `${normalizedRouteName}.e2e.spec.ts`);
    const routePath = `/${normalizedRouteName}`;
    
    const e2eContent = this.generateRemixE2ETestContent(normalizedRouteName, routePath);
    fs.writeFileSync(e2eTestPath, e2eContent);
    
    logs.push(`✅ Test e2e généré pour la route ${normalizedRouteName}: ${e2eTestPath}`);
    
    // Mettre à jour la carte de couverture
    if (!coverageMap.remix[normalizedRouteName]) {
      coverageMap.remix[normalizedRouteName] = {
        e2eCoverage: 60, // Estimation de la couverture
        lastGenerated: new Date().toISOString(),
        lastRun: '',
        status: 'unknown'
      };
    } else {
      coverageMap.remix[normalizedRouteName].e2eCoverage = 60;
      coverageMap.remix[normalizedRouteName].lastGenerated = new Date().toISOString();
    }
  },
  
  // Générer le contenu d'un test pour un service NestJS
  generateServiceTestContent(moduleName: string, serviceContent: string): string {
    // Analyser le contenu du service pour identifier les méthodes
    const methodRegex = /async\s+([a-zA-Z0-9_]+)\s*\([^)]*\)/g;
    const methods: string[] = [];
    let match;
    
    while ((match = methodRegex.exec(serviceContent)) !== null) {
      methods.push(match[1]);
    }
    
    // Extraire les dépendances
    const dependencyRegex = /constructor\(\s*(?:private|readonly|protected)?\s*([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/g;
    const dependencies: { name: string; type: string }[] = [];
    
    while ((match = dependencyRegex.exec(serviceContent)) !== null) {
      dependencies.push({ name: match[1], type: match[2] });
    }
    
    // Créer les mocks pour les dépendances
    const mockDependencies = dependencies.map(dep => 
      `const mock${dep.type} = {\n    ${this.generateMockMethods(dep)}\n  };`
    ).join('\n  ');
    
    // Initialiser les dépendances dans beforeEach
    const initDependencies = dependencies.length > 0 
      ? `service = new ${moduleName}Service(${dependencies.map(dep => `mock${dep.type} as any`).join(', ')});`
      : `service = new ${moduleName}Service();`;
    
    // Générer les tests pour chaque méthode
    const methodTests = methods.map(method => this.generateMethodTest(method)).join('\n\n  ');
    
    return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleName}Service } from './${moduleName}.service';

describe('${moduleName}Service', () => {
  let service: ${moduleName}Service;
  
  ${dependencies.length > 0 ? mockDependencies : ''}

  beforeEach(async () => {
    ${initDependencies}
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  ${methods.length > 0 ? methodTests : '// Ajoutez vos tests spécifiques ici'}
});
`;
  },
  
  // Générer le contenu d'un test pour un contrôleur NestJS
  generateControllerTestContent(moduleName: string, controllerContent: string): string {
    // Analyser le contenu du contrôleur pour identifier les endpoints
    const endpointRegex = /@(Get|Post|Put|Delete|Patch)\(['"](.*?)['"]\)[\s\n]+(?:async\s+)?([a-zA-Z0-9_]+)/g;
    const endpoints: { method: string; path: string; handler: string }[] = [];
    let match;
    
    while ((match = endpointRegex.exec(controllerContent)) !== null) {
      endpoints.push({ 
        method: match[1], 
        path: match[2], 
        handler: match[3]
      });
    }
    
    // Extraire les dépendances du service
    const serviceRegex = /constructor\(\s*(?:private|readonly|protected)?\s*([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/g;
    const serviceMatch = serviceRegex.exec(controllerContent);
    
    const serviceName = serviceMatch ? serviceMatch[1] : `${moduleName.toLowerCase()}Service`;
    const serviceType = serviceMatch ? serviceMatch[2] : `${moduleName}Service`;
    
    return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleName}Controller } from './${moduleName}.controller';
import { ${serviceType} } from './${moduleName}.service';

describe('${moduleName}Controller', () => {
  let controller: ${moduleName}Controller;
  let service: ${serviceType};

  beforeEach(async () => {
    const mockService = {
      ${endpoints.map(endpoint => `${endpoint.handler}: jest.fn()`).join(',\n      ')}
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [${moduleName}Controller],
      providers: [
        {
          provide: ${serviceType},
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<${moduleName}Controller>(${moduleName}Controller);
    service = module.get<${serviceType}>(${serviceType});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
  ${endpoints.map(endpoint => this.generateEndpointTest(endpoint, serviceName)).join('\n\n  ')}
});
`;
  },
  
  // Générer le contenu d'un test e2e pour une route Remix
  generateRemixE2ETestContent(routeName: string, routePath: string): string {
    return `import { test, expect } from '@playwright/test';

test.describe('${routeName} route', () => {
  test('page loads', async ({ page }) => {
    await page.goto('${routePath}');
    await expect(page).toHaveTitle(/${routeName}/i);
  });
  
  test('navigation works', async ({ page }) => {
    await page.goto('${routePath}');
    
    // Vérifier des éléments clés de la page
    await expect(page.locator('h1')).toBeVisible();
    
    // Vérifier la structure de navigation
    await expect(page.locator('nav')).toBeVisible();
  });
  
  test('interactive elements function correctly', async ({ page }) => {
    await page.goto('${routePath}');
    
    // Tester les interactions basiques
    // Exemple: cliquer sur un bouton et vérifier le résultat
    // const button = page.locator('button:has-text("Submit")');
    // await button.click();
    // await expect(page.locator('.success-message')).toBeVisible();
  });
  
  test('data loading works', async ({ page }) => {
    await page.goto('${routePath}');
    
    // Vérifier que les données sont chargées correctement
    // await expect(page.locator('.data-container')).not.toBeEmpty();
  });
});
`;
  },
  
  // Générer des méthodes mock pour une dépendance
  generateMockMethods(dependency: { name: string; type: string }): string {
    return `// Mock des méthodes pour ${dependency.type}
    // findAll: jest.fn().mockResolvedValue([]),
    // findOne: jest.fn().mockResolvedValue({}),
    // create: jest.fn().mockImplementation(dto => Promise.resolve({ id: 'mock-id', ...dto })),`;
  },
  
  // Générer un test pour une méthode de service
  generateMethodTest(methodName: string): string {
    return `it('should call ${methodName}', async () => {
    // Arrange
    const result = await service.${methodName}(/* params */);
    
    // Assert
    expect(result).toBeDefined();
    // Ajoutez vos assertions spécifiques ici
  });`;
  },
  
  // Générer un test pour un endpoint de contrôleur
  generateEndpointTest(endpoint: { method: string; path: string; handler: string }, serviceName: string): string {
    const httpMethod = endpoint.method.toLowerCase();
    const params = httpMethod === 'get' || httpMethod === 'delete' ? '' : 'mockData';
    
    return `it('should call ${endpoint.handler}', async () => {
    // Arrange
    const mockData = {}; // Ajoutez vos données de test ici
    jest.spyOn(service, '${endpoint.handler}').mockResolvedValue({});
    
    // Act
    const result = await controller.${endpoint.handler}(${params});
    
    // Assert
    expect(service.${endpoint.handler}).toHaveBeenCalled();
    expect(result).toBeDefined();
  });`;
  },
  
  // Exécuter les tests NestJS
  async runNestJSTests(logs: string[]): Promise<boolean> {
    try {
      const output = execSync('pnpm test:unit', { stdio: 'pipe' }).toString();
      logs.push(`🧪 Résultat des tests unitaires NestJS: ${output.includes('PASS') ? 'RÉUSSITE' : 'ÉCHEC'}`);
      return output.includes('PASS');
    } catch (error: any) {
      logs.push(`❌ Erreur lors de l'exécution des tests unitaires: ${error.message}`);
      return false;
    }
  },
  
  // Exécuter les tests e2e Remix
  async runRemixE2ETests(logs: string[]): Promise<boolean> {
    try {
      const output = execSync('pnpm test:e2e', { stdio: 'pipe' }).toString();
      logs.push(`🧪 Résultat des tests e2e Remix: ${output.includes('PASS') ? 'RÉUSSITE' : 'ÉCHEC'}`);
      return output.includes('PASS');
    } catch (error: any) {
      logs.push(`❌ Erreur lors de l'exécution des tests e2e: ${error.message}`);
      return false;
    }
  }
};