#!/usr/bin/env node

/**
 * Gestionnaire de versions intelligent pour le cahier des charges
 *
 * Ce script analyse les changements dans le cahier des charges et crée
 * automatiquement des versions archivées avec horodatage selon des règles
 * configurables.
 */

const fs = require('fsstructure-agent').promises;
const path = require('pathstructure-agent');
const { execSync } = require('child_processstructure-agent');
const crypto = require('cryptostructure-agent');
const chalk = require('chalkstructure-agent');
const yaml = require('js-yamlstructure-agent');
const semver = require('semverstructure-agent');
const glob = require('globstructure-agent');
const { program } = require('commanderstructure-agent');

// Configuration
const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');
const ARCHIVES_DIR = path.join(process.cwd(), 'archives', 'versions');
const CONFIG_PATH = path.join(process.cwd(), 'config', 'versioning.yml');
const INDEX_PATH = path.join(process.cwd(), 'archives', 'version-index.json');

// Options par défaut
const DEFAULT_CONFIG = {
  thresholds: {
    lines_changed_percentage: 5,
    files_changed_percentage: 10,
    min_changes_for_version: 50,
  },
  versioning: {
    auto_increment: true,
    semantic_analysis: true,
  },
  triggers: {
    scheduled: true,
    git_commit: true,
    explicit: true,
  },
  retention: {
    all_versions: '7 years',
    major_versions: 'indefinite',
    daily_versions: '30 days',
  },
};

// Configurer les options de ligne de commande
program
  .option('-f, --force', "Forcer la création d'une version même sans changements suffisants")
  .option('-m, --message <message>', 'Message associé à la version')
  .option(
    '-i, --increment <type>',
    "Type d'incrémentation de version (patch, minor, major)",
    'auto'
  )
  .option('-t, --trigger <trigger>', 'Déclencheur de la version (manual, scheduled, git)', 'manual')
  .option('-d, --dry-run', 'Simuler la création sans réellement créer la version')
  .parse(process.argv);

