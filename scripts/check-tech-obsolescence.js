#!/usr/bin/env node

/**
 * Script de vérification des technologies obsolètes dans le cahier des charges
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');
const TECH_DB_FILE = path.join(process.cwd(), 'config', 'technology-database.json');
const REPORT_DIR = path.join(process.cwd(), 'logs', 'tech-reports');

// Mapping des technologies connues avec leurs alternatives modernes
const TECH_MAPPING = {
  express: {
    pattern: /\bexpress(?:\.js)?\b/i,
    isCurrent: (version) => version && parseInt(version) >= 5,
    alternatives: ['Fastify', 'NestJS', 'Koa'],
    category: 'framework',
  },
  moment: {
    pattern: /\bmoment(?:\.js)?\b/i,
    isCurrent: () => false, // Moment.js est considéré comme obsolète
    alternatives: ['date-fns', 'Day.js', 'Luxon'],
    category: 'library',
  },
  jquery: {
    pattern: /\bjquery\b/i,
    isCurrent: () => false,
    alternatives: ['Vanilla JS', 'React', 'Vue'],
    category: 'library',
  },
  webpack: {
    pattern: /\bwebpack\b/i,
    isCurrent: (version) => version && parseInt(version) >= 5,
    alternatives: ['Vite', 'Parcel', 'esbuild'],
    category: 'build-tool',
  },
  loopback: {
    pattern: /\bloopback\b/i,
    isCurrent: (version) => version && parseInt(version) >= 4,
    alternatives: ['NestJS', 'Fastify', 'Express 5'],
    category: 'framework',
  },
  // Ajouter d'autres technologies à surveiller
};

// Base de connaissances des technologies
let techDatabase = {};

/**
 * Point d'entrée principal
 */
