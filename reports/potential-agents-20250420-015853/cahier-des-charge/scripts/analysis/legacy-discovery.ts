import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * Agent d'analyse du code PHP legacy
 * Détecte les fichiers, leur complexité et établit des priorités pour la migration
 */

interface DiscoveryConfig {
  scanPaths: string[];
  excludePaths: string[];
  priorityFactors: {
    traffic: number;
    complexity: number;
    dependencies: number;
    lastModified: number;
  };
  outputFile: string;
}

interface FileMetadata {
  path: string;
  filename: string;
  size: number;
  lines: number;
  complexity: number;
  lastModified: Date;
  dependencies: string[];
  duplications: string[];
  priorityScore: number;
}

class LegacyDiscovery {
  private config: DiscoveryConfig;
  private files: FileMetadata[] = [];

  constructor(config: DiscoveryConfig) {
    this.config = config;
  }

  /**
   * Exécute la découverte complète
   */
  public async discover(): Promise<void> {
    console.log('🔍 Démarrage de la découverte du code legacy PHP...');

    try {
      // Trouver tous les fichiers PHP
      const phpFiles = await this.findPhpFiles();
      console.log(`📂 ${phpFiles.length} fichiers PHP trouvés`);

      // Analyser chaque fichier
      for (const file of phpFiles) {
        const metadata = await this.analyzeFile(file);
        this.files.push(metadata);
      }

      // Détecter les duplications
      await this.detectDuplications();

      // Calculer les scores de priorité
      this.calculatePriorityScores();

      // Générer le rapport final
      await this.generateDiscoveryMap();

      console.log('✅ Découverte terminée avec succès.');
    } catch (error) {
      console.error('❌ Erreur lors de la découverte:', error);
      process.exit(1);
    }
  }