const options = program.opts();

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(chalk.blue('🔄 Gestionnaire de versions du cahier des charges'));

    // Vérifier que le répertoire du cahier des charges existe
    await verifyDirectories();

    // Charger la configuration
    const config = await loadConfig();

    // Analyser les changements
    const changeAnalysis = await analyzeChanges(config);

    // Déterminer si une nouvelle version doit être créée
    if (shouldCreateVersion(changeAnalysis, config, options)) {
      // Générer les détails de la version
      const versionDetails = await generateVersionDetails(changeAnalysis, config, options);

      // Créer la version
      if (!options.dryRun) {
        const versionId = await createVersionSnapshot(versionDetails);
        console.log(chalk.green(`✅ Nouvelle version créée: ${versionId}`));

        // Mettre à jour l'index des versions
        await updateVersionIndex(versionId, versionDetails);

        // Générer le changelog
        await generateChangelog(versionId, versionDetails);

        // Afficher un résumé
        displayVersionSummary(versionId, versionDetails);
      } else {
        console.log(chalk.yellow("⚠️ Mode simulation: aucune version n'a été créée"));
        console.log(chalk.yellow('La version aurait été:'));
        displayVersionSummary(
          `CDC-${new Date().toISOString().replace(/:/g, '')}-${versionDetails.version}-xxxxxx`,
          versionDetails
        );
      }
    } else {
      console.log(chalk.yellow('ℹ️ Pas assez de changements pour justifier une nouvelle version'));
      console.log(chalk.yellow(`Utilisez --force pour forcer la création d'une version`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Vérifie que les répertoires nécessaires existent
 */
async function verifyDirectories() {
  try {
    // Vérifier que le répertoire du cahier des charges existe
    await fs.access(CDC_DIR);

    // Créer le répertoire d'archives s'il n'existe pas
    await fs.mkdir(ARCHIVES_DIR, { recursive: true });

    // Créer le répertoire parent de l'index s'il n'existe pas
    await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
  } catch (error) {
    throw new Error(`Erreur lors de la vérification des répertoires: ${error.message}`);
  }
}

/**
 * Charge la configuration du versionnement
 */
async function loadConfig() {
  try {
    // Vérifier si le fichier de configuration existe
    try {
      await fs.access(CONFIG_PATH);
    } catch (_error) {
      console.log(chalk.yellow(`⚠️ Fichier de configuration non trouvé: ${CONFIG_PATH}`));
      console.log(chalk.yellow("Création d'un fichier de configuration par défaut..."));

      // Créer le répertoire de configuration s'il n'existe pas
      await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });

      // Écrire la configuration par défaut
      await fs.writeFile(CONFIG_PATH, yaml.dump(DEFAULT_CONFIG, { indent: 2 }), 'utf8');

      console.log(chalk.green(`✅ Fichier de configuration créé: ${CONFIG_PATH}`));
    }

    // Charger la configuration
    const configFile = await fs.readFile(CONFIG_PATH, 'utf8');
    const config = yaml.load(configFile);

    // Fusionner avec les valeurs par défaut pour les propriétés manquantes
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du chargement de la configuration: ${error.message}`));
    return DEFAULT_CONFIG;
  }
}

/**
 * Analyse les changements dans le cahier des charges
 */
async function analyzeChanges(config) {
  console.log(chalk.blue('🔍 Analyse des changements...'));

  let gitAvailable = false;

  try {
    // Vérifier si Git est disponible et initialisé
    execSync('git status', { stdio: 'ignore' });
    gitAvailable = true;
  } catch (_error) {
    console.log(chalk.yellow("⚠️ Git n'est pas disponible ou le répertoire n'est pas un dépôt Git"));
    console.log(chalk.yellow('Les analyses basées sur Git seront désactivées'));
  }

  // Obtenir les fichiers actuels du cahier des charges
  const cdcFiles = await getCDCFiles();

  // Si Git est disponible, utiliser Git pour l'analyse des changements
  if (gitAvailable) {
    return await analyzeGitChanges(cdcFiles, config);
  }
  // Sinon, utiliser une méthode basée sur les checksums
  return await analyzeChecksumChanges(cdcFiles, config);
}

/**
 * Obtient la liste des fichiers du cahier des charges
 */
async function getCDCFiles() {
  return new Promise((resolve, reject) => {
    glob(`${CDC_DIR}/**/*.md`, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map((file) => path.relative(process.cwd(), file)));
      }
    });
  });
}

/**
 * Analyse les changements en utilisant Git
 */
async function analyzeGitChanges(cdcFiles, config) {
  try {
    // Obtenir le dernier commit touchant au cahier des charges
    const _lastCommitHash = execSync(`git log -1 --format="%H" -- ${CDC_DIR}`, {
      encoding: 'utf8',
    }).trim();

    // Obtenir la dernière version dans l'index
    const lastVersion = await getLastVersion();

    // Obtenir les statistiques de changement depuis le dernier commit ou la dernière version
    let sinceRef = lastVersion ? lastVersion.hash : '';
    if (!sinceRef) {
      // Si pas de référence, utiliser les 10 derniers commits
      sinceRef = execSync(`git log -10 --format="%H" | tail -1`, { encoding: 'utf8' }).trim();
    }

    const stats = {
      files_changed: 0,
      lines_added: 0,
      lines_deleted: 0,
      total_files: cdcFiles.length,
    };

    if (sinceRef) {
      // Calculer les différences entre le commit actuel et la référence
      const diffOutput = execSync(`git diff --numstat ${sinceRef} HEAD -- ${CDC_DIR}`, {
        encoding: 'utf8',
      });

      // Analyser la sortie du diff
      const lines = diffOutput.trim().split('\n').filter(Boolean);
      stats.files_changed = lines.length;

      for (const line of lines) {
        const [added, deleted] = line.split('\t');
        stats.lines_added += parseInt(added, 10) || 0;
        stats.lines_deleted += parseInt(deleted, 10) || 0;
      }
    } else {
      // Si pas de référence, considérer tous les fichiers comme modifiés
      stats.files_changed = cdcFiles.length;

      // Calculer le nombre de lignes total
      let totalLines = 0;
      for (const file of cdcFiles) {
        const content = await fs.readFile(file, 'utf8');
        totalLines += content.split('\n').length;
      }

      stats.lines_added = totalLines;
      stats.lines_deleted = 0;
    }

    // Calculer les pourcentages
    stats.files_changed_percentage = (stats.files_changed / stats.total_files) * 100;
    stats.lines_changed = stats.lines_added + stats.lines_deleted;

    // Analyse sémantique si activée
    if (config.versioning.semantic_analysis) {
      stats.semanticAnalysis = analyzeSemanticChanges(cdcFiles, sinceRef);
    }

    // Récupérer les commits concernés
    stats.relatedCommits = getRelatedCommits(sinceRef);

    return stats;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse Git: ${error.message}`));
    throw error;
  }
}

