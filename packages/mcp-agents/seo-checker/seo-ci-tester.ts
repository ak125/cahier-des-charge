import fs from 'fs/promises';
import path from 'path';
import { SEOMetadataSchema, validateSEOMetadata } from './seo-metadata-schema';

/**
 * Outil d'automatisation des tests SEO pour l'intégration CI
 * Analyse les fichiers de métadonnées SEO et génère un rapport
 */
export class SEOCITester {
  private results: {
    passed: string[];
    failed: { file: string; errors: Record<string, any> }[];
    score: number;
  };

  constructor(private baseDir: string) {
    this.results = {
      passed: [],
      failed: [],
      score: 0,
    };
  }

  /**
   * Analyse un fichier de métadonnées SEO
   * @param filePath Chemin du fichier à analyser
   * @returns Résultat de l'analyse
   */
  async analyzeFile(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      const validation = validateSEOMetadata(data);
      
      if (validation.success) {
        this.results.passed.push(filePath);
        return true;
      } else {
        this.results.failed.push({
          file: filePath,
          errors: validation.errors as Record<string, any>,
        });
        return false;
      }
    } catch (error) {
      this.results.failed.push({
        file: filePath,
        errors: { _errors: [`Erreur lors de l'analyse du fichier: ${(error as Error).message}`] },
      });
      return false;
    }
  }

  /**
   * Analyse tous les fichiers de métadonnées SEO dans un répertoire
   * @param directory Répertoire à analyser (relatif au baseDir)
   * @param pattern Motif pour filtrer les fichiers (regex)
   * @returns Résultat de l'analyse
   */
  async analyzeDirectory(directory: string, pattern = /\.seo\.json$/): Promise<void> {
    const dirPath = path.join(this.baseDir, directory);
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      const analyzePromises = files.map(async (file) => {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.analyzeDirectory(path.relative(this.baseDir, filePath), pattern);
        } else if (pattern.test(file.name)) {
          await this.analyzeFile(filePath);
        }
      });
      
      await Promise.all(analyzePromises);
    } catch (error) {
      console.error(`Erreur lors de l'analyse du répertoire ${dirPath}:`, error);
    }
  }

  /**
   * Calcule le score SEO global
   * @returns Score entre 0 et 100
   */
  calculateScore(): number {
    const total = this.results.passed.length + this.results.failed.length;
    if (total === 0) return 0;
    
    const score = Math.round((this.results.passed.length / total) * 100);
    this.results.score = score;
    return score;
  }

  /**
   * Génère un rapport au format JSON
   * @param outputPath Chemin du fichier de sortie
   */
  async generateJsonReport(outputPath: string): Promise<void> {
    const score = this.calculateScore();
    
    const report = {
      timestamp: new Date().toISOString(),
      score,
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      total: this.results.passed.length + this.results.failed.length,
      details: {
        passed: this.results.passed,
        failed: this.results.failed,
      },
    };
    
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Rapport SEO généré: ${outputPath}`);
  }

  /**
   * Génère un rapport au format Markdown
   * @param outputPath Chemin du fichier de sortie
   */
  async generateMarkdownReport(outputPath: string): Promise<void> {
    const score = this.calculateScore();
    
    let markdown = `# Rapport de validation SEO\n\n`;
    markdown += `Date: ${new Date().toLocaleString('fr-FR')}\n\n`;
    markdown += `## Résumé\n\n`;
    markdown += `- **Score global**: ${score}/100\n`;
    markdown += `- **Tests réussis**: ${this.results.passed.length}\n`;
    markdown += `- **Tests échoués**: ${this.results.failed.length}\n`;
    markdown += `- **Total**: ${this.results.passed.length + this.results.failed.length}\n\n`;
    
    if (this.results.failed.length > 0) {
      markdown += `## Erreurs détectées\n\n`;
      
      this.results.failed.forEach(({ file, errors }) => {
        markdown += `### ${file}\n\n`;
        
        const formatErrors = (errors: any, path = '') => {
          let result = '';
          
          if (errors._errors && errors._errors.length > 0) {
            result += `- ${path}: ${errors._errors.join(', ')}\n`;
          }
          
          Object.entries(errors).forEach(([key, value]) => {
            if (key !== '_errors' && typeof value === 'object' && value !== null) {
              result += formatErrors(value, path ? `${path}.${key}` : key);
            }
          });
          
          return result;
        };
        
        markdown += formatErrors(errors);
        markdown += '\n';
      });
    }
    
    await fs.writeFile(outputPath, markdown, 'utf-8');
    console.log(`Rapport Markdown généré: ${outputPath}`);
  }
}

/**
 * Point d'entrée pour l'exécution depuis la ligne de commande
 */
export async function runSEOCITests(baseDir: string, outputDir: string): Promise<number> {
  try {
    const tester = new SEOCITester(baseDir);
    
    console.log('Démarrage de l'analyse SEO...');
    await tester.analyzeDirectory('');
    
    const score = tester.calculateScore();
    console.log(`Score SEO: ${score}/100`);
    
    await fs.mkdir(outputDir, { recursive: true });
    
    await tester.generateJsonReport(path.join(outputDir, 'seo-report.json'));
    await tester.generateMarkdownReport(path.join(outputDir, 'seo-report.md'));
    
    return score >= 70 ? 0 : 1; // Retourne un code d'échec si le score est inférieur à 70
  } catch (error) {
    console.error('Erreur lors de l'exécution des tests SEO:', error);
    return 1;
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  const baseDir = process.argv[2] || process.cwd();
  const outputDir = process.argv[3] || path.join(process.cwd(), 'reports', 'seo');
  
  runSEOCITests(baseDir, outputDir).then(exitCode => {
    process.exit(exitCode);
  });
}