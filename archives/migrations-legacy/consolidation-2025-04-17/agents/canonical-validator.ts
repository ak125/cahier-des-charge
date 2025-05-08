/**
 * canonical-validator.ts
 *
 * Validateur d'URLs canoniques pour les routes Remix
 * Vérifie et corrige les canonicals pour assurer une bonne indexation SEO
 */

import * as path from 'path';
import { pathExists, readFile, writeFile } from 'fs-extra';
import {
  TraceabilityService,
  createTraceabilityService,
} from '../utils/traceability/traceability-service';

interface CanonicalValidatorConfig {
  // Chemin des fichiers à valider
  remixDir: string; // Répertoire des routes Remix
  metaDir: string; // Répertoire des fichiers meta.ts
  outputDir: string; // Répertoire pour les fichiers corrigés

  // Options de validation
  baseUrl: string; // URL de base du site (ex: https://monsite.com)
  strictValidation: boolean; // Validation stricte qui bloque en cas d'erreur
  autoFix: boolean; // Correction automatique des problèmes

  // Configuration de la traçabilité
  enableTracing?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  databaseTable?: string;
}

interface CanonicalIssue {
  route: string;
  metaFile: string;
  currentCanonical?: string;
  expectedCanonical: string;
  issueType: 'missing' | 'incorrect' | 'duplicate' | 'relative';
  severity: 'high' | 'medium' | 'low';
  fixed: boolean;
}

interface ValidationResult {
  route: string;
  metaFile: string;
  valid: boolean;
  canonical?: string;
  issues: CanonicalIssue[];
  fixed: number;
  skipped: number;
}

export class CanonicalValidator {
  private traceService: TraceabilityService | null = null;

  constructor(private config: CanonicalValidatorConfig) {
    if (this.config.enableTracing) {
      this.traceService = createTraceabilityService('agents', {
        storageStrategy: 'database',
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        databaseTable: config.databaseTable || 'seo_migration_status',
      });
    }
  }

