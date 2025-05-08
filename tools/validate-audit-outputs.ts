import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface AuditFile {
  filePath: string;
  exists: boolean;
  type: string;
  lastModified?: Date;
  sourceFile?: string;
}

interface ValidationIssue {
  type: 'missing' | 'inconsistent' | 'duplicate';
  description: string;
  sourceFile?: string;
  affectedFiles?: string[];
  fields?: string[];
}

interface ValidationReport {
  timestamp: string;
  totalFilesChecked: number;
  issues: ValidationIssue[];
  consistencyScore: number;
  missingFiles: AuditFile[];
  duplicateAudits: string[];
  inconsistentFields: {
    [key: string]: {
      field: string;
      values: { [value: string]: string[] };
    }[];
  };
}

/**
 * Vérifie l'existence et la cohérence des fichiers d'audit
 */
async function validateAuditOutputs(
  basePath = '/workspaces/cahier-des-charge',
  outputPath = '/workspaces/cahier-des-charge/reports/audit_consistency_report.json'
): Promise<ValidationReport> {
  console.log("Démarrage de la validation des fichiers d'audit...");

  // 1. Collecter tous les fichiers PHP analysés (source de vérité)
  const phpFiles = await findPhpFiles(basePath);
  console.log(`${phpFiles.length} fichiers PHP trouvés comme sources d'audit`);

  // 2. Vérifier l'existence des fichiers d'audit pour chaque fichier PHP
  const auditFiles: AuditFile[] = [];
  const missingFiles: AuditFile[] = [];
  const issues: ValidationIssue[] = [];

  for (const phpFile of phpFiles) {
    const baseName = path.basename(phpFile);
    const expectedFiles = getExpectedAuditFiles(baseName, basePath);

    for (const expected of expectedFiles) {
      const exists = fs.existsSync(expected.filePath);
      auditFiles.push({
        ...expected,
        exists,
        sourceFile: phpFile,
        lastModified: exists ? new Date(fs.statSync(expected.filePath).mtime) : undefined,
      });

      if (!exists) {
        missingFiles.push({
          ...expected,
          exists: false,
          sourceFile: phpFile,
        });

        issues.push({
          type: 'missing',
          description: `Fichier ${expected.type} manquant pour ${baseName}`,
          sourceFile: phpFile,
          affectedFiles: [expected.filePath],
        });
      }
    }
  }

  console.log(
    `Vérification terminée: ${auditFiles.length} fichiers d'audit attendus, ${missingFiles.length} manquants`
  );

  // 3. Vérifier les doublons d'audits (même fichier source analysé plusieurs fois)
  const duplicateAudits = findDuplicateAudits(auditFiles);

  for (const dup of duplicateAudits) {
    issues.push({
      type: 'duplicate',
      description: `Audit en double détecté pour le fichier source: ${dup}`,
      sourceFile: dup,
      affectedFiles: auditFiles.filter((f) => f.sourceFile === dup).map((f) => f.filePath),
    });
  }

  // 4. Vérifier la cohérence entre les différents fichiers d'audit
  const inconsistentFields = await verifyConsistencyBetweenFiles(auditFiles);

  for (const [sourceFile, fieldIssues] of Object.entries(inconsistentFields)) {
    for (const issue of fieldIssues) {
      issues.push({
        type: 'inconsistent',
        description: `Incohérence du champ "${issue.field}" pour ${path.basename(sourceFile)}`,
        sourceFile,
        fields: [issue.field],
        affectedFiles: Object.values(issue.values).flat(),
      });
    }
  }

  // 5. Générer le rapport final
  const consistencyScore = calculateConsistencyScore(auditFiles.length, issues.length);

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalFilesChecked: auditFiles.length,
    issues,
    consistencyScore,
    missingFiles,
    duplicateAudits,
    inconsistentFields,
  };

  // Enregistrer le rapport
  const reportDir = path.dirname(outputPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Rapport de cohérence enregistré dans ${outputPath}`);
  console.log(`Score de cohérence: ${consistencyScore.toFixed(2)}/10`);

  return report;
}

/**
 * Recherche tous les fichiers PHP dans le dossier spécifié
 */
async function findPhpFiles(basePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(`${basePath}/**/*.php`, (err, matches) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(matches);
    });
  });
}

/**
 * Génère les chemins de fichiers d'audit attendus pour un fichier PHP donné
 */
function getExpectedAuditFiles(phpFileName: string, basePath: string): AuditFile[] {
  const expectedFiles: AuditFile[] = [];

  // 1. Fichier d'audit principal (*.audit.md)
  expectedFiles.push({
    filePath: path.join(
      basePath,
      'docs',
      'cahier-des-charges',
      'audits',
      `${phpFileName}.audit.md`
    ),
    type: 'audit.md',
    exists: false,
  });

  // 2. Fichier de backlog (*.backlog.json)
  expectedFiles.push({
    filePath: path.join(
      basePath,
      'docs',
      'cahier-des-charges',
      'audits',
      `${phpFileName}.backlog.json`
    ),
    type: 'backlog.json',
    exists: false,
  });

  // 3. Graphe d'impact (*.impact_graph.json)
  expectedFiles.push({
    filePath: path.join(
      basePath,
      'docs',
      'cahier-des-charges',
      'audits',
      `${phpFileName}.impact_graph.json`
    ),
    type: 'impact_graph.json',
    exists: false,
  });

  return expectedFiles;
}

/**
 * Recherche les fichiers sources qui ont été audités plusieurs fois
 */
function findDuplicateAudits(auditFiles: AuditFile[]): string[] {
  const fileCount: Record<string, number> = {};

  for (const file of auditFiles) {
    if (file.sourceFile && file.exists) {
      fileCount[file.sourceFile] = (fileCount[file.sourceFile] || 0) + 1;
    }
  }

  // Un fichier est considéré en double s'il a plus de 3 fichiers d'audit associés
  // (car normalement on attend 3 fichiers par source: audit.md, backlog.json, impact_graph.json)
  return Object.entries(fileCount)
    .filter(([_, count]) => count > 3)
    .map(([file]) => file);
}

/**
 * Vérifie la cohérence des champs importants entre les différents fichiers d'audit
 */
async function verifyConsistencyBetweenFiles(auditFiles: AuditFile[]): Promise<{
  [key: string]: {
    field: string;
    values: { [value: string]: string[] };
  }[];
}> {
  const inconsistentFields: {
    [key: string]: {
      field: string;
      values: { [value: string]: string[] };
    }[];
  } = {};

  // Regrouper les fichiers par source
  const filesBySource: Record<string, AuditFile[]> = {};

  for (const file of auditFiles) {
    if (file.sourceFile && file.exists) {
      if (!filesBySource[file.sourceFile]) {
        filesBySource[file.sourceFile] = [];
      }
      filesBySource[file.sourceFile].push(file);
    }
  }

  // Pour chaque source, vérifier la cohérence des champs entre les fichiers
  for (const [sourceFile, files] of Object.entries(filesBySource)) {
    const fieldValues: Record<string, Record<string, string[]>> = {
      slug: {},
      table: {},
      route: {},
      type: {},
    };

    for (const file of files) {
      if (!file.exists) continue;

      try {
        // Lire et analyser le contenu du fichier en fonction de son type
        const content = fs.readFileSync(file.filePath, 'utf8');

        let extractedValues: Record<string, string> = {};

        if (file.type === 'audit.md') {
          extractedValues = extractValuesFromMarkdown(content);
        } else if (file.type === 'backlog.json' || file.type === 'impact_graph.json') {
          const jsonContent = JSON.parse(content);
          extractedValues = extractValuesFromJson(jsonContent);
        }

        // Enregistrer les valeurs extraites pour chaque champ
        for (const [field, value] of Object.entries(extractedValues)) {
          if (value) {
            if (!fieldValues[field]) {
              fieldValues[field] = {};
            }
            if (!fieldValues[field][value]) {
              fieldValues[field][value] = [];
            }
            fieldValues[field][value].push(file.filePath);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'analyse du fichier ${file.filePath}:`, error);
      }
    }

    // Vérifier si chaque champ a des valeurs incohérentes
    const sourceIssues: {
      field: string;
      values: { [value: string]: string[] };
    }[] = [];

    for (const [field, values] of Object.entries(fieldValues)) {
      if (Object.keys(values).length > 1) {
        // Incohérence détectée pour ce champ
        sourceIssues.push({
          field,
          values,
        });
      }
    }

    if (sourceIssues.length > 0) {
      inconsistentFields[sourceFile] = sourceIssues;
    }
  }

  return inconsistentFields;
}

