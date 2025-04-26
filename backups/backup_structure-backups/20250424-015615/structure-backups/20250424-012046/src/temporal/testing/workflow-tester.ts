import { TestWorkflowEnvironment } from @temporalio/testingstructure-agent';
import { Worker } from @temporalio/workerstructure-agent';
import { Runtime } from @temporalio/workerstructure-agent';
import * as path from pathstructure-agent';
import { Client, Connection } from @temporalio/clientstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';
import * as fs from fsstructure-agent';

/**
 * Configuration pour les tests de workflow
 */
export interface WorkflowTestConfig {
  workflowsPath: string;
  activities: Record<string, Function>;
  taskQueue?: string;
  testTimeout?: number;
  mockActivities?: Record<string, Function>;
  interceptors?: any[];
  dataConverterPath?: string;
}

/**
 * Framework de test pour les workflows Temporal
 * 
 * Cette classe facilite l'écriture de tests pour les workflows Temporal
 * en fournissant un environnement de test isolé.
 */
export class WorkflowTester {
  private readonly logger = new Logger('WorkflowTester');
  private testEnv: any;
  private worker: Worker;
  private client: Client;
  private readonly config: WorkflowTestConfig;
  private testResults: Array<{
    name: string;
    success: boolean;
    duration: number;
    error?: Error;
  }> = [];
  
  constructor(config: WorkflowTestConfig) {
    this.config = {
      taskQueue: 'test-task-queue',
      testTimeout: 5000,
      ...config
    };
  }
  
  /**
   * Initialise l'environnement de test
   */
  async setup(): Promise<void> {
    this.logger.log('🔧 Configuration de l\'environnement de test pour les workflows...');
    
    // Créer un environnement de test Temporal
    this.testEnv = await TestWorkflowEnvironment.create({
      // Vous pouvez personnaliser les paramètres ici
    });
    
    // Obtenir la connexion à partir de l'environnement de test
    const connection = this.testEnv.nativeConnection;
    
    // Créer un worker
    this.worker = await Worker.create({
      connection,
      taskQueue: this.config.taskQueue,
      workflowsPath: this.config.workflowsPath,
      activities: this.config.activities,
      interceptors: this.config.interceptors || [],
    });
    
    // Créer un client
    this.client = new Client({
      connection: connection as Connection,
    });
    
    // Démarrer le worker
    await this.worker.run();
    
    this.logger.log('✅ Environnement de test configuré avec succès');
  }
  
