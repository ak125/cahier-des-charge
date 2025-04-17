import { Injectable, Logger } from '@nestjs/common';
import { ISeoAnalysisStrategy } from '../interfaces/seo-strategy.interface';
import * as cheerio from 'cheerio';
import * as urlLib from 'url';

/**
 * Stratégie d'analyse des liens pour le SEO
 * Vérifie la structure des liens internes et externes
 */
@Injectable()
export class LinksAnalysisStrategy implements ISeoAnalysisStrategy {
  private readonly logger = new Logger(LinksAnalysisStrategy.name);

  readonly id = 'links-analyzer';
  readonly name = 'Analyse des liens';
  readonly priority = 20; // Priorité moyenne

  /**
   * Cette stratégie est applicable à toutes les pages HTML
   */
  isApplicable(url: string, content?: string): boolean {
    return !!content && content.includes('<a');
  }

  /**
   * Analyse les liens d'une page
   */
  async analyze(url: string, content: string, options?: any): Promise<{
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

      // Analyser tous les liens de la page
      const links = $('a').toArray();
      const baseUrl = new URL(url).origin;
      
      // Structure pour stocker les métadonnées des liens
      const internalLinks: Array<{ href: string; text: string; nofollow: boolean }> = [];
      const externalLinks: Array<{ href: string; text: string; nofollow: boolean }> = [];
      const brokenLinks: Array<{ href: string; text: string; reason: string }> = [];

      // Compter les liens sans texte
      let emptyLinksCount = 0;
      
      // Compter les liens avec attributs nofollow
      let nofollowLinksCount = 0;
      
      // Compter les liens avec même texte mais URLs différentes
      const linkTextMap: Map<string, Set<string>> = new Map();

      // Analyser chaque lien
      links.forEach(link => {
        const $link = $(link);
        const href = $link.attr('href') || '';
        const text = $link.text().trim();
        const rel = $link.attr('rel') || '';
        const isNofollow = rel.includes('nofollow');

        // Vérifier si le texte du lien est vide
        if (!text || text === '') {
          emptyLinksCount++;
          issues.push({
            type: 'empty-link-text',
            severity: 'warning',
            message: 'Lien sans texte détecté.',
            details: {
              href,
              element: $.html(link),
              recommendation: 'Ajoutez un texte descriptif à ce lien pour améliorer l\'accessibilité et le SEO',
            },
          });
        } else {
          // Mémoriser le texte du lien pour détecter les doublons
          if (text.length > 3) { // Ignorer les textes très courts
            if (!linkTextMap.has(text)) {
              linkTextMap.set(text, new Set());
            }
            linkTextMap.get(text)?.add(href);
          }
        }

        if (isNofollow) {
          nofollowLinksCount++;
        }

        // Vérifier si le lien est valide
        if (!href || href === '#' || href === 'javascript:void(0)') {
          brokenLinks.push({ href, text, reason: 'empty-href' });
          issues.push({
            type: 'empty-href',
            severity: 'warning',
            message: 'Lien avec URL vide ou non valide.',
            details: {
              href,
              text,
              element: $.html(link),
              recommendation: 'Remplacez ce lien par une URL valide ou utilisez un élément <button> si l\'action est gérée par JavaScript',
            },
          });
        } else {
          try {
            // Vérifier si c'est un lien interne ou externe
            if (href.startsWith('http') && !href.startsWith(baseUrl)) {
              // Lien externe
              externalLinks.push({ href, text, nofollow: isNofollow });
              
              // Vérifier si le lien externe a un attribut nofollow
              if (!isNofollow && !rel.includes('ugc') && !rel.includes('sponsored')) {
                issues.push({
                  type: 'external-without-nofollow',
                  severity: 'info',
                  message: 'Lien externe sans attribut nofollow, ugc ou sponsored.',
                  details: {
                    href,
                    text,
                    element: $.html(link),
                    recommendation: 'Considérez l\'ajout de rel="nofollow" pour les liens externes que vous ne souhaitez pas soutenir explicitement',
                  },
                });
              }
            } else {
              // Lien interne
              let resolvedHref = href;
              
              // Résoudre les URLs relatives
              if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                resolvedHref = new URL(href, url).href;
              }
              
              internalLinks.push({ href: resolvedHref, text, nofollow: isNofollow });
              
              // Vérifier si le lien interne a un attribut nofollow (généralement pas recommandé)
              if (isNofollow && href.startsWith('/')) {
                issues.push({
                  type: 'internal-with-nofollow',
                  severity: 'info',
                  message: 'Lien interne avec attribut nofollow.',
                  details: {
                    href,
                    text,
                    element: $.html(link),
                    recommendation: 'Évitez d\'utiliser rel="nofollow" pour les liens internes, car cela empêche le transfert de PageRank entre vos pages',
                  },
                });
              }
            }
          } catch (error) {
            brokenLinks.push({ href, text, reason: 'invalid-url' });
            issues.push({
              type: 'invalid-url',
              severity: 'warning',
              message: 'URL de lien invalide.',
              details: {
                href,
                text,
                error: error.message,
                element: $.html(link),
                recommendation: 'Corrigez l\'URL pour qu\'elle respecte la syntaxe standard',
              },
            });
          }
        }
      });