/**
 * Analyse les changements en utilisant des checksums
 */
async function analyzeChecksumChanges(cdcFiles, _config) {
  try {
    // Charger l'index des versions pour trouver la dernière version
    const lastVersion = await getLastVersion();

    const stats = {
      files_changed: 0,
      lines_added: 0,
      lines_deleted: 0,
      total_files: cdcFiles.length,
    };

    // Si aucune version précédente n'existe, considérer tous les fichiers comme nouveaux
    if (!lastVersion) {
      stats.files_changed = cdcFiles.length;

      let totalLines = 0;
      for (const file of cdcFiles) {
        const content = await fs.readFile(file, 'utf8');
        totalLines += content.split('\n').length;
      }

      stats.lines_added = totalLines;

      // Calculer les pourcentages
      stats.files_changed_percentage = 100;
      stats.lines_changed = stats.lines_added;

      return stats;
    }

    // Sinon, charger les checksums de la dernière version
    const lastVersionDir = path.join(ARCHIVES_DIR, lastVersion.id);

    // Pour chaque fichier actuel, comparer avec la version archivée
    for (const file of cdcFiles) {
      const relativePath = path.relative(process.cwd(), file);
      const archivedPath = path.join(lastVersionDir, relativePath);

      try {
        // Lire le contenu actuel
        const currentContent = await fs.readFile(file, 'utf8');
        const currentLines = currentContent.split('\n');

        // Essayer de lire le contenu archivé
        try {
          const archivedContent = await fs.readFile(archivedPath, 'utf8');
          const archivedLines = archivedContent.split('\n');

          // Si les contenus sont différents, compter comme un fichier modifié
          if (currentContent !== archivedContent) {
            stats.files_changed++;

            // Calculer les lignes ajoutées et supprimées (simpliste)
            const addedLines = Math.max(0, currentLines.length - archivedLines.length);
            const deletedLines = Math.max(0, archivedLines.length - currentLines.length);

            stats.lines_added += addedLines;
            stats.lines_deleted += deletedLines;
          }
        } catch (_error) {
          // Le fichier n'existe pas dans la version précédente, c'est un nouveau fichier
          stats.files_changed++;
          stats.lines_added += currentLines.length;
        }
      } catch (error) {
        console.error(
          chalk.red(`❌ Erreur lors de la lecture du fichier ${file}: ${error.message}`)
        );
      }
    }

    // Calculer les pourcentages
    stats.files_changed_percentage = (stats.files_changed / stats.total_files) * 100;
    stats.lines_changed = stats.lines_added + stats.lines_deleted;

    return stats;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'analyse des checksums: ${error.message}`));
    throw error;
  }
}

/**
 * Analyse sémantique des changements
 */
