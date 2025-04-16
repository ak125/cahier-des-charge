/**
 * Agent de traitement pour l'optimisation des images
 * Optimise les images (redimensionnement, compression, conversion de format)
 * Date: 16 avril 2025
 */

import { AbstractProcessorAgent, ProcessorConfig } from '../core/abstract-processor-agent';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as sharp from 'sharp';
import * as imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminWebp from 'imagemin-webp';
import imageminAvif from 'imagemin-avif';

/**
 * Configuration spécifique à l'agent d'optimisation d'images
 */
export interface ImageOptimizerConfig extends ProcessorConfig {
  quality?: number;                // Qualité de compression (0-100)
  maxWidth?: number;               // Largeur maximale
  maxHeight?: number;              // Hauteur maximale
  convertTo?: 'webp' | 'avif' | 'jpg' | 'png' | 'original'; // Conversion de format
  keepOriginal?: boolean;          // Conserver l'original
  generateResponsive?: boolean;    // Générer des versions responsive
  responsiveSizes?: number[];      // Tailles pour les versions responsive
  metadata?: {                     // Métadonnées à préserver
    exif?: boolean;                // Préserver les données EXIF
    icc?: boolean;                 // Préserver le profil de couleur ICC
    iptc?: boolean;                // Préserver les métadonnées IPTC
  };
  optimizationLevel?: 'low' | 'medium' | 'high' | 'extreme'; // Niveau d'optimisation
  progressive?: boolean;           // Images JPEG progressives
  generatePlaceholders?: boolean;  // Générer des images placeholder
  placeholderType?: 'blur' | 'dominant-color' | 'lqip'; // Type de placeholder
  fitMethod?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; // Méthode de redimensionnement
}

/**
 * Métadonnées d'image
 */
interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha?: boolean;
  colorSpace?: string;
}

/**
 * Agent qui optimise les images
 */
export class ImageOptimizer extends AbstractProcessorAgent<ImageOptimizerConfig> {
  // Identifiants de l'agent
  public id = 'image-optimizer';
  public name = 'Optimiseur d\'images';
  public version = '1.0.0';
  public description = 'Optimise les images (redimensionnement, compression, conversion de format)';

  // Cache pour les métadonnées d'images
  private imageMetadataCache: Map<string, ImageMetadata> = new Map();

  /**
   * Constructeur
   * @param config Configuration de l'agent
   */
  constructor(config?: Partial<ImageOptimizerConfig>) {
    super(undefined, {
      inputDir: './images',
      outputDir: './images-optimized',
      backupDir: './images-backup',
      createBackups: true,
      filters: {
        include: ['**/*.{jpg,jpeg,png,gif,svg,webp,avif}'],
        exclude: ['**/*.min.*', '**/node_modules/**']
      },
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      convertTo: 'original',
      keepOriginal: true,
      generateResponsive: false,
      responsiveSizes: [320, 640, 1024, 1440],
      metadata: {
        exif: true,
        icc: true,
        iptc: false
      },
      optimizationLevel: 'medium',
      progressive: true,
      generatePlaceholders: false,
      placeholderType: 'blur',
      fitMethod: 'cover',
      ...config
    });
  }

  /**
   * Préparation spécifique à l'agent
   */
  protected async prepare(): Promise<void> {
    this.logger.info(`Mode d'optimisation: ${this.config.optimizationLevel}`);
    this.logger.info(`Conversion au format: ${this.config.convertTo}`);
    
    // Vérifier les dépendances
    try {
      // Ces importations sont déjà faites en haut, mais on vérifie qu'elles sont disponibles
      const sharpVersion = sharp.versions.sharp;
      this.logger.info(`Sharp version ${sharpVersion} disponible`);
    } catch (error) {
      this.logger.warn("Sharp n'est pas installé correctement. L'optimisation peut échouer.");
      this.addWarning("Sharp n'est pas installé correctement. Exécutez 'npm install sharp'.");
    }
  }