async function main() {
  try {
    console.log(
      chalk.blue('🔍 Vérification des technologies obsolètes dans le cahier des charges...')
    );

    // Créer le répertoire de rapports s'il n'existe pas
    await fs.mkdir(REPORT_DIR, { recursive: true });

    // Charger la base de données des technologies
    await loadTechDatabase();

    // Analyser tous les fichiers markdown
    const mdFiles = await findMarkdownFiles(CDC_DIR);
    const obsoleteTechs = await scanFilesForObsoleteTech(mdFiles);

    // Générer le rapport
    if (obsoleteTechs.length > 0) {
      const reportPath = await generateReport(obsoleteTechs);
      console.log(chalk.yellow(`⚠️ ${obsoleteTechs.length} technologies obsolètes détectées.`));
      console.log(chalk.yellow(`📊 Rapport généré: ${reportPath}`));

      // Si nous avons des technologies critiques, on retourne une erreur
      const criticalTechs = obsoleteTechs.filter((t) => t.obsolescenceScore >= 75);
      if (criticalTechs.length > 0) {
        console.log(
          chalk.red(`❌ ${criticalTechs.length} technologies critiquement obsolètes détectées!`)
        );
        process.exit(1);
      }
    } else {
      console.log(chalk.green('✅ Aucune technologie obsolète détectée'));
    }

    // Sauvegarder la base de données mise à jour
    await saveTechDatabase();

    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`❌ Erreur: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Charge la base de données des technologies
 */
async function loadTechDatabase() {
  try {
    const data = await fs.readFile(TECH_DB_FILE, 'utf8');
    techDatabase = JSON.parse(data);
  } catch (_error) {
    console.log(
      chalk.yellow("⚠️ Base de données des technologies non trouvée, création d'une nouvelle")
    );
    techDatabase = {
      technologies: {},
      lastUpdated: new Date().toISOString(),
    };

    // Créer le répertoire de config s'il n'existe pas
    await fs.mkdir(path.dirname(TECH_DB_FILE), { recursive: true });
  }
}

/**
 * Sauvegarde la base de données des technologies
 */
async function saveTechDatabase() {
  techDatabase.lastUpdated = new Date().toISOString();
  await fs.writeFile(TECH_DB_FILE, JSON.stringify(techDatabase, null, 2), 'utf8');
}

/**
 * Trouve tous les fichiers markdown récursivement
 */
async function findMarkdownFiles(dir) {
  const files = [];

  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

/**
 * Scanne les fichiers pour détecter des technologies obsolètes
 */
async function scanFilesForObsoleteTech(files) {
  const obsoleteTechs = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(CDC_DIR, file);

    // Analyser le contenu pour les technologies
    for (const [techName, techInfo] of Object.entries(TECH_MAPPING)) {
      const matches = content.match(techInfo.pattern);

      if (matches) {
        // Chercher une version potentielle
        const versionMatch = content.match(new RegExp(`${techName}\\s+v?([0-9]+(?:\\.[0-9]+)*)`));
        const version = versionMatch ? versionMatch[1] : null;

        // Vérifier si la technologie est obsolète
        const isCurrent = techInfo.isCurrent(version);

        if (!isCurrent) {
          // Calculer un score d'obsolescence
          const obsolescenceScore = calculateObsolescenceScore(techName, techInfo);

          obsoleteTechs.push({
            name: techName,
            version: version,
            file: relativePath,
            alternatives: techInfo.alternatives,
            category: techInfo.category,
            obsolescenceScore,
          });

          // Mettre à jour la base de données
          updateTechDatabase(techName, {
            version,
            category: techInfo.category,
            obsolescenceScore,
            lastDetected: new Date().toISOString(),
            files: [relativePath],
          });
        }
      }
    }
  }

  return obsoleteTechs;
}

/**
 * Calcule un score d'obsolescence pour une technologie
 */
function calculateObsolescenceScore(techName, techInfo) {
  // Bases du calcul:
  // 1. Est-ce que la technologie est officiellement obsolète?
  // 2. Depuis quand est-elle considérée obsolète?
  // 3. Y a-t-il des alternatives matures?
  // 4. Est-elle encore maintenue?

  let score = 0;

  // Technologies connues comme obsolètes
  const knownObsoleteScores = {
    jquery: 85,
    moment: 80,
    backbone: 75,
    angularjs: 90,
    grunt: 85,
    bower: 95,
  };

  if (knownObsoleteScores[techName.toLowerCase()]) {
    return knownObsoleteScores[techName.toLowerCase()];
  }

  // Vérifier dans notre base de données
  const techData = techDatabase.technologies[techName];
  if (techData?.obsolescenceScore) {
    // Augmenter légèrement le score à chaque détection (maxium +10)
    return Math.min(techData.obsolescenceScore + 2, techData.obsolescenceScore + 10);
  }

  // Score par défaut basé sur la catégorie et les alternatives
  if (techInfo.alternatives && techInfo.alternatives.length > 2) {
    score += 60; // Beaucoup d'alternatives = probablement obsolète
  } else if (techInfo.alternatives && techInfo.alternatives.length > 0) {
    score += 40; // Quelques alternatives
  } else {
    score += 20; // Pas d'alternative connue
  }

  return score;
}

/**
 * Met à jour la base de données des technologies
 */
function updateTechDatabase(techName, data) {
  if (!techDatabase.technologies[techName]) {
    techDatabase.technologies[techName] = {
      firstDetected: new Date().toISOString(),
      detections: 0,
      files: [],
    };
  }

  // Mettre à jour les données
  techDatabase.technologies[techName] = {
    ...techDatabase.technologies[techName],
    ...data,
    detections: techDatabase.technologies[techName].detections + 1,
  };

  // Ajouter le fichier s'il n'est pas déjà présent
  if (data.files && data.files.length > 0) {
    for (const file of data.files) {
      if (!techDatabase.technologies[techName].files.includes(file)) {
        techDatabase.technologies[techName].files.push(file);
      }
    }
  }
}

/**
 * Génère un rapport des technologies obsolètes
 */
async function generateReport(obsoleteTechs) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `tech-obsolescence-${timestamp}.md`);

  // Trier par score d'obsolescence décroissant
  const sortedTechs = [...obsoleteTechs].sort((a, b) => b.obsolescenceScore - a.obsolescenceScore);

  // Créer le contenu du rapport
  let reportContent = `# Rapport d'obsolescence technologique\n\n`;
  reportContent += `Date: ${new Date().toISOString()}\n\n`;

  reportContent += '## Résumé\n\n';
  reportContent += `- **Technologies détectées**: ${obsoleteTechs.length}\n`;
  reportContent += `- **Niveau critique** (score ≥ 75): ${
    sortedTechs.filter((t) => t.obsolescenceScore >= 75).length
  }\n`;
  reportContent += `- **Niveau préoccupant** (score 50-74): ${
    sortedTechs.filter((t) => t.obsolescenceScore >= 50 && t.obsolescenceScore < 75).length
  }\n`;
  reportContent += `- **Niveau à surveiller** (score < 50): ${
    sortedTechs.filter((t) => t.obsolescenceScore < 50).length
  }\n\n`;

  reportContent += '## Technologies détectées\n\n';
  reportContent += '| Technologie | Version | Score | Catégorie | Alternatives | Fichier |\n';
  reportContent += '|------------|---------|-------|-----------|-------------|--------|\n';

  for (const tech of sortedTechs) {
    const severity =
      tech.obsolescenceScore >= 75 ? '🔴' : tech.obsolescenceScore >= 50 ? '🟠' : '🟡';

    reportContent += `| ${severity} ${tech.name} | ${tech.version || 'N/A'} | ${
      tech.obsolescenceScore
    } | ${tech.category} | ${tech.alternatives.join(', ')} | ${tech.file} |\n`;
  }

  reportContent += '\n## Recommandations\n\n';

  // Recommandations pour les technologies critiques
  const criticalTechs = sortedTechs.filter((t) => t.obsolescenceScore >= 75);
  if (criticalTechs.length > 0) {
    reportContent += '### Actions prioritaires\n\n';

    for (const tech of criticalTechs) {
      reportContent += `- Remplacer **${tech.name}** ${
        tech.version ? `v${tech.version}` : ''
      } par ${tech.alternatives[0]}\n`;
    }

    reportContent += '\n';
  }

  // Recommandations pour les technologies préoccupantes
  const concerningTechs = sortedTechs.filter(
    (t) => t.obsolescenceScore >= 50 && t.obsolescenceScore < 75
  );
  if (concerningTechs.length > 0) {
    reportContent += '### Planification à moyen terme\n\n';

    for (const tech of concerningTechs) {
      reportContent += `- Envisager la migration de **${tech.name}** ${
        tech.version ? `v${tech.version}` : ''
      } vers ${tech.alternatives[0]}\n`;
    }

    reportContent += '\n';
  }

  // Section sur la mise à jour documentaire
  reportContent += '## Mise à jour documentaire\n\n';
  reportContent += 'Pour mettre à jour le cahier des charges avec les technologies modernes:\n\n';
  reportContent += '```bash\n';
  reportContent += '# Pour chaque technologie obsolète, mettre à jour la documentation\n';
  reportContent += `npm run update-tech -- --replace "ancienne-tech" --with "nouvelle-tech" --files "chemin/vers/fichier.md"\n`;
  reportContent += '```\n\n';

  // Écrire le rapport
  await fs.writeFile(reportPath, reportContent, 'utf8');

  return reportPath;
}

// Exécuter le script
main();
