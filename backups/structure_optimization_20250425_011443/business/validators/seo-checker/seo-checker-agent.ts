/**
 * SEOCheckerAgent - Agent standardisé de validation SEO
 * 
 * Vérifie, valide et corrige les métadonnées SEO pour les sites Remix migrés depuis PHP
 * Version standardisée - 24 avril 2025
 */

import { BaseValidatorAgent, ValidatorAgentConfig, ValidationResult } from '../../core/interfaces/validator-agent';
import { AgentContext, AgentMetadata } from '../../core/interfaces/base-agent';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

// Configuration spécifique à l'agent SEO
export interface SEOCheckerConfig extends ValidatorAgentConfig {
    checkCanonicalUrls?: boolean;
    checkMissingMetadata?: boolean;
    checkDuplicateTitles?: boolean;
    autoFix?: boolean;
    reportOnly?: boolean;
    ignorePaths?: string[];
    minTitleLength?: number;
    maxTitleLength?: number;
    minDescriptionLength?: number;
    maxDescriptionLength?: number;
}

// Interface pour les résultats de validation SEO
export interface SEOValidationResult extends ValidationResult {
    missingMetadata?: string[];
    duplicateTitles?: { path: string, title: string }[];
    canonicalErrors?: { path: string, error: string }[];
    fixedIssues?: { path: string, type: string, before: string, after: string }[];
}

/**
 * Agent de validation SEO
 * Vérifie la conformité des métadonnées SEO dans les fichiers Remix générés
 */
export class SEOCheckerAgent extends BaseValidatorAgent {
    private config: SEOCheckerConfig;

    constructor(config?: SEOCheckerConfig) {
        super(config);
        this.config = {
            checkCanonicalUrls: true,
            checkMissingMetadata: true,
            checkDuplicateTitles: true,
            autoFix: false,
            reportOnly: false,
            ignorePaths: ['/api/', '/admin/', '/internal/'],
            minTitleLength: 10,
            maxTitleLength: 60,
            minDescriptionLength: 50,
            maxDescriptionLength: 160,
            ...config
        };
    }

    /**
     * Métadonnées de l'agent
     */
    get metadata(): AgentMetadata {
        return {
            name: 'seo-checker',
            version: '1.0.0',
            description: 'Vérifie la conformité SEO des fichiers générés',
            author: 'Équipe Migration',
            tags: ['seo', 'validation', 'metadata', 'quality'],
            requiresConfig: false
        };
    }

    /**
     * Initialisation de l'agent
     */
    async initialize(context: AgentContext): Promise<void> {
        await super.initialize(context);
        this.logger.info('SEOCheckerAgent initialisé');
        this.logger.debug('Configuration:', this.config);
    }

    /**
     * Exécution de la validation SEO
     */
    async validate(context: AgentContext): Promise<SEOValidationResult> {
        this.logger.info('Validation SEO démarrée');

        const result: SEOValidationResult = {
            valid: true,
            errors: [],
            warnings: [],
            missingMetadata: [],
            duplicateTitles: [],
            canonicalErrors: [],
            fixedIssues: []
        };

        try {
            // Vérifier les fichiers de routes Remix
            const routeFiles = await this.findRouteFiles(context);
            this.logger.info(`${routeFiles.length} fichiers de routes trouvés`);

            // Analyse des métadonnées SEO
            await this.checkMetadataInFiles(routeFiles, result);

            // Vérification des URLs canoniques si activé
            if (this.config.checkCanonicalUrls) {
                await this.checkCanonicalUrls(routeFiles, result);
            }

            // Application des corrections automatiques si activé
            if (this.config.autoFix && !this.config.reportOnly && result.errors.length > 0) {
                await this.applyFixes(routeFiles, result);
            }

            // Mise à jour du statut de validation
            result.valid = result.errors.length === 0;

            this.logger.info(`Validation SEO terminée: ${result.valid ? 'Réussite' : 'Échec'}`);
            this.logger.info(`${result.errors.length} erreurs, ${result.warnings.length} avertissements`);

            if (result.fixedIssues && result.fixedIssues.length > 0) {
                this.logger.info(`${result.fixedIssues.length} problèmes corrigés automatiquement`);
            }

        } catch (error) {
            this.logger.error('Erreur lors de la validation SEO:', error);
            result.valid = false;
            result.errors.push(`Erreur technique: ${error.message}`);
        }

        return result;
    }

