#!/usr/bin/env ts-node

/**
 * Script pour tester l'agent QA-Analyzer dans la nouvelle architecture
 * 
 * Ce script permet de vérifier si l'agent QA-Analyzer implémente correctement 
 * l'interface AbstractAnalyzerAgent.
 */

import * as fs from fs-extrastructure-agent';
import * as path from pathstructure-agent';
import { QAAnalyzer } from ./packagesDoDotmcp-agents/analyzers/qa-analyzer/qa-analyzer';

/**
 * Interface de contexte minimale pour les tests
 */
interface MinimalAgentContext {
  getConfig: () => Record<string, any>;
  logger: Console;
}

/**
 * Fonction pour tester un agent QA-Analyzer
 */
async function testQAAnalyzer() {
  const sourcePhpPath = '/tmp/example.php';
  const generatedFiles = {
    component: '/tmp/example.tsx',
    loader: '/tmp/example.loader.ts'
  };
  
  // Créer des fichiers temporaires pour le test
  await fs.writeFile(sourcePhpPath, `<?php\n// Example PHP file\n$name = $_GET['name'];\necho "Hello, $name";\n?>`);
  await fs.writeFile(generatedFiles.component, 'export default function Example() { return <div>Hello</div>; }');
  await fs.writeFile(generatedFiles.loader, 'export async function loader() { return { name: "World" }; }');
  
  console.log('Fichiers de test créés.');
  
  // Créer une instance de l'agent
  const analyzer = new QAAnalyzer(sourcePhpPath, generatedFiles, {
    outputDir: '/tmp',
    verbose: true
  });
  
  console.log('Agent créé. Propriétés requises:');
  console.log(`- id: ${analyzer.id}`);
  console.log(`- name: ${analyzer.name}`);
  console.log(`- version: ${analyzer.version}`);
  console.log(`- description: ${analyzer.description}`);
  
  // Créer un contexte minimal
  const context: MinimalAgentContext = {
    getConfig: () => ({ outputDir: '/tmp' }),
    logger: console
  };
  
  // Tester l'initialisation
  console.log('\nInitialisation de l\'agent...');
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    await analyzer.initialize(context);
    console.log('Initialisation réussie!');
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation:', error.message);
  }
  
  // Tester l'exécution
  console.log('\nExécution de l\'agent...');
  try {
    // @ts-ignore - Ignorer les erreurs de type pour ce test simple
    await analyzer.execute(context);
    console.log('Exécution réussie!');
  } catch (error: any) {
    console.error('Erreur lors de l\'exécution:', error.message);
  }
  
  // Tester le nettoyage
  console.log('\nNettoyage de l\'agent...');
  try {
    await analyzer.cleanup();
    console.log('Nettoyage réussi!');
  } catch (error: any) {
    console.error('Erreur lors du nettoyage:', error.message);
  }
  
  // Supprimer les fichiers temporaires
  await fs.remove(sourcePhpPath);
  await fs.remove(generatedFiles.component);
  await fs.remove(generatedFiles.loader);
  
  console.log('\nFichiers temporaires supprimés.');
  console.log('\nTest terminé.');
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('=== Test de l\'agent QA-Analyzer ===\n');
  
  try {
    await testQAAnalyzer();
  } catch (error: any) {
    console.error('Erreur lors du test:', error.message);
  }
}

// Exécuter le script
main()
  .then(() => console.log('\nTest terminé.'))
  .catch(error => console.error('Erreur:', error));