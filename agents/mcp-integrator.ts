#!/usr/bin/env node

/**
 * MCP Integrator Agent
 * 
 * Intègre les résultats du pipeline de migration avec GitHub via MCP
 * Automatise la création de PRs, l'ajout de commentaires, et le suivi des migrations
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import { execSync } from 'child_process';

// Types pour l'intégration MCP
interface MCPConfig {
  token: string;
  repository: string;
  baseBranch: string;
}

interface PRConfig {
  title: string;
  body: string;
  labels: string[];
  reviewers?: string[];
  draft?: boolean;
}

interface FileCommit {
  path: string;
  content: string;
  message: string;
}

// Configuration du CLI
program
  .name('mcp-integrator')
  .description('Integrate migration pipeline with GitHub using MCP')
  .version('1.0.0')
  .option('-f, --file <path>', 'Path to PHP file being migrated (or backlog JSON)')
  .option('-w, --wave <id>', 'Wave ID (for batch migrations)')
  .option('-c, --create-pr', 'Create a Pull Request', false)
  .option('-r, --rollback', 'Rollback a migration wave', false)
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--config <path>', 'Path to MCP config file', './config/mcp-config.json')
  .option('--verbose', 'Enable verbose output');

program.parse();
const options = program.opts();

// Point d'entrée principal
async function main() {
  try {
    console.log('🔗 Starting MCP Integrator...');
    
    // Charger la configuration MCP
    const mcpConfig = loadMCPConfig(options.config);
    
    // Déterminer le mode (fichier unique ou vague)
    if (options.file) {
      await processSingleFile(options.file, mcpConfig);
    } else if (options.wave) {
      await processWave(options.wave, mcpConfig);
    } else {
      throw new Error('Either --file or --wave must be specified');
    }
    
    console.log('✅ MCP integration completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Charge la configuration MCP
 */
function loadMCPConfig(configPath: string): MCPConfig {
  let config: MCPConfig;
  
  // Essayer de charger le fichier de configuration
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    // Utiliser les variables d'environnement ou valeurs par défaut
    config = {
      token: process.env.GITHUB_TOKEN || '',
      repository: process.env.GITHUB_REPOSITORY || '',
      baseBranch: process.env.GITHUB_BASE_BRANCH || 'main'
    };
  }
  
  // Validation de la configuration
  if (!config.token) {
    throw new Error('GitHub token is required. Set it in config file or GITHUB_TOKEN env variable');
  }
  
  if (!config.repository) {
    throw new Error('GitHub repository is required. Set it in config file or GITHUB_REPOSITORY env variable');
  }
  
  return config;
}

/**
 * Traite un seul fichier PHP
 */
async function processSingleFile(filePath: string, mcpConfig: MCPConfig) {
  console.log(`🔍 Processing file: ${filePath}`);
  
  // Déterminer le chemin du fichier de backlog
  const fileBaseName = path.basename(filePath, '.php');
  const isBacklog = filePath.endsWith('.backlog.json');
  
  const backlogPath = isBacklog 
    ? filePath 
    : path.join(options.output, `${fileBaseName}.backlog.json`);
  
  // Vérifier que le fichier existe
  if (!fs.existsSync(backlogPath)) {
    throw new Error(`Backlog file not found: ${backlogPath}`);
  }
  
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  const originalFile = backlog.file || filePath;
  
  console.log(`📋 Loaded backlog for: ${originalFile}`);
  
  // Créer une branche pour la migration
  const branchName = createBranchName(originalFile);
  
  if (options.verbose) {
    console.log(`🌿 Creating branch: ${branchName}`);
  }
  
  // Collecter les fichiers générés à committer
  const filesToCommit = collectGeneratedFiles(backlog);
  
  if (options.verbose) {
    console.log(`📦 Found ${filesToCommit.length} files to commit`);
  }
  
  // Si l'option create-pr est activée, créer une PR
  if (options.createPr && filesToCommit.length > 0) {
    await createPullRequest(branchName, filesToCommit, backlog, mcpConfig);
  } else {
    console.log('ℹ️ Skipping PR creation (--create-pr not specified or no files to commit)');
  }
}

/**
 * Traite une vague de migration complète
 */
