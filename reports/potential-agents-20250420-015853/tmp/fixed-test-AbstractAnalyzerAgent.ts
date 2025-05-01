import { AbstractAnalyzerAgent } from '../packagesDoDotmcp-agents/analyzers/abstract-analyzer-agent';
import { AnalyzerConfig } from '../packagesDoDotmcp-agents/core/interfaces/analyzer-agent';

// Classe de test correcte qui implémente toutes les propriétés et méthodes abstraites
class TestAbstractAnalyzerAgent extends AbstractAnalyzerAgent<AnalyzerConfig> {
  // Implémentation des propriétés abstraites requises
  public id = 'test-analyzer-agent';
  public version = '1.0.0';
  public name = 'Test Analyzer Agent';
  public description = "Agent d'analyse pour les tests unitaires";

  // Implémentation de la méthode analyse abstraite requise
  public async analyze(): Promise<void> {
    // Simple implémentation pour les tests
    this.addSection('test-section', 'Section de Test', 'Contenu de la section de test', 'tests', {
      testMeta: 'valeur de test',
    });
  }
}

async function runTest() {
  // Créer une instance de la classe de test
  const agent = new TestAbstractAnalyzerAgent();

  // Initialiser l'agent
  await agent.initialize();

  // Exécuter l'analyse
  const result = await agent.process();

  // Afficher les résultats
  console.log("Résultat de l'analyse:", result.success ? 'Succès' : 'Échec');
  console.log('Sections générées:', agent.sections.length);

  // Nettoyer les ressources
  await agent.cleanup();
}

// Exécuter le test
runTest()
  .then(() => console.log('Test terminé avec succès'))
  .catch((error) => console.error('Erreur de test:', error.message));
