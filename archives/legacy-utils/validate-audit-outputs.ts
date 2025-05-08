/**
 * Script de validation des fichiers d'audit générés
 *
 * Ce script vérifie :
 * 1. L'existence de tous les fichiers nécessaires pour chaque *.php
 * 2. La cohérence des champs slug, table, route, type entre fichiers
 * 3. Les doublons d'analyse
 *
 * Génère un rapport audit_consistency_report.json
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as glob from 'glob';

// Interfaces pour les types de données
interface AuditFile {
  path: string;
  moduleName: string;
  slug?: string;
  table?: string;
  route?: string;
  type?: string;
}

interface BacklogFile {
  path: string;
  slug?: string;
  table?: string;
  route?: string;
  type?: string;
  tasks: any[];
}

interface ImpactGraphFile {
  path: string;
  slug?: string;
  dependencies: any[];
}

interface AuditIndex {
  audits: {
    filePath: string;
    timestamp: string;
    status: string;
    score: number;
  }[];
}

interface ValidationReport {
  missingFiles: {
    sourcePath: string;
    missingTypes: string[];
  }[];
  inconsistentFields: {
    sourcePath: string;
    fieldName: string;
    values: { [key: string]: string };
  }[];
  duplicateAnalyses: {
    slug: string;
    files: string[];
  }[];
  timestamp: string;
}

// Configuration
const CONFIG = {
  extensions: {
    audit: '.audit.md',
    backlog: '.backlog.json',
    impactGraph: '.impact_graph.json',
  },
  directories: {
    audits: './reports/audits',
    backlogs: './reports/backlogs',
    impactGraphs: './reports/impact_graphs',
  },
  outputFile: './reports/audit_consistency_report.json',
  indexFile: './reports/audit_index.json',
};

/**
 * Fonction principale
 */
export async function validateAuditOutputs(
  options: { verbose: boolean; autoFix: boolean } = { verbose: false, autoFix: false }
): Promise<ValidationReport> {
  console.log(chalk.blue("📊 Validation des fichiers d'audit..."));

  // Initialiser le rapport
  const report: ValidationReport = {
    missingFiles: [],
    inconsistentFields: [],
    duplicateAnalyses: [],
    timestamp: new Date().toISOString(),
  };

  // 1. Collecter tous les fichiers d'audit
  const auditFiles = await getAuditFiles();
  const backlogFiles = await getBacklogFiles();
  const impactGraphFiles = await getImpactGraphFiles();
  let _auditIndex: AuditIndex = { audits: [] };

  try {
    _auditIndex = JSON.parse(fs.readFileSync(CONFIG.indexFile, 'utf8'));
  } catch (_error) {
    console.warn(chalk.yellow(`⚠️ Fichier d'index non trouvé: ${CONFIG.indexFile}`));
  }

  // 2. Vérifier les fichiers manquants
  checkMissingFiles(auditFiles, backlogFiles, impactGraphFiles, report);

  // 3. Vérifier la cohérence des champs entre fichiers
  checkFieldConsistency(auditFiles, backlogFiles, impactGraphFiles, report);

  // 4. Vérifier les doublons d'analyse
  checkDuplicateAnalyses(auditFiles, backlogFiles, report);

  // 5. Afficher et enregistrer le rapport
  outputReport(report, options);

  // 6. Auto-correction si demandée
  if (options.autoFix) {
    await autoFixIssues(report);
  }

  return report;
}

/**
 * Récupère tous les fichiers d'audit
 */
async function getAuditFiles(): Promise<AuditFile[]> {
  const files = glob.sync(`${CONFIG.directories.audits}/**/*${CONFIG.extensions.audit}`);
  return files.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const moduleName = extractModuleName(content);
    const slug = extractField(content, 'slug');
    const table = extractField(content, 'table');
    const route = extractField(content, 'route');
    const type = extractField(content, 'type');

    return { path: filePath, moduleName, slug, table, route, type };
  });
}

/**
 * Récupère tous les fichiers de backlog
 */
