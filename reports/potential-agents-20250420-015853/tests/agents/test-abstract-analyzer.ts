import { AbstractAnalyzerAgent } from '../../packagesDoDotmcp-agents/analyzers/abstract-analyzer-agent';

// Classe concrète pour tester AbstractAnalyzerAgent
class TestAnalyzerAgent extends AbstractAnalyzerAgent {
  public id = 'test-analyzer-agent';
  public version = '1.0.0';
  public name = 'Test Analyzer Agent';
  public description = "Agent d'analyse pour les tests";

  // Implémentation de la méthode abstraite analyze
  public async analyze(): Promise<void> {
    this.addSection('test-section', 'Test Section', 'Contenu de test', 'test', { testMeta: true });
  }

  // Ajout d'autres méthodes requises par l'interface
  public async validate(data: any): Promise<boolean> {
    return true;
  }

  public async execute(params: any): Promise<any> {
    return await this.process();
  }

  public async run(params: any): Promise<any> {
    return await this.process();
  }

  public async validateData(data: any): boolean {
    return true;
  }

  public async generate(params: any): Promise<any> {
    return { generated: true };
  }
}

// Fonction principale pour exécuter le test
async function main() {
  const testAgent = new TestAnalyzerAgent();

  console.log('Initializing test agent...');
  await testAgent.initialize();

  console.log('Processing with test agent...');
  const result = await testAgent.process();

  console.log('Test result:', JSON.stringify(result, null, 2));

  console.log('Testing all interface methods...');
  await testAgent.validate({});
  await testAgent.execute({});
  await testAgent.run({});
  await testAgent.validateData({});
  await testAgent.generate({});

  console.log('All tests completed successfully');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  main().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { TestAnalyzerAgent };