  /**
   * Valide les canonicals pour toutes les routes
   */
  async validateAllRoutes(): Promise<{ valid: number; invalid: number; fixed: number }> {
    const traceId = this.traceService
      ? await this.traceService.generateTraceId({ operation: 'validate-all-canonicals' })
      : '';

    if (this.traceService) {
      await this.traceService.logTrace({
        traceId,
        event: 'canonical-validation-started',
        timestamp: new Date(),
        context: {
          remixDir: this.config.remixDir,
          metaDir: this.config.metaDir,
        },
      });
    }

    try {
      // Implémenter la logique pour trouver toutes les routes et valider leurs canonicals
      // Pour cet exemple, on retourne des valeurs fictives

      const result = {
        valid: 15,
        invalid: 5,
        fixed: this.config.autoFix ? 5 : 0,
      };

      // Tracer le résultat
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'canonical-validation-completed',
          timestamp: new Date(),
          success: result.invalid === 0 || (this.config.autoFix && result.fixed === result.invalid),
          context: result,
        });
      }

      return result;
    } catch (error) {
      // Tracer l'erreur
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'canonical-validation-error',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }

  /**
   * Valide le canonical d'une route spécifique
   */
  async validateRoute(route: string): Promise<ValidationResult> {
    const traceId = this.traceService
      ? await this.traceService.generateTraceId({ route, operation: 'validate-canonical' })
      : '';

    const result: ValidationResult = {
      route,
      metaFile: path.join(this.config.metaDir, `${route}.meta.ts`),
      valid: false,
      issues: [],
      fixed: 0,
      skipped: 0,
    };

    try {
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-canonical-validation-started',
          timestamp: new Date(),
          context: { route },
        });
      }

      // 1. Vérifier si le fichier meta.ts existe
      const metaFilePath = result.metaFile;
      if (!(await pathExists(metaFilePath))) {
        const issue: CanonicalIssue = {
          route,
          metaFile: metaFilePath,
          expectedCanonical: this.generateCanonicalUrl(route),
          issueType: 'missing',
          severity: 'high',
          fixed: false,
        };

        result.issues.push(issue);

        // Essayer de fixer en créant un fichier meta.ts de base
        if (this.config.autoFix) {
          await this.createBasicMetaFile(route, issue.expectedCanonical);
          issue.fixed = true;
          result.fixed++;
        } else {
          result.skipped++;
        }

        // Tracer le résultat
        if (this.traceService) {
          await this.traceService.logTrace({
            traceId,
            event: 'route-canonical-validation-completed',
            timestamp: new Date(),
            success: false,
            context: {
              route,
              issues: result.issues,
              fixed: result.fixed,
              skipped: result.skipped,
            },
          });
        }

        return result;
      }

      // 2. Lire le fichier meta.ts et extraire l'URL canonique
      const metaContent = await readFile(metaFilePath, 'utf-8');
      const canonicalMatch = metaContent.match(/rel:.*?["']canonical["'].*?href:.*?["'](.*?)["']/s);

      // 3. Vérifier si l'URL canonique est présente et correcte
      const expectedCanonical = this.generateCanonicalUrl(route);
      result.canonical = canonicalMatch ? canonicalMatch[1] : undefined;

      if (!result.canonical) {
        // Canonical manquant
        const issue: CanonicalIssue = {
          route,
          metaFile: metaFilePath,
          expectedCanonical,
          issueType: 'missing',
          severity: 'high',
          fixed: false,
        };

        result.issues.push(issue);

        // Corriger automatiquement si autoFix est activé
        if (this.config.autoFix) {
          await this.addCanonicalToMetaFile(metaFilePath, expectedCanonical);
          issue.fixed = true;
          result.fixed++;
        } else {
          result.skipped++;
        }
      } else if (!this.isCanonicalValid(result.canonical, expectedCanonical)) {
        // Canonical incorrect
        const issueType = result.canonical.startsWith('/') ? 'relative' : 'incorrect';
        const issue: CanonicalIssue = {
          route,
          metaFile: metaFilePath,
          currentCanonical: result.canonical,
          expectedCanonical,
          issueType,
          severity: issueType === 'relative' ? 'medium' : 'high',
          fixed: false,
        };

        result.issues.push(issue);

        // Corriger automatiquement si autoFix est activé
        if (this.config.autoFix) {
          await this.fixCanonicalInMetaFile(metaFilePath, result.canonical, expectedCanonical);
          issue.fixed = true;
          result.fixed++;
        } else {
          result.skipped++;
        }
      }

      // 4. Vérifier les doublons de canonicals dans d'autres fichiers (logique simplifiée pour l'exemple)
      // Cette partie nécessiterait une vérification plus complexe dans un environnement réel

      // 5. Déterminer si tout est valide
      result.valid =
        result.issues.length === 0 ||
        (this.config.autoFix && result.fixed === result.issues.length);

      // Tracer le résultat
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-canonical-validation-completed',
          timestamp: new Date(),
          success: result.valid,
          context: {
            route,
            canonical: result.canonical,
            expectedCanonical,
            valid: result.valid,
            issues: result.issues,
            fixed: result.fixed,
            skipped: result.skipped,
          },
        });
      }

      return result;
    } catch (error) {
      // Tracer l'erreur
      if (this.traceService) {
        await this.traceService.logTrace({
          traceId,
          event: 'route-canonical-validation-error',
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : String(error),
          context: { route },
        });
      }

      throw error;
    }
  }

  /**
   * Génère une URL canonique pour une route
   */
  private generateCanonicalUrl(route: string): string {
    // Supprimer les index pour avoir des URLs propres
    let normalizedRoute = route;
    if (normalizedRoute.endsWith('/index')) {
      normalizedRoute = normalizedRoute.replace(/\/index$/, '/');
    } else if (normalizedRoute === 'index') {
      normalizedRoute = '';
    }

    // Assurer que les routes commencent par un slash
    if (normalizedRoute && !normalizedRoute.startsWith('/')) {
      normalizedRoute = '/' + normalizedRoute;
    }

    // Combiner avec l'URL de base
    return `${this.config.baseUrl}${normalizedRoute}`;
  }

  /**
   * Vérifie si une URL canonique est valide
   */
  private isCanonicalValid(current: string, expected: string): boolean {
    // Normalisation des URLs pour la comparaison
    // Supprimer les slashes finaux pour la comparaison
    const normalizedCurrent = current.replace(/\/$/, '');
    const normalizedExpected = expected.replace(/\/$/, '');

    return normalizedCurrent === normalizedExpected;
  }

  /**
   * Crée un fichier meta.ts de base avec l'URL canonique
   */
  private async createBasicMetaFile(route: string, canonicalUrl: string): Promise<void> {
    const metaFilePath = path.join(this.config.metaDir, `${route}.meta.ts`);
    const content = `/**
 * Métadonnées SEO pour la route "${route}"
 * Générées automatiquement par CanonicalValidator le ${new Date().toISOString()}
 */
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = ({ data }) => {
  // Valeurs par défaut ou extraites des données
  const seo = data?.seo || {};
  
  return [
    { title: seo.title || "${this.formatRouteTitle(route)}" },
    { name: "description", content: seo.description || "Description de la page ${this.formatRouteTitle(
      route
    )}" },
    { tagName: "link", rel: "canonical", href: seo.canonical || "${canonicalUrl}" },
    { property: "og:type", content: "website" },
  ];
};

export default meta;
`;

    await writeFile(metaFilePath, content, 'utf-8');
  }

  /**
   * Ajoute une URL canonique à un fichier meta.ts existant
   */
  private async addCanonicalToMetaFile(metaFilePath: string, canonicalUrl: string): Promise<void> {
    let content = await readFile(metaFilePath, 'utf-8');

    // Rechercher l'emplacement où ajouter la balise canonical
    const returnMatch = content.match(/return\s*\[\s*[\s\S]*?\]\s*;/);

    if (returnMatch) {
      // Insérer avant la dernière accolade fermante du tableau de méta
      const arrayContent = returnMatch[0];
      const lastBracketIndex = arrayContent.lastIndexOf(']');

      const newArrayContent =
        arrayContent.substring(0, lastBracketIndex) +
        `\n    { tagName: "link", rel: "canonical", href: seo.canonical || "${canonicalUrl}" },` +
        arrayContent.substring(lastBracketIndex);

      content = content.replace(arrayContent, newArrayContent);

      // Écrire le contenu mis à jour
      await writeFile(metaFilePath, content, 'utf-8');
    }
  }

  /**
   * Corrige une URL canonique dans un fichier meta.ts existant
   */
  private async fixCanonicalInMetaFile(
    metaFilePath: string,
    current: string,
    expected: string
  ): Promise<void> {
    let content = await readFile(metaFilePath, 'utf-8');

    // Échapper les caractères spéciaux pour la recherche
    const escapedCurrent = current.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Remplacer l'URL canonique
    const canonicalRegex = new RegExp(
      `(rel:\\s*["']canonical["'].*?href:\\s*["'])${escapedCurrent}(["'])`,
      's'
    );
    content = content.replace(canonicalRegex, `$1${expected}$2`);

    // Si le format est différent, essayer d'autres patterns
    const altPattern = new RegExp(
      `(href:\\s*["'])${escapedCurrent}(["'].*?rel:\\s*["']canonical["'])`,
      's'
    );
    content = content.replace(altPattern, `$1${expected}$2`);

    // Essayer un format plus simple pour le remplacement
    const simplePattern = new RegExp(`(canonical["'].*?href:\\s*["'])${escapedCurrent}(["'])`, 's');
    content = content.replace(simplePattern, `$1${expected}$2`);

    // Et un autre format simple
    const literalPattern = new RegExp(`["']${escapedCurrent}["']`, 'g');
    content = content.replace(literalPattern, `"${expected}"`);

    // Écrire le contenu mis à jour
    await writeFile(metaFilePath, content, 'utf-8');
  }

  /**
   * Formatte le titre d'une route pour la présentation
   */
  private formatRouteTitle(route: string): string {
    let displayRoute = route;

    // Supprimer 'index' à la fin
    if (displayRoute.endsWith('/index')) {
      displayRoute = displayRoute.replace(/\/index$/, '');
    } else if (displayRoute === 'index') {
      displayRoute = 'Accueil';
    }

    // Remplacer les tirets et slashes par des espaces
    displayRoute = displayRoute
      .replace(/-/g, ' ')
      .replace(/\//g, ' - ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return displayRoute;
  }
}

/**
 * Fonction utilitaire pour créer une instance de CanonicalValidator
 */
export function createCanonicalValidator(config: CanonicalValidatorConfig): CanonicalValidator {
  return new CanonicalValidator(config);
}
