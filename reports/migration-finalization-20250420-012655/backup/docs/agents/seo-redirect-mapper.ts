/**
 * SEO Redirect Mapper Agent
 *
 * Agent qui analyse les règles de redirection .htaccess
 * et les convertit en configuration de redirection pour Remix et/ou NestJS
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { AgentConfig, AgentContext, MCPAgent } from '../packagesDoDotmcp-core';

interface Redirection {
  source: string;
  target: string;
  type: '301' | '302' | '307' | '308' | '410' | '404';
  condition?: string;
  rewriteRuleOriginal?: string;
}

interface RedirectMapperConfig extends AgentConfig {
  htaccessPaths: string[];
  remixConfigPath: string;
  nestJSConfigPath?: string;
  outputJsonPath: string;
  validateRedirects: boolean;
}

export class SEORedirectMapper implements BaseAgent, BusinessAgent, MCPAgent<RedirectMapperConfig> {
  id = 'seo-redirect-mapper';
  name = 'SEO Redirect Mapper';
  description =
    'Convertit les règles de redirection .htaccess en configuration pour Remix et NestJS';
  version = '1.0.0';

  private redirects: Redirection[] = [];

  constructor(private config: RedirectMapperConfig, private context: AgentContext) {}

  async initialize(): Promise<void> {
    this.context.logger.info('Initialisation du SEO Redirect Mapper');
    this.redirects = [];

    // Vérifier que les fichiers existent
    for (const htaccessPath of this.config.htaccessPaths) {
      if (!(await fs.pathExists(htaccessPath))) {
        this.context.logger.warn(`Le fichier .htaccess ${htaccessPath} n'existe pas.`);
      }
    }
  }

  async run(): Promise<void> {
    this.context.logger.info('Démarrage de la conversion des redirections');

    // Extraire les redirections de tous les fichiers .htaccess
    for (const htaccessPath of this.config.htaccessPaths) {
      if (await fs.pathExists(htaccessPath)) {
        const extractedRedirects = await this.extractRedirectsFromHtaccess(htaccessPath);
        this.context.logger.info(
          `${extractedRedirects.length} redirections extraites de ${htaccessPath}`
        );
        this.redirects.push(...extractedRedirects);
      }
    }

    // Dédupliquer les redirections
    this.redirects = this.deduplicateRedirects(this.redirects);
    this.context.logger.info(`${this.redirects.length} redirections uniques après déduplication`);

    // Générer les fichiers de configuration
    await this.generateRedirectsJson();
    await this.updateRemixConfig();

    if (this.config.nestJSConfigPath) {
      await this.updateNestJSConfig();
    }

    // Valider les redirections si demandé
    if (this.config.validateRedirects) {
      await this.validateRedirects();
    }
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
        currentCondition += line + ' ';
        continue;
      }

      // Traiter les RewriteRule
      if (line.startsWith('RewriteRule')) {
        const rewriteMatch = line.match(/RewriteRule\s+\^?(.*?)[\$\s]\s+(.*?)\s+\[(.*?)\]/);

        if (rewriteMatch) {
          const source = rewriteMatch[1];
          const target = rewriteMatch[2];
          const flags = rewriteMatch[3];

          // Déterminer le type de redirection
          let type: '301' | '302' | '307' | '308' = '301';
          if (flags.includes('R=302')) type = '302';
          if (flags.includes('R=307')) type = '307';
          if (flags.includes('R=308')) type = '308';

          // Traiter les redirections
          if (flags.includes('R=') || flags.includes('R,')) {
            redirects.push({
              source: source.startsWith('/') ? source : '/' + source,
              target: target.startsWith('http')
                ? target
                : target.startsWith('/')
                  ? target
                  : '/' + target,
              type,
              condition: inRewriteCondition ? currentCondition.trim() : undefined,
              rewriteRuleOriginal: line,
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
            source: redirectMatch[1].startsWith('/') ? redirectMatch[1] : '/' + redirectMatch[1],
            target: redirectMatch[2],
            type: '301',
            rewriteRuleOriginal: line,
          });
        }
      } else if (line.startsWith('Redirect ')) {
        const redirectMatch = line.match(/Redirect\s+(\d+)?\s+(.*?)\s+(.*)/);
        if (redirectMatch) {
          const code = redirectMatch[1];
          const sourcePath = redirectMatch[2];
          const targetPath = redirectMatch[3];

          let type: '301' | '302' | '307' | '308' = '302';
          if (code === '301') type = '301';
          if (code === '307') type = '307';
          if (code === '308') type = '308';

          redirects.push({
            source: sourcePath.startsWith('/') ? sourcePath : '/' + sourcePath,
            target: targetPath,
            type,
            rewriteRuleOriginal: line,
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
    const uniqueMap = new Map<string, Redirection>();

    // Trier par spécificité (plus longue source d'abord)
    const sorted = [...redirects].sort((a, b) => b.source.length - a.source.length);

    // Garder la première (plus spécifique) pour chaque source
    for (const redirect of sorted) {
      if (!uniqueMap.has(redirect.source)) {
        uniqueMap.set(redirect.source, redirect);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Générer un fichier JSON avec toutes les redirections
   */
  private async generateRedirectsJson(): Promise<void> {
    await fs.ensureDir(path.dirname(this.config.outputJsonPath));

    await fs.writeJson(
      this.config.outputJsonPath,
      {
        generated: new Date().toISOString(),
        count: this.redirects.length,
        redirects: this.redirects,
      },
      { spaces: 2 }
    );

    this.context.logger.info(`Fichier JSON de redirections généré: ${this.config.outputJsonPath}`);
  }

  /**
   * Mettre à jour la configuration Remix avec les redirections
   */
  private async updateRemixConfig(): Promise<void> {
    if (!(await fs.pathExists(this.config.remixConfigPath))) {
      // Créer un nouveau fichier de configuration Remix
      const remixConfig = `/**
 * Configuration Remix générée
 * Date de génération: ${new Date().toISOString()}
 * Contient les redirections migrées depuis .htaccess
 */
module.exports = {
  // Redirections migrées depuis .htaccess
  redirects: {
${this.redirects.map((r) => `    "${r.source}": "${r.target}", // ${r.type}`).join('\n')}
  },

  // Autres options de configuration Remix
  appDirectory: "app",
  ignoredRouteFiles: ["**/.*"],
  watchPaths: ["./public"]
};
`;
      await fs.writeFile(this.config.remixConfigPath, remixConfig, 'utf-8');
      this.context.logger.info(
        `Nouvelle configuration Remix générée: ${this.config.remixConfigPath}`
      );
    } else {
      // Mettre à jour la configuration existante
      let content = await fs.readFile(this.config.remixConfigPath, 'utf-8');
      const redirectsBlock = `  // Redirections migrées depuis .htaccess - ${new Date().toISOString()}
  redirects: {
${this.redirects.map((r) => `    "${r.source}": "${r.target}", // ${r.type}`).join('\n')}
  },`;

      if (content.includes('redirects:')) {
        // Remplacer le bloc de redirections existant
        content = content.replace(
          /\s*\/\/.*redirections.*\n\s*redirects:\s*{[^}]*},/s,
          '\n' + redirectsBlock
        );
      } else {
        // Ajouter le bloc de redirections après module.exports = {
        content = content.replace('module.exports = {', 'module.exports = {\n' + redirectsBlock);
      }

      await fs.writeFile(this.config.remixConfigPath, content, 'utf-8');
      this.context.logger.info(`Configuration Remix mise à jour: ${this.config.remixConfigPath}`);
    }
  }

  /**
   * Mettre à jour la configuration NestJS avec les redirections
   */
  private async updateNestJSConfig(): Promise<void> {
    if (!this.config.nestJSConfigPath) return;

    // Créer le middleware de redirection pour NestJS
    const nestJSRedirectMiddleware = `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BaseAgent, BusinessAgent } from '../core/interfaces/BaseAgent';