async function processWave(waveId: string, mcpConfig: MCPConfig) {
  console.log(`🌊 Processing wave: ${waveId}`);
  
  // Déterminer le chemin du plan de vague
  const wavePlanPath = path.join(options.output, `wave_${waveId}_plan.json`);
  
  // Vérifier que le fichier existe
  if (!fs.existsSync(wavePlanPath)) {
    throw new Error(`Wave plan not found: ${wavePlanPath}`);
  }
  
  const wavePlan = JSON.parse(fs.readFileSync(wavePlanPath, 'utf8'));
  
  if (options.verbose) {
    console.log(`📋 Loaded wave plan with ${wavePlan.files?.length || 0} files`);
  }
  
  // Si l'option rollback est activée, effectuer un rollback
  if (options.rollback) {
    await rollbackWave(waveId, mcpConfig);
    return;
  }
  
  // Créer une branche pour la vague
  const branchName = `migration/wave-${waveId}`;
  
  // Collecter tous les fichiers générés pour cette vague
  const allFiles: FileCommit[] = [];
  
  // Traiter chaque fichier de la vague
  for (const fileInfo of wavePlan.files || []) {
    try {
      // Charger le backlog pour ce fichier
      const backlogPath = path.join(options.output, `${path.basename(fileInfo.path, '.php')}.backlog.json`);
      
      if (fs.existsSync(backlogPath)) {
        const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
        const fileCommits = collectGeneratedFiles(backlog);
        allFiles.push(...fileCommits);
      } else {
        console.warn(`⚠️ Backlog not found for: ${fileInfo.path}`);
      }
    } catch (error) {
      console.error(`❌ Error processing file ${fileInfo.path}:`, error);
      // Continuer avec les autres fichiers
    }
  }
  
  if (options.verbose) {
    console.log(`📦 Found ${allFiles.length} files to commit in wave ${waveId}`);
  }
  
  // Si l'option create-pr est activée, créer une PR pour la vague
  if (options.createPr && allFiles.length > 0) {
    await createPullRequestForWave(branchName, allFiles, wavePlan, mcpConfig);
  } else {
    console.log('ℹ️ Skipping PR creation (--create-pr not specified or no files to commit)');
  }
}

/**
 * Crée un nom de branche à partir du chemin du fichier
 */