/**
 * Extrait les valeurs importantes d'un fichier Markdown
 */
function extractValuesFromMarkdown(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  // Extraction de slug/route à partir d'une ligne contenant Route:
  const routeMatch = content.match(/Route\s*:\s*([^\n]+)/i);
  if (routeMatch) {
    values.route = routeMatch[1].trim();
  }

  // Extraction de table à partir d'une ligne contenant Table:
  const tableMatch = content.match(/Table\s*:\s*([^\n]+)/i);
  if (tableMatch) {
    values.table = tableMatch[1].trim();
  }

  // Extraction de type à partir d'une ligne contenant Type:
  const typeMatch = content.match(/Type\s*:\s*([^\n]+)/i);
  if (typeMatch) {
    values.type = typeMatch[1].trim();
  }

  return values;
}

/**
 * Extrait les valeurs importantes d'un fichier JSON
 */
function extractValuesFromJson(content: any): Record<string, string> {
  const values: Record<string, string> = {};

  // Extraction des champs communs
  for (const field of ['slug', 'table', 'route', 'type']) {
    if (content[field]) {
      values[field] = content[field].toString();
    }
  }

  return values;
}

/**
 * Calcule un score de cohérence global (0-10)
 */
function calculateConsistencyScore(totalFiles: number, issuesCount: number): number {
  if (totalFiles === 0) return 10; // Pas de fichiers, pas de problèmes!

  // Formule: 10 - (nombre d'issues / nombre total de fichiers) * 10
  // Limité entre 0 et 10
  return Math.max(0, Math.min(10, 10 - (issuesCount / totalFiles) * 10));
}