      // Vérifier les liens avec même texte mais URLs différentes
      linkTextMap.forEach((hrefs, text) => {
        if (hrefs.size > 1) {
          issues.push({
            type: 'duplicate-link-text',
            severity: 'info',
            message: `Le texte d'ancrage "${text}" est utilisé pour plusieurs URLs différentes.`,
            details: {
              text,
              urls: Array.from(hrefs),
              recommendation: 'Utilisez des textes d\'ancrage uniques pour chaque destination différente afin d\'éviter de confondre les utilisateurs et les moteurs de recherche',
            },
          });
        }
      });

      // Vérifier si la page a trop de liens externes
      const externalLinksCount = externalLinks.length;
      const internalLinksCount = internalLinks.length;
      const totalLinks = externalLinksCount + internalLinksCount;
      
      if (totalLinks > 0 && (externalLinksCount / totalLinks) > 0.7) {
        issues.push({
          type: 'too-many-external-links',
          severity: 'warning',
          message: 'Trop de liens externes par rapport aux liens internes.',
          details: {
            externalLinks: externalLinksCount,
            internalLinks: internalLinksCount,
            ratio: (externalLinksCount / totalLinks).toFixed(2),
            recommendation: 'Réduisez le nombre de liens externes ou augmentez le nombre de liens internes pour améliorer la distribution du PageRank',
          },
        });
      }

      // Calcul du score
      let score = 100;
      
      // Pénalités pour les problèmes
      const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
      const warningIssues = issues.filter(issue => issue.severity === 'warning').length;
      const infoIssues = issues.filter(issue => issue.severity === 'info').length;
      
      score -= criticalIssues * 20;
      score -= warningIssues * 5;
      score -= infoIssues * 1;
      
      // Pénalité supplémentaire pour les proportions problématiques
      if (totalLinks > 0) {
        // Pénalité pour trop de liens externes
        const externalRatio = externalLinksCount / totalLinks;
        if (externalRatio > 0.8) {
          score -= 15;
        } else if (externalRatio > 0.6) {
          score -= 5;
        }
        
        // Pénalité pour trop de liens vides
        if (emptyLinksCount / totalLinks > 0.2) {
          score -= 10;
        }
        
        // Bonus pour un bon équilibre
        if (internalLinksCount > 0 && externalLinksCount > 0 && externalRatio < 0.5) {
          score += 5;
        }
      }
      
      // S'assurer que le score reste entre 0 et 100
      score = Math.max(0, Math.min(100, score));