  /**
   * Trouve tous les fichiers PHP dans les chemins configurés
   */
  private async findPhpFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const scanPath of this.config.scanPaths) {
      const files = await new Promise<string[]>((resolve, reject) => {
        glob(
          '**/*.php',
          {
            cwd: scanPath,
            ignore: this.config.excludePaths,
            absolute: true,
          },
          (err, matches) => {
            if (err) return reject(err);
            resolve(matches);
          }
        );
      });

      allFiles.push(...files);
    }

    return allFiles;
  }

  /**
   * Analyse un fichier PHP spécifique
   */
  private async analyzeFile(filePath: string): Promise<FileMetadata> {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    // Calculer des métriques de base
    const lines = content.split('\n').length;
    const complexity = this.calculateComplexity(content);
    const dependencies = this.extractDependencies(content);

    return {
      path: filePath,
      filename: path.basename(filePath),
      size: stats.size,
      lines,
      complexity,
      lastModified: stats.mtime,
      dependencies,
      duplications: [],
      priorityScore: 0, // Sera calculé plus tard
    };
  }

  /**
   * Calcule la complexité cyclomatique d'un fichier PHP
   */
  private calculateComplexity(content: string): number {
    // Une implémentation simplifiée qui compte les structures de contrôle
    let complexity = 1; // Valeur de base

    // Compter les structures de contrôle courantes
    const controlStructures = [
      'if',
      'else',
      'elseif',
      'for',
      'foreach',
      'while',
      'do',
      'switch',
      'case',
      '?',
      '&&',
      '||',
    ];

    for (const structure of controlStructures) {
      const regex = new RegExp(`\\b${structure}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Extrait les dépendances d'un fichier PHP
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Détecter les includes et requires
    const includeRegex =
      /(?:include|require|include_once|require_once)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;

    while ((match = includeRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    // Détecter les namespaces et use statements
    const useRegex = /use\s+([^;]+);/g;
    while ((match = useRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Détecte les duplications potentielles entre les fichiers
   */
  private async detectDuplications(): Promise<void> {
    console.log('🔍 Détection des duplications...');

    // Une approche simple: calculer des hachages pour le contenu des fichiers
    // et regrouper ceux qui ont un hachage similaire
    const fileHashes = new Map<string, string[]>();

    for (const file of this.files) {
      const content = fs.readFileSync(file.path, 'utf8');
      // Dans un cas réel, on utiliserait un algorithme plus sophistiqué
      // comme la détection de sous-séquences communes
      const hash = this.simpleHash(content);

      if (!fileHashes.has(hash)) {
        fileHashes.set(hash, []);
      }

      fileHashes.get(hash)!.push(file.path);
    }

    // Identifier les fichiers dupliqués
    for (const [hash, filePaths] of fileHashes.entries()) {
      if (filePaths.length > 1) {
        for (const filePath of filePaths) {
          const file = this.files.find((f) => f.path === filePath);
          if (file) {
            file.duplications = filePaths.filter((p) => p !== filePath);
          }
        }
      }
    }
  }

  /**
   * Calculateur de hachage simple pour la démonstration
   */
  private simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash = hash & hash; // Conversion en 32 bits
    }
    return hash.toString(16);
  }

  /**
   * Calcule les scores de priorité pour tous les fichiers
   */
  private calculatePriorityScores(): void {
    console.log('📊 Calcul des scores de priorité...');

    // Normaliser les valeurs pour chaque facteur
    const normalize = (values: number[]): number[] => {
      const max = Math.max(...values);
      return values.map((v) => (max > 0 ? v / max : 0));
    };

    // Obtenir les valeurs pour chaque facteur
    const complexities = normalize(this.files.map((f) => f.complexity));
    const dependencies = normalize(this.files.map((f) => f.dependencies.length));
    const sizes = normalize(this.files.map((f) => f.size));

    // Les dates de dernière modification (plus récent = plus important)
    const dates = this.files.map((f) => f.lastModified.getTime());
    const maxDate = Math.max(...dates);
    const minDate = Math.min(...dates);
    const dateRange = maxDate - minDate;
    const normalizedDates = dates.map((d) => (dateRange > 0 ? (d - minDate) / dateRange : 0));

    // Calculer le score final pour chaque fichier
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];

      // Utiliser les facteurs de priorité configurés
      const score =
        complexities[i] * this.config.priorityFactors.complexity +
        dependencies[i] * this.config.priorityFactors.dependencies +
        normalizedDates[i] * this.config.priorityFactors.lastModified +
        sizes[i] * 0.1; // Un petit bonus pour la taille du fichier

      file.priorityScore = Math.round(score * 100) / 100;
    }

    // Trier les fichiers par priorité décroissante
    this.files.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Génère le rapport final de découverte
   */
  private async generateDiscoveryMap(): Promise<void> {
    console.log('📝 Génération du rapport de découverte...');

    const discoveryMap = {
      scanDate: new Date().toISOString(),
      totalFiles: this.files.length,
      totalLines: this.files.reduce((sum, file) => sum + file.lines, 0),
      avgComplexity: this.files.reduce((sum, file) => sum + file.complexity, 0) / this.files.length,
      duplicatedFiles: this.files.filter((f) => f.duplications.length > 0).length,
      files: this.files.map((file) => ({
        path: file.path,
        filename: file.filename,
        metrics: {
          size: file.size,
          lines: file.lines,
          complexity: file.complexity,
          lastModified: file.lastModified.toISOString(),
        },
        dependencies: file.dependencies,
        duplications: file.duplications,
        priorityScore: file.priorityScore,
      })),
    };

    // Écrire le fichier JSON
    fs.writeFileSync(this.config.outputFile, JSON.stringify(discoveryMap, null, 2), 'utf8');

    console.log(`✅ Rapport écrit dans ${this.config.outputFile}`);
  }
}

// Configuration par défaut
const defaultConfig: DiscoveryConfig = {
  scanPaths: ['/var/www/html/legacy/', '/var/www/html/includes/'],
  excludePaths: ['vendor/', 'node_modules/'],
  priorityFactors: {
    traffic: 0.4,
    complexity: 0.3,
    dependencies: 0.2,
    lastModified: 0.1,
  },
  outputFile: './discovery_map.json',
};

// Point d'entrée du script
async function main() {
  try {
    // Charger la configuration depuis les arguments ou utiliser les valeurs par défaut
    const config = {
      ...defaultConfig,
      // Ajouter ici le parsing des arguments CLI si nécessaire
      outputFile: process.env.OUTPUT_FILE || defaultConfig.outputFile,
    };

    console.log('📊 Configuration:', config);

    const discovery = new LegacyDiscovery(config);
    await discovery.discover();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