function createBranchName(filePath: string): string {
  // Extraire le nom du fichier sans extension
  const fileName = path.basename(filePath, '.php');
  
  // Nettoyer le chemin pour la branche
  const cleanPath = path.dirname(filePath)
    .replace(/^src\//, '')
    .replace(/\//g, '-');
  
  return `migration/${cleanPath}-${fileName}`;
}

/**
 * Collecte les fichiers générés à partir du backlog
 */
function collectGeneratedFiles(backlog: any): FileCommit[] {
  const files: FileCommit[] = [];
  
  // Parcourir les tâches pour trouver les fichiers générés
  for (const task of backlog.tasks || []) {
    if (task.target_file && task.status === 'completed') {
      const filePath = task.target_file;
      
      // Vérifier que le fichier existe
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        files.push({
          path: filePath,
          content,
          message: `feat(migration): ${path.basename(filePath)} from ${path.basename(backlog.file)}`
        });
      }
    }
  }
  
  return files;
}

/**
 * Crée une Pull Request pour un fichier migré
 */
async function createPullRequest(
  branchName: string, 
  files: FileCommit[], 
  backlog: any, 
  mcpConfig: MCPConfig
) {
  console.log(`🚀 Creating pull request for branch: ${branchName}`);
  
  try {
    // Préparer les arguments pour MCP
    const prConfig: PRConfig = {
      title: `[migration] ${backlog.file} → NestJS/Remix`,
      body: generatePRDescription(backlog),
      labels: ['migration', 'automated']
    };
    
    // Ajouter des labels basés sur les tags
    if (backlog.tags) {
      for (const tag of backlog.tags) {
        if (tag === 'seo-critical') {
          prConfig.labels.push('seo-critical');
        } else if (tag === 'prioritaire') {
          prConfig.labels.push('high-priority');
        }
      }
    }
    
    // Exécuter la commande MCP pour créer la PR
    const mcpCommand = buildMCPCommand(
      'create_pull_request',
      {
        repo: mcpConfig.repository,
        base: mcpConfig.baseBranch,
        head: branchName,
        title: prConfig.title,
        body: prConfig.body,
        labels: prConfig.labels
      },
      mcpConfig.token
    );
    
    // Exécuter la commande
    const prResponse = execSync(mcpCommand).toString();
    const prData = JSON.parse(prResponse);
    
    console.log(`✅ Pull request created: ${prData.html_url}`);
    
    // Ajouter un commentaire avec des détails supplémentaires
    if (prData.number) {
      const commentCommand = buildMCPCommand(
        'add_issue_comment',
        {
          repo: mcpConfig.repository,
          issue_number: prData.number,
          body: `## 🤖 Détails de migration automatique\n\nCette PR a été générée par le pipeline de migration IA.\n\n- Date: ${new Date().toISOString()}\n- Agent: mcp-integrator.ts\n- Fichier source: ${backlog.file}\n\n[Voir le backlog complet](link/to/backlog)`
        },
        mcpConfig.token
      );
      
      execSync(commentCommand);
      console.log(`✅ Comment added to PR #${prData.number}`);
    }
    
    return prData;
  } catch (error) {
    console.error('❌ Error creating pull request:', error);
    throw error;
  }
}

/**
 * Crée une Pull Request pour une vague complète
 */
async function createPullRequestForWave(
  branchName: string, 
  files: FileCommit[], 
  wavePlan: any, 
  mcpConfig: MCPConfig
) {
  console.log(`🚀 Creating pull request for wave: ${wavePlan.id || 'unknown'}`);
  
  try {
    // Préparer les arguments pour MCP
    const prConfig: PRConfig = {
      title: `[migration-wave] Wave ${wavePlan.id || 'unknown'}`,
      body: generateWavePRDescription(wavePlan),
      labels: ['migration', 'migration-wave', 'automated']
    };
    
    // Exécuter la commande MCP pour créer la PR
    const mcpCommand = buildMCPCommand(
      'create_pull_request',
      {
        repo: mcpConfig.repository,
        base: mcpConfig.baseBranch,
        head: branchName,
        title: prConfig.title,
        body: prConfig.body,
        labels: prConfig.labels
      },
      mcpConfig.token
    );
    
    // Exécuter la commande
    const prResponse = execSync(mcpCommand).toString();
    const prData = JSON.parse(prResponse);
    
    console.log(`✅ Pull request created: ${prData.html_url}`);
    
    return prData;
  } catch (error) {
    console.error('❌ Error creating pull request for wave:', error);
    throw error;
  }
}

/**
 * Effectue un rollback de vague
 */
async function rollbackWave(waveId: string, mcpConfig: MCPConfig) {
  console.log(`⚠️ Rolling back wave: ${waveId}`);
  
  const branchName = `rollback/wave-${waveId}`;
  
  try {
    // Créer une PR de rollback
    const prConfig: PRConfig = {
      title: `[rollback] Wave ${waveId}`,
      body: `## ⚠️ Rollback de la vague ${waveId}\n\nCe rollback a été généré automatiquement.\n\n**Raison**: Rollback demandé via mcp-integrator.`,
      labels: ['rollback', 'migration', 'automated']
    };
    
    // Exécuter la commande MCP pour créer la PR
    const mcpCommand = buildMCPCommand(
      'create_pull_request',
      {
        repo: mcpConfig.repository,
        base: mcpConfig.baseBranch,
        head: branchName,
        title: prConfig.title,
        body: prConfig.body,
        labels: prConfig.labels
      },
      mcpConfig.token
    );
    
    // Exécuter la commande
    const prResponse = execSync(mcpCommand).toString();
    const prData = JSON.parse(prResponse);
    
    console.log(`✅ Rollback PR created: ${prData.html_url}`);
    
    return prData;
  } catch (error) {
    console.error('❌ Error creating rollback PR:', error);
    throw error;
  }
}

/**
 * Génère la description d'une PR pour un fichier
 */
function generatePRDescription(backlog: any): string {
  return `## 🤖 Migration Automatique

Ce fichier a été migré par le pipeline d'IA.

### 📊 Métriques
- Complexité: ${backlog.complexity_score ? (backlog.complexity_score * 10).toFixed(1) : 'N/A'}/10
- Impact SEO: ${getSEOImpactLabel(backlog.seo_impact)}
- Dépendances: ${backlog.dependency_graph?.imports?.length || 0} fichiers
- Tables SQL: ${backlog.sql_tables?.join(', ') || 'Aucune'}

### 🧪 Tests
- [x] Tests unitaires NestJS
- [x] Tests E2E Remix
- [ ] Validation visuelle

### 📎 Liens
- [Audit détaillé](link/to/audit.md)
- [Plan de backlog](link/to/backlog.json)
`;
}

/**
 * Génère la description d'une PR pour une vague
 */
function generateWavePRDescription(wavePlan: any): string {
  return `## 🌊 Migration Wave ${wavePlan.id || 'unknown'}

Cette vague de migration a été générée automatiquement par le pipeline d'IA.

### 📊 Contenu
- Nombre de fichiers: ${wavePlan.files?.length || 0}
- Module principal: ${wavePlan.name || 'N/A'}
- Impact métier: ${wavePlan.business_value || 'N/A'}

### 📋 Fichiers migrés
${(wavePlan.files || []).map(f => `- ${f.path}`).join('\n')}

### 🔗 Plan de vague
[Voir le plan complet](link/to/wave/plan)
`;
}

/**
 * Obtient le label d'impact SEO
 */
function getSEOImpactLabel(seoImpact: number): string {
  if (!seoImpact && seoImpact !== 0) return 'N/A';
  
  if (seoImpact >= 0.7) return 'High';
  if (seoImpact >= 0.4) return 'Medium';
  return 'Low';
}

/**
 * Construit une commande MCP avec authentification
 */
function buildMCPCommand(
  action: string,
  params: Record<string, any>,
  token: string
): string {
  // Échapper les doubles guillemets dans les paramètres
  const safeParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value.replace(/"/g, '\\"');
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  // Convertir les paramètres en JSON
  const paramsJson = JSON.stringify(safeParams);
  
  // Construire la commande
  return `GITHUB_PERSONAL_ACCESS_TOKEN=${token} docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server ${action} '${paramsJson}'`;
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
