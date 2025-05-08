#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

interface UrlPattern {
  pattern: string;
  count: number;
  examples: string[];
}

const program = new Command();

program
  .name('analyze-legacy-urls')
  .description('Analyse les URLs legacy pour identifier des patterns')
  .argument('<fichier>', 'Chemin vers le fichier contenant les URLs legacy')
  .option('-o, --output <chemin>', 'Chemin pour le fichier de rapport (défaut: legacy-urls-report.json)')
  .action((fichier, options) => {
    const outputPath = options.output || 'legacy-urls-report.json';
    analyzeUrls(fichier, outputPath);
  });

program.parse();

function analyzeUrls(inputFile: string, outputFile: string) {
  try {
    // Lire le fichier d'URLs
    console.log(chalk.blue(`Lecture du fichier ${inputFile}...`));
    const content = fs.readFileSync(inputFile, 'utf8');
    const urls = content.split('\n').filter(url => url.trim() !== '');

    console.log(chalk.green(`${urls.length} URLs trouvées.`));

    // Analyser les patterns
    const patterns: Record<string, UrlPattern> = {};
    const extensions = new Set<string>();
    const paramNames = new Set<string>();

    for (const url of urls) {
      try {
        // Utiliser un domaine factice pour les URLs relatives
        const fullUrl = url.startsWith('http') ? url : `http://example.com${url}`;
        const parsedUrl = new URL(fullUrl);

        // Extraire l'extension
        const pathname = parsedUrl.pathname;
        const ext = path.extname(pathname);
        if (ext) {
          extensions.add(ext);
        }

        // Créer un pattern en remplaçant les segments variables par des placeholders
        let pattern = pathname;

        // Remplacer les IDs numériques par {id}
        pattern = pattern.replace(/\/\d+\//g, '/{id}/');

        // Collecter les noms de paramètres
        for (const paramName of parsedUrl.searchParams.keys()) {
          paramNames.add(paramName);
        }

        // Ajouter le pattern au dictionnaire
        if (!patterns[pattern]) {
          patterns[pattern] = {
            pattern,
            count: 0,
            examples: []
          };
        }

        patterns[pattern].count++;
        if (patterns[pattern].examples.length < 5) {
          patterns[pattern].examples.push(url);
        }
      } catch (error) {
        console.warn(chalk.yellow(`Impossible de traiter l'URL: ${url}`));
      }
    }

    // Préparer les résultats
    const result = {
      totalUrls: urls.length,
      extensions: Array.from(extensions),
      paramNames: Array.from(paramNames),
      patterns: Object.values(patterns).sort((a, b) => b.count - a.count)
    };

    // Écrire le rapport
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(chalk.green(`Rapport généré avec succès: ${outputFile}`));
    console.log(`Nombre de patterns identifiés: ${Object.keys(patterns).length}`);
    console.log(`Extensions identifiées: ${Array.from(extensions).join(', ')}`);
    console.log(`Paramètres courants: ${Array.from(paramNames).join(', ')}`);

  } catch (error) {
    console.error(chalk.red(`Erreur: ${error}`));
    process.exit(1);
  }
}