/**
 * Fonction principale
 */
async function main() {
  try {
    const basePath = process.argv[2] || '/workspaces/cahier-des-charge';
    const outputPath =
      process.argv[3] || '/workspaces/cahier-des-charge/reports/audit_consistency_report.json';

    console.log(`🔍 Validation des fichiers d'audit`);
    console.log(`📂 Dossier de base: ${basePath}`);
    console.log(`📄 Rapport sera généré à: ${outputPath}`);

    const report = await validateAuditOutputs(basePath, outputPath);

    // Résumé des résultats
    console.log('\n📊 Résumé de la validation:');
    console.log(`Total des fichiers vérifiés: ${report.totalFilesChecked}`);
    console.log(`Fichiers manquants: ${report.missingFiles.length}`);
    console.log(`Doublons d'audits: ${report.duplicateAudits.length}`);
    console.log(`Incohérences détectées: ${Object.keys(report.inconsistentFields).length}`);
    console.log(`Score de cohérence: ${report.consistencyScore.toFixed(2)}/10`);

    // Suggestion pour re-audit si nécessaire
    if (report.issues.length > 0) {
      console.log("\n⚠️ Des problèmes ont été détectés dans les fichiers d'audit.");
      console.log(
        'Vous pouvez exécuter recheck_missing_outputs.ts pour générer les fichiers manquants.'
      );
    } else {
      console.log("\n✅ Tous les fichiers d'audit sont cohérents et complets!");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la validation des fichiers d'audit:", error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

export { validateAuditOutputs, ValidationReport, ValidationIssue };
