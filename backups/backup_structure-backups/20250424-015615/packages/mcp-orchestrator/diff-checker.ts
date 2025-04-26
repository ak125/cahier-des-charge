/**
 * Diff Checker - Composant de l'orchestrateur MCP
 * 
 * Outil pour comparer les fichiers PHP originaux avec leurs versions TSX générées
 * et détecter les différences structurelles ou fonctionnelles.
 * 
 * Fonctionnalités principales:
 * - Analyse d'un fichier PHP et de sa version TSX générée
 * - Détection des éléments clés manquants (champs, formulaires, sections)
 * - Validation des routes et des paramètres
 * - Génération de rapports de différences
 */

import fs from fs-extrastructure-agent';
import path from pathstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';
import * as diff from diffstructure-agent';
import * as cheerio from cheeriostructure-agent';
import * as Sentry from @sentry/nodestructure-agent';

// Types
interface DiffResult {
  filename: string;
  originalPath: string;
  generatedPath: string;
  timestamp: string;
  summary: {
    totalDifferences: number;
    criticalDifferences: number;
    missingElements: number;
    addedElements: number;
  };
  details: {
    missingFields: string[];
    missingForms: string[];
    missingRouteParams: string[];
    structuralDifferences: DiffDetails[];
  };
  report: string;
}

interface DiffDetails {
  type: 'missing' | 'added' | 'changed';
  element: string;
  context?: string;
  originalContent?: string;
  generatedContent?: string;
  importance: 'critical' | 'important' | 'minor';
}

interface DiffCheckerConfig {
  simulationDir?: string;
  outputDir?: string;
  thresholdWarning?: number;
  thresholdError?: number;
  enableSentry?: boolean;
  ignoreComments?: boolean;
  templateMappingsPath?: string;
}

interface TemplateMappings {
  [phpPattern: string]: string;
}

/**
 * Classe principale pour analyser les différences entre PHP et TSX
 */
export class DiffChecker {
  private readonly logger = new Logger('DiffChecker');
  private readonly simulationDir: string;
  private readonly outputDir: string;
  private readonly thresholdWarning: number;
  private readonly thresholdError: number;
  private readonly enableSentry: boolean;
  private readonly ignoreComments: boolean;
  private templateMappings: TemplateMappings = {};
  
