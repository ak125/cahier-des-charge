#!/usr/bin/env node

/**
 * Script de génération automatique des fichiers d'audit et création de PR GitHub
 *
 * Utilisation:
 *   1. Automatique via hook post-migration
 *   2. Manuel: node generate-audit.js --file=path/to/migrated/file.ts
 */

const fs = require('fsstructure-agent').promises;
const path = require('pathstructure-agent');
const { execSync } = require('child_processstructure-agent');
const chalk = require('chalkstructure-agent');
const yaml = require('js-yamlstructure-agent');
const { Octokit } = require('@octokit/reststructure-agent');
const { program } = require('commanderstructure-agent');
const parser = require('@typescript-eslint/parserstructure-agent');
const traverse = require('@typescript-eslint/typescript-estreestructure-agent').traverseFast;

// Configuration des arguments en ligne de commande
program
  .option('-f, --file <path>', 'Chemin du fichier migré à auditer')
  .option('-b, --branch <name>', 'Nom de la branche pour la PR', `audit-${Date.now()}`)
  .option('-a, --auto-push', 'Pousser automatiquement et créer la PR', false)
  .option('-c, --config <path>', 'Chemin du fichier de configuration', './config/audit-config.yml')
  .parse(process.argv);

const options = program.opts();

// Fonction principale
async function main() {
  try {
    console.log(chalk.blue("🔍 Génération de fichier d'audit..."));

    // Vérifier les arguments
    if (!options.file) {
      console.error(chalk.red('❌ Erreur: Chemin du fichier requis'));
      console.log(chalk.yellow('Utilisez --file=path/to/file.ts'));
      process.exit(1);
    }

    // Charger la configuration
    const config = await loadConfig(options.config);

    // Vérifier que le fichier existe
    const filePath = path.resolve(options.file);

    try {
      await fs.access(filePath);
    } catch (_error) {
      console.error(chalk.red(`❌ Erreur: Fichier non trouvé: ${filePath}`));
      process.exit(1);
    }

    console.log(chalk.blue(`📄 Analyse du fichier: ${filePath}`));

    // Extraire les métadonnées du fichier
    const metadata = await extractMetadata(filePath, config);

    // Générer le contenu du fichier d'audit
    const auditContent = generateAuditContent(metadata, config);

    // Créer le fichier d'audit
    const auditFilePath = createAuditFilePath(filePath);
    await fs.writeFile(auditFilePath, auditContent, 'utf8');

    console.log(chalk.green(`✅ Fichier d'audit généré: ${auditFilePath}`));

    // Si auto-push est activé, créer la PR
    if (options.autoPush) {
      await createPullRequest(auditFilePath, metadata, config, options.branch);
    } else {
      console.log(chalk.yellow('📝 Pour créer une PR:'));
      console.log(chalk.yellow(`1. git checkout -b ${options.branch}`));
      console.log(chalk.yellow(`2. git add ${auditFilePath}`));
      console.log(chalk.yellow(`3. git commit -m "Add audit file for ${path.basename(filePath)}"`));
      console.log(chalk.yellow(`4. git push -u origin ${options.branch}`));
      console.log(chalk.yellow('5. Créez une PR sur GitHub avec le tag #ai-generated'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Charge la configuration depuis un fichier YAML
 */
async function loadConfig(configPath) {
  try {
    const defaultConfig = {
      project: {
        name: 'Default Project',
        repo: 'organisation/repo',
      },
      extraction: {
        code_patterns: {
          objective: ['// Module:', '/** @module', 'class .* implements .*'],
          sql_models: ['@Entity', 'CREATE TABLE', 'prisma.model'],
        },
      },
      templates: {
        audit: './templates/audit-template.md',
        pr_description: './templates/pr-template.md',
      },
      github: {
        pr_labels: ['documentation', 'ai-generated'],
        default_reviewers: ['tech-lead', 'qa-team'],
      },
    };

    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      const userConfig = yaml.load(configFile);
      return { ...defaultConfig, ...userConfig };
    } catch (_error) {
      console.warn(chalk.yellow(`⚠️ Fichier de configuration non trouvé: ${configPath}`));
      console.warn(chalk.yellow('Utilisation de la configuration par défaut'));
      return defaultConfig;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du chargement de la configuration: ${error.message}`));
    throw error;
  }
}

/**
 * Extrait les métadonnées d'un fichier
 */
async function extractMetadata(filePath, config) {
  try {
    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf8');

    // Analyser le code source
    let ast;
    try {
      ast = parser.parse(content, {
        ecmaVersion: 2020,
        sourceType: 'module',
      });
    } catch (_error) {
      console.warn(
        chalk.yellow(`⚠️ Impossible d'analyser le fichier comme TypeScript, extraction limitée.`)
      );
    }

    // Extraire les informations
    const fileName = path.basename(filePath);
    const moduleName = fileName.replace(/\.[^/.]+$/, '');

    // Objectif du module
    const objective = extractObjective(content, ast, config);

    // Modèle SQL
    const sqlModel = extractSqlModel(content, ast, config);

    // Routes
    const routes = extractRoutes(content, ast, config);

    return {
      fileName,
      moduleName,
      filePath,
      objective,
      sqlModel,
      routes,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'extraction des métadonnées: ${error.message}`));
    throw error;
  }
}

/**
 * Extrait l'objectif du module
 */
function extractObjective(content, ast, config) {
  // Recherche de commentaires de documentation
  const moduleCommentRegex = /\/\*\*[\s\S]*?\*\/|\/\/.*$/gm;
  const comments = content.match(moduleCommentRegex) || [];

  // Recherche de patterns spécifiques dans les commentaires
  for (const pattern of config.extraction.code_patterns.objective) {
    const regex = new RegExp(pattern);
    for (const comment of comments) {
      const match = comment.match(regex);
      if (match) {
        // Nettoyer et retourner la description
        return comment
          .replace(/\/\*\*|\*\/|\/\/|\*/g, '')
          .replace(new RegExp(pattern), '')
          .trim();
      }
    }
  }

  // Si aucun commentaire explicite n'est trouvé, essayer d'extraire du code
  if (ast) {
    let objective = '';

    // Rechercher la classe ou la fonction exportée principale
    traverse(ast, (node) => {
      if (
        (node.type === 'ClassDeclaration' || node.type === 'FunctionDeclaration') &&
        node.exportKind === 'value'
      ) {
        objective = `Module ${node.id.name} - `;

        // Ajouter des détails selon le type
        if (node.type === 'ClassDeclaration') {
          objective += `Classe ${node.implements ? 'implémentant ' : ''} `;
          if (node.implements) {
            objective += node.implements.map((impl) => impl.expression.name).join(', ');
          }
        } else {
          objective += 'Fonction principale du module';
        }
      }
    });

    return objective || `Module ${path.basename(filePath, path.extname(filePath))}`;
  }

  // Par défaut
  return `Module ${path.basename(filePath, path.extname(filePath))}`;
}

/**
 * Extrait le modèle SQL associé
 */
function extractSqlModel(content, _ast, config) {
  // Recherche de définitions SQL ou d'annotations d'entités
  for (const pattern of config.extraction.code_patterns.sql_models) {
    const regex = new RegExp(`${pattern}([\\s\\S]*?)(;|\\})`, 'g');
    const matches = content.matchAll(regex);

    for (const match of matches) {
      if (match?.[0]) {
        return match[0];
      }
    }
  }

  // Recherche de définitions Prisma
  if (content.includes('prisma.')) {
    // Rechercher des méthodes prisma qui indiquent les modèles utilisés
    const prismaModelRegex = /prisma\.([a-zA-Z]+)\./g;
    const models = new Set();
    let match;

    while ((match = prismaModelRegex.exec(content)) !== null) {
      models.add(match[1]);
    }

    if (models.size > 0) {
      return `// Modèles Prisma utilisés:\n// - ${Array.from(models).join('\n// - ')}`;
    }
  }

  return '-- Aucun modèle SQL explicite détecté';
}

/**
 * Extrait les routes associées
 */
function extractRoutes(content, _ast, _config) {
  const routes = [];

  // Recherche de décorateurs de route (NestJS/Express style)
  const routeRegex = /@(Get|Post|Put|Delete|Patch)\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      endpoint: match[2],
      description: 'Endpoint extrait du code',
      author: 'AI',
    });
  }

  // Rechercher les définitions de routes Express
  const expressRouteRegex =
    /\.(get|post|put|delete|patch)\(['"]([^'"]+)['"],\s*(?:async\s*)?\(?([^)]*)\)?\s*=>/g;

  while ((match = expressRouteRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      endpoint: match[2],
      description: 'Route Express',
      author: 'AI',
    });
  }

  return routes;
}

