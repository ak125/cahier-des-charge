import { BaseAnalyzerAgent, AnalysisResult, AnalyzerAgentConfig } from '../../packagesDoDotmcp-agents/analyzers/base-analyzer-agent';
import { AgentContext, AgentResult } from '../../packagesDoDotmcp-agents/core/interfaces';

// Classe concrète pour tester BaseAnalyzerAgent
class TestBaseAnalyzer extends BaseAnalyzerAgent<any> {
  // Implémentation des méthodes abstraites
  public id = 'test-base-analyzer';
  public name = 'Test Base Analyzer';
  public version = '1.0.0';
  public description = 'Agent d\'analyse de base pour les tests';

  // Implémentation de la méthode abstraite performAnalysis
  protected async performAnalysis(context: AgentContext): Promise<AnalysisResult<any>> {
    return {
      findings: [
        {
          type: 'test-finding',
          severity: 'info',
          message: 'Ceci est un test'
        }
      ],
      summary: {
        testResult: true
      },
      statistics: {
        totalFiles: 1,
        filesAnalyzed: 1,
        totalFindings: 1,
        findingsBySeverity: {
          'info': 1
        }
      }
    };
  }

  // Implémentation de validate requise par l'interface
  public async validate(context: any): Promise<boolean> {
    return true;
  }

  // Ajout des autres méthodes requises par l'interface
  public async initialize(): Promise<void> {
    // Implementation du corps de la méthode
    this.log('info', 'Agent initialisé');
  }

  public async run(params: any): Promise<any> {
    return this.execute({} as AgentContext);
  }

  public async process(data: any): Promise<any> {
    return this.execute({} as AgentContext);
  }

  public async generate(params: any): Promise<any> {
    return { generated: true };
  }

  public validateData(data: any): boolean {
    return true;
  }

  // Méthode de journalisation nécessaire
  protected log(level: string, message: string): void {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  // Méthode pour l'exécution avec métriques
  protected async executeWithMetrics<T>(context: AgentContext, callback: () => Promise<AgentResult<T>>): Promise<AgentResult<T>> {
    const startTime = Date.now();
    try {
      const result = await callback();
      const endTime = Date.now();
      return {
        ...result,
        executionTime: endTime - startTime
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: endTime - startTime
      };
    }
  }
}

// Fonction principale pour exécuter le test
async function main() {
  const testAgent = new TestBaseAnalyzer();
  
  console.log('Initializing test agent...');
  await testAgent.initialize();
  
  console.log('Executing test agent...');
  const result = await testAgent.execute({} as AgentContext);
  
  console.log('Test result:', JSON.stringify(result, null, 2));
  
  console.log('Testing all interface methods...');
  await testAgent.validate({});
  await testAgent.run({});
  await testAgent.process({});
  testAgent.validateData({});
  await testAgent.generate({});
  
  console.log('All tests completed successfully');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { TestBaseAnalyzer };