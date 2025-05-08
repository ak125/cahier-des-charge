import fs from 'fs';
import path from 'path';
import { parse as parseHTML } from 'node-html-parser';
import { AbstractGeneratorAgent } from '../abstract-generator';
import { analyzePhpFile } from '../analysis/php-analyzer';
import { generateMetaFile } from '../core/meta-generator';
import { transformPhpToRemix } from '../core/PhpToRemix-transformer';
import { generateLoaderFile } from '../core/loader-generator';
import { generateSchemaFile } from '../core/schema-generator';
import { AgentResult, MigrationConfig, PhpAnalysisResult } from '../types';

/**
 * Agent de génération Remix à partir de fichiers PHP
 * Responsable de la transformation d'un fichier PHP en composant Remix
 */
export class RemixGenerator extends AbstractGeneratorAgent<any, any> {
  protected async initializeInternal(): Promise<void> {
  protected async cleanupInternal(): Promise<void> {
    // Nettoyage des ressources
  }

    // Initialisation de l'agent
  }

  constructor(private config: MigrationConfig) {}

  /**
   * Génère un composant Remix à partir d'un fichier PHP
   * @param sourceFilePath Chemin vers le fichier PHP source
   * @param destinationPath Dossier de destination pour les fichiers Remix générés
   */
  async generateFromPhp(sourceFilePath: string, destinationPath: string): Promise<AgentResult> {
    try {
      console.log(`[RemixGenerator] Analyse du fichier PHP : ${sourceFilePath}`);
      
      // 1. Analyser le fichier PHP avec PhpAnalyzer
      const analysisResult = await analyzePhpFile(sourceFilePath);
      
      // 2. Générer les fichiers Remix
      const remixComponents = await this.generateRemixComponents(sourceFilePath, analysisResult);
      
      // 3. Écrire les fichiers générés
      await this.writeRemixFiles(remixComponents, destinationPath);
      
      // 4. Générer un rapport d'audit
      const auditReport = this.generateAuditReport(sourceFilePath, remixComponents);
      
      return {
        success: true,
        sourceFile: sourceFilePath,
        generatedFiles: Object.keys(remixComponents),
        auditReport
      };
    } catch (error) {
      console.error(`[RemixGenerator] Erreur lors de la génération de Remix pour ${sourceFilePath}:`, error);
      return {
        success: false,
        sourceFile: sourceFilePath,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Génère les composants Remix à partir du fichier PHP analysé
   */
  private async generateRemixComponents(sourceFilePath: string, analysisResult: PhpAnalysisResult) {
    const fileBaseName = path.basename(sourceFilePath, '.php');
    const sourceContent = fs.readFileSync(sourceFilePath, 'utf-8');
    
    // Transformer le PHP en composants Remix
    const remixComponentContent = await transformPhpToRemix(sourceContent, analysisResult);
    
    // Générer le fichier meta.ts pour les métadonnées SEO
    const metaFileContent = await generateMetaFile(sourceContent, analysisResult);
    
    // Générer le fichier loader.ts pour les données
    const loaderFileContent = await generateLoaderFile(sourceContent, analysisResult);
    
    // Générer le fichier schema.ts pour Prisma/validation des données
    const schemaFileContent = await generateSchemaFile(analysisResult);
    
    return {
      [`${fileBaseName}.tsx`]: remixComponentContent,
      [`${fileBaseName}.meta.ts`]: metaFileContent,
      [`${fileBaseName}.loader.ts`]: loaderFileContent,
      [`${fileBaseName}.schema.ts`]: schemaFileContent
    };
  }

  /**
   * Écrit les fichiers Remix générés dans le dossier de destination
   */
  private async writeRemixFiles(files: Record<string, string>, destinationPath: string) {
    // Créer le dossier de destination s'il n'existe pas
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    // Écrire chaque fichier généré
    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(destinationPath, fileName);
      fs.writeFileSync(filePath, content);
      console.log(`[RemixGenerator] Fichier généré : ${filePath}`);
    }
  }

  /**
   * Génère un rapport d'audit sur la migration
   */
  private generateAuditReport(sourceFilePath: string, remixComponents: Record<string, string>) {
    const fileName = path.basename(sourceFilePath, '.php');
    const report = `# Rapport de migration PHP → Remix pour ${fileName}

## Fichier source
- ${sourceFilePath}

## Fichiers générés
${Object.keys(remixComponents).map(file => `- ${file}`).join('\n')}

## Analyse de la migration
- **Complexité du fichier source** : ${this.estimateComplexity(sourceFilePath)}
- **Points d'attention SEO** : ${this.extractSeoPoints(remixComponents)}
- **Routes préservées** : ${this.extractPreservedRoutes(sourceFilePath, remixComponents)}

## Recommandations
${this.generateRecommendations(remixComponents)}
`;
    
    // Écrire le rapport d'audit
    const auditPath = path.join(process.cwd(), 'audit');
    if (!fs.existsSync(auditPath)) {
      fs.mkdirSync(auditPath, { recursive: true });
    }
    
    const auditFilePath = path.join(auditPath, `${fileName}.audit.md`);
    fs.writeFileSync(auditFilePath, report);
    
    return {
      path: auditFilePath,
      content: report
    };
  }

  /**
   * Estime la complexité du fichier PHP source
   */
  private estimateComplexity(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const phpBlocks = (content.match(/<\?php/g) || []).length;
    const sqlQueries = (content.match(/SELECT|INSERT|UPDATE|DELETE/gi) || []).length;
    
    let complexity = 'Faible';
    if (lines > 300 || sqlQueries > 5) {
      complexity = 'Moyenne';
    }
    if (lines > 500 || sqlQueries > 10 || phpBlocks > 3) {
      complexity = 'Élevée';
    }
    
    return `${complexity} (${lines} lignes, ${sqlQueries} requêtes SQL, ${phpBlocks} blocs PHP)`;
  }

  /**
   * Extrait les points d'attention SEO des composants générés
   */
  private extractSeoPoints(components: Record<string, string>) {
    const metaFile = Object.entries(components).find(([name]) => name.endsWith('.meta.ts'));
    if (!metaFile) return 'Aucune métadonnée SEO détectée';
    
    const metaContent = metaFile[1];
    const hasCanonical = metaContent.includes('canonical');
    const hasOpenGraph = metaContent.includes('og:');
    const hasStructuredData = metaContent.includes('jsonLd');
    
    const points = [];
    if (hasCanonical) points.push('URL canonique préservée');
    if (hasOpenGraph) points.push('Balises Open Graph générées');
    if (hasStructuredData) points.push('Données structurées JSON-LD ajoutées');
    
    return points.length ? points.join(', ') : 'Métadonnées SEO basiques';
  }

  /**
   * Extrait les routes préservées du fichier source
   */
  private extractPreservedRoutes(sourceFilePath: string, components: Record<string, string>) {
    const fileName = path.basename(sourceFilePath, '.php');
    const loaderFile = Object.entries(components).find(([name]) => name.endsWith('.loader.ts'));
    
    if (!loaderFile) return 'Aucune route extraite';
    
    // Détection basique des paramètres d'URL
    const loaderContent = loaderFile[1];
    const paramsMatch = loaderContent.match(/params\.([\w]+)/g);
    const uniqueParams = [...new Set(paramsMatch?.map(p => p.replace('params.', '')) || [])];
    
    if (uniqueParams.length === 0) {
      return `Route statique : /${fileName}`;
    }
    
    return `Route dynamique : /${fileName}/[${uniqueParams.join('][')}]`;
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateRecommendations(components: Record<string, string>) {
    const recommendations = [];
    
    // Vérifier si le loader utilise Prisma
    const loaderFile = Object.entries(components).find(([name]) => name.endsWith('.loader.ts'));
    if (loaderFile && !loaderFile[1].includes('prisma')) {
      recommendations.push('- Migrer les requêtes SQL vers Prisma pour une meilleure sécurité et maintenabilité');
    }
    
    // Vérifier si le composant utilise des hooks
    const componentFile = Object.entries(components).find(([name]) => name.endsWith('.tsx'));
    if (componentFile && !componentFile[1].includes('useState') && !componentFile[1].includes('useLoaderData')) {
      recommendations.push('- Optimiser le composant en utilisant useLoaderData pour accéder aux données');
    }
    
    // Vérifier les imports manquants
    const allComponents = Object.values(components).join('\n');
    if (!allComponents.includes('import { db }') && allComponents.includes('prisma')) {
      recommendations.push('- Ajouter l\'import de client Prisma via db');
    }
    
    return recommendations.length ? recommendations.join('\n') : '- Aucune recommandation particulière';
  }
}

// Export pour utilisation dans la CLI ou l'API
export default RemixGenerator;