function analyzeSemanticChanges(_cdcFiles, sinceRef) {
  // Version simplifiée - dans un cas réel, cela impliquerait une analyse de texte plus sophistiquée

  try {
    // Liste des termes/patterns indiquant des changements significatifs
    const majorPatterns = [
      'BREAKING CHANGE',
      'refonte complète',
      'nouvelle architecture',
      'changement majeur',
    ];

    const minorPatterns = ['nouvelle fonctionnalité', 'ajout de', 'amélioration de'];

    const diffOutput = execSync(`git diff ${sinceRef} HEAD -- ${CDC_DIR}`, { encoding: 'utf8' });

    // Analyser le texte pour détecter les patterns
    const hasMajorChanges = majorPatterns.some((pattern) =>
      diffOutput.toLowerCase().includes(pattern.toLowerCase())
    );

    const hasMinorChanges = minorPatterns.some((pattern) =>
      diffOutput.toLowerCase().includes(pattern.toLowerCase())
    );

    return {
      impact: hasMajorChanges ? 'major' : hasMinorChanges ? 'minor' : 'patch',
      architectural: diffOutput.toLowerCase().includes('architecture'),
      functional:
        diffOutput.toLowerCase().includes('fonctionnel') ||
        diffOutput.toLowerCase().includes('exigence'),
      technical:
        diffOutput.toLowerCase().includes('technique') ||
        diffOutput.toLowerCase().includes('technologie'),
      editorial: !hasMajorChanges && !hasMinorChanges,
    };
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Analyse sémantique non disponible: ${error.message}`));
    return {
      impact: 'patch',
      architectural: false,
      functional: false,
      technical: false,
      editorial: true,
    };
  }
}

/**
 * Récupère les commits liés aux changements
 */
function getRelatedCommits(sinceRef) {
  try {
    const commitData = execSync(
      `git log ${sinceRef}..HEAD --format="%H|%an|%ae|%at|%s" -- ${CDC_DIR}`,
      { encoding: 'utf8' }
    ).trim();

    if (!commitData) {
      return [];
    }

    return commitData.split('\n').map((line) => {
      const [hash, author, email, timestamp, subject] = line.split('|');
      return {
        hash,
        author,
        email,
        date: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
        subject,
      };
    });
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Récupération des commits impossible: ${error.message}`));
    return [];
  }
}

/**
 * Détermine si une nouvelle version doit être créée
 */
function shouldCreateVersion(analysis, config, options) {
  // Si --force est utilisé, toujours créer une version
  if (options.force) {
    return true;
  }

  // Vérifier les seuils configurés
  const meetsThresholds =
    analysis.files_changed_percentage >= config.thresholds.files_changed_percentage ||
    analysis.lines_changed >= config.thresholds.min_changes_for_version;

  // Si l'analyse sémantique est activée, considérer également l'impact
  if (config.versioning.semantic_analysis && analysis.semanticAnalysis) {
    if (
      analysis.semanticAnalysis.impact === 'major' ||
      analysis.semanticAnalysis.impact === 'minor'
    ) {
      return true;
    }
  }

  return meetsThresholds;
}

/**
 * Génère les détails de la nouvelle version
 */
async function generateVersionDetails(analysis, config, options) {
  // Obtenir la dernière version
  const lastVersion = await getLastVersion();

  // Déterminer la nouvelle version sémantique
  let newVersion;

  if (options.increment !== 'auto') {
    // Utiliser l'incrément spécifié par l'utilisateur
    newVersion = lastVersion ? semver.inc(lastVersion.version, options.increment) : '1.0.0';
  } else if (config.versioning.semantic_analysis && analysis.semanticAnalysis) {
    // Utiliser l'analyse sémantique
    const increment = analysis.semanticAnalysis.impact;
    newVersion = lastVersion ? semver.inc(lastVersion.version, increment) : '1.0.0';
  } else {
    // Incrément par défaut (patch)
    newVersion = lastVersion ? semver.inc(lastVersion.version, 'patch') : '1.0.0';
  }

  // Calculer le hash de la version
  const hash = crypto
    .createHash('md5')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 7);

  // Construire les détails de la version
  return {
    version: newVersion,
    timestamp: new Date().toISOString(),
    hash: hash,
    author: getAuthor(),
    trigger: options.trigger,
    changeVolume: {
      additions: analysis.lines_added,
      deletions: analysis.lines_deleted,
      files_changed: analysis.files_changed,
      total_files: analysis.total_files,
    },
    semanticAnalysis: analysis.semanticAnalysis,
    relatedCommits: analysis.relatedCommits || [],
    commitMessage: options.message || 'Mise à jour du cahier des charges',
  };
}