  constructor(
    private readonly config: DiffCheckerConfig = {}
  ) {
    this.simulationDir = config.simulationDir || './simulations';
    this.outputDir = config.outputDir || './diff-reports';
    this.thresholdWarning = config.thresholdWarning || 10;
    this.thresholdError = config.thresholdError || 30;
    this.enableSentry = config.enableSentry || false;
    this.ignoreComments = config.ignoreComments !== false;
    
    if (this.enableSentry) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development'
      });
    }
  }
  
  /**
   * Initialise le checker de différences
   */
  async initialize(): Promise<void> {
    try {
      // Créer le répertoire de sortie s'il n'existe pas
      await fs.ensureDir(this.outputDir);
      
      // Charger les mappings de templates si spécifiés
      if (this.config.templateMappingsPath && await fs.pathExists(this.config.templateMappingsPath)) {
        this.templateMappings = await fs.readJson(this.config.templateMappingsPath);
        this.logger.log(`Mappings de templates chargés: ${Object.keys(this.templateMappings).length} motifs`);
      }
      
      this.logger.log('DiffChecker initialisé avec succès');
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'initialisation du DiffChecker: ${error.message}`);
      if (this.enableSentry) {
        Sentry.captureException(error);
      }
      throw error;
    }
  }
  
  /**
   * Compare un fichier PHP original avec sa version TSX générée
   */
  async compareFiles(phpFilePath: string, tsxFilePath: string): Promise<DiffResult> {
    try {
      this.logger.log(`Comparaison de ${path.basename(phpFilePath)} avec ${path.basename(tsxFilePath)}`);
      
      // Lire les contenus des fichiers
      const phpContent = await fs.readFile(phpFilePath, 'utf-8');
      const tsxContent = await fs.readFile(tsxFilePath, 'utf-8');
      
      // Initialiser le résultat
      const result: DiffResult = {
        filename: path.basename(phpFilePath, '.php'),
        originalPath: phpFilePath,
        generatedPath: tsxFilePath,
        timestamp: new Date().toISOString(),
        summary: {
          totalDifferences: 0,
          criticalDifferences: 0,
          missingElements: 0,
          addedElements: 0
        },
        details: {
          missingFields: [],
          missingForms: [],
          missingRouteParams: [],
          structuralDifferences: []
        },
        report: ''
      };
      
      // Analyser la structure HTML depuis le PHP (si possible)
      const phpHtml = this.extractHtmlFromPHP(phpContent);
      
      // Analyser la structure JSX depuis le TSX
      const tsxHtml = this.extractJsxOutput(tsxContent);
      
      // Comparer les structures HTML/JSX
      if (phpHtml && tsxHtml) {
        const structuralDiffs = this.compareHtmlStructures(phpHtml, tsxHtml);
        result.details.structuralDifferences = structuralDiffs;
        
        result.summary.totalDifferences = structuralDiffs.length;
        result.summary.criticalDifferences = structuralDiffs.filter(d => d.importance === 'critical').length;
        result.summary.missingElements = structuralDiffs.filter(d => d.type === 'missing').length;
        result.summary.addedElements = structuralDiffs.filter(d => d.type === 'added').length;
      }
      
      // Trouver les formulaires manquants
      result.details.missingForms = this.findMissingForms(phpContent, tsxContent);
      
      // Trouver les champs manquants
      result.details.missingFields = this.findMissingFields(phpContent, tsxContent);
      
      // Trouver les paramètres de route manquants
      result.details.missingRouteParams = this.findMissingRouteParams(phpContent, tsxContent);
      
      // Générer le rapport
      result.report = this.generateReport(result);
      
      // Sauvegarder le rapport
      await this.saveReport(result);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erreur lors de la comparaison des fichiers: ${error.message}`);
      if (this.enableSentry) {
        Sentry.captureException(error);
      }
      throw error;
    }
  }
  
  /**
   * Extrait le code HTML d'un fichier PHP
   */
  private extractHtmlFromPHP(phpContent: string): string | null {
    try {
      let extractedHtml = '';
      const htmlRegex = /<\s*[a-z][\s\S]*?>/gi;
      
      // Supprimer les blocs PHP
      let cleanedContent = phpContent.replace(/<\?php[\s\S]*?\?>/g, '');
      
      // Supprimer les commentaires si configuré ainsi
      if (this.ignoreComments) {
        cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');
      }
      
      // Si aucun HTML n'est trouvé, retourner null
      if (!htmlRegex.test(cleanedContent)) {
        return null;
      }
      
      // Extraire le HTML
      return cleanedContent;
    } catch (error) {
      this.logger.warn(`Impossible d'extraire le HTML du PHP: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Extrait la sortie HTML probable d'un fichier TSX
   */
  private extractJsxOutput(tsxContent: string): string | null {
    try {
      // Rechercher les composants JSX principaux
      const jsxRegex = /<([A-Z][a-zA-Z]*|[a-z][\w-]*)[\s\S]*?>([\s\S]*?)<\/\1>|<([A-Z][a-zA-Z]*|[a-z][\w-]*)[^>]*\/>/g;
      
      let cleanedContent = tsxContent;
      
      // Supprimer les commentaires si configuré ainsi
      if (this.ignoreComments) {
        cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      }
      
      // Si aucun JSX n'est trouvé, retourner null
      if (!jsxRegex.test(cleanedContent)) {
        return null;
      }
      
      return cleanedContent;
    } catch (error) {
      this.logger.warn(`Impossible d'extraire le JSX du TSX: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Compare les structures HTML
   */
  private compareHtmlStructures(phpHtml: string, tsxHtml: string): DiffDetails[] {
    const differences: DiffDetails[] = [];
    
    try {
      // Parser les structures HTML avec cheerio
      const $php = cheerio.load(phpHtml);
      const $tsx = cheerio.load(tsxHtml);
      
      // Comparer les éléments critiques (formulaires, tableaux, etc.)
      this.compareElements($php, $tsx, 'form', differences);
      this.compareElements($php, $tsx, 'table', differences);
      this.compareElements($php, $tsx, 'div[class*="container"]', differences);
      this.compareElements($php, $tsx, 'section', differences);
      
      // Comparer les champs de formulaire
      this.compareElements($php, $tsx, 'input[type="text"]', differences);
      this.compareElements($php, $tsx, 'input[type="email"]', differences);
      this.compareElements($php, $tsx, 'input[type="password"]', differences);
      this.compareElements($php, $tsx, 'select', differences);
      this.compareElements($php, $tsx, 'textarea', differences);
      
      // Comparer les structures de navigation
      this.compareElements($php, $tsx, 'nav', differences);
      this.compareElements($php, $tsx, 'ul', differences);
      this.compareElements($php, $tsx, 'ol', differences);
      
      // Ajout de vérifications spécifiques pour les attributs data
      this.compareDataAttributes($php, $tsx, differences);
    } catch (error) {
      this.logger.warn(`Erreur lors de la comparaison des structures HTML: ${error.message}`);
    }
    
    return differences;
  }
  
  /**
   * Compare des éléments spécifiques dans les structures HTML
   */
  private compareElements($php: cheerio.CheerioAPI, $tsx: cheerio.CheerioAPI, selector: string, differences: DiffDetails[]): void {
    const phpElements = $php(selector);
    const tsxElements = $tsx(selector);
    
    // Vérifier si les éléments sont présents dans les deux sources
    if (phpElements.length > tsxElements.length) {
      phpElements.each((i, elem) => {
        const $elem = $php(elem);
        const id = $elem.attr('id') || '';
        const name = $elem.attr('name') || '';
        const classes = $elem.attr('class') || '';
        
        // Construire un sélecteur plus spécifique si possible
        let specificSelector = selector;
        if (id) specificSelector = `${selector}#${id}`;
        else if (name) specificSelector = `${selector}[name="${name}"]`;
        else if (classes) specificSelector = `${selector}.${classes.replace(/\s+/g, '.')}`;
        
        // Vérifier si cet élément spécifique existe dans le TSX
        if (tsxElements.length === 0 || $tsx(specificSelector).length === 0) {
          differences.push({
            type: 'missing',
            element: selector.split('[')[0], // Extraire le type d'élément de base
            context: id || name || classes || `index ${i}`,
            originalContent: $php.html($elem),
            importance: this.determineImportance(selector)
          });
        }
      });
    }
  }
  
  /**
   * Compare les attributs data-* dans les structures HTML
   */
  private compareDataAttributes($php: cheerio.CheerioAPI, $tsx: cheerio.CheerioAPI, differences: DiffDetails[]): void {
    // Rechercher tous les éléments avec attributs data-*
    const phpDataElements = $php('[data-*]');
    
    phpDataElements.each((i, elem) => {
      const $elem = $php(elem);
      const attribs = $elem.attr();
      
      // Filtrer pour obtenir seulement les attributs data-*
      const dataAttribs = Object.keys(attribs).filter(key => key.startsWith('data-'));
      
      for (const attr of dataAttribs) {
        // Construire un sélecteur pour cet attribut data spécifique
        const selector = `[${attr}="${attribs[attr]}"]`;
        
        // Vérifier s'il existe dans la version TSX
        if ($tsx(selector).length === 0) {
          differences.push({
            type: 'missing',
            element: 'data-attribute',
            context: `${elem.tagName} ${attr}="${attribs[attr]}"`,
            importance: 'important'
          });
        }
      }
    });
  }
  
  /**
   * Détermine l'importance d'un élément manquant
   */
  private determineImportance(selector: string): 'critical' | 'important' | 'minor' {
    // Les formulaires et les champs sont critiques
    if (selector.startsWith('form') || 
        selector.startsWith('input') ||
        selector.startsWith('select') ||
        selector.startsWith('textarea')) {
      return 'critical';
    }
    
    // Les éléments de structure sont importants
    if (selector.startsWith('table') ||
        selector.startsWith('div[class*="container"]') ||
        selector.startsWith('section') ||
        selector.startsWith('nav')) {
      return 'important';
    }
    
    // Le reste est considéré comme mineur
    return 'minor';
  }
  
  /**
   * Trouve les formulaires manquants en comparant les fichiers
   */
  private findMissingForms(phpContent: string, tsxContent: string): string[] {
    const missingForms: string[] = [];
    const phpFormRegex = /<form[^>]*name=["']([^"']+)["'][^>]*>|<form[^>]*id=["']([^"']+)["'][^>]*>/gi;
    
    let match;
    while ((match = phpFormRegex.exec(phpContent)) !== null) {
      const formName = match[1] || match[2] || 'unknown';
      
      // Recherche du formulaire dans le TSX
      const tsxFormRegex = new RegExp(`<Form[^>]*name=["']${formName}["'][^>]*>|<Form[^>]*id=["']${formName}["'][^>]*>|useForm\\(.*["']${formName}["'].*\\)`, 'i');
      
      if (!tsxFormRegex.test(tsxContent)) {
        missingForms.push(formName);
      }
    }
    
    return missingForms;
  }
  
  /**
   * Trouve les champs manquants en comparant les fichiers
   */
  private findMissingFields(phpContent: string, tsxContent: string): string[] {
    const missingFields: string[] = [];
    const phpFieldRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>|<select[^>]*name=["']([^"']+)["'][^>]*>|<textarea[^>]*name=["']([^"']+)["'][^>]*>/gi;
    
    let match;
    while ((match = phpFieldRegex.exec(phpContent)) !== null) {
      const fieldName = match[1] || match[2] || match[3] || 'unknown';
      
      // Recherche du champ dans le TSX
      const tsxFieldRegex = new RegExp(`<[^>]*name=["']${fieldName}["'][^>]*>|register\\(.*["']${fieldName}["'].*\\)|useField\\(.*["']${fieldName}["'].*\\)`, 'i');
      
      if (!tsxFieldRegex.test(tsxContent)) {
        missingFields.push(fieldName);
      }
    }
    
    return missingFields;
  }
  
  /**
   * Trouve les paramètres de route manquants
   */
  private findMissingRouteParams(phpContent: string, tsxContent: string): string[] {
    const missingParams: string[] = [];
    
    // Recherche des paramètres dans les URLs PHP (ex: /product.php?id=123, $_GET['id'])
    const phpGetParamRegex = /\$_GET\s*\[\s*["']([^"']+)["']\s*\]/gi;
    const phpUrlParamRegex = /\?([\w\-]+=[\w\-]+)(&[\w\-]+=[\w\-]+)*/gi;
    
    // Collecter les paramètres uniques du PHP
    const phpParams = new Set<string>();
    
    let match;
    while ((match = phpGetParamRegex.exec(phpContent)) !== null) {
      phpParams.add(match[1]);
    }
    
    while ((match = phpUrlParamRegex.exec(phpContent)) !== null) {
      const queryString = match[0].substring(1); // Enlever le point d'interrogation
      const params = queryString.split('&');
      
      for (const param of params) {
        const [name] = param.split('=');
        phpParams.add(name);
      }
    }
    
    // Recherche des mêmes paramètres dans le TSX
    for (const param of phpParams) {
      // Rechercher des occurrences Remix/React (ex: useParams, params.id, searchParams.get)
      const tsxParamRegex = new RegExp(`params\\.${param}|searchParams\\.get\\(["']${param}["']\\)|useSearchParams.*get\\(["']${param}["']\\)`, 'i');
      
      if (!tsxParamRegex.test(tsxContent)) {
        missingParams.push(param);
      }
    }
    
    return missingParams;
  }
  
  /**
   * Génère un rapport formaté des différences
   */
  private generateReport(result: DiffResult): string {
    let report = `# Rapport de différences pour ${result.filename}\n\n`;
    report += `Date: ${new Date(result.timestamp).toLocaleString()}\n\n`;
    
    // Résumé
    report += '## Résumé\n\n';
    report += `- Différences totales: ${result.summary.totalDifferences}\n`;
    report += `- Différences critiques: ${result.summary.criticalDifferences}\n`;
    report += `- Éléments manquants: ${result.summary.missingElements}\n`;
    report += `- Éléments ajoutés: ${result.summary.addedElements}\n\n`;
    
    // Status global
    let status = 'OK';
    if (result.summary.criticalDifferences > 0) {
      status = '❌ ÉCHEC';
    } else if (result.summary.totalDifferences > this.thresholdWarning) {
      status = '⚠️ AVERTISSEMENT';
    }
    
    report += `**Status global: ${status}**\n\n`;
    
    // Détails
    report += '## Détails\n\n';
    
    if (result.details.missingForms.length > 0) {
      report += '### Formulaires manquants\n\n';
      for (const form of result.details.missingForms) {
        report += `- \`${form}\`\n`;
      }
      report += '\n';
    }
    
    if (result.details.missingFields.length > 0) {
      report += '### Champs manquants\n\n';
      for (const field of result.details.missingFields) {
        report += `- \`${field}\`\n`;
      }
      report += '\n';
    }
    
    if (result.details.missingRouteParams.length > 0) {
      report += '### Paramètres de route manquants\n\n';
      for (const param of result.details.missingRouteParams) {
        report += `- \`${param}\`\n`;
      }
      report += '\n';
    }
    
    if (result.details.structuralDifferences.length > 0) {
      report += '### Différences structurelles\n\n';
      
      const criticalDiffs = result.details.structuralDifferences.filter(d => d.importance === 'critical');
      const importantDiffs = result.details.structuralDifferences.filter(d => d.importance === 'important');
      const minorDiffs = result.details.structuralDifferences.filter(d => d.importance === 'minor');
      
      if (criticalDiffs.length > 0) {
        report += '#### Critiques\n\n';
        for (const diff of criticalDiffs) {
          report += `- **${diff.type}**: ${diff.element} (${diff.context})\n`;
        }
        report += '\n';
      }
      
      if (importantDiffs.length > 0) {
        report += '#### Importantes\n\n';
        for (const diff of importantDiffs) {
          report += `- **${diff.type}**: ${diff.element} (${diff.context})\n`;
        }
        report += '\n';
      }
      
      if (minorDiffs.length > 0) {
        report += '#### Mineures\n\n';
        for (const diff of minorDiffs) {
          report += `- **${diff.type}**: ${diff.element} (${diff.context})\n`;
        }
        report += '\n';
      }
    }
    
    // Recommandations
    report += '## Recommandations\n\n';
    
    if (result.summary.criticalDifferences > 0) {
      report += '- ⚠️ **Action requise**: Corriger les éléments critiques manquants avant toute mise en production\n';
    }
    
    if (result.details.missingForms.length > 0) {
      report += '- Implémenter les formulaires manquants en utilisant les composants Form de Remix\n';
    }
    
    if (result.details.missingFields.length > 0) {
      report += '- Ajouter les champs manquants aux formulaires correspondants\n';
    }
    
    if (result.details.missingRouteParams.length > 0) {
      report += '- Vérifier que les paramètres d\'URL sont correctement gérés dans les loaders/actions Remix\n';
    }
    
    return report;
  }
  
  /**
   * Sauvegarde le rapport dans un fichier markdown
   */
  private async saveReport(result: DiffResult): Promise<void> {
    const outputPath = path.join(this.outputDir, `${result.filename}.diff.md`);
    
    try {
      await fs.writeFile(outputPath, result.report, 'utf-8');
      this.logger.log(`Rapport enregistré: ${outputPath}`);
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'enregistrement du rapport: ${error.message}`);
    }
  }
  
  /**
   * Exécute une vérification de différences pour un fichier spécifique
   */
  async run(input: { originalPath: string; generatedPath: string }): Promise<DiffResult> {
    await this.initialize();
    
    const result = await this.compareFiles(input.originalPath, input.generatedPath);
    
    return result;
  }
  
  /**
   * Retourne la version du vérificateur
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    if (process.argv.length < 4) {
      console.error('Usage: node diff-checker.ts <php-file-path> <tsx-file-path>');
      process.exit(1);
    }
    
    const phpFilePath = process.argv[2];
    const tsxFilePath = process.argv[3];
    
    const checker = new DiffChecker();
    
    try {
      const result = await checker.run({ originalPath: phpFilePath, generatedPath: tsxFilePath });
      console.log(`Rapport généré: ${result.filename}.diff.md`);
    } catch (error) {
      console.error('Erreur lors de l\'exécution du vérificateur:', error);
      process.exit(1);
    }
  })();
}