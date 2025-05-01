/**
 * analyze-duplicates.js - Script pour analyser les duplications de code dans le projet
 * Version: 2.0 - Implémentation JavaScript pour intégration avec NX
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const MIN_SIZE = 100; // Taille minimale des fichiers à analyser (en octets)
const MIN_SIMILARITY = 80; // Pourcentage minimal de similarité
const EXCLUDE_DIRS = /node_modules|dist|\.git|\.cache|coverage|build|backups|logs/;
const EXCLUDE_FILES = /\.map$|\.lock$|package-lock\.json$|\.min\.(js|css)$/;
const TARGET_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.html', '.css', '.scss'];

// Variables globales
const duplicateSets = [];
const fileHashes = new Map();
const fileSimilarities = new Map();
const startTime = Date.now();
const reportFile = `reports/duplicate-analysis-${new Date().toISOString().slice(0, 10)}.md`;

// Utilitaires pour le formatage console
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// Création du dossier reports s'il n'existe pas
if (!fs.existsSync('reports')) {
  fs.mkdirSync('reports', { recursive: true });
}

// Fonction pour calculer le hash d'un fichier
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    console.error(`Erreur lors du calcul du hash pour ${filePath}: ${error.message}`);
    return null;
  }
}

// Fonction pour comparer deux fichiers et obtenir un pourcentage de similarité
function calculateSimilarity(file1, file2) {
  try {
    // Utiliser diff pour comparer les fichiers
    const diffOutput = execSync(`diff -y --suppress-common-lines "${file1}" "${file2}" | wc -l`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    const diffLines = parseInt(diffOutput);

    // Calculer le nombre total de lignes
    const lines1 = fs.readFileSync(file1, 'utf8').split('\n').length;
    const lines2 = fs.readFileSync(file2, 'utf8').split('\n').length;
    const totalLines = Math.max(lines1, lines2);

    // Calculer le pourcentage de similarité
    const similarLines = totalLines - diffLines;
    const similarity = (similarLines / totalLines) * 100;

    return Math.round(similarity * 100) / 100; // Arrondi à 2 décimales
  } catch (error) {
    console.error(
      `Erreur lors du calcul de similarité entre ${file1} et ${file2}: ${error.message}`
    );
    return 0;
  }
}

// Fonction pour récupérer tous les fichiers de façon récursive
function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // Ignorer les dossiers exclus
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.test(filePath)) {
          getAllFiles(filePath, fileList);
        }
      } else if (
        stat.isFile() &&
        !EXCLUDE_FILES.test(filePath) &&
        TARGET_EXTENSIONS.includes(path.extname(filePath)) &&
        stat.size >= MIN_SIZE
      ) {
        fileList.push(filePath);
      }
    }

    return fileList;
  } catch (error) {
    console.error(`Erreur lors de la recherche des fichiers dans ${dir}: ${error.message}`);
    return fileList;
  }
}

// Fonction pour détecter les fichiers identiques
function findIdenticalFiles(files) {
  console.log(`${colors.blue}[INFO]${colors.reset} Recherche de fichiers identiques...`);

  const hashToFiles = new Map();
  let identicalCount = 0;

  for (const filePath of files) {
    const hash = calculateFileHash(filePath);

    if (hash) {
      fileHashes.set(filePath, hash);

      if (hashToFiles.has(hash)) {
        hashToFiles.get(hash).push(filePath);
        identicalCount++;
      } else {
        hashToFiles.set(hash, [filePath]);
      }
    }
  }

  // Collecter les ensembles de fichiers identiques
  const identicalSets = [];

  for (const [hash, fileSet] of hashToFiles.entries()) {
    if (fileSet.length > 1) {
      identicalSets.push({
        type: 'identical',
        files: fileSet,
        similarity: 100,
        hash,
      });
    }
  }

  console.log(
    `${colors.green}[SUCCÈS]${colors.reset} Trouvé ${identicalSets.length} ensembles de fichiers identiques (${identicalCount} fichiers dupliqués)`
  );

  return identicalSets;
}

// Fonction pour détecter les fichiers similaires
function findSimilarFiles(files) {
  console.log(
    `${colors.blue}[INFO]${colors.reset} Recherche de fichiers similaires (seuil: ${MIN_SIMILARITY}%)...`
  );

  const similarSets = [];
  const processedPairs = new Set();
  let comparisonCount = 0;

  // Comparer les fichiers par paires
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const file1 = files[i];
      const file2 = files[j];

      // Vérifier si les fichiers ont le même hash (identiques)
      if (fileHashes.get(file1) === fileHashes.get(file2)) {
        continue; // Ignorer les fichiers déjà identifiés comme identiques
      }

      // Vérifier si cette paire a déjà été traitée
      const pairKey = `${file1}:${file2}`;
      if (processedPairs.has(pairKey)) {
        continue;
      }

      processedPairs.add(pairKey);
      comparisonCount++;

      if (comparisonCount % 100 === 0) {
        process.stdout.write(
          `\r${colors.blue}[INFO]${colors.reset} Comparaison en cours... ${comparisonCount} paires traitées`
        );
      }

      // Calculer la similarité
      const similarity = calculateSimilarity(file1, file2);

      // Stocker la similarité pour référence
      if (!fileSimilarities.has(file1)) {
        fileSimilarities.set(file1, new Map());
      }
      fileSimilarities.get(file1).set(file2, similarity);

      if (similarity >= MIN_SIMILARITY && similarity < 100) {
        const existingSet = similarSets.find(
          (set) => set.files.includes(file1) || set.files.includes(file2)
        );

        if (existingSet) {
          // Ajouter à un ensemble existant
          if (!existingSet.files.includes(file1)) {
            existingSet.files.push(file1);
          }
          if (!existingSet.files.includes(file2)) {
            existingSet.files.push(file2);
          }
          // Mettre à jour la similarité moyenne
          existingSet.similarity = (existingSet.similarity + similarity) / 2;
        } else {
          // Créer un nouvel ensemble
          similarSets.push({
            type: 'similar',
            files: [file1, file2],
            similarity: similarity,
          });
        }
      }
    }
  }

  console.log(
    `\r${colors.green}[SUCCÈS]${colors.reset} Trouvé ${similarSets.length} ensembles de fichiers similaires (${comparisonCount} comparaisons effectuées)`
  );

  return similarSets;
}

// Fonction pour analyser les imports/exports entre fichiers similaires
function analyzeDependencies(similarFiles) {
  console.log(`${colors.blue}[INFO]${colors.reset} Analyse des dépendances entre fichiers...`);

  for (const set of similarFiles) {
    if (set.type !== 'similar') continue;

    set.dependencies = [];

    for (const file of set.files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const extension = path.extname(file);

        // Détecter les imports/exports
        if (['.js', '.ts', '.tsx', '.jsx'].includes(extension)) {
          // Rechercher les imports
          const importPattern = /import\s+.*\s+from\s+['"](.+)['"]/g;
          let match;

          while ((match = importPattern.exec(content)) !== null) {
            const importPath = match[1];

            // Vérifier si c'est un import relatif
            if (importPath.startsWith('.')) {
              const importedFile = path.resolve(path.dirname(file), importPath);

              // Vérifier si le fichier importé fait partie de cet ensemble
              for (const otherFile of set.files) {
                if (
                  otherFile !== file &&
                  (otherFile === importedFile || otherFile.startsWith(importedFile))
                ) {
                  set.dependencies.push({
                    from: file,
                    to: otherFile,
                    type: 'import',
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'analyse des dépendances de ${file}: ${error.message}`);
      }
    }
  }

  console.log(`${colors.green}[SUCCÈS]${colors.reset} Analyse des dépendances terminée`);
}

// Fonction pour générer un rapport
function generateReport(duplicateSets) {
  console.log(`${colors.blue}[INFO]${colors.reset} Génération du rapport...`);

  let report = `# Rapport d'analyse des duplications de code\n\n`;
  report += `Date: ${new Date().toISOString().slice(0, 10)}\n\n`;

  // Statistiques générales
  const identicalSets = duplicateSets.filter((set) => set.type === 'identical');
  const similarSets = duplicateSets.filter((set) => set.type === 'similar');

  report += '## Résumé\n\n';
  report += `- **Ensembles de fichiers identiques:** ${identicalSets.length}\n`;
  report += `- **Ensembles de fichiers similaires:** ${similarSets.length}\n`;
  report += `- **Seuil de similarité:** ${MIN_SIMILARITY}%\n`;
  report += `- **Total des fichiers concernés:** ${
    new Set(duplicateSets.flatMap((set) => set.files)).size
  }\n\n`;

  // Détails des ensembles identiques
  report += '## Fichiers identiques\n\n';

  if (identicalSets.length > 0) {
    for (let i = 0; i < identicalSets.length; i++) {
      const set = identicalSets[i];
      report += `### Ensemble ${i + 1}\n\n`;
      report += '- **Similarité:** 100%\n';
      report += `- **Hash MD5:** ${set.hash}\n`;
      report += '- **Fichiers:**\n\n';

      for (const file of set.files) {
        report += `  - \`${file}\`\n`;
      }

      report +=
        '\n**Recommendation:** Conserver un seul fichier et remplacer les autres par des imports/références.\n\n';
    }
  } else {
    report += '*Aucun ensemble de fichiers identiques trouvé.*\n\n';
  }

  // Détails des ensembles similaires
  report += '## Fichiers similaires\n\n';

  if (similarSets.length > 0) {
    similarSets.sort((a, b) => b.similarity - a.similarity);

    for (let i = 0; i < similarSets.length; i++) {
      const set = similarSets[i];
      report += `### Ensemble ${i + 1}\n\n`;
      report += `- **Similarité:** ${set.similarity.toFixed(2)}%\n`;
      report += '- **Fichiers:**\n\n';

      for (const file of set.files) {
        report += `  - \`${file}\`\n`;
      }

      // Ajouter des informations sur les dépendances si disponibles
      if (set.dependencies && set.dependencies.length > 0) {
        report += '\n- **Dépendances:**\n\n';

        for (const dep of set.dependencies) {
          report += `  - \`${dep.from}\` ${dep.type === 'import' ? 'importe' : 'utilise'} \`${
            dep.to
          }\`\n`;
        }
      }

      report += `\n**Recommendation:** Envisager d'extraire le code commun dans une fonction/classe partagée.\n\n`;
    }
  } else {
    report += '*Aucun ensemble de fichiers similaires trouvé.*\n\n';
  }

  // Conseils pour la refactorisation
  report += '## Conseils de refactorisation\n\n';
  report += '1. **Pour les fichiers identiques:**\n';
  report += '   - Conserver une seule copie dans un emplacement logique\n';
  report += '   - Remplacer les autres occurrences par des imports ou des références\n';
  report += `   - Envisager de déplacer ces fichiers dans un dossier 'shared' ou 'common'\n\n`;
  report += '2. **Pour les fichiers similaires:**\n';
  report += '   - Extraire le code commun dans des fonctions utilitaires partagées\n';
  report += '   - Créer une classe de base commune pour les composants similaires\n';
  report += '   - Envisager des patterns comme Factory ou Strategy\n\n';
  report += '3. **Actions générales:**\n';
  report += '   - Améliorer la modularité du code\n';
  report += '   - Renforcer les tests pour garantir que la refactorisation ne casse rien\n';
  report += '   - Documenter les raisons des duplications si elles sont intentionnelles\n\n';

  // Générer le rapport
  fs.writeFileSync(reportFile, report);

  console.log(`${colors.green}[SUCCÈS]${colors.reset} Rapport généré: ${reportFile}`);
}

// Fonction principale
async function main() {
  console.log(`${colors.magenta}${colors.bold}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              ANALYSE DES DUPLICATIONS DE CODE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);

  console.log(
    `${colors.blue}[INFO]${colors.reset} Analyse démarrée à ${new Date().toLocaleString()}`
  );

  try {
    // Collecter tous les fichiers
    const files = getAllFiles('.');
    console.log(
      `${colors.blue}[INFO]${colors.reset} ${files.length} fichiers trouvés pour analyse`
    );

    // Trouver les fichiers identiques
    const identicalSets = findIdenticalFiles(files);

    // Trouver les fichiers similaires
    const similarSets = findSimilarFiles(files);

    // Combiner les résultats
    duplicateSets.push(...identicalSets, ...similarSets);

    // Analyser les dépendances
    analyzeDependencies(duplicateSets);

    // Générer le rapport
    generateReport(duplicateSets);

    // Afficher le temps d'exécution
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(
      `${colors.green}[SUCCÈS]${colors.reset} Analyse terminée en ${duration.toFixed(2)} secondes`
    );
  } catch (error) {
    console.error(`${colors.red}[ERREUR]${colors.reset} Une erreur est survenue: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le script
main();
