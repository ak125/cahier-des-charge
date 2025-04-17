#!/usr/bin/env ts-node
/**
 * Script de démarrage du pipeline SEO-MCP
 * 
 * Ce script configure et exécute le contrôleur SEO-MCP qui orchestre
 * l'ensemble du processus de migration SEO avec traçabilité
 */

import { createSEOMCPController } from '../agents/seo-mcp-controller';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import { Command } from 'commander';

// Charger les variables d'environnement
dotenv.config();

// Configuration de la ligne de commande
const program = new Command();

program
  .name('run-seo-mcp')
  .description('Exécute le pipeline SEO-MCP pour la migration PHP vers Remix')
  .version('1.0.0')
  .option('-p, --php-dir <dir>', 'Répertoire des fichiers PHP source', './legacy')
  .option('-r, --remix-dir <dir>', 'Répertoire des routes Remix', './apps/frontend/app/routes')
  .option('-o, --output-dir <dir>', 'Répertoire de sortie pour les rapports', './reports/seo')
  .option('-m, --meta-dir <dir>', 'Répertoire pour les fichiers meta.ts', './apps/frontend/app/routes')
  .option('-b, --base-url <url>', 'URL de base du site', 'https://monsite.com')
  .option('-s, --min-score <score>', 'Score SEO minimal requis', '70')
  .option('-a, --auto-fix', 'Correction automatique des problèmes', false)
  .option('-c, --no-canonicals', 'Désactiver la validation des canonicals', false)
  .option('-d, --no-redirects', 'Désactiver la validation des redirections', false)
  .option('-h, --htaccess <paths>', 'Chemins des fichiers .htaccess séparés par des virgules', './legacy/.htaccess')
  .option('-n, --nestjs-config <path>', 'Chemin du fichier de configuration NestJS pour les redirections')
  .option('--config <path>', 'Fichier de configuration JSON', './config/seo-mcp.json');

program.parse(process.argv);

async function main() {
  try {
    console.log('🔧 Configuration du pipeline SEO-MCP...');
    
    // Obtenir les options de la ligne de commande
    const options = program.opts();
    
    // Charger la configuration depuis le fichier JSON si spécifié
    let config: any = {};
    if (options.config && await fs.pathExists(options.config)) {
      console.log(`📄 Chargement de la configuration depuis ${options.config}`);
      config = await fs.readJson(options.config);
    }
    
    // Fusionner avec les options de ligne de commande
    const finalConfig = {
      // Répertoires de travail
      phpSourceDir: path.resolve(options.phpDir || config.phpSourceDir || './legacy'),
      remixTargetDir: path.resolve(options.remixDir || config.remixTargetDir || './apps/frontend/app/routes'),
      outputDir: path.resolve(options.outputDir || config.outputDir || './reports/seo'),
      metaDir: path.resolve(options.metaDir || config.metaDir || './apps/frontend/app/routes'),
      
      // Options SEO
      baseUrl: options.baseUrl || config.baseUrl || 'https://monsite.com',
      minSeoScore: parseInt(options.minScore || config.minSeoScore || '70', 10),
      autoFix: options.autoFix !== undefined ? options.autoFix : (config.autoFix || false),
      validateCanonicals: options.canonicals !== undefined ? options.canonicals : (config.validateCanonicals !== false),
      validateRedirects: options.redirects !== undefined ? options.redirects : (config.validateRedirects !== false),
      
      // Sources de métadonnées
      extractFromPhp: config.extractFromPhp !== false,
      extractFromDb: config.extractFromDb || false,
      extractFromHtaccess: config.extractFromHtaccess || true,
      
      // Options htaccess
      htaccessPaths: (options.htaccess || config.htaccessPaths || './legacy/.htaccess')
        .split(',')
        .map((p: string) => path.resolve(p.trim())),
      remixConfigPath: path.resolve(config.remixConfigPath || './apps/frontend/remix.config.js'),
      nestJSConfigPath: options.nestjsConfig ? path.resolve(options.nestjsConfig) : 
        (config.nestJSConfigPath ? path.resolve(config.nestJSConfigPath) : undefined),
      
      // Configuration Supabase
      supabaseUrl: process.env.SUPABASE_URL || config.supabaseUrl,
      supabaseKey: process.env.SUPABASE_KEY || config.supabaseKey,
    };
    
    // Vérifier les configurations requises
    const missingConfigs = [];
    if (!finalConfig.supabaseUrl) missingConfigs.push('SUPABASE_URL');
    if (!finalConfig.supabaseKey) missingConfigs.push('SUPABASE_KEY');
    
    if (missingConfigs.length > 0) {
      console.warn(`⚠️ Attention: Les configurations suivantes sont manquantes: ${missingConfigs.join(', ')}`);
      console.warn('La traçabilité via Supabase ne sera pas activée.');
    }
    
    // Créer les répertoires si nécessaire
    await fs.ensureDir(finalConfig.outputDir);
    await fs.ensureDir(finalConfig.metaDir);
    
    // Vérifier l'existence des répertoires source
    if (!await fs.pathExists(finalConfig.phpSourceDir)) {
      console.warn(`⚠️ Le répertoire PHP source n'existe pas: ${finalConfig.phpSourceDir}`);
    }
    
    if (!await fs.pathExists(finalConfig.remixTargetDir)) {
      console.warn(`⚠️ Le répertoire Remix cible n'existe pas: ${finalConfig.remixTargetDir}`);
    }
    
    // Afficher la configuration
    console.log('📋 Configuration finalisée:');
    console.log('- PHP source:', finalConfig.phpSourceDir);
    console.log('- Remix cible:', finalConfig.remixTargetDir);
    console.log('- Sortie:', finalConfig.outputDir);
    console.log('- Score SEO minimum:', finalConfig.minSeoScore);
    console.log('- Auto-correction:', finalConfig.autoFix ? 'Activée' : 'Désactivée');
    console.log('- Validation canonicals:', finalConfig.validateCanonicals ? 'Activée' : 'Désactivée');
    console.log('- Validation redirections:', finalConfig.validateRedirects ? 'Activée' : 'Désactivée');
    console.log('- Fichiers .htaccess:', finalConfig.htaccessPaths.join(', '));
    console.log('- Traçabilité:', missingConfigs.length === 0 ? 'Activée' : 'Désactivée');
    
    // Créer et exécuter le contrôleur
    const controller = createSEOMCPController(finalConfig);
    
    console.log('\n🚀 Démarrage du pipeline SEO-MCP...\n');
    
    const startTime = Date.now();
    const result = await controller.runPipeline();
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n✅ Pipeline SEO-MCP terminé en', duration, 'secondes');
    console.log('- Statut:', result.success ? '✅ Succès' : '❌ Échec');
    console.log('- Routes traitées:', result.routesProcessed);
    console.log('- Score SEO moyen:', result.averageSeoScore.toFixed(2), '/ 100');
    console.log('- Problèmes corrigés:', result.routesFixed);
    console.log('- Rapport généré dans:', path.join(finalConfig.outputDir, 'seo-mcp-report.md'));
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Erreurs rencontrées:');
      result.errors.slice(0, 5).forEach(error => {
        console.log(`- ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`... et ${result.errors.length - 5} autres erreurs`);
      }
      
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

main();