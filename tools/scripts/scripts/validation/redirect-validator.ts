/**
 * Redirect Validator
 *
 * Script pour valider systématiquement les URLs migrées et vérifier que les redirections
 * fonctionnent correctement, afin d'éviter toute perte de référencement SEO.
 *
 * Fonctionnalités:
 * - Parse les fichiers .htaccess pour extraire les règles de redirection
 * - Vérifie la validité des URLs sources et destinations
 * - Détecte les chaînes de redirection trop longues (impactant le SEO)
 * - Valide que chaque URL source génère bien la redirection attendue
 * - Génère un rapport détaillé avec statistiques et problèmes identifiés
 */

import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs-extra';

// Interfaces
interface Redirection {
  source: string;
  target: string;
  statusCode: number;
  condition?: string;
  rewriteRule?: string;
}

interface ValidationResult {
  url: string;
  expected: {
    statusCode: number;
    destination?: string;
  };
  actual: {
    statusCode: number;
    destination?: string;
  };
  valid: boolean;
  error?: string;
  isSeoImportant: boolean;
}

interface ValidationReport {
  totalTested: number;
  passed: number;
  failed: number;
  skipped: number;
  seoIssues: number;
  redirectionChainIssues: number;
  results: ValidationResult[];
}

interface RedirectValidatorOptions {
  htaccessPaths: string[];
  baseUrl: string;
  outputReportPath: string;
  seoImportantUrlsPath?: string;
  timeout: number;
  verbose: boolean;
}

// Classe principale
class RedirectValidator {
  private redirects: Redirection[] = [];
  private seoImportantUrls: Set<string> = new Set();
  private redirectGraph: Map<string, string> = new Map();
  private validationResults: ValidationResult[] = [];

  constructor(private options: RedirectValidatorOptions) {}

  /**
   * Point d'entrée principal pour lancer la validation
   */
  public async validate(): Promise<ValidationReport> {
    console.log(chalk.blue('🔄 Démarrage de la validation des redirections...'));

    // Chargement des URLs importantes pour le SEO
    await this.loadSeoUrls();

    // Extraction des règles de redirection
    await this.extractRedirections();

    // Construction du graphe des redirections
    this.buildRedirectGraph();

    // Validation des redirections
    await this.validateRedirections();

    // Génération et sauvegarde du rapport
    const report = this.generateReport();
    await this.saveReport(report);

    return report;
  }

  /**
   * Charge les URLs importantes pour le SEO depuis un fichier JSON
   */
  private async loadSeoUrls(): Promise<void> {
    if (!this.options.seoImportantUrlsPath) {
      console.log(
        chalk.yellow(
          "⚠️ Aucun fichier d'URLs SEO importantes spécifié. Toutes les URLs seront considérées comme importantes."
        )
      );
      return;
    }

    try {
      if (await fs.pathExists(this.options.seoImportantUrlsPath)) {
        const urls = await fs.readJson(this.options.seoImportantUrlsPath);
        urls.forEach((url: string) => this.seoImportantUrls.add(url));
        console.log(
          chalk.green(`✅ ${this.seoImportantUrls.size} URLs importantes pour le SEO chargées.`)
        );
      } else {
        console.log(
          chalk.yellow(
            `⚠️ Le fichier ${this.options.seoImportantUrlsPath} n'existe pas. Toutes les URLs seront considérées comme importantes.`
          )
        );
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du chargement des URLs SEO: ${error.message}`));
    }
  }

  /**
   * Extrait toutes les règles de redirection des fichiers .htaccess
   */
  private async extractRedirections(): Promise<void> {
    for (const htaccessPath of this.options.htaccessPaths) {
      if (await fs.pathExists(htaccessPath)) {
        const extractedRedirects = await this.extractRedirectsFromHtaccess(htaccessPath);
        console.log(
          chalk.green(`✅ ${extractedRedirects.length} redirections extraites de ${htaccessPath}`)
        );
        this.redirects.push(...extractedRedirects);
      } else {
        console.log(chalk.yellow(`⚠️ Le fichier htaccess ${htaccessPath} n'existe pas.`));
      }
    }

    // Dédupliquer les redirections
    this.redirects = this.deduplicateRedirects(this.redirects);
    console.log(
      chalk.green(`✅ ${this.redirects.length} redirections uniques après déduplication`)
    );
  }

