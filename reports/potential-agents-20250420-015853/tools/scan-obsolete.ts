import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import { promisify } from 'util';
import { exec } from 'child_process';

const globPromise = promisify(glob);
const execPromise = promisify(exec);

// Types
interface FileStatus {
  filePath: string;
  status: '✅ Actif' | '🌀 Généré (non validé)' | '⚠️ Obsolète' | '📦 Archive' | '❓ Inconnu';
  reason: string;
}

// Configuration
const foldersToScan = [
  'apps/frontend/app/routes',
  'apps/backend/src/modules',
  'packagesDoDotmcp-agents',
  'prisma',
  'audit',
  'simulations',
  'oldsiteautomecanik',
  'public',
  'tools'
];

const obsoleteSuffixes = ['.copy', '.old', '.bak', '.v1', '.v2', '.v3', '.v4', '.v5', '.v6', '.v7', '.backup'];
const generatedPaths = ['simulations', 'audit'];
const archivePaths = ['oldsite', 'legacy', 'backup', 'backups'];
const auditExtensions = ['.md', '.json', '.audit.md', '.audit.json'];

/**
 * Détermine si un fichier est importé dans le projet
 */
async function isImported(filePath: string): Promise<boolean> {
  try {
    // Extraction du nom de fichier sans extension
    const basename = path.basename(filePath).split('.')[0];
    
    // Si le nom est trop commun, utiliser le chemin relatif
    const searchPattern = basename.length > 3 ? basename : path.relative(process.cwd(), filePath);
    
    // Rechercher les imports dans les fichiers TypeScript/JavaScript
    const { stdout } = await execPromise(`grep -r "import.*${searchPattern}" --include="*.{ts,tsx,js,jsx}" .`);
    
    return stdout.trim().length > 0;
  } catch (error) {
    // Si grep ne trouve rien, il renvoie code 1
    return false;
  }
}

/**
 * Vérifie si un fichier a un doublon dans le projet
 */
async function hasDuplicate(filePath: string): Promise<boolean> {
  const basename = path.basename(filePath);
  const allFiles = await globPromise(`**/${basename}`, { ignore: filePath });
  return allFiles.length > 0;
}

/**
 * Classifie un fichier selon son statut
 */
async function classifyFile(filePath: string): Promise<FileStatus> {
  const filename = path.basename(filePath).toLowerCase();
  const relativePath = path.relative(process.cwd(), filePath);
  const pathParts = relativePath.split(path.sep);
  const extension = path.extname(filePath);
  
  // 1. Détection fichiers obsolètes (par suffixe)
  if (obsoleteSuffixes.some(suffix => filename.includes(suffix))) {
    return {
      filePath: relativePath,
      status: '⚠️ Obsolète',
      reason: `Nom contient un suffixe de version/doublon (${obsoleteSuffixes.find(suffix => filename.includes(suffix))})`
    };
  }
  
  // 2. Détection fichiers générés non validés
  if (generatedPaths.some(part => pathParts.includes(part))) {
    if (auditExtensions.includes(extension) || auditExtensions.some(ext => filename.includes(ext))) {
      return {
        filePath: relativePath,
        status: '🌀 Généré (non validé)',
        reason: `Fichier d'audit ou de simulation non validé`
      };
    }
  }
  
  // 3. Détection fichiers à archiver
  if (archivePaths.some(part => pathParts.some(p => p.includes(part)))) {
    return {
      filePath: relativePath,
      status: '📦 Archive',
      reason: `Fichier dans un dossier d'archive ou de sauvegarde`
    };
  }
  
  // 4. Détection des doublons
  const duplicate = await hasDuplicate(filePath);
  if (duplicate) {
    return {
      filePath: relativePath,
      status: '⚠️ Obsolète',
      reason: `Fichier en doublon dans le projet`
    };
  }
  
  // 5. Détection si importé/utilisé
  const imported = await isImported(filePath);
  if (!imported && (extension === '.ts' || extension === '.tsx' || extension === '.js' || extension === '.jsx')) {
    // Vérifier s'il s'DoDoDoDotgit d'un point d'entrée, route, ou fichier spécial
    if (filename === 'index.ts' || filename === 'main.ts' || pathParts.includes('routes')) {
      return {
        filePath: relativePath,
        status: '✅ Actif',
        reason: `Point d'entrée ou route active`
      };
    }
    
    return {
      filePath: relativePath, 
      status: '⚠️ Obsolète',
      reason: `Fichier non importé ni utilisé ailleurs`
    };
  }
  
  // 6. Par défaut, considérer comme actif
  return {
    filePath: relativePath,
    status: '✅ Actif',
    reason: `Fichier utilisé dans le projet`
  };
}