  /**
   * Traite le contenu d'un fichier image
   * @param content Contenu original du fichier
   * @param filePath Chemin du fichier
   */
  protected async processContent(
    content: string,
    filePath: string
  ): Promise<{ processedContent: string; changes: Array<{ type: string; description: string }> }> {
    const changes: Array<{ type: string; description: string }> = [];
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Vérifier si le fichier est une image prise en charge
    if (!['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'].includes(fileExt)) {
      return { processedContent: content, changes: [] };
    }
    
    try {
      // Obtenir les métadonnées de l'image originale
      let inputBuffer = Buffer.from(content, 'binary');
      const originalMetadata = await this.getImageMetadata(inputBuffer);
      this.imageMetadataCache.set(filePath, originalMetadata);
      
      let outputBuffer = inputBuffer;
      let sharpInstance = sharp(inputBuffer);
      
      // Conserver les métadonnées si demandé
      if (this.config.metadata?.exif || this.config.metadata?.icc) {
        sharpInstance = sharpInstance.withMetadata({
          exif: this.config.metadata?.exif === true,
          icc: this.config.metadata?.icc === true,
          iptc: this.config.metadata?.iptc === true
        });
      }
      
      // Redimensionner si nécessaire
      if (this.config.maxWidth || this.config.maxHeight) {
        const needsResize = (this.config.maxWidth && originalMetadata.width > this.config.maxWidth) ||
                           (this.config.maxHeight && originalMetadata.height > this.config.maxHeight);
        
        if (needsResize) {
          sharpInstance = sharpInstance.resize({
            width: this.config.maxWidth,
            height: this.config.maxHeight,
            fit: this.config.fitMethod as keyof sharp.FitEnum,
            withoutEnlargement: true
          });
          
          changes.push({
            type: 'resize',
            description: `Redimensionnement de ${originalMetadata.width}x${originalMetadata.height} vers max ${this.config.maxWidth}x${this.config.maxHeight}`
          });
        }
      }
      
      // Déterminer le format de sortie
      const targetFormat = this.determineOutputFormat(fileExt);
      
      // Conversion de format si différent de l'original
      if (targetFormat !== 'original' && 
          !fileExt.includes(targetFormat.replace('webp', 'webp').replace('avif', 'avif'))) {
        
        switch (targetFormat) {
          case 'webp':
            sharpInstance = sharpInstance.webp({ 
              quality: this.config.quality,
              effort: this.getCompressionEffort()
            });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ 
              quality: this.config.quality,
              effort: this.getCompressionEffort()
            });
            break;
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ 
              quality: this.config.quality,
              progressive: this.config.progressive
            });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ 
              quality: this.config.quality,
              progressive: this.config.progressive
            });
            break;
        }
        
        changes.push({
          type: 'format',
          description: `Conversion du format ${originalMetadata.format} vers ${targetFormat}`
        });
      } else {
        // Optimiser sans changer le format
        switch (fileExt) {
          case '.jpg':
          case '.jpeg':
            sharpInstance = sharpInstance.jpeg({ 
              quality: this.config.quality,
              progressive: this.config.progressive
            });
            break;
          case '.png':
            sharpInstance = sharpInstance.png({ 
              quality: this.config.quality,
              progressive: this.config.progressive
            });
            break;
          case '.webp':
            sharpInstance = sharpInstance.webp({ 
              quality: this.config.quality,
              effort: this.getCompressionEffort()
            });
            break;
          case '.avif':
            sharpInstance = sharpInstance.avif({ 
              quality: this.config.quality,
              effort: this.getCompressionEffort()
            });
            break;
          // gif et svg sont traités par imagemin plus tard
        }
      }
      
      // Obtenir le buffer depuis sharp
      outputBuffer = await sharpInstance.toBuffer();
      
      // Utiliser imagemin pour une optimisation supplémentaire
      if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'].includes(fileExt)) {
        const plugins = this.getImageminPlugins(fileExt, targetFormat);
        
        if (plugins.length > 0) {
          outputBuffer = await imagemin.buffer(outputBuffer, {
            plugins
          });
          
          changes.push({
            type: 'compression',
            description: `Compression avec ${plugins.length} plugin(s) imagemin`
          });
        }
      }
      
      // Générer des versions responsives si demandé
      if (this.config.generateResponsive && this.config.responsiveSizes?.length) {
        await this.generateResponsiveVersions(inputBuffer, filePath);
      }
      
      // Générer des placeholders si demandé
      if (this.config.generatePlaceholders) {
        await this.generatePlaceholder(inputBuffer, filePath);
      }
      
      // Calculer le taux de compression
      const originalSize = Buffer.byteLength(inputBuffer);
      const newSize = Buffer.byteLength(outputBuffer);
      const compressionRatio = (1 - newSize / originalSize) * 100;
      
      changes.push({
        type: 'compression-result',
        description: `Taux de compression: ${compressionRatio.toFixed(2)}% (${originalSize} → ${newSize} octets)`
      });
      
      // Retourner le contenu traité
      return {
        processedContent: outputBuffer.toString('binary'),
        changes
      };
    } catch (error: any) {
      this.logger.error(`Erreur lors du traitement de ${filePath}: ${error.message}`);
      throw new Error(`Échec du traitement de l'image: ${error.message}`);
    }
  }

  /**
   * Génère des versions responsives d'une image
   * @param inputBuffer Buffer de l'image d'entrée
   * @param filePath Chemin du fichier original
   */
  private async generateResponsiveVersions(inputBuffer: Buffer, filePath: string): Promise<void> {
    if (!this.config.responsiveSizes || this.config.responsiveSizes.length === 0) {
      return;
    }
    
    try {
      const parsedPath = path.parse(filePath);
      const metadata = await this.getImageMetadata(inputBuffer);
      const targetFormat = this.determineOutputFormat(path.extname(filePath));
      
      for (const width of this.config.responsiveSizes) {
        // Ne pas générer des images plus grandes que l'original
        if (width >= metadata.width) continue;
        
        const outputFilename = `${parsedPath.name}-${width}w${parsedPath.ext}`;
        const outputPath = path.join(this.config.outputDir, outputFilename);
        
        let sharpInstance = sharp(inputBuffer)
          .resize({
            width,
            fit: this.config.fitMethod as keyof sharp.FitEnum,
            withoutEnlargement: true
          });
        
        // Appliquer le format si nécessaire
        if (targetFormat !== 'original') {
          switch (targetFormat) {
            case 'webp':
              sharpInstance = sharpInstance.webp({ 
                quality: this.config.quality,
                effort: this.getCompressionEffort()
              });
              break;
            case 'avif':
              sharpInstance = sharpInstance.avif({ 
                quality: this.config.quality,
                effort: this.getCompressionEffort()
              });
              break;
            case 'jpg':
              sharpInstance = sharpInstance.jpeg({ 
                quality: this.config.quality,
                progressive: this.config.progressive
              });
              break;
            case 'png':
              sharpInstance = sharpInstance.png({ 
                quality: this.config.quality,
                progressive: this.config.progressive
              });
              break;
          }
        }
        
        // Écrire le fichier responsive
        if (!this.config.dryRun) {
          await sharpInstance.toFile(outputPath);
          this.logger.info(`Version responsive générée: ${outputPath}`);
        } else {
          this.logger.info(`[DRY RUN] Version responsive simulée: ${outputPath}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération des versions responsives: ${error.message}`);
      this.addWarning(`Échec de la génération des versions responsives pour ${path.basename(filePath)}: ${error.message}`);
    }
  }

  /**
   * Génère une image placeholder
   * @param inputBuffer Buffer de l'image d'entrée
   * @param filePath Chemin du fichier original
   */
  private async generatePlaceholder(inputBuffer: Buffer, filePath: string): Promise<void> {
    try {
      const parsedPath = path.parse(filePath);
      const outputFilename = `${parsedPath.name}-placeholder${parsedPath.ext}`;
      const outputPath = path.join(this.config.outputDir, outputFilename);
      
      let sharpInstance: sharp.Sharp;
      
      switch (this.config.placeholderType) {
        case 'blur':
          // Créer une version floutée et très petite
          sharpInstance = sharp(inputBuffer)
            .resize(20, 20, { fit: 'inside' })
            .blur(5);
          break;
        
        case 'dominant-color':
          // Extraire la couleur dominante et créer une image de cette couleur
          const { dominant } = await sharp(inputBuffer)
            .stats();
          
          // Créer une image de 1x1 pixel avec la couleur dominante
          sharpInstance = sharp({
            create: {
              width: 1,
              height: 1,
              channels: 3,
              background: {
                r: dominant.r,
                g: dominant.g,
                b: dominant.b
              }
            }
          });
          break;
        
        case 'lqip': // Low Quality Image Placeholder
          // Version très basse qualité mais reconnaissable
          sharpInstance = sharp(inputBuffer)
            .resize(40, 40, { fit: 'inside' })
            .jpeg({ quality: 20 });
          break;
          
        default:
          sharpInstance = sharp(inputBuffer)
            .resize(20, 20, { fit: 'inside' })
            .blur(3);
      }
      
      // Écrire le fichier placeholder
      if (!this.config.dryRun) {
        await sharpInstance.toFile(outputPath);
        this.logger.info(`Placeholder généré: ${outputPath}`);
      } else {
        this.logger.info(`[DRY RUN] Placeholder simulé: ${outputPath}`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération du placeholder: ${error.message}`);
      this.addWarning(`Échec de la génération du placeholder pour ${path.basename(filePath)}: ${error.message}`);
    }
  }

  /**
   * Détermine le format de sortie d'une image
   * @param originalExt Extension originale du fichier
   */
  private determineOutputFormat(originalExt: string): 'webp' | 'avif' | 'jpg' | 'png' | 'original' {
    // Si l'utilisateur a spécifié un format, l'utiliser
    if (this.config.convertTo && this.config.convertTo !== 'original') {
      return this.config.convertTo;
    }
    
    // Sinon garder le format original
    return 'original';
  }

  /**
   * Retourne les plugins imagemin appropriés pour le type de fichier
   * @param fileExt Extension du fichier
   * @param targetFormat Format cible (si conversion)
   */
  private getImageminPlugins(fileExt: string, targetFormat: string): any[] {
    const plugins: any[] = [];
    const compressionLevel = this.getCompressionLevel();
    
    if (targetFormat !== 'original') {
      // Utiliser les plugins pour le format cible
      switch (targetFormat) {
        case 'webp':
          plugins.push(imageminWebp({ quality: this.config.quality }));
          break;
        case 'avif':
          plugins.push(imageminAvif({ quality: this.config.quality }));
          break;
        case 'jpg':
          plugins.push(imageminMozjpeg({ quality: this.config.quality, progressive: this.config.progressive }));
          break;
        case 'png':
          plugins.push(imageminPngquant({ quality: [Math.max(0, this.config.quality! - 10) / 100, this.config.quality! / 100] }));
          break;
      }
    } else {
      // Utiliser les plugins selon l'extension originale
      switch (fileExt) {
        case '.jpg':
        case '.jpeg':
          plugins.push(imageminMozjpeg({ quality: this.config.quality, progressive: this.config.progressive }));
          break;
        case '.png':
          plugins.push(imageminPngquant({ quality: [Math.max(0, this.config.quality! - 10) / 100, this.config.quality! / 100] }));
          break;
        case '.gif':
          plugins.push(imageminGifsicle({ optimizationLevel: compressionLevel, interlaced: this.config.progressive }));
          break;
        case '.svg':
          plugins.push(imageminSvgo({
            plugins: [{
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                  cleanupIDs: true,
                  removeEmptyAttrs: true
                }
              }
            }]
          }));
          break;
        case '.webp':
          plugins.push(imageminWebp({ quality: this.config.quality }));
          break;
        case '.avif':
          plugins.push(imageminAvif({ quality: this.config.quality }));
          break;
      }
    }
    
    return plugins;
  }

  /**
   * Obtient le niveau de compression à utiliser pour les plugins
   */
  private getCompressionLevel(): number {
    switch (this.config.optimizationLevel) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'extreme': return 3;
      default: return 2;
    }
  }

  /**
   * Obtient l'effort de compression à utiliser pour WebP/AVIF
   */
  private getCompressionEffort(): number {
    switch (this.config.optimizationLevel) {
      case 'low': return 2;
      case 'medium': return 4;
      case 'high': return 5;
      case 'extreme': return 6;
      default: return 4;
    }
  }

  /**
   * Obtient les métadonnées d'une image
   * @param buffer Buffer de l'image
   */
  private async getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || '',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      colorSpace: metadata.space
    };
  }

  /**
   * Génère un rapport personnalisé au format HTML
   */
  protected async generateReport(): Promise<string | undefined> {
    if (this.processedFiles.length === 0) {
      return undefined;
    }
    
    try {
      const totalOriginalSize = this.processedFiles.reduce((sum, file) => sum + (file.originalSize || 0), 0);
      const totalNewSize = this.processedFiles.reduce((sum, file) => sum + (file.newSize || 0), 0);
      const overallCompressionRatio = totalOriginalSize > 0 ? (1 - totalNewSize / totalOriginalSize) * 100 : 0;
      
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'optimisation d'images</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2c3e50; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .success { color: #27ae60; }
    .warning { color: #e67e22; }
    .error { color: #c0392b; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .chart-container { margin-top: 30px; margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>Rapport d'optimisation d'images</h1>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p><strong>Total des fichiers traités:</strong> ${this.processedFiles.length}</p>
    <p><strong>Succès:</strong> ${this.processedFiles.filter(f => f.success).length}</p>
    <p><strong>Échecs:</strong> ${this.processedFiles.filter(f => !f.success).length}</p>
    <p><strong>Taille totale originale:</strong> ${this.formatBytes(totalOriginalSize)}</p>
    <p><strong>Taille totale après optimisation:</strong> ${this.formatBytes(totalNewSize)}</p>
    <p><strong>Économie d'espace:</strong> ${this.formatBytes(totalOriginalSize - totalNewSize)} (${overallCompressionRatio.toFixed(2)}%)</p>
  </div>
  
  <h2>Détails des fichiers traités</h2>
  <table>
    <tr>
      <th>Fichier</th>
      <th>Statut</th>
      <th>Taille originale</th>
      <th>Taille optimisée</th>
      <th>Économie</th>
      <th>Actions effectuées</th>
    </tr>`;
      
      // Ajouter une ligne par fichier
      for (const file of this.processedFiles) {
        const originalSize = file.originalSize || 0;
        const newSize = file.newSize || 0;
        const savings = originalSize - newSize;
        const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;
        
        // Collecter les changements
        const actions = file.changes?.map(c => `${c.type}: ${c.description}`).join('<br>') || '';
        
        html += `
    <tr>
      <td>${path.basename(file.filePath)}</td>
      <td class="${file.success ? 'success' : 'error'}">${file.success ? 'Succès' : 'Échec'}</td>
      <td>${this.formatBytes(originalSize)}</td>
      <td>${this.formatBytes(newSize)}</td>
      <td>${this.formatBytes(savings)} (${savingsPercent.toFixed(2)}%)</td>
      <td>${actions}</td>
    </tr>`;
      }
      
      html += `
  </table>
  
  <div class="chart-container">
    <h2>Visualisation</h2>
    <p>Consultez le graphique ci-dessous pour voir la réduction de taille par fichier.</p>
    <!-- Ici, un graphique pourrait être inséré avec une bibliothèque JavaScript -->
  </div>
  
  <h2>Configuration utilisée</h2>
  <pre>${JSON.stringify(this.config, null, 2)}</pre>
</body>
</html>`;
      
      // Écrire le rapport HTML
      const reportPath = path.join(this.config.outputDir, 'image-optimization-report.html');
      
      if (!this.config.dryRun) {
        await fs.writeFile(reportPath, html);
        this.logger.info(`Rapport HTML généré: ${reportPath}`);
        return reportPath;
      } else {
        this.logger.info(`[DRY RUN] Rapport HTML simulé`);
        return undefined;
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la génération du rapport: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Formate un nombre d'octets en format lisible (KB, MB, etc.)
   * @param bytes Nombre d'octets
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Exporte une factory pour créer l'agent
 */
export const createImageOptimizer = (config?: Partial<ImageOptimizerConfig>) => {
  return new ImageOptimizer(config);
};