  /**
   * Extrait les règles de redirection d'un fichier .htaccess
   */
  private async extractRedirectsFromHtaccess(htaccessPath: string): Promise<Redirection[]> {
    const content = await fs.readFile(htaccessPath, 'utf-8');
    const lines = content.split('\n');
    const redirects: Redirection[] = [];
    let inRewriteCondition = false;
    let currentCondition = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ignorer les commentaires et les lignes vides
      if (line.startsWith('#') || line === '') {
        continue;
      }

      // Récupérer les conditions RewriteCond
      if (line.startsWith('RewriteCond')) {
        inRewriteCondition = true;
        currentCondition += `${line} `;
        continue;
      }

      // Traiter les règles RewriteRule
      if (line.startsWith('RewriteRule')) {
        const ruleMatch = line.match(/RewriteRule\s+\^?(.*?)[\$\s]\s+(.*?)\s+\[(.*?)\]/);

        if (ruleMatch) {
          const source = ruleMatch[1];
          const target = ruleMatch[2];
          const flags = ruleMatch[3];

          // Déterminer le type de redirection
          let statusCode = 301; // Par défaut
          if (flags.includes('R=302')) statusCode = 302;
          if (flags.includes('R=307')) statusCode = 307;
          if (flags.includes('R=308')) statusCode = 308;

          // Traiter les redirections
          if (flags.includes('R=') || flags.includes('R,')) {
            redirects.push({
              source: source.startsWith('/') ? source : `/${source}`,
              target: target.startsWith('http')
                ? target
                : target.startsWith('/')
                  ? target
                  : `/${target}`,
              statusCode,
              condition: inRewriteCondition ? currentCondition.trim() : undefined,
              rewriteRule: line,
            });
          }
        }

        // Réinitialiser après avoir traité une règle
        inRewriteCondition = false;
        currentCondition = '';
        continue;
      }

      // Traiter les RedirectPermanent et Redirect
      if (line.startsWith('RedirectPermanent')) {
        const redirectMatch = line.match(/RedirectPermanent\s+(.*?)\s+(.*)/);
        if (redirectMatch) {
          redirects.push({
            source: redirectMatch[1].startsWith('/') ? redirectMatch[1] : `/${redirectMatch[1]}`,
            target: redirectMatch[2],
            statusCode: 301,
            rewriteRule: line,
          });
        }
      } else if (line.startsWith('Redirect ')) {
        const redirectMatch = line.match(/Redirect\s+(\d+)?\s+(.*?)\s+(.*)/);
        if (redirectMatch) {
          const code = redirectMatch[1];
          const sourcePath = redirectMatch[2];
          const targetPath = redirectMatch[3];

          let statusCode = 302; // Par défaut
          if (code === '301') statusCode = 301;
          if (code === '307') statusCode = 307;
          if (code === '308') statusCode = 308;

          redirects.push({
            source: sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`,
            target: targetPath,
            statusCode,
            rewriteRule: line,
          });
        }
      } else if (line.startsWith('RedirectMatch')) {
        const redirectMatch = line.match(/RedirectMatch\s+(\d+)\s+(.+?)\s+(.+)/i);
        if (redirectMatch) {
          redirects.push({
            source: redirectMatch[2],
            target: redirectMatch[3],
            statusCode: parseInt(redirectMatch[1], 10),
            rewriteRule: line,
          });
        }
      }
    }

    return redirects;
  }

  /**
   * Déduplique les redirections en gardant la plus spécifique
   */
  private deduplicateRedirects(redirects: Redirection[]): Redirection[] {
    const redirectMap = new Map<string, Redirection>();

    // Trier les redirections de la plus spécifique à la moins spécifique
    const sortedRedirects = [...redirects].sort((a, b) => {
      // Plus la source est longue, plus elle est spécifique
      return b.source.length - a.source.length;
    });

    for (const redirect of sortedRedirects) {
      // Si on n'a pas encore de redirection pour cette source ou si la nouvelle est plus spécifique
      if (!redirectMap.has(redirect.source)) {
        redirectMap.set(redirect.source, redirect);
      }
    }

    return Array.from(redirectMap.values());
  }

  /**
   * Construit le graphe des redirections pour détecter les chaînes de redirection
   */
  private buildRedirectGraph(): void {
    for (const redirect of this.redirects) {
      this.redirectGraph.set(redirect.source, redirect.target);
    }

    // Détecter les chaînes de redirection trop longues
    const longChains = this.detectLongRedirectChains();

    if (longChains.length > 0) {
      console.log(
        chalk.yellow(
          `⚠️ Détecté ${longChains.length} chaînes de redirection trop longues (>2) - impact SEO négatif.`
        )
      );

      if (this.options.verbose) {
        for (const chain of longChains) {
          console.log(chalk.yellow(`  Chaîne: ${chain.join(' -> ')}`));
        }
      }
    }
  }

  /**
   * Détecte les chaînes de redirection trop longues (>2 sauts)
   */
  private detectLongRedirectChains(): string[][] {
    const longChains: string[][] = [];

    for (const source of this.redirectGraph.keys()) {
      const chains = this.findRedirectChain(source, []);
      const longChainsForSource = chains.filter((chain) => chain.length > 3); // source + 2+ redirections
      longChains.push(...longChainsForSource);
    }

    return longChains;
  }

  /**
   * Trouve toutes les chaînes de redirection pour une URL donnée
   */
  private findRedirectChain(url: string, visited: string[]): string[][] {
    if (visited.includes(url)) {
      // Cycle détecté
      return [visited.concat(url)];
    }

    if (!this.redirectGraph.has(url)) {
      // Fin de la chaîne
      return visited.length > 0 ? [visited.concat(url)] : [];
    }

    // Continuer à suivre la chaîne
    const nextUrl = this.redirectGraph.get(url);
    return this.findRedirectChain(nextUrl, visited.concat(url));
  }

  /**
   * Valide toutes les redirections en effectuant des requêtes HTTP réelles
   */
  private async validateRedirections(): Promise<void> {
    console.log(chalk.blue('🔍 Validation des redirections en cours...'));

    for (const redirect of this.redirects) {
      const fullSourceUrl = this.options.baseUrl + redirect.source;

      try {
        // Détermine si l'URL est importante pour le SEO
        const isSeoImportant = this.isSeoImportantUrl(redirect.source);

        if (this.options.verbose) {
          console.log(
            `Testing ${fullSourceUrl} -> ${redirect.target} (${redirect.statusCode}) [SEO: ${
              isSeoImportant ? 'Important' : 'Standard'
            }]`
          );
        }

        // Test la redirection
        const result = await this.testUrl(fullSourceUrl, redirect.statusCode, redirect.target);

        this.validationResults.push({
          url: redirect.source,
          expected: {
            statusCode: redirect.statusCode,
            destination: redirect.target,
          },
          actual: {
            statusCode: result.statusCode,
            destination: result.location,
          },
          valid: result.valid,
          error: result.error,
          isSeoImportant,
        });
      } catch (error) {
        this.validationResults.push({
          url: redirect.source,
          expected: {
            statusCode: redirect.statusCode,
            destination: redirect.target,
          },
          actual: {
            statusCode: 0,
            destination: '',
          },
          valid: false,
          error: error.message,
          isSeoImportant: this.isSeoImportantUrl(redirect.source),
        });
      }
    }

    const valid = this.validationResults.filter((r) => r.valid).length;
    const failed = this.validationResults.filter((r) => !r.valid).length;

    console.log(chalk.green(`✅ ${valid} redirections valides`));
    if (failed > 0) {
      console.log(chalk.red(`❌ ${failed} redirections en échec`));
    }
  }

  /**
   * Teste une URL pour vérifier la redirection
   */
  private async testUrl(
    url: string,
    expectedStatus: number,
    expectedLocation?: string
  ): Promise<{
    statusCode: number;
    location?: string;
    valid: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      // Utiliser curl pour tester les redirections
      const curlProcess = spawn('curl', [
        '-s', // Silent
        '-I', // Headers only
        '-o',
        '/dev/null', // Discard output
        '-m',
        `${this.options.timeout}`, // Timeout in seconds
        '-w',
        '%{http_code} %{redirect_url}', // Output format
        url,
      ]);

      let output = '';

      curlProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      curlProcess.stderr.on('data', (data) => {
        output += `ERROR: ${data.toString()}`;
      });

      curlProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            statusCode: 0,
            valid: false,
            error: `Curl exit code: ${code}`,
          });
          return;
        }

        const [statusCodeStr, location] = output.trim().split(' ');
        const statusCode = parseInt(statusCodeStr, 10);

        let valid = true;
        let error;

        // Vérifier le code de statut
        if (statusCode !== expectedStatus) {
          valid = false;
          error = `Code de statut attendu ${expectedStatus}, reçu ${statusCode}`;
        }

        // Vérifier l'URL de destination (si disponible et attendue)
        if (
          valid &&
          expectedLocation &&
          location &&
          !this.matchesExpectedLocation(location, expectedLocation)
        ) {
          valid = false;
          error = `Destination attendue ${expectedLocation}, reçu ${location}`;
        }

        resolve({
          statusCode,
          location,
          valid,
          error,
        });
      });
    });
  }

  /**
   * Vérifie si une URL de redirection correspond à la destination attendue
   */
  private matchesExpectedLocation(actual: string, expected: string): boolean {
    // Normaliser les URLs pour la comparaison
    const normalizeUrl = (url: string): string => {
      url = url.trim();
      // Supprimer le trailing slash si présent
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      // S'assurer que l'URL est complète
      if (!url.startsWith('http')) {
        url = this.options.baseUrl + (url.startsWith('/') ? url : `/${url}`);
      }
      return url.toLowerCase();
    };

    const normalizedActual = normalizeUrl(actual);
    const normalizedExpected = normalizeUrl(expected);

    return normalizedActual === normalizedExpected;
  }

  /**
   * Vérifie si une URL est considérée comme importante pour le SEO
   */
  private isSeoImportantUrl(url: string): boolean {
    // Si aucune liste d'URLs importantes n'est définie, toutes sont importantes
    if (this.seoImportantUrls.size === 0) {
      return true;
    }

    // Normaliser l'URL
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    // Vérifier si l'URL est dans la liste des URLs importantes
    return this.seoImportantUrls.has(normalizedUrl);
  }

  /**
   * Génère le rapport de validation
   */
  private generateReport(): ValidationReport {
    const total = this.validationResults.length;
    const passed = this.validationResults.filter((r) => r.valid).length;
    const failed = this.validationResults.filter((r) => !r.valid).length;
    const skipped = 0; // Dans cette implémentation, on ne saute aucun test

    const seoIssues = this.validationResults.filter((r) => !r.valid && r.isSeoImportant).length;
    const redirectionChainIssues = this.detectLongRedirectChains().length;

    return {
      totalTested: total,
      passed,
      failed,
      skipped,
      seoIssues,
      redirectionChainIssues,
      results: this.validationResults,
    };
  }

  /**
   * Sauvegarde le rapport dans un fichier JSON
   */
  private async saveReport(report: ValidationReport): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.options.outputReportPath));
      await fs.writeJson(this.options.outputReportPath, report, { spaces: 2 });
      console.log(chalk.green(`✅ Rapport sauvegardé dans ${this.options.outputReportPath}`));

      // Afficher un résumé
      console.log(chalk.blue('\n📊 Résumé de la validation:'));
      console.log(`Total des redirections testées: ${report.totalTested}`);
      console.log(chalk.green(`✅ Redirections valides: ${report.passed}`));

      if (report.failed > 0) {
        console.log(chalk.red(`❌ Redirections en échec: ${report.failed}`));
      }

      if (report.seoIssues > 0) {
        console.log(chalk.red(`⚠️ Problèmes SEO critiques: ${report.seoIssues}`));
      }

      if (report.redirectionChainIssues > 0) {
        console.log(
          chalk.yellow(`⚠️ Chaînes de redirection trop longues: ${report.redirectionChainIssues}`)
        );
      }
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la sauvegarde du rapport: ${error.message}`));
    }
  }
}

// Point d'entrée quand exécuté directement
if (require.main === module) {
  const yargs = require('yargs/yargs');
  const { hideBin } = require('yargs/helpers');

  const argv = yargs(hideBin(process.argv))
    .option('htaccess', {
      alias: 'h',
      type: 'array',
      description: 'Chemins vers les fichiers .htaccess à analyser',
      demandOption: true,
    })
    .option('base-url', {
      alias: 'b',
      type: 'string',
      description: 'URL de base pour tester les redirections (par ex. http://localhost:3000)',
      demandOption: true,
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Chemin pour le rapport de validation JSON',
      default: './redirect-validation-report.json',
    })
    .option('seo-urls', {
      alias: 's',
      type: 'string',
      description: 'Chemin vers un fichier JSON contenant les URLs importantes pour le SEO',
    })
    .option('timeout', {
      alias: 't',
      type: 'number',
      description: 'Timeout en secondes pour chaque requête de validation',
      default: 5,
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: "Afficher plus d'informations pendant la validation",
      default: false,
    })
    .help().argv;

  const validator = new RedirectValidator({
    htaccessPaths: argv.htaccess,
    baseUrl: argv.baseUrl,
    outputReportPath: argv.output,
    seoImportantUrlsPath: argv.seoUrls,
    timeout: argv.timeout,
    verbose: argv.verbose,
  });

  validator
    .validate()
    .then((report) => {
      if (report.failed > 0 || report.seoIssues > 0) {
        process.exit(1); // Échec pour CI/CD
      } else {
        process.exit(0); // Succès
      }
    })
    .catch((error) => {
      console.error(chalk.red(`❌ Erreur fatale: ${error.message}`));
      process.exit(1);
    });
}

export { RedirectValidator, ValidationReport, ValidationResult, Redirection };