async function getBacklogFiles(): Promise<BacklogFile[]> {
  const files = glob.sync(`${CONFIG.directories.backlogs}/**/*${CONFIG.extensions.backlog}`);
  return files.map((filePath) => {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        path: filePath,
        slug: content.slug,
        table: content.table,
        route: content.route,
        type: content.type,
        tasks: content.tasks || [],
      };
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la lecture du fichier ${filePath}: ${error}`));
      return { path: filePath, tasks: [] };
    }
  });
}

/**
 * Récupère tous les fichiers de graphe d'impact
 */
async function getImpactGraphFiles(): Promise<ImpactGraphFile[]> {
  const files = glob.sync(
    `${CONFIG.directories.impactGraphs}/**/*${CONFIG.extensions.impactGraph}`
  );
  return files.map((filePath) => {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        path: filePath,
        slug: content.slug,
        dependencies: content.dependencies || [],
      };
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la lecture du fichier ${filePath}: ${error}`));
      return { path: filePath, dependencies: [] };
    }
  });
}

/**
 * Extrait le nom du module à partir du contenu de l'audit
 */
function extractModuleName(content: string): string {
  const match = content.match(/# Audit: (.*)/);
  return match ? match[1].trim() : 'Unknown Module';
}

/**
 * Extrait un champ à partir du contenu de l'audit
 */
function extractField(content: string, fieldName: string): string | undefined {
  const regex = new RegExp(`## ${fieldName}:([^\\n]*)|${fieldName}:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? (match[1] || match[2]).trim() : undefined;
}

/**
 * Vérifie les fichiers manquants pour chaque source PHP
 */
function checkMissingFiles(
  auditFiles: AuditFile[],
  backlogFiles: BacklogFile[],
  impactGraphFiles: ImpactGraphFile[],
  report: ValidationReport
): void {
  // Récupérer tous les slugs uniques
  const allSlugs = new Set([
    ...auditFiles.filter((f) => f.slug).map((f) => f.slug),
    ...backlogFiles.filter((f) => f.slug).map((f) => f.slug),
    ...impactGraphFiles.filter((f) => f.slug).map((f) => f.slug),
  ]);

  allSlugs.forEach((slug) => {
    if (!slug) return;

    const hasAudit = auditFiles.some((f) => f.slug === slug);
    const hasBacklog = backlogFiles.some((f) => f.slug === slug);
    const hasImpactGraph = impactGraphFiles.some((f) => f.slug === slug);

    const missingTypes = [];
    if (!hasAudit) missingTypes.push('audit.md');
    if (!hasBacklog) missingTypes.push('backlog.json');
    if (!hasImpactGraph) missingTypes.push('impact_graph.json');

    if (missingTypes.length > 0) {
      report.missingFiles.push({
        sourcePath: `Source: ${slug}`,
        missingTypes,
      });
    }
  });
}

/**
 * Vérifie la cohérence des champs entre les différents fichiers
 */
function checkFieldConsistency(
  auditFiles: AuditFile[],
  backlogFiles: BacklogFile[],
  impactGraphFiles: ImpactGraphFile[],
  report: ValidationReport
): void {
  // Récupérer tous les slugs uniques
  const allSlugs = new Set([
    ...auditFiles.filter((f) => f.slug).map((f) => f.slug),
    ...backlogFiles.filter((f) => f.slug).map((f) => f.slug),
    ...impactGraphFiles.filter((f) => f.slug).map((f) => f.slug),
  ]);

  allSlugs.forEach((slug) => {
    if (!slug) return;

    const filesForSlug = {
      audit: auditFiles.find((f) => f.slug === slug),
      backlog: backlogFiles.find((f) => f.slug === slug),
      impactGraph: impactGraphFiles.find((f) => f.slug === slug),
    };

    // Vérifier la cohérence du champ 'table'
    checkFieldAcrossFiles(slug, 'table', filesForSlug, report);

    // Vérifier la cohérence du champ 'route'
    checkFieldAcrossFiles(slug, 'route', filesForSlug, report);

    // Vérifier la cohérence du champ 'type'
    checkFieldAcrossFiles(slug, 'type', filesForSlug, report);
  });
}

/**
 * Vérifie la cohérence d'un champ spécifique entre les fichiers
 */
function checkFieldAcrossFiles(
  slug: string,
  fieldName: string,
  files: { audit?: AuditFile; backlog?: BacklogFile; impactGraph?: ImpactGraphFile },
  report: ValidationReport
): void {
  const values: { [key: string]: string } = {};

  if (files.audit?.[fieldName]) {
    values.audit = files.audit[fieldName] as string;
  }

  if (files.backlog?.[fieldName]) {
    values.backlog = files.backlog[fieldName] as string;
  }

  if (files.impactGraph?.[fieldName]) {
    values.impactGraph = files.impactGraph[fieldName] as string;
  }

  // Si plusieurs valeurs différentes existent pour le même champ
  const uniqueValues = new Set(Object.values(values));
  if (uniqueValues.size > 1) {
    report.inconsistentFields.push({
      sourcePath: `Source: ${slug}`,
      fieldName,
      values,
    });
  }
}

/**
 * Vérifie les doublons d'analyse
 */
function checkDuplicateAnalyses(
  auditFiles: AuditFile[],
  backlogFiles: BacklogFile[],
  report: ValidationReport
): void {
  // Créer un mapping slug -> files
  const slugMap: { [key: string]: string[] } = {};

  auditFiles.forEach((file) => {
    if (file.slug) {
      if (!slugMap[file.slug]) {
        slugMap[file.slug] = [];
      }
      slugMap[file.slug].push(file.path);
    }
  });

  backlogFiles.forEach((file) => {
    if (file.slug) {
      if (!slugMap[file.slug]) {
        slugMap[file.slug] = [];
      }
      slugMap[file.slug].push(file.path);
    }
  });

  // Identifier les doublons
  Object.entries(slugMap).forEach(([slug, files]) => {
    const auditCount = files.filter((f) => f.endsWith(CONFIG.extensions.audit)).length;
    const backlogCount = files.filter((f) => f.endsWith(CONFIG.extensions.backlog)).length;

    if (auditCount > 1 || backlogCount > 1) {
      report.duplicateAnalyses.push({
        slug,
        files,
      });
    }
  });
}

/**
 * Affiche et enregistre le rapport
 */
function outputReport(report: ValidationReport, options: { verbose: boolean }): void {
  // Créer le répertoire de sortie s'il n'existe pas
  const outputDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Écrire le rapport JSON
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2), 'utf8');

  // Afficher le résumé
  console.log(chalk.green(`📝 Rapport de cohérence des audits généré: ${CONFIG.outputFile}`));
  console.log(chalk.blue('\n📊 Résumé:'));
  console.log(chalk.yellow(`→ Fichiers manquants: ${report.missingFiles.length}`));
  console.log(chalk.yellow(`→ Champs incohérents: ${report.inconsistentFields.length}`));
  console.log(chalk.yellow(`→ Analyses en double: ${report.duplicateAnalyses.length}`));

  // Afficher les détails si demandé
  if (options.verbose) {
    if (report.missingFiles.length > 0) {
      console.log(chalk.blue('\n📦 Fichiers manquants:'));
      report.missingFiles.forEach((item) => {
        console.log(chalk.red(`  → ${item.sourcePath}: ${item.missingTypes.join(', ')}`));
      });
    }

    if (report.inconsistentFields.length > 0) {
      console.log(chalk.blue('\n🔄 Champs incohérents:'));
      report.inconsistentFields.forEach((item) => {
        console.log(chalk.red(`  → ${item.sourcePath}, champ '${item.fieldName}':`));
        Object.entries(item.values).forEach(([fileType, value]) => {
          console.log(chalk.yellow(`    - ${fileType}: ${value}`));
        });
      });
    }

    if (report.duplicateAnalyses.length > 0) {
      console.log(chalk.blue('\n🔄 Analyses en double:'));
      report.duplicateAnalyses.forEach((item) => {
        console.log(chalk.red(`  → ${item.slug}:`));
        item.files.forEach((file) => {
          console.log(chalk.yellow(`    - ${file}`));
        });
      });
    }
  }
}

/**
 * Tente de corriger automatiquement les problèmes détectés
 */
async function autoFixIssues(_report: ValidationReport): Promise<void> {
  console.log(chalk.blue('\n🔧 Tentative de correction automatique des problèmes...'));

  // TODO: Implémenter les corrections automatiques
  console.log(chalk.yellow("⚠️ La correction automatique n'est pas encore implémentée"));
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const options = {
      verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
      autoFix: process.argv.includes('--auto-fix') || process.argv.includes('-f'),
    };

    await validateAuditOutputs(options);
  })();
}