/**
 * Crée un snapshot de la version
 */
async function createVersionSnapshot(versionDetails) {
  try {
    // Générer l'ID de la version
    const versionId = `CDC-${versionDetails.timestamp.replace(/:/g, '')}-${
      versionDetails.version
    }-${versionDetails.hash}`;

    // Créer le répertoire pour la version
    const versionDir = path.join(ARCHIVES_DIR, versionId);
    await fs.mkdir(versionDir, { recursive: true });

    // Copier tous les fichiers du cahier des charges
    await copyDirectory(CDC_DIR, path.join(versionDir, 'cahier-des-charges'));

    // Enregistrer les métadonnées
    await fs.writeFile(
      path.join(versionDir, 'metadata.json'),
      JSON.stringify(versionDetails, null, 2),
      'utf8'
    );

    return versionId;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la création du snapshot: ${error.message}`));
    throw error;
  }
}

/**
 * Copie un répertoire de façon récursive
 */
async function copyDirectory(source, destination) {
  // Créer le répertoire de destination
  await fs.mkdir(destination, { recursive: true });

  // Lire le contenu du répertoire source
  const entries = await fs.readdir(source, { withFileTypes: true });

  // Copier chaque entrée
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Copier récursivement le sous-répertoire
      await copyDirectory(sourcePath, destPath);
    } else {
      // Copier le fichier
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

/**
 * Met à jour l'index des versions
 */
async function updateVersionIndex(versionId, versionDetails) {
  try {
    // Charger l'index existant ou créer un nouveau
    let index;
    try {
      const indexContent = await fs.readFile(INDEX_PATH, 'utf8');
      index = JSON.parse(indexContent);
    } catch (_error) {
      index = { versions: [] };
    }

    // Ajouter la nouvelle version
    index.versions.push({
      id: versionId,
      version: versionDetails.version,
      timestamp: versionDetails.timestamp,
      hash: versionDetails.hash,
      trigger: versionDetails.trigger,
      author: versionDetails.author,
      commitMessage: versionDetails.commitMessage,
    });

    // Trier par date (la plus récente en premier)
    index.versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Enregistrer l'index
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');

    console.log(chalk.green('✅ Index des versions mis à jour'));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la mise à jour de l'index: ${error.message}`));
    throw error;
  }
}

/**
 * Génère un changelog pour la version
 */