/**
 * Middleware de redirection généré automatiquement 
 * à partir des règles .htaccess
 * 
 * Date de génération: ${new Date().toISOString()}
 */
@Injectable()
export class RedirectionMiddleware implements NestMiddleware {
  // Table de correspondance des redirections
  private redirects: Record<string, { target: string; type: number }> = {
${this.redirects
  .map((r) => `    "${r.source}": { target: "${r.target}", type: ${r.type} },`)
  .join('\n')}
  };

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    
    // Vérifier si cette URL doit être redirigée
    if (this.redirects[path]) {
      const { target, type } = this.redirects[path];
      return res.redirect(type, target);
    }
    
    // Vérifier les wildcards et les patterns plus complexes
    for (const [source, redirect] of Object.entries(this.redirects)) {
      if (source.includes('*')) {
        const regex = new RegExp(source.replace(/\*/g, '.*'));
        if (regex.test(path)) {
          let targetUrl = redirect.target;
          
          // Remplacer les références de capture $1, $2, etc.
          if (targetUrl.includes('$')) {
            const matches = path.match(regex);
            if (matches) {
              for (let i = 1; i < matches.length; i++) {
                targetUrl = targetUrl.replace(new RegExp('\\$' + i, 'g'), matches[i]);
              }
            }
          }
          
          return res.redirect(redirect.type, targetUrl);
        }
      }
    }
    
    next();
  }
}
`;

    await fs.ensureDir(path.dirname(this.config.nestJSConfigPath));
    await fs.writeFile(this.config.nestJSConfigPath, nestJSRedirectMiddleware, 'utf-8');
    this.context.logger.info(
      `Middleware de redirection NestJS généré: ${this.config.nestJSConfigPath}`
    );
  }

  /**
   * Valider les redirections en testant quelques-unes
   */
  private async validateRedirects(): Promise<void> {
    this.context.logger.info('Validation des redirections...');

    // Sélectionner un échantillon de redirections à tester
    const samplesToTest = Math.min(10, this.redirects.length);
    const sampleRedirects = this.redirects.slice(0, samplesToTest);

    try {
      // Créer un fichier de test temporaire
      const testFilePath = path.join(path.dirname(this.config.outputJsonPath), 'redirect-test.sh');
      const testContent = `#!/bin/bash
echo "Test de validation des redirections"
echo "=================================="

${sampleRedirects
  .map(
    (r, i) => `
echo "Test ${i + 1}/${samplesToTest}: ${r.source} -> ${r.target} (${r.type})"
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\\n" "http://localhost:3000${r.source}"
`
  )
  .join('\n')}

echo "=================================="
echo "Tests terminés"
`;

      await fs.writeFile(testFilePath, testContent, 'utf-8');
      await fs.chmod(testFilePath, 0o755);

      this.context.logger.info(`Fichier de test des redirections généré: ${testFilePath}`);
      this.context.logger.info(
        "Pour valider les redirections, exécutez ce script lorsque votre serveur Remix est en cours d'exécution."
      );
    } catch (error) {
      this.context.logger.error(
        'Erreur lors de la génération du fichier de test des redirections:',
        error
      );
    }
  }
}

export default SEORedirectMapper;
