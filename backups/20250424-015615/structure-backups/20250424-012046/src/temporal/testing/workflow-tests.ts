import { WorkflowTester } from ./workflow-testerstructure-agent';
import * as activities from ../activitiesstructure-agent';
import * as path from pathstructure-agent';

/**
 * Script de test pour les workflows Temporal
 * 
 * Ce script exécute des tests automatisés pour vos workflows Temporal
 * et génère un rapport de test.
 */
async function runWorkflowTests() {
  console.log('🧪 Démarrage des tests des workflows Temporal');
  
  // Créer une instance du testeur de workflows
  const tester = new WorkflowTester({
    workflowsPath: path.resolve(__dirname, '../workflows.ts'),
    activities,
    testTimeout: 10000 // 10 secondes
  });
  
  try {
    // Initialiser l'environnement de test
    await tester.setup();
    
    // Exécuter une suite de tests
    await tester.runTestSuite([
      // Test du workflow de transformation de code
      {
        name: 'Test du workflow de transformation de code',
        type: 'workflow',
        target: 'codeTransformationWorkflow',
        args: ['/chemin/test/source'],
        validation: (result) => {
          // Vérifier que le résultat contient les propriétés attendues
          return (
            result &&
            result.status === 'success' &&
            typeof result.sourceDir === 'string' &&
            result.analysisResult &&
            result.transformResult &&
            result.validationResult &&
            typeof result.timestamp === 'string'
          );
        }
      },
      
      // Test du workflow d'audit de code
      {
        name: 'Test du workflow d\'audit de code',
        type: 'workflow',
        target: 'codeAuditWorkflow',
        args: ['/chemin/test/source'],
        validation: (result) => {
          // Vérifier que le résultat contient les propriétés attendues
          return (
            result &&
            result.status === 'audit-completed' &&
            typeof result.sourceDir === 'string' &&
            result.analysisResult &&
            typeof result.timestamp === 'string'
          );
        }
      },
      
      // Test de l'activité d'analyse de code
      {
        name: 'Test de l\'activité d\'analyse de code',
        type: 'activity',
        target: 'analyzeCode',
        args: ['/chemin/test/source'],
        validation: (result) => {
          return result && result.status === 'completed';
        }
      },
      
      // Test de l'activité de transformation de code
      {
        name: 'Test de l\'activité de transformation de code',
        type: 'activity',
        target: 'transformCode',
        args: [{ status: 'completed', sourceDir: '/chemin/test/source' }],
        validation: (result) => {
          return result && result.status === 'completed';
        }
      },
      
      // Test de l'activité de validation du code transformé
      {
        name: 'Test de l\'activité de validation du code transformé',
        type: 'activity',
        target: 'validateTransformedCode',
        args: [{ status: 'completed', analysis: { sourceDir: '/chemin/test/source' } }],
        validation: (result) => {
          return result && result.status === 'validated';
        }
      }
    ]);
    
    // Générer un rapport de test
    const reportPath = path.resolve(__dirname, '../../../reports/workflow-test-report.json');
    const report = tester.generateTestReport(reportPath);
    
    console.log('📊 Résumé des tests:');
    console.log(`  Total: ${report.summary.total}`);
    console.log(`  Réussis: ${report.summary.passed}`);
    console.log(`  Échoués: ${report.summary.failed}`);
    console.log(`  Taux de réussite: ${report.summary.passRate.toFixed(2)}%`);
    
  } finally {
    // Nettoyer l'environnement de test
    await tester.teardown();
  }
}

// Exécuter les tests si le fichier est appelé directement
if (require.main === module) {
  runWorkflowTests().catch((err) => {
    console.error('❌ Erreur lors de l\'exécution des tests:', err);
    process.exit(1);
  });
}

export { runWorkflowTests };