async function generateChangelog(versionId, versionDetails) {
  try {
    const changelogPath = path.join(ARCHIVES_DIR, versionId, 'CHANGELOG.md');

    // Construire le contenu du changelog
    let changelog = `# Changelog pour la version ${versionDetails.version}\n\n`;
    changelog += `Date: ${new Date(versionDetails.timestamp).toLocaleString()}\n\n`;

    // Ajouter les informations de changement
    changelog += '## Résumé des changements\n\n';
    changelog += `- Fichiers modifiés: ${versionDetails.changeVolume.files_changed}/${versionDetails.changeVolume.total_files}\n`;
    changelog += `- Lignes ajoutées: ${versionDetails.changeVolume.additions}\n`;
    changelog += `- Lignes supprimées: ${versionDetails.changeVolume.deletions}\n\n`;

    // Ajouter l'analyse sémantique si disponible
    if (versionDetails.semanticAnalysis) {
      changelog += `## Analyse d'impact\n\n`;
      changelog += `- Type de changement: ${versionDetails.semanticAnalysis.impact.toUpperCase()}\n`;
      changelog += `- Changement architectural: ${
        versionDetails.semanticAnalysis.architectural ? 'Oui' : 'Non'
      }\n`;
      changelog += `- Changement fonctionnel: ${
        versionDetails.semanticAnalysis.functional ? 'Oui' : 'Non'
      }\n`;
      changelog += `- Changement technique: ${
        versionDetails.semanticAnalysis.technical ? 'Oui' : 'Non'
      }\n`;
      changelog += `- Changement éditorial: ${
        versionDetails.semanticAnalysis.editorial ? 'Oui' : 'Non'
      }\n\n`;
    }

    // Ajouter les commits liés
    if (versionDetails.relatedCommits && versionDetails.relatedCommits.length > 0) {
      changelog += '## Commits associés\n\n';

      for (const commit of versionDetails.relatedCommits) {
        changelog += `- ${commit.subject} (${commit.hash.substring(0, 7)})\n`;
        changelog += `  _par ${commit.author} le ${new Date(commit.date).toLocaleString()}_\n\n`;
      }
    }

    // Ajouter le message de commit
    if (versionDetails.commitMessage) {
      changelog += `## Message\n\n${versionDetails.commitMessage}\n`;
    }

    // Enregistrer le changelog
    await fs.writeFile(changelogPath, changelog, 'utf8');

    console.log(chalk.green(`✅ Changelog généré: ${changelogPath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération du changelog: ${error.message}`));
    throw error;
  }
}

/**
 * Affiche un résumé de la version créée
 */
function displayVersionSummary(versionId, versionDetails) {
  console.log(chalk.blue('\n📊 Résumé de la version'));
  console.log(chalk.blue('─────────────────────────────────────'));
  console.log(`ID: ${chalk.green(versionId)}`);
  console.log(`Version: ${chalk.green(versionDetails.version)}`);
  console.log(`Date: ${chalk.green(new Date(versionDetails.timestamp).toLocaleString())}`);
  console.log(`Auteur: ${chalk.green(versionDetails.author)}`);
  console.log(`Déclencheur: ${chalk.green(versionDetails.trigger)}`);
  console.log(`Message: ${chalk.green(versionDetails.commitMessage)}`);
  console.log(chalk.blue('─────────────────────────────────────'));
  console.log(
    `Changements: ${chalk.yellow(
      `${versionDetails.changeVolume.additions} ajouts, ${versionDetails.changeVolume.deletions} suppressions`
    )}`
  );
  console.log(
    `Fichiers: ${chalk.yellow(
      `${versionDetails.changeVolume.files_changed} modifiés sur ${versionDetails.changeVolume.total_files}`
    )}`
  );

  if (versionDetails.semanticAnalysis) {
    const impactColor =
      versionDetails.semanticAnalysis.impact === 'major'
        ? chalk.red
        : versionDetails.semanticAnalysis.impact === 'minor'
          ? chalk.yellow
          : chalk.green;

    console.log(`Impact: ${impactColor(versionDetails.semanticAnalysis.impact.toUpperCase())}`);
  }

  console.log(chalk.blue('─────────────────────────────────────\n'));
}

/**
 * Obtient la dernière version
 */
async function getLastVersion() {
  try {
    const indexContent = await fs.readFile(INDEX_PATH, 'utf8');
    const index = JSON.parse(indexContent);

    if (index.versions && index.versions.length > 0) {
      return index.versions[0]; // L'index est trié par date
    }

    return null;
  } catch (_error) {
    // Si le fichier n'existe pas ou ne peut pas être lu, retourner null
    return null;
  }
}

/**
 * Obtient l'auteur actuel (depuis Git si possible)
 */
function getAuthor() {
  try {
    const gitUser = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const gitEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();

    return gitUser ? `${gitUser} <${gitEmail}>` : 'Système de versionnement';
  } catch (_error) {
    return 'Système de versionnement';
  }
}

// Exécuter le script
main();