/**
 * Génère le contenu du fichier d'audit
 */
function generateAuditContent(metadata, _config) {
  const { moduleName, objective, sqlModel, routes } = metadata;

  let content = `# Audit: ${moduleName}\n\n`;

  // Objectif du module
  content += `## Objectif du module\n${objective || 'À compléter'}\n\n`;

  // Modèle SQL associé
  content += `## Modèle SQL associé\n\`\`\`sql\n${sqlModel || '-- À compléter'}\n\`\`\`\n\n`;

  // Routes associées
  content += '## Routes associées\n';
  content += '| Méthode | Endpoint | Description | Auteur |\n';
  content += '|---------|----------|-------------|--------|\n';

  if (routes && routes.length > 0) {
    for (const route of routes) {
      content += `| ${route.method} | ${route.endpoint} | ${route.description} | ${route.author} |\n`;
    }
  } else {
    content += '| - | - | À compléter | - |\n';
  }

  content += '\n';

  // Checklist de validation
  content += '## Checklist de validation\n\n';

  content += '### Validation AI\n';
  content += '- [ ] Tous les endpoints du module original sont couverts\n';
  content += '- [ ] Intégrité référentielle des clés étrangères maintenue\n';
  content += '- [ ] Règles de validation des données implémentées\n';
  content += '- [ ] Gestion des erreurs conforme aux standards\n';
  content += '- [ ] Tests unitaires générés\n\n';

  content += '### Validation humaine requise\n';
  content += '- [ ] Logique métier correctement transposée\n';
  content += '- [ ] Performances acceptables sous charge\n';
  content += '- [ ] Sécurité des endpoints vérifiée\n';
  content += `- [ ] Consistance avec le reste de l'API\n`;
  content += '- [ ] Documentation complète et exacte\n';

  // Information de génération
  content += '\n\n---\n\n';
  content += `> Ce fichier d'audit a été généré automatiquement le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}.\n`;

  return content;
}

