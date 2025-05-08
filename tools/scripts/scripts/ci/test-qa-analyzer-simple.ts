#!/usr/bin/env ts-node

/**
 * Script simplifié pour tester l'agent QA-Analyzer
 *
 * Ce script contourne les problèmes de type avec AbstractAnalyzerAgent
 * en testant uniquement les fonctionnalités spécifiques de QAAnalyzer.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import {
  QAAnalyzer,
  runQAAnalyzer,
} from './packagesDoDotmcp-agents/analyzers/qa-analyzer/qa-analyzer';

/**
 * Fonction pour tester directement les fonctionnalités de QAAnalyzer
 */
async function testQAAnalyzerSimple() {
  console.log('=== Test simplifié de QA-Analyzer ===\n');

  // Créer des fichiers temporaires pour le test
  const testDir = path.join('/tmp', 'qa-analyzer-test');
  await fs.ensureDir(testDir);

  const sourcePhpPath = path.join(testDir, 'example.php');
  const remixComponentPath = path.join(testDir, 'example.tsx');
  const remixLoaderPath = path.join(testDir, 'example.loader.ts');
  const remixMetaPath = path.join(testDir, 'example.meta.ts');

  // Créer un fichier PHP avec quelques champs
  await fs.writeFile(
    sourcePhpPath,
    `
<?php
// Fichier PHP d'exemple
$nom = $_GET['nom'];
$age = $_POST['age'];
$email = $_POST['email'];

// Validation du formulaire
if (empty($nom) || empty($age) || empty($email)) {
  $erreur = "Tous les champs sont obligatoires";
}

// Base de données
$requete = "SELECT id, nom, email FROM utilisateurs WHERE age > $age";

// Métadonnées SEO
?>
<html>
<head>
  <title>Profil de <?php echo $nom; ?></title>
  <meta name="description" content="Page de profil utilisateur">
  <meta name="keywords" content="profil, utilisateur">
  <link rel="canonical" href="https://example.com/profil" />
</head>
<body>
  <h1>Bonjour <?php echo $nom; ?></h1>
  <p>Vous avez <?php echo $age; ?> ans.</p>
  <p>Votre email est <?php echo $email; ?></p>
</body>
</html>
  `
  );

  // Créer un composant Remix
  await fs.writeFile(
    remixComponentPath,
    `
import { useLoaderData } from '@remix-run/react';
import type { LoaderData } from './example.loader';

export default function ExampleComponent() {
  const { nom, age } = useLoaderData<LoaderData>();
  
  return (
    <div>
      <h1>Bonjour {nom}</h1>
      <p>Vous avez {age} ans.</p>
    </div>
  );
}
  `
  );

  // Créer un loader Remix
  await fs.writeFile(
    remixLoaderPath,
    `
import { LoaderFunction } from '@remix-run/node';
import { z } from 'zod';

export interface LoaderData {
  nom: string;
  age: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const nom = url.searchParams.get('nom') || 'Anonyme';
  
  // Validation manquante pour l'email
  
  return {
    nom,
    age: 25
  };
};
  `
  );

  // Créer un fichier meta (incomplet)
  await fs.writeFile(
    remixMetaPath,
    `
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return {
    title: 'Page de profil',
    description: 'Page de profil utilisateur'
    // Canonical manquant
  };
};
  `
  );

  console.log('Fichiers de test créés.');

  try {
    // Utiliser la fonction runQAAnalyzer qui ne dépend pas directement de AbstractAnalyzerAgent
    const result = await runQAAnalyzer(
      sourcePhpPath,
      {
        component: remixComponentPath,
        loader: remixLoaderPath,
        meta: remixMetaPath,
      },
      {
        outputDir: testDir,
        verbose: true,
        generateReport: true,
        reportName: 'qa-test-report',
      }
    );

    console.log("\n=== Résultats de l'analyse ===");
    console.log(`Statut: ${result.status}`);
    console.log(`Score: ${result.score}/100`);
    console.log(`Fichier source: ${path.basename(result.sourceFile)}`);

    console.log('\n=== Champs ===');
    console.log(`Présents: ${result.presentFields.length}`);
    console.log(result.presentFields.map((f) => f.name).join(', '));
    console.log(`Manquants: ${result.missingFields.length}`);
    console.log(result.missingFields.map((f) => f.name).join(', '));

    console.log('\n=== Problèmes ===');
    console.log(`SEO: ${result.seoIssues.length}`);
    result.seoIssues.forEach((issue) => console.log(`- [${issue.severity}] ${issue.message}`));

    console.log(`Types: ${result.typeIssues.length}`);
    result.typeIssues.forEach((issue) => console.log(`- [${issue.severity}] ${issue.message}`));

    console.log(`Validation: ${result.validationIssues.length}`);
    result.validationIssues.forEach((issue) =>
      console.log(`- [${issue.severity}] ${issue.message}`)
    );

    console.log(`Comportement: ${result.behaviorIssues.length}`);
    result.behaviorIssues.forEach((issue) => console.log(`- [${issue.severity}] ${issue.message}`));

    console.log('\n=== Recommandations ===');
    result.recommendations.forEach((rec) => console.log(`- ${rec}`));

    console.log('\n=== Tags ===');
    console.log(result.tags.join(', '));

    // Vérifier si un rapport a été généré
    const reportPath = path.join(testDir, 'qa-test-report.md');
    if (await fs.pathExists(reportPath)) {
      console.log(`\nRapport généré: ${reportPath}`);
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      console.log('\nAperçu du rapport:');
      console.log(`${reportContent.substring(0, 300)}...`);
    }
  } catch (error: any) {
    console.error("Erreur lors de l'analyse:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    // Nettoyer
    await fs.remove(testDir);
    console.log('\nFichiers temporaires supprimés.');
  }
}

// Exécuter le test
testQAAnalyzerSimple()
  .then(() => console.log('\nTest terminé avec succès.'))
  .catch((error) => console.error('Échec du test:', error));
