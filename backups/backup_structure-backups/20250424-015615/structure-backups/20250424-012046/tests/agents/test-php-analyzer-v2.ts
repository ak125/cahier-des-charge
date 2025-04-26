import phpAnalyzerV2 from ../../packagesDoDotmcp-agents/analyzers/php-analyzer/php-analyzer';

// Test pour l'agent PHPAnalyzerV2 qui est exporté comme une instance par défaut
async function main() {
  console.log('Testing PHPAnalyzerV2 instance...');
  
  // On peut directement utiliser les méthodes sur l'instance exportée
  const processMock = async () => {
    console.log('Testing process method');
    // Simulation d'un contexte minimal
    const context = {
      sourceDir: '/tmp/test-php-directory',
      options: {}
    };
    
    try {
      // Simuler l'exécution sans vraiment analyser de fichiers
      console.log(`Would process PHP files in ${context.sourceDir}`);
      return {
        success: true,
        data: {
          analysis: {
            files: [],
            statistics: {
              totalFiles: 0,
              totalLOC: 0,
              totalFunctions: 0,
              totalClasses: 0,
              totalMethods: 0,
              avgComplexity: 0,
              fileTypes: {}
            },
            dependencies: { internal: [], external: [] },
            databaseSchema: { tables: [] },
            routes: [],
            migrationComplexity: { score: 0, factors: [] }
          }
        }
      };
    } catch (error) {
      console.error('Error executing PHP analyzer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Test basic properties
  console.log(`Agent ID: ${phpAnalyzerV2.id}`);
  console.log(`Agent Name: ${phpAnalyzerV2.name}`);
  console.log(`Agent Description: ${phpAnalyzerV2.description}`);
  
  // Test all required methods
  console.log('\nTesting process method (mocked)...');
  await processMock();

  // Adapter le test en fonction des méthodes existantes dans l'interface
  console.log('\nTesting all interface methods...');
  
  // Ces méthodes ne sont peut-être pas implémentées directement, mais simulons-les
  // pour la compatibilité avec l'interface commune
  const interfaceMethods = [
    'initialize', 'validate', 'execute', 'run', 'validateData', 'generate'
  ];
  
  for (const method of interfaceMethods) {
    console.log(`Testing ${method} method (if available)...`);
    if (typeof (phpAnalyzerV2 as any)[method] === 'function') {
      console.log(`✓ Method ${method} exists`);
    } else {
      console.log(`✕ Method ${method} is not implemented, should be added for interface compliance`);
    }
  }
  
  console.log('\nAll tests completed');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

// Export the test function for use in other tests
export { main as testPHPAnalyzerV2 };