  /**
   * Exécute un test pour un workflow spécifique
   * @param testName Nom du test
   * @param workflowName Nom du workflow à tester
   * @param workflowArgs Arguments du workflow
   * @param validationFn Fonction de validation du résultat
   * @param options Options supplémentaires
   */
  async runWorkflowTest(
    testName: string,
    workflowName: string,
    workflowArgs: any[],
    validationFn: (result: any) => boolean | Promise<boolean>,
    options: {
      timeout?: number;
      mockActivities?: Record<string, Function>;
      workflowId?: string;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    this.logger.log(`🧪 Exécution du test "${testName}" pour le workflow "${workflowName}"...`);
    
    try {
      // Définir un timeout pour le test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Test timeout after ${options.timeout || this.config.testTimeout}ms`));
        }, options.timeout || this.config.testTimeout);
      });
      
      // Exécuter le workflow
      const workflowPromise = this.client.workflow.execute(workflowName, {
        args: workflowArgs,
        taskQueue: this.config.taskQueue,
        workflowId: options.workflowId || `test-${workflowName}-${Date.now()}`,
      });
      
      // Attendre le résultat avec timeout
      const result = await Promise.race([workflowPromise, timeoutPromise]);
      
      // Valider le résultat
      const isValid = await validationFn(result);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (isValid) {
        this.logger.log(`✅ Test "${testName}" réussi en ${duration}ms`);
        this.testResults.push({
          name: testName,
          success: true,
          duration
        });
        return true;
      } else {
        const error = new Error(`Test "${testName}" échoué: le résultat ne correspond pas aux attentes`);
        this.logger.error(error.message, result);
        this.testResults.push({
          name: testName,
          success: false,
          duration,
          error
        });
        return false;
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.logger.error(`❌ Test "${testName}" échoué:`, error);
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error
      });
      return false;
    }
  }
  
  /**
   * Exécute un test pour une activité spécifique
   * @param testName Nom du test
   * @param activityName Nom de l'activité à tester
   * @param activityArgs Arguments de l'activité
   * @param validationFn Fonction de validation du résultat
   * @param options Options supplémentaires
   */
  async runActivityTest(
    testName: string,
    activityName: string,
    activityArgs: any[],
    validationFn: (result: any) => boolean | Promise<boolean>,
    options: {
      timeout?: number;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();
    this.logger.log(`🧪 Exécution du test "${testName}" pour l'activité "${activityName}"...`);
    
    try {
      // Récupérer la fonction d'activité
      const activityFn = this.config.activities[activityName];
      if (!activityFn) {
        throw new Error(`Activité "${activityName}" non trouvée`);
      }
      
      // Définir un timeout pour le test
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Test timeout after ${options.timeout || this.config.testTimeout}ms`));
        }, options.timeout || this.config.testTimeout);
      });
      
      // Exécuter l'activité
      const activityPromise = Promise.resolve(activityFn(...activityArgs));
      
      // Attendre le résultat avec timeout
      const result = await Promise.race([activityPromise, timeoutPromise]);
      
      // Annuler le timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Valider le résultat
      const isValid = await validationFn(result);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (isValid) {
        this.logger.log(`✅ Test "${testName}" réussi en ${duration}ms`);
        this.testResults.push({
          name: testName,
          success: true,
          duration
        });
        return true;
      } else {
        const error = new Error(`Test "${testName}" échoué: le résultat ne correspond pas aux attentes`);
        this.logger.error(error.message, result);
        this.testResults.push({
          name: testName,
          success: false,
          duration,
          error
        });
        return false;
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.logger.error(`❌ Test "${testName}" échoué:`, error);
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error
      });
      return false;
    }
  }
  
  /**
   * Exécute une suite de tests de workflow
   * @param tests Tableau de tests à exécuter
   */
  async runTestSuite(tests: Array<{
    name: string;
    type: 'workflow' | 'activity';
    target: string;
    args: any[];
    validation: (result: any) => boolean | Promise<boolean>;
    options?: any;
  }>): Promise<boolean> {
    this.logger.log(`🧪 Exécution d'une suite de ${tests.length} tests...`);
    
    let allSucceeded = true;
    let passCount = 0;
    let failCount = 0;
    
    for (const test of tests) {
      let success: boolean;
      
      if (test.type === 'workflow') {
        success = await this.runWorkflowTest(
          test.name,
          test.target,
          test.args,
          test.validation,
          test.options
        );
      } else {
        success = await this.runActivityTest(
          test.name,
          test.target,
          test.args,
          test.validation,
          test.options
        );
      }
      
      if (success) {
        passCount++;
      } else {
        failCount++;
        allSucceeded = false;
      }
    }
    
    this.logger.log(`📊 Résultat des tests: ${passCount} réussis, ${failCount} échoués`);
    
    return allSucceeded;
  }
  
  /**
   * Génère un rapport de test
   * @param outputPath Chemin du fichier de rapport (optionnel)
   * @returns Le rapport de test sous forme d'objet JSON
   */
  generateTestReport(outputPath?: string): any {
    const report = {
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(t => t.success).length,
        failed: this.testResults.filter(t => !t.success).length,
        passRate: this.testResults.length > 0
          ? (this.testResults.filter(t => t.success).length / this.testResults.length) * 100
          : 0
      },
      tests: this.testResults.map(t => ({
        name: t.name,
        status: t.success ? 'passed' : 'failed',
        duration: t.duration,
        error: t.error ? t.error.message : undefined
      })),
      timestamp: new Date().toISOString()
    };
    
    if (outputPath) {
      try {
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        this.logger.log(`📝 Rapport de test écrit dans ${outputPath}`);
      } catch (error) {
        this.logger.error(`Erreur lors de l'écriture du rapport de test:`, error);
      }
    }
    
    return report;
  }
  
  /**
   * Nettoie l'environnement de test
   */
  async teardown(): Promise<void> {
    this.logger.log('🧹 Nettoyage de l\'environnement de test...');
    
    if (this.worker) {
      await this.worker.shutdown();
    }
    
    if (this.testEnv) {
      await this.testEnv.teardown();
    }
    
    this.logger.log('✅ Environnement de test nettoyé avec succès');
  }
}