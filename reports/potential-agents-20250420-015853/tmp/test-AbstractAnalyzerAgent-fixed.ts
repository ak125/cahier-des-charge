import { AbstractAnalyzerAgent } from '../packagesDoDotmcp-agents/analyzers/abstract-analyzer-agent';
import { AnalyzerConfig } from '../packagesDoDotmcp-agents/core/interfaces/analyzer-agent';

// Implémentation de test pour AbstractAnalyzerAgent
class TestAbstractAnalyzerAgent extends AbstractAnalyzerAgent<AnalyzerConfig> {
  // Implémentation des propriétés abstraites requises
  public id = 'test-analyzer-agent';
  public version = '1.0.0';
  public name = 'Test Analyzer Agent';
  public description = "Agent d'analyse de test pour les tests unitaires";

  // Implémentation de la méthode abstraite analyze
  public async analyze(): Promise<void> {
    // Simple implémentation pour les tests
    this.addSection(
      'test-section',
      'Section de test',
      'Contenu de la section de test',
      'test-category'
    );
  }
}

// Fonction de test principale
async function runTest(): Promise<void> {
  console.log('Exécution du test pour TestAbstractAnalyzerAgent');

  // Création d'une instance de l'agent
  const agent = new TestAbstractAnalyzerAgent('/chemin/vers/fichier-test.txt');

  // Initialisation de l'agent
  await agent.initialize();

  // Exécution du traitement de l'agent
  const result = await agent.process();

  // Vérification du résultat
  console.log('Résultat du traitement:', result.success ? 'Succès' : 'Échec');
  console.log(`Nombre de sections: ${result.data?.sectionCount || 0}`);

  // Nettoyage des ressources
  await agent.cleanup();

  console.log('Test terminé');
}

// Exécution du test
runTest().catch((err) => {
  console.error('Erreur lors du test:', err);
  process.exit(1);
});