      return {
        score: Math.round(score),
        issues,
        metadata: {
          totalLinks,
          internalLinks: internalLinksCount,
          externalLinks: externalLinksCount,
          brokenLinks: brokenLinks.length,
          emptyLinks: emptyLinksCount,
          nofollowLinks: nofollowLinksCount,
          linksDetail: {
            internal: internalLinks,
            external: externalLinks,
            broken: brokenLinks,
          },
          issuesCount: {
            total: issues.length,
            critical: criticalIssues,
            warning: warningIssues,
            info: infoIssues,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'analyse des liens: ${error.message}`, error.stack);
      return {
        score: 0,
        issues: [{
          type: 'analysis-error',
          severity: 'critical',
          message: `Erreur lors de l'analyse des liens: ${error.message}`,
          details: { error: error.message },
        }],
      };
    }
  }

  /**
   * Suggère des corrections pour les problèmes identifiés
   */
  async suggestFixes(issues: Array<any>, content: string): Promise<{
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
          case 'empty-link-text':
            if (issue.details && issue.details.href) {
              const $emptyLink = $(`a[href="${issue.details.href}"]`).filter(function() {
                return !$(this).text().trim();
              });
              
              recommendations.push({
                issue,
                recommendation: 'Ajoutez un texte descriptif à ce lien ou une alternative textuelle via un attribut aria-label.',
                autoFixable: $emptyLink.has('img').length > 0,
              });
              
              // Auto-correction si le lien contient une image
              $emptyLink.each((_, el) => {
                const $link = $(el);
                if ($link.has('img').length) {
                  const $img = $link.find('img');
                  const altText = $img.attr('alt');
                  if (altText && !$link.attr('aria-label')) {
                    $link.attr('aria-label', altText);
                    modified = true;
                  }
                }
              });
            } else {
              recommendations.push({
                issue,
                recommendation: 'Ajoutez un texte descriptif à ce lien.',
                autoFixable: false,
              });
            }
            break;

          case 'external-without-nofollow':
            if (issue.details && issue.details.href) {
              const externalLink = $(`a[href="${issue.details.href}"]`);
              recommendations.push({
                issue,
                recommendation: 'Ajoutez un attribut rel="nofollow" à ce lien externe, surtout s\'il s\'agit de contenu non vérifié ou commercial.',
                autoFixable: true,
              });
              
              // Auto-correction possible
              if (externalLink.length && !externalLink.attr('rel')) {
                externalLink.attr('rel', 'nofollow');
                modified = true;
              }
            } else {
              recommendations.push({
                issue,
                recommendation: 'Ajoutez un attribut rel="nofollow" aux liens externes.',
                autoFixable: false,
              });
            }
            break;
            
          case 'internal-with-nofollow':
            if (issue.details && issue.details.href) {
              const internalLink = $(`a[href="${issue.details.href}"]`);
              recommendations.push({
                issue,
                recommendation: 'Retirez l\'attribut nofollow de ce lien interne pour permettre le transfert de PageRank.',
                autoFixable: true,
              });
              
              // Auto-correction possible
              if (internalLink.length) {
                const rel = internalLink.attr('rel');
                if (rel) {
                  const newRel = rel.split(' ').filter(r => r !== 'nofollow').join(' ');
                  if (newRel) {
                    internalLink.attr('rel', newRel);
                  } else {
                    internalLink.removeAttr('rel');
                  }
                  modified = true;
                }
              }
            } else {
              recommendations.push({
                issue,
                recommendation: 'Retirez l\'attribut nofollow des liens internes.',
                autoFixable: false,
              });
            }
            break;

          default:
            recommendations.push({
              issue,
              recommendation: issue.details?.recommendation || 'Consultez les détails du problème pour des recommandations.',
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
      this.logger.error(`Erreur lors de la suggestion de corrections: ${error.message}`, error.stack);
      return {
        recommendations: [{
          issue: {
            type: 'fix-error',
            severity: 'critical',
            message: `Erreur lors de la suggestion de corrections: ${error.message}`,
          },
          recommendation: 'Une erreur est survenue lors de la tentative de correction. Vérifiez la syntaxe HTML de la page.',
          autoFixable: false,
        }],
      };
    }
  }
}