    /**
     * Recherche des fichiers de routes Remix dans le projet
     */
    private async findRouteFiles(context: AgentContext): Promise<string[]> {
        const { targetDir } = context.config;
        const routesDir = path.join(targetDir, 'app/routes');

        if (!fs.existsSync(routesDir)) {
            this.logger.warn(`Dossier des routes non trouvé: ${routesDir}`);
            return [];
        }

        // Recherche récursive des fichiers de routes Remix (.tsx, .jsx, .js)
        const routeFiles: string[] = [];

        const collectFiles = (dir: string) => {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    collectFiles(filePath);
                } else if (/\.(tsx|jsx|js)$/.test(file) && !file.includes('.test.') && !file.includes('.spec.')) {
                    // Vérifier si le chemin doit être ignoré
                    if (!this.config.ignorePaths?.some(ignorePath => filePath.includes(ignorePath))) {
                        routeFiles.push(filePath);
                    }
                }
            }
        };

        collectFiles(routesDir);
        return routeFiles;
    }

    /**
     * Vérification des métadonnées dans les fichiers
     */
    private async checkMetadataInFiles(files: string[], result: SEOValidationResult): Promise<void> {
        const titles = new Map<string, string>();

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');

            // Vérifier la présence des balises méta essentielles
            const hasTitle = /<title>|export const meta.*title|title:|"title":/.test(content);
            const hasDescription = /name="description"|content=".*?"|description:|"description":/.test(content);
            const hasOgTags = /property="og:|og:/.test(content);

            if (!hasTitle || !hasDescription) {
                result.missingMetadata = result.missingMetadata || [];
                result.missingMetadata.push(file);

                if (!hasTitle) {
                    result.errors.push(`Balise title manquante: ${file}`);
                }

                if (!hasDescription) {
                    result.warnings.push(`Métadonnée description manquante: ${file}`);
                }

                if (!hasOgTags) {
                    result.warnings.push(`Tags Open Graph manquants: ${file}`);
                }
            }

            // Extraction du titre pour vérifier les doublons
            if (hasTitle && this.config.checkDuplicateTitles) {
                const titleMatch = content.match(/<title>(.*?)<\/title>|title:\s*["'](.+?)["']|"title":\s*"(.+?)"/);
                if (titleMatch) {
                    const title = (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim();

                    // Vérifier la longueur du titre
                    if (title.length < this.config.minTitleLength) {
                        result.warnings.push(`Titre trop court (${title.length} caractères): ${file}`);
                    } else if (title.length > this.config.maxTitleLength) {
                        result.warnings.push(`Titre trop long (${title.length} caractères): ${file}`);
                    }

                    // Vérifier les doublons
                    if (titles.has(title)) {
                        const duplicateFile = titles.get(title);
                        result.duplicateTitles = result.duplicateTitles || [];
                        result.duplicateTitles.push({ path: file, title });
                        result.errors.push(`Titre en double "${title}" dans ${file} et ${duplicateFile}`);
                    } else {
                        titles.set(title, file);
                    }
                }
            }
        }
    }

    /**
     * Vérification des URLs canoniques
     */
    private async checkCanonicalUrls(files: string[], result: SEOValidationResult): Promise<void> {
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');

            // Vérifier la présence de liens canoniques
            const hasCanonical = /rel="canonical"|canonical:|"canonical":/.test(content);

            if (!hasCanonical) {
                result.warnings.push(`Lien canonique manquant: ${file}`);
            } else {
                // Analyser le lien canonique
                const canonicalMatch = content.match(/href="([^"]+)"\s+rel="canonical"|canonical:\s*["'](.+?)["']|"canonical":\s*"(.+?)"/);
                if (canonicalMatch) {
                    const canonicalUrl = (canonicalMatch[1] || canonicalMatch[2] || canonicalMatch[3]).trim();

                    // Vérifier si l'URL canonique est valide
                    if (!canonicalUrl.startsWith('http')) {
                        result.canonicalErrors = result.canonicalErrors || [];
                        result.canonicalErrors.push({
                            path: file,
                            error: `URL canonique invalide: ${canonicalUrl}`
                        });
                        result.errors.push(`URL canonique invalide dans ${file}: ${canonicalUrl}`);
                    }
                }
            }
        }
    }

    /**
     * Application des corrections automatiques
     */
    private async applyFixes(files: string[], result: SEOValidationResult): Promise<void> {
        this.logger.info('Application des corrections automatiques');
        result.fixedIssues = [];

        // Traitement des fichiers avec métadonnées manquantes
        if (result.missingMetadata && result.missingMetadata.length > 0) {
            for (const file of result.missingMetadata) {
                const content = await fs.readFile(file, 'utf-8');
                let modified = content;
                let fileModified = false;

                // Extraire le nom de la route du chemin du fichier
                const routeName = this.getRouteNameFromFilePath(file);
                const displayName = this.formatRouteNameForDisplay(routeName);

                // Ajouter une méta fonction si elle n'existe pas
                if (!/<title>|export const meta/.test(content)) {
                    const metaFunction = `
export const meta = () => {
  return {
    title: "${displayName}",
    description: "Page ${displayName} - Description à personnaliser",
    "og:title": "${displayName}",
    "og:type": "website",
    "og:image": "/images/og-default.jpg",
    "og:url": window.location.href
  };
};
`;
                    // Trouver l'endroit où insérer la méta fonction
                    if (/import.*from/.test(content)) {
                        // Insérer après le dernier import
                        const lastImportIndex = content.lastIndexOf('import');
                        const lastImportEnd = content.indexOf('\n', lastImportIndex);

                        if (lastImportEnd !== -1) {
                            modified = content.slice(0, lastImportEnd + 1) + "\n" + metaFunction + content.slice(lastImportEnd + 1);
                            fileModified = true;
                        }
                    } else {
                        // Insérer au début du fichier
                        modified = metaFunction + content;
                        fileModified = true;
                    }

                    if (fileModified) {
                        await fs.writeFile(file, modified);
                        result.fixedIssues.push({
                            path: file,
                            type: 'missing_metadata',
                            before: 'Aucune métadonnée',
                            after: 'Métadonnées ajoutées'
                        });
                        this.logger.info(`Métadonnées ajoutées pour: ${file}`);
                    }
                }
            }
        }

        // Traitement des erreurs canoniques
        if (result.canonicalErrors && result.canonicalErrors.length > 0) {
            for (const error of result.canonicalErrors) {
                const file = error.path;
                const content = await fs.readFile(file, 'utf-8');

                // Extraire l'URL canonique actuelle
                const canonicalMatch = content.match(/href="([^"]+)"\s+rel="canonical"|canonical:\s*["'](.+?)["']|"canonical":\s*"(.+?)"/);
                if (canonicalMatch) {
                    const currentCanonical = (canonicalMatch[1] || canonicalMatch[2] || canonicalMatch[3]).trim();

                    // Corriger l'URL canonique en ajoutant le protocole et le domaine
                    if (!currentCanonical.startsWith('http')) {
                        let correctedCanonical = currentCanonical;

                        if (!correctedCanonical.startsWith('/')) {
                            correctedCanonical = '/' + correctedCanonical;
                        }

                        // Ajouter le domaine principal
                        correctedCanonical = `https://example.com${correctedCanonical}`;

                        // Remplacer l'ancienne URL par la nouvelle
                        let modified = content.replace(
                            new RegExp(`(href="|canonical:\\s*["']|"canonical":\\s*")${currentCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}("|')`),
                            `$1${correctedCanonical}$2`
                        );

                        await fs.writeFile(file, modified);
                        result.fixedIssues.push({
                            path: file,
                            type: 'canonical_url',
                            before: currentCanonical,
                            after: correctedCanonical
                        });
                        this.logger.info(`URL canonique corrigée dans ${file}: ${currentCanonical} -> ${correctedCanonical}`);
                    }
                }
            }
        }
    }

    /**
     * Extrait le nom de la route à partir du chemin du fichier
     */
    private getRouteNameFromFilePath(filePath: string): string {
        const fileName = path.basename(filePath, path.extname(filePath));

        // Gestion des routes imbriquées (_index, etc.)
        if (fileName === 'index' || fileName === '_index') {
            const dirName = path.dirname(filePath).split('/').pop();
            return dirName || 'Index';
        }

        return fileName.replace(/^_+/, '');
    }

    /**
     * Formatage du nom de route pour affichage
     */
    private formatRouteNameForDisplay(routeName: string): string {
        return routeName
            .replace(/[-_.]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }
}

export const seoCheckerAgent = new SEOCheckerAgent();
export default seoCheckerAgent;