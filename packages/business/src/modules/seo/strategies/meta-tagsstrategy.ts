import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ISeoAnalysisStrategy } from '../interfaces/seo-strategy.interface';

/**
 * Stratégie d'analyse des balises meta pour le SEO
 * Vérifie la présence et la qualité des balises meta essentielles
 */
@Injectable()
export class MetaTagsStrategy implements ISeoAnalysisStrategy {
  private readonly logger = new Logger(MetaTagsStrategy.name);

  readonly id = 'meta-tags-analyzer';
  readonly name = 'Analyse des balises meta';
  readonly priority = 10; // Priorité élevée

  /**
   * Cette stratégie est applicable à toutes les pages HTML
   */
  isApplicable(_url: string, content?: string): boolean {
    return !!content && content.includes('<!DOCTYPE html>');
  }

  /**
   * Analyse les balises meta d'une page
   */
  async analyze(
    url: string,
    content: string,
    _options?: any
  ): Promise<{
    score: number;
    issues: Array<{
      type: string;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      details?: any;
    }>;
    metadata?: Record<string, any>;
  }> {
    try {
      const $ = cheerio.load(content);
      const issues: Array<{
        type: string;
        severity: 'critical' | 'warning' | 'info';
        message: string;
        details?: any;
      }> = [];

      const metadata: Record<string, any> = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content')?.trim(),
        url: url,
        canonical: $('link[rel="canonical"]').attr('href')?.trim(),
        robotsMeta: $('meta[name="robots"]').attr('content')?.trim(),
      };

      // Analyse du titre
      const title = metadata.title;
      if (!title) {
        issues.push({
          type: 'missing-title',
          severity: 'critical',
          message: 'La balise title est manquante.',
          details: {
            recommendation: 'Ajoutez une balise title concise et descriptive (50-60 caractères)',
          },
        });
      } else {
        if (title.length < 10) {
          issues.push({
            type: 'short-title',
            severity: 'warning',
            message: 'La balise title est trop courte.',
            details: {
              titleLength: title.length,
              title: title,
              recommendation:
                "Allongez le titre pour qu'il soit plus descriptif (50-60 caractères)",
            },
          });
        } else if (title.length > 70) {
          issues.push({
            type: 'long-title',
            severity: 'warning',
            message: 'La balise title est trop longue.',
            details: {
              titleLength: title.length,
              title: title,
              recommendation:
                'Raccourcissez le titre à 50-60 caractères pour éviter la troncature dans les SERP',
            },
          });
        }
      }

      // Analyse de la méta description
      const description = metadata.description;
      if (!description) {
        issues.push({
          type: 'missing-description',
          severity: 'critical',
          message: 'La balise meta description est manquante.',
          details: {
            recommendation:
              'Ajoutez une meta description concise et pertinente (130-160 caractères)',
          },
        });
      } else {
        if (description.length < 50) {
          issues.push({
            type: 'short-description',
            severity: 'warning',
            message: 'La meta description est trop courte.',
            details: {
              descriptionLength: description.length,
              description: description,
              recommendation:
                "Allongez la description pour qu'elle soit plus informative (130-160 caractères)",
            },
          });
        } else if (description.length > 320) {
          issues.push({
            type: 'long-description',
            severity: 'warning',
            message: 'La meta description est trop longue.',
            details: {
              descriptionLength: description.length,
              description: description,
              recommendation:
                'Raccourcissez la description à 130-160 caractères pour éviter la troncature dans les SERP',
            },
          });
        }
      }

      // Vérification de la balise canonical
      const canonical = metadata.canonical;
      if (!canonical) {
        issues.push({
          type: 'missing-canonical',
          severity: 'warning',
          message: 'La balise canonical est manquante.',
          details: {
            recommendation:
              'Ajoutez une balise canonical pour éviter les problèmes de contenu dupliqué',
          },
        });
      } else if (!canonical.startsWith('http')) {
        issues.push({
          type: 'invalid-canonical',
          severity: 'warning',
          message: 'La balise canonical a une URL relative.',
          details: {
            canonical: canonical,
            recommendation: 'Utilisez une URL absolue pour la balise canonical',
          },
        });
      } else if (canonical !== url && !url.endsWith('/') && canonical !== `${url}/`) {
        issues.push({
          type: 'incorrect-canonical',
          severity: 'info',
          message: 'La balise canonical pointe vers une URL différente.',
          details: {
            current: url,
            canonical: canonical,
            recommendation: 'Vérifiez si cette redirection est intentionnelle',
          },
        });
      }

      // Vérification des balises Open Graph
      if (!$('meta[property="og:title"]').attr('content')) {
        issues.push({
          type: 'missing-og-title',
          severity: 'info',
          message: 'La balise Open Graph title est manquante.',
          details: {
            recommendation:
              'Ajoutez une balise og:title pour améliorer le partage sur les réseaux sociaux',
          },
        });
      }

      if (!$('meta[property="og:description"]').attr('content')) {
        issues.push({
          type: 'missing-og-description',
          severity: 'info',
          message: 'La balise Open Graph description est manquante.',
          details: {
            recommendation:
              'Ajoutez une balise og:description pour améliorer le partage sur les réseaux sociaux',
          },
        });
      }

      if (!$('meta[property="og:image"]').attr('content')) {
        issues.push({
          type: 'missing-og-image',
          severity: 'info',
          message: 'La balise Open Graph image est manquante.',
          details: {
            recommendation:
              'Ajoutez une balise og:image pour améliorer le partage sur les réseaux sociaux',
          },
        });
      }

      // Calcul du score
      const totalIssues = issues.length;
      const criticalIssues = issues.filter((issue) => issue.severity === 'critical').length;
      const warningIssues = issues.filter((issue) => issue.severity === 'warning').length;
      const infoIssues = issues.filter((issue) => issue.severity === 'info').length;

      // Calcul du score (100 - pénalités)
      let score = 100;
      score -= criticalIssues * 20; // -20 points par problème critique
      score -= warningIssues * 10; // -10 points par avertissement
      score -= infoIssues * 2; // -2 points par information

      // S'assurer que le score reste entre 0 et 100
      score = Math.max(0, Math.min(100, score));

      return {
        score,
        issues,
        metadata: {
          ...metadata,
          issuesCount: {
            total: totalIssues,
            critical: criticalIssues,
            warning: warningIssues,
            info: infoIssues,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'analyse des balises meta: ${error.message}`, error.stack);
      return {
        score: 0,
        issues: [
          {
            type: 'analysis-error',
            severity: 'critical',
            message: `Erreur lors de l'analyse: ${error.message}`,
            details: { error: error.message },
          },
        ],
      };
    }
  }

  /**
   * Suggère des corrections pour les problèmes identifiés
   */
  async suggestFixes(
    issues: Array<any>,
    content: string
  ): Promise<{
    fixedContent?: string;
    recommendations: Array<{
      issue: any;
      recommendation: string;
      autoFixable: boolean;
    }>;
  }> {
    try {
      const $ = cheerio.load(content);
      let modified = false;
      const recommendations: Array<{
        issue: any;
        recommendation: string;
        autoFixable: boolean;
      }> = [];

      for (const issue of issues) {
        switch (issue.type) {
          case 'missing-title':
            recommendations.push({
              issue,
              recommendation: 'Ajoutez une balise title descriptive dans la section head.',
              autoFixable: false,
            });
            break;

          case 'missing-description':
            recommendations.push({
              issue,
              recommendation: 'Ajoutez une balise meta description dans la section head.',
              autoFixable: true,
            });
            // Tentative de correction automatique avec une description générique
            if (!$('meta[name="description"]').length) {
              $('head').append(
                '<meta name="description" content="Description à personnaliser pour cette page" />'
              );
              modified = true;
            }
            break;

          case 'missing-canonical':
            recommendations.push({
              issue,
              recommendation:
                "Ajoutez une balise canonical pointant vers l'URL canonique de cette page.",
              autoFixable: true,
            });
            // Tentative de correction automatique
            if (!$('link[rel="canonical"]').length) {
              $('head').append(`<link rel="canonical" href="${issue.details?.current || ''}" />`);
              modified = true;
            }
            break;

          case 'missing-og-title':
            recommendations.push({
              issue,
              recommendation: 'Ajoutez une balise og:title basée sur le titre de la page.',
              autoFixable: true,
            });
            // Tentative de correction automatique
            if (!$('meta[property="og:title"]').length && $('title').length) {
              $('head').append(`<meta property="og:title" content="${$('title').text()}" />`);
              modified = true;
            }
            break;

          default:
            recommendations.push({
              issue,
              recommendation:
                issue.details?.recommendation ||
                'Consultez les détails du problème pour des recommandations.',
              autoFixable: false,
            });
            break;
        }
      }

      return {
        fixedContent: modified ? $.html() : undefined,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suggestion de corrections: ${error.message}`,
        error.stack
      );
      return {
        recommendations: [
          {
            issue: {
              type: 'fix-error',
              severity: 'critical',
              message: `Erreur lors de la suggestion de corrections: ${error.message}`,
            },
            recommendation:
              'Une erreur est survenue lors de la tentative de correction. Vérifiez la syntaxe HTML de la page.',
            autoFixable: false,
          },
        ],
      };
    }
  }
}