/**
 * Crée le chemin du fichier d'audit
 */
function createAuditFilePath(filePath) {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(dir, `${baseName}.audit.md`);
}

/**
 * Crée une Pull Request sur GitHub
 */
async function createPullRequest(auditFilePath, metadata, config, branchName) {
  try {
    console.log(chalk.blue("🔄 Création d'une Pull Request GitHub..."));

    // Vérifier le token GitHub
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error(
        chalk.red("❌ Erreur: Token GitHub non trouvé dans les variables d'environnement")
      );
      console.log(chalk.yellow("Définissez GITHUB_TOKEN avant d'exécuter cette commande"));
      return false;
    }

    // Créer une instance Octokit
    const octokit = new Octokit({
      auth: githubToken,
    });

    // Extraire les informations du dépôt
    const repoInfo = config.project.repo.split('/');
    const owner = repoInfo[0];
    const repo = repoInfo[1];

    // Créer une nouvelle branche
    try {
      execSync(`git checkout -b ${branchName}`);
      console.log(chalk.green(`✅ Branche créée: ${branchName}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la création de la branche: ${error.message}`));
      return false;
    }

    // Ajouter le fichier d'audit
    try {
      execSync(`git add ${auditFilePath}`);
      console.log(chalk.green(`✅ Fichier d'audit ajouté: ${auditFilePath}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'ajout du fichier: ${error.message}`));
      return false;
    }

    // Commettre les changements
    try {
      execSync(`git commit -m "Add audit file for ${metadata.moduleName} #ai-generated"`);
      console.log(chalk.green('✅ Commit créé'));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du commit: ${error.message}`));
      return false;
    }

    // Pousser la branche
    try {
      execSync(`git push -u origin ${branchName}`);
      console.log(chalk.green(`✅ Branche poussée: ${branchName}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors du push: ${error.message}`));
      return false;
    }

    // Créer la PR
    try {
      const { data: pullRequest } = await octokit.pulls.create({
        owner,
        repo,
        title: `Audit: ${metadata.moduleName} #ai-generated`,
        head: branchName,
        base: 'main',
        body: `
# Audit automatique: ${metadata.moduleName}

Ce fichier d'audit a été généré automatiquement pour documenter le module migré.

## Contenu de l'audit
- Objectif du module
- Modèle SQL associé
- Routes associées
- Checklist de validation (IA + humaine)

## À faire
- [ ] Réviser le contenu de l'audit
- [ ] Compléter les informations manquantes
- [ ] Valider les checkpoints
- [ ] Approuver ou demander des modifications

> Généré automatiquement. Tag: #ai-generated
`,
      });

      console.log(chalk.green(`✅ Pull Request créée: ${pullRequest.html_url}`));

      // Ajouter des labels
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pullRequest.number,
        labels: config.github.pr_labels,
      });

      console.log(chalk.green(`✅ Labels ajoutés: ${config.github.pr_labels.join(', ')}`));

      // Ajouter des reviewers
      if (config.github.default_reviewers.length > 0) {
        await octokit.pulls.requestReviewers({
          owner,
          repo,
          pull_number: pullRequest.number,
          reviewers: config.github.default_reviewers,
        });

        console.log(
          chalk.green(`✅ Reviewers assignés: ${config.github.default_reviewers.join(', ')}`)
        );
      }

      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la création de la PR: ${error.message}`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la création de la PR: ${error.message}`));
    return false;
  }
}

// Exécuter le script
main();
