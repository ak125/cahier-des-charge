// filepath: /workspaces/cahier-des-charge/run-fixed-agent-tests.ts
/**
 * Script pour exécuter les tests des agents MCP en résolvant les problèmes d'importation et d'instanciation
 */

import * as path from pathstructure-agent';
import * as fs from fsstructure-agent';
import { configureAgentTest, runAgentTest } from ./test-configstructure-agent';

// Liste des agents à tester
const agentsToTest: Array<{ name: string; path: string }> = [
  {
    name: 'DataAgent',
    path: './packagesDoDotmcp-agents/analyzers/DataAnalyzer/DataAgent'
  },
  {
    name: 'AbstractAnalyzer',
    path: './packagesDoDotmcp-agents/analyzers/AbstractAnalyzer'
  },
  {
    name: 'BaseAnalyzerAgent',
    path: './packagesDoDotmcp-agents/analyzers/BaseAnalyzer-agent'
  },
  // Ajoutez d'autres agents selon les besoins
];

// Créer un rapport de résultats
const reportDir = path.join(__dirname, 'reports', 'tests');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

async function runTests() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `agent-fixed-tests-report-${timestamp}.md`);
  const reportStream = fs.createWriteStream(reportPath);
  
  reportStream.write(`# Rapport des tests d'agents MCP corrigés - ${new Date().toLocaleString()}\n\n`);
  reportStream.write(`## Résumé\n\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const agent of agentsToTest) {
    reportStream.write(`### ${agent.name} (${agent.path})\n\n`);
    
    try {
      // Configurer le test pour cet agent
      const testFilePath = configureAgentTest(agent.name, agent.path);
      
      // Exécuter le test
      console.log(`Exécution des tests pour ${agent.name}...`);
      const results = await runAgentTest(testFilePath);
      
      if (results.results.success) {
        reportStream.write(`- ✅ Test réussi\n`);
        successCount++;
      } else {
        reportStream.write(`- ❌ Test échoué\n`);
        reportStream.write("```\n");
        reportStream.write(JSON.stringify(results.results.json, null, 2));
        reportStream.write("\n```\n\n");
        failureCount++;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack || errorMessage : String(error);
      
      reportStream.write(`- ❌ Erreur lors de l'exécution du test : ${errorMessage}\n`);
      reportStream.write("```\n");
      reportStream.write(errorStack);
      reportStream.write("\n```\n\n");
      failureCount++;
    }
  }
  
  reportStream.write(`## Statistiques\n\n`);
  reportStream.write(`- Tests réussis : ${successCount}\n`);
  reportStream.write(`- Tests échoués : ${failureCount}\n`);
  reportStream.write(`- Total : ${successCount + failureCount}\n`);
  
  reportStream.end();
  
  console.log(`Rapport de tests généré : ${reportPath}`);
}

runTests().catch(error => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Erreur lors de l\'exécution des tests :', errorMessage);
  process.exit(1);
});