/**
 * Génère un rapport Markdown
 */
function generateReport(files: FileStatus[]): string {
  const active = files.filter(f => f.status === '✅ Actif');
  const generated = files.filter(f => f.status === '🌀 Généré (non validé)');
  const obsolete = files.filter(f => f.status === '⚠️ Obsolète');
  const archive = files.filter(f => f.status === '📦 Archive');
  const unknown = files.filter(f => f.status === '❓ Inconnu');
  
  let report = `# Rapport d'obsolescence — MCP Smart Scan\n\n`;
  report += `*Date de génération : ${new Date().toLocaleDateString('fr-FR')}*\n\n`;
  
  report += `Ce rapport analyse la structure complète du projet monorepo NestJS + Remix + MCP pour identifier les fichiers potentiellement obsolètes, inutilisés ou à archiver. Les fichiers sont classés selon quatre catégories :\n\n`;
  
  report += `- **✅ Actif** : fichier utilisé dans le code, présent dans une route Remix, un contrôleur NestJS, un import MCP\n`;
  report += `- **🌀 Généré (non validé)** : fichier créé par un agent MCP, mais encore en simulations/audit\n`;
  report += `- **⚠️ Obsolète** : fichier avec suffixes .copy, .bak, .v1, ou jamais importé/utilisé\n`;
  report += `- **📦 Archive** : code PHP déjà migré, scripts de migration MySQL, visualisations historiques\n\n`;
  
  report += `## Résumé\n\n`;
  report += `| Catégorie | Nombre de fichiers |\n`;
  report += `|-----------|-------------------|\n`;
  report += `| ✅ Actif | ${active.length} |\n`;
  report += `| 🌀 Généré (non validé) | ${generated.length} |\n`;
  report += `| ⚠️ Obsolète | ${obsolete.length} |\n`;
  report += `| 📦 Archive | ${archive.length} |\n`;
  if (unknown.length > 0) {
    report += `| ❓ Inconnu | ${unknown.length} |\n`;
  }
  report += `\n`;
  
  report += `## Détail des fichiers par catégorie\n\n`;
  
  // Actifs
  if (active.length > 0) {
    report += `### ✅ Fichiers actifs\n\n`;
    report += `| Fichier | Statut | Raison |\n`;
    report += `|---------|--------|--------|\n`;
    active.forEach(file => {
      report += `| ${file.filePath} | ${file.status} | ${file.reason} |\n`;
    });
    report += `\n`;
  }
  
  // Générés
  if (generated.length > 0) {
    report += `### 🌀 Fichiers générés (non validés)\n\n`;
    report += `| Fichier | Statut | Raison |\n`;
    report += `|---------|--------|--------|\n`;
    generated.forEach(file => {
      report += `| ${file.filePath} | ${file.status} | ${file.reason} |\n`;
    });
    report += `\n`;
  }
  
  // Obsolètes
  if (obsolete.length > 0) {
    report += `### ⚠️ Fichiers obsolètes\n\n`;
    report += `| Fichier | Statut | Raison |\n`;
    report += `|---------|--------|--------|\n`;
    obsolete.forEach(file => {
      report += `| ${file.filePath} | ${file.status} | ${file.reason} |\n`;
    });
    report += `\n`;
  }
  
  // Archives
  if (archive.length > 0) {
    report += `### 📦 Fichiers à archiver\n\n`;
    report += `| Fichier | Statut | Raison |\n`;
    report += `|---------|--------|--------|\n`;
    archive.forEach(file => {
      report += `| ${file.filePath} | ${file.status} | ${file.reason} |\n`;
    });
    report += `\n`;
  }
  
  // Actions recommandées
  report += `## Actions recommandées\n\n`;
  
  report += `### 1. Fichiers à supprimer en sécurité\n\n`;
  report += `Les fichiers suivants peuvent être supprimés sans impact sur le projet :\n\n`;
  report += `\`\`\`bash\n`;
  obsolete.filter(f => f.reason.includes('suffixe') || f.reason.includes('doublon'))
    .forEach(file => {
      report += `rm ${file.filePath}\n`;
    });
  report += `\`\`\`\n\n`;
  
  report += `### 2. Fichiers à archiver (à déplacer vers /archives)\n\n`;
  report += `Créer un dossier d'archives pour stocker les fichiers historiques :\n\n`;
  report += `\`\`\`bash\n`;
  report += `mkdir -p archives/migration-history\n`;
  report += `mkdir -p archives/backups\n`;
  report += `mkdir -p archives/php-legacy\n`;
  report += `mkdir -p archives/sql-legacy\n\n`;
  archive.filter(f => !f.filePath.includes('backup') && !f.filePath.includes('archive'))
    .forEach(file => {
      const targetDir = file.filePath.includes('sql') ? 'archives/sql-legacy/' :
                       file.filePath.includes('php') ? 'archives/php-legacy/' :
                       'archives/migration-history/';
      report += `mv ${file.filePath} ${targetDir}\n`;
    });
  report += `\`\`\`\n\n`;
  
  report += `### 3. Fichiers générés à valider\n\n`;
  report += `Les fichiers suivants nécessitent une validation ou une regénération :\n\n`;
  report += `\`\`\`\n`;
  generated.forEach(file => {
    report += `${file.filePath}\n`;
  });
  report += `\`\`\`\n\n`;
  
  report += `Il est recommandé de :\n`;
  report += `- Valider les fichiers d'audit générés et les intégrer dans la documentation officielle\n`;
  report += `- Regénérer les exemples en utilisant les données actuelles du projet\n`;
  report += `- Unifier les fichiers d'audit en évitant les doublons\n\n`;
  
  // Recommandations structurelles
  report += `## Recommandations structurelles\n\n`;
  
  report += `1. **Consolidation des générateurs** :\n`;
  report += `   - Ne conserver qu'une seule instance de chaque générateur\n`;
  report += `   - Centraliser les générateurs dans un dossier unique (idéalement \`packagesDoDotmcp-agents/generators/\`)\n`;
  report += `   - Supprimer les doublons et les versions obsolètes\n\n`;
  
  report += `2. **Gestion des versions d'agents** :\n`;
  report += `   - Éviter les suffixes de version (\`-v1\`, \`-v2\`) en faveur d'un système de versioning Git\n`;
  report += `   - Utiliser des tags sémantiques pour marquer les versions stables\n`;
  report += `   - Documenter les changements majeurs dans CHANGELOG.md\n\n`;
  
  report += `3. **Politique de sauvegardes** :\n`;
  report += `   - Implémenter une politique de rétention (garder uniquement les N dernières sauvegardes)\n`;
  report += `   - Utiliser un système de sauvegarde différentiel pour réduire la taille\n`;
  report += `   - Éviter les doublons de sauvegardes dans différents répertoires\n\n`;
  
  report += `4. **Structure du projet** :\n`;
  report += `   - Nettoyer les dossiers vides\n`;
  report += `   - Centraliser les audits et simulations dans des dossiers dédiés\n`;
  report += `   - Séparer clairement le code production des outils de migration\n\n`;
  
  return report;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('MCP Smart Scan - Analyse d\'obsolescence');
  console.log('========================================');

  const allFiles: FileStatus[] = [];
  
  // 1. Scan des dossiers spécifiés
  for (const folder of foldersToScan) {
    console.log(`Scanning ${folder}...`);
    const folderPath = path.join(process.cwd(), folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`  Dossier ${folder} introuvable - ignoré`);
      continue;
    }
    
    // Trouver tous les fichiers dans ce dossier
    const files = await globPromise(`${folder}/**/*`, { nodir: true });
    console.log(`  ${files.length} fichiers trouvés`);
    
    // Classifier chaque fichier
    for (const file of files) {
      const status = await classifyFile(file);
      allFiles.push(status);
    }
  }
  
  // 2. Générer le rapport
  console.log(`\nGénération du rapport pour ${allFiles.length} fichiers...`);
  const report = generateReport(allFiles);
  
  // 3. Enregistrer le rapport
  const reportDir = path.join(process.cwd(), 'audit');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, 'obsolete_report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\nRapport généré avec succès dans ${reportPath}`);
  console.log(`Classification : ${allFiles.filter(f => f.status === '✅ Actif').length} actifs, ${allFiles.filter(f => f.status === '🌀 Généré (non validé)').length} générés, ${allFiles.filter(f => f.status === '⚠️ Obsolète').length} obsolètes, ${allFiles.filter(f => f.status === '📦 Archive').length} archives`);
}

// Lancement du script
main().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});