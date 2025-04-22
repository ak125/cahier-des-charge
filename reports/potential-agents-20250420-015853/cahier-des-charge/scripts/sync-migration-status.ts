#!/usr/bin/env node

/**
 * Script de synchronisation du statut de migration
 * 
 * Synchronise les fichiers d'audit et de backlog avec les changements de schéma
 * détectés dans schema_migration_diff.json, et génère migration_warnings.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { program } from 'commander';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// Types

interface SchemaMigrationDiff {
  metadata: {
    source: string;
    target: string;
    generatedAt: string;
    agent: string;
  };
  tables: {
    [tableName: string]: {
      status: 'new' | 'modified' | 'removed';
      changes?: {
        columns?: {
          [columnName: string]: {
            type?: string;
            mappedTo?: string;
            transformation?: string;
            note?: string;
          };
        };
        deletedColumns?: string[];
        addedColumns?: {
          [columnName: string]: {
            type: string;
            default?: string | boolean | number;
            note?: string;
          };
        };
      };
    };
  };
}

interface AuditFile {
  path: string;
  content: string;
  tables: string[];
  columns: {
    table: string;
    column: string;
    line: number;
    context: string;
  }[];
}

interface BacklogFile {
  file: string;
  status: string;
  reason?: string;
  linkedSchema?: string;
  tasks: any[];
}

interface MigrationWarning {
  id: string;
  timestamp: string;
  type: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  file: string;
  table: string;
  column?: string;
  from?: string;
  to?: string;
  relation?: string;
  usages?: {
    line: number;
    context: string;
    functionName?: string;
  }[];
  action_required: string;
  suggested_fix?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  assignee: string | null;
}

// Configuration du programme
program
  .name('sync-migration-status')
  .description('Synchronize audit and backlog files with schema changes')
  .option('-d, --diff <path>', 'Path to schema_migration_diff.json', './schema_migration_diff.json')
  .option('-a, --audit-dir <path>', 'Directory containing audit files', './audits')
  .option('-b, --backlog-dir <path>', 'Directory containing backlog files', './backlogs')
  .option('-o, --output <path>', 'Path for migration_warnings.json', './migration_warnings.json')
  .option('-c, --commit', 'Create aDoDoDoDotgit commit with changes', false)
  .option('-s, --slack', 'Send Slack notification for critical changes', false)
  .option('-g, -DoDoDoDoDoDotgithub', 'Create GitHub issues for warnings', false);

program.parse();
const options = program.opts();

// Point d'entrée principal
async function main() {
  try {
    console.log('🔄 Starting migration status synchronization...');
    
    // 1. Charger le fichier schema_migration_diff.json
    const diffPath = path.resolve(options.diff);
    if (!fs.existsSync(diffPath)) {
      throw new Error(`Schema migration diff file not found: ${diffPath}`);
    }
    
    const schemaDiff: SchemaMigrationDiff = JSON.parse(
      fs.readFileSync(diffPath, 'utf-8')
    );
    
    console.log(`✅ Loaded schema migration diff (generated at ${schemaDiff.metadata.generatedAt})`);
    
    // 2. Trouver et analyser tous les fichiers d'audit
    const auditFiles = await findAndAnalyzeAuditFiles(options.auditDir);
    console.log(`✅ Analyzed ${auditFiles.length} audit files`);
    
    // 3. Générer les warnings pour chaque fichier d'audit
    const warnings: MigrationWarning[] = [];
    let auditFilesUpdated = 0;
    let backlogFilesUpdated = 0;
    
    for (const auditFile of auditFiles) {
      const fileWarnings = detectWarnings(auditFile, schemaDiff);
      warnings.push(...fileWarnings);
      
      if (fileWarnings.length > 0) {
        // Mettre à jour le fichier d'audit
        const updated = updateAuditFile(auditFile, fileWarnings);
        if (updated) auditFilesUpdated++;
        
        // Mettre à jour le fichier de backlog correspondant
        const backlogUpdated = await updateBacklogFile(
          auditFile.path,
          fileWarnings,
          options.backlogDir
        );
        if (backlogUpdated) backlogFilesUpdated++;
      }
    }
    
    console.log(`✅ Generated ${warnings.length} migration warnings`);
    console.log(`✅ Updated ${auditFilesUpdated} audit files`);
    console.log(`✅ Updated ${backlogFilesUpdated} backlog files`);
    
    // 4. Écrire le fichier migration_warnings.json
    fs.writeFileSync(
      options.output,
      JSON.stringify(warnings, null, 2)
    );
    console.log(`✅ Wrote migration warnings to ${options.output}`);
    
    // 5. Créer un commit Git si demandé
    if (options.commit) {
      createGitCommit(auditFilesUpdated, backlogFilesUpdated, warnings.length);
    }
    
    // 6. Envoyer des notifications si demandé
    if (options.slack) {
      sendSlackNotification(warnings);
    }
    
    // 7. Créer des issues GitHub si demandé
    if (optionsDoDoDoDoDoDotgithub) {
      await createGitHubIssues(warnings);
    }
    
    console.log('✅ Migration status synchronization completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Trouve et analyse tous les fichiers d'audit dans un répertoire
 */
async function findAndAnalyzeAuditFiles(auditDir: string): Promise<AuditFile[]> {
  // Trouver tous les fichiers .audit.md
  const auditFilePaths = glob.sync(`${auditDir}/**/*.audit.md`);
  
  const auditFiles: AuditFile[] = [];
  
  for (const filePath of auditFilePaths) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extraire les tables et colonnes utilisées dans le fichier
    const { tables, columns } = extractSqlUsageFromAudit(content);
    
    auditFiles.push({
      path: filePath,
      content,
      tables,
      columns
    });
  }
  
  return auditFiles;
}

/**
 * Extrait les utilisations SQL d'un fichier d'audit
 */
function extractSqlUsageFromAudit(content: string): {
  tables: string[];
  columns: { table: string; column: string; line: number; context: string }[];
} {
  const tables: string[] = [];
  const columns: {
    table: string;
    column: string;
    line: number;
    context: string;
  }[] = [];
  
  // Extraire les tables des requêtes SQL
  const sqlSectionMatch = content.match(/## SQL Queries\s*\n([\s\S]*?)(?=\n##|$)/);
  if (sqlSectionMatch) {
    const sqlSection = sqlSectionMatch[1];
    
    // Extraire les références de tables (FROM table, JOIN table)
    const tableMatches = sqlSection.match(/FROM\s+(\w+)|JOIN\s+(\w+)/g) || [];
    for (const match of tableMatches) {
      const tableName = match.split(/\s+/)[1];
      if (!tables.includes(tableName)) {
        tables.push(tableName);
      }
    }
    
    // Extraire les références de colonnes
    const columnRegex = /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/g;
    let columnMatch;
    let lineNumber = 0;
    const lines = sqlSection.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Détecter les numéros de ligne explicites
      const lineMatch = line.match(/\/\/ Line (\d+)/);
      if (lineMatch) {
        lineNumber = parseInt(lineMatch[1], 10);
        continue;
      }
      
      // Analyser la ligne pour les références de colonnes
      columnRegex.lastIndex = 0; // Réinitialiser regex
      while ((columnMatch = columnRegex.exec(line)) !== null) {
        const [, table, column] = columnMatch;
        columns.push({
          table,
          column,
          line: lineNumber,
          context: line.trim()
        });
      }
      
      // Incrémenter le numéro de ligne
      lineNumber++;
    }
  }
  
  // Extraire les champs des variables PHP
  const variableSectionMatch = content.match(/## Fields Used:\s*\n([\s\S]*?)(?=\n##|$)/);
  if (variableSectionMatch) {
    const variableSection = variableSectionMatch[1];
    const lines = variableSection.split('\n');
    
    for (const line of lines) {
      // Format attendu: - table.column
      const fieldMatch = line.match(/- ([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
      if (fieldMatch) {
        const [, table, column] = fieldMatch;
        
        if (!tables.includes(table)) {
          tables.push(table);
        }
        
        columns.push({
          table,
          column,
          line: 0, // Ligne inconnue
          context: line.trim()
        });
      }
    }
  }
  
  return { tables, columns };
}

/**
 * Détecte les warnings pour un fichier d'audit
 */
function detectWarnings(
  auditFile: AuditFile,
  schemaDiff: SchemaMigrationDiff
): MigrationWarning[] {
  const warnings: MigrationWarning[] = [];
  const auditBasename = path.basename(auditFile.path, '.audit.md');
  const phpFile = auditBasename + '.php';
  
  // Analyser chaque colonne utilisée dans le fichier d'audit
  for (const column of auditFile.columns) {
    const { table, column: columnName } = column;
    
    // Vérifier si la table existe dans le diff de schéma
    if (schemaDiff.tables[table]) {
      const tableInfo = schemaDiff.tables[table];
      
      // Cas 1: La table a été modifiée
      if (tableInfo.status === 'modified' && tableInfo.changes) {
        // Cas 1a: Colonne renommée
        if (
          tableInfo.changes.columns && 
          tableInfo.changes.columns[columnName] &&
          tableInfo.changes.columns[columnName].transformation === 'rename'
        ) {
          const newName = tableInfo.changes.columns[columnName].mappedTo;
          warnings.push({
            id: generateWarningId(),
            timestamp: new Date().toISOString(),
            type: 'renamed_field',
            severity: 'medium',
            file: phpFile,
            table,
            column: columnName,
            from: columnName,
            to: newName,
            usages: [{
              line: column.line,
              context: column.context
            }],
            action_required: 'Refactor variable names',
            suggested_fix: `Replace occurrences of '${columnName}' with '${newName}'`,
            status: 'pending',
            assignee: null
          });
        }
        
        // Cas 1b: Colonne supprimée
        else if (tableInfo.changes.deletedColumns && 
                tableInfo.changes.deletedColumns.includes(columnName)) {
          warnings.push({
            id: generateWarningId(),
            timestamp: new Date().toISOString(),
            type: 'removed_field',
            severity: 'high',
            file: phpFile,
            table,
            column: columnName,
            usages: [{
              line: column.line,
              context: column.context
            }],
            action_required: 'Remove usage or create fallback logic',
            status: 'pending',
            assignee: null
          });
        }
        
        // Cas 1c: Type de colonne modifié
        else if (
          tableInfo.changes.columns && 
          tableInfo.changes.columns[columnName] &&
          tableInfo.changes.columns[columnName].type
        ) {
          const typeChange = tableInfo.changes.columns[columnName].type;
          
          // Extraire les types avant et après
          const [fromType, toType] = typeChange.split(' → ');
          
          warnings.push({
            id: generateWarningId(),
            timestamp: new Date().toISOString(),
            type: 'type_changed',
            severity: 'low',
            file: phpFile,
            table,
            column: columnName,
            from_type: fromType,
            to_type: toType,
            usages: [{
              line: column.line,
              context: column.context
            }],
            action_required: 'Verify type compatibility',
            status: 'pending',
            assignee: null
          });
        }
      }
      
      // Cas 2: La table a été supprimée
      else if (tableInfo.status === 'removed') {
        warnings.push({
          id: generateWarningId(),
          timestamp: new Date().toISOString(),
          type: 'removed_table',
          severity: 'high',
          file: phpFile,
          table,
          usages: [{
            line: column.line,
            context: column.context
          }],
          action_required: 'Remove usage or update table reference',
          status: 'pending',
          assignee: null
        });
      }
    }
    // Cas 3: La table n'existe pas dans le diff
    else {
      // Pour simplifier on suppose que c'est une table inchangée
      // Dans une implémentation complète, il faudrait vérifier avec le schéma complet
    }
  }
  
  // Dédupliquer les warnings (par table + colonne)
  return deduplicateWarnings(warnings);
}

/**
 * Déduplique les warnings en regroupant les usages
 */
function deduplicateWarnings(warnings: MigrationWarning[]): MigrationWarning[] {
  const warningMap = new Map<string, MigrationWarning>();
  
  for (const warning of warnings) {
    const key = `${warning.type}_${warning.table}_${warning.column || ''}`;
    
    if (warningMap.has(key)) {
      const existingWarning = warningMap.get(key)!;
      
      // Ajouter l'usage au warning existant
      if (warning.usages && warning.usages.length > 0) {
        existingWarning.usages = [
          ...(existingWarning.usages || []),
          ...warning.usages
        ];
      }
    } else {
      warningMap.set(key, warning);
    }
  }
  
  return Array.from(warningMap.values());
}

/**
 * Met à jour un fichier d'audit avec les warnings détectés
 */
function updateAuditFile(
  auditFile: AuditFile,
  warnings: MigrationWarning[]
): boolean {
  if (warnings.length === 0) return false;
  
  let content = auditFile.content;
  
  // 1. Ajouter les annotations aux champs concernés
  for (const warning of warnings) {
    if (warning.type === 'renamed_field') {
      // Trouver toutes les mentions du champ dans la section SQL ou Fields Used
      const fieldPattern = new RegExp(`- (${warning.table}\\.)?(${warning.column})\\b`, 'g');
      content = content.replace(
        fieldPattern,
        `- $1$2 → 🟠 renommé en \`${warning.to}\` dans Prisma`
      );
    } else if (warning.type === 'removed_field') {
      // Trouver toutes les mentions du champ dans la section SQL ou Fields Used
      const fieldPattern = new RegExp(`- (${warning.table}\\.)?(${warning.column})\\b`, 'g');
      content = content.replace(
        fieldPattern,
        `- $1$2 → ❌ supprimé dans Prisma`
      );
    } else if (warning.type === 'type_changed') {
      // Trouver toutes les mentions du champ dans la section SQL ou Fields Used
      const fieldPattern = new RegExp(`- (${warning.table}\\.)?(${warning.column})\\b`, 'g');
      content = content.replace(
        fieldPattern,
        `- $1$2 → ⚠️ type modifié: ${warning.from_type} → ${warning.to_type}`
      );
    }
  }
  
  // 2. Ajouter une section Mismatch warnings si elle n'existe pas déjà
  if (!content.includes('## Schema Mismatch Warnings')) {
    content += '\n\n## Schema Mismatch Warnings\n\n';
    
    for (const warning of warnings) {
      if (warning.type === 'renamed_field') {
        content += `> ⚠️ Le champ \`${warning.column}\` a été renommé en \`${warning.to}\` dans le modèle Prisma.\n\n`;
      } else if (warning.type === 'removed_field') {
        content += `> ⚠️ Le champ \`${warning.column}\` n'existe plus dans le modèle Prisma.\n\n`;
      } else if (warning.type === 'removed_table') {
        content += `> ⚠️ La table \`${warning.table}\` n'existe plus dans le modèle Prisma.\n\n`;
      } else if (warning.type === 'type_changed') {
        content += `> ⚠️ Le type du champ \`${warning.column}\` a changé: ${warning.from_type} → ${warning.to_type}\n\n`;
      }
    }
  }
  
  // Écrire le fichier mis à jour
  fs.writeFileSync(auditFile.path, content);
  return true;
}

/**
 * Met à jour un fichier de backlog avec les warnings détectés
 */
async function updateBacklogFile(
  auditFilePath: string,
  warnings: MigrationWarning[],
  backlogDir: string
): Promise<boolean> {
  if (warnings.length === 0) return false;
  
  // Déterminer le chemin du fichier backlog
  const auditBasename = path.basename(auditFilePath, '.audit.md');
  const backlogPath = path.join(backlogDir, `${auditBasename}.backlog.json`);
  
  // Créer ou charger le fichier backlog
  let backlog: BacklogFile = {
    file: `${auditBasename}.php`,
    status: 'pending',
    tasks: []
  };
  
  if (fs.existsSync(backlogPath)) {
    try {
      backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));
    } catch (error) {
      console.warn(`⚠️ Error reading backlog file ${backlogPath}: ${error}`);
    }
  }
  
  // Mettre à jour le statut et la raison
  backlog.status = 'requires_review';
  
  // Trouver le warning le plus sévère pour la raison
  const highSeverityWarning = warnings.find(w => w.severity === 'high');
  if (highSeverityWarning) {
    if (highSeverityWarning.type === 'removed_field') {
      backlog.reason = `Schema mismatch: column ${highSeverityWarning.column} removed`;
    } else if (highSeverityWarning.type === 'removed_table') {
      backlog.reason = `Schema mismatch: table ${highSeverityWarning.table} removed`;
    } else {
      backlog.reason = `Schema mismatch: ${highSeverityWarning.type}`;
    }
    
    // Lier au schéma concerné
    backlog.linkedSchema = highSeverityWarning.table;
  } else {
    backlog.reason = 'Schema changes require review';
    backlog.linkedSchema = warnings[0].table;
  }
  
  // Ajouter des tâches pour chaque warning
  const existingTasks = new Set(
    backlog.tasks
      .filter(task => task.type === 'schema_migration')
      .map(task => `${task.warning_type}_${task.table}_${task.column || ''}`)
  );
  
  for (const warning of warnings) {
    const taskKey = `${warning.type}_${warning.table}_${warning.column || ''}`;
    
    if (!existingTasks.has(taskKey)) {
      backlog.tasks.push({
        type: 'schema_migration',
        warning_type: warning.type,
        status: 'todo',
        priority: getSeverityPriority(warning.severity),
        table: warning.table,
        column: warning.column,
        action: warning.action_required,
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Écrire le fichier backlog mis à jour
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  return true;
}

/**
 * Génère un ID unique pour un warning
 */
function generateWarningId(): string {
  return 'W' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

/**
 * Convertit une sévérité en niveau de priorité
 */
function getSeverityPriority(severity: string): string {
  switch (severity) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'medium';
  }
}

/**
 * Crée un commit Git avec les changements
 */
function createGitCommit(
  auditFilesUpdated: number, 
  backlogFilesUpdated: number,
  warningsCount: number
): void {
  try {
    // Vérifier si on est dans un repo Git
    execSync(DoDoDoDotgit rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    
    // Ajouter les fichiers modifiés
    execSync(DoDoDoDotgit add **/*.audit.md **/*.backlog.json migration_warnings.json');
    
    // Créer le commit
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commitMessage = 
      `sync-schema-${timestamp}: Update migration status\n\n` +
      `Updated ${auditFilesUpdated} audit files and ${backlogFilesUpdated} backlog files\n` +
      `Detected ${warningsCount} schema migration warnings\n\n` +
      `[automated commit]`;
    
    execSync(DoDoDoDotgit commit -m "${commitMessage}"`, { stdio: 'pipe' });
    
    console.log('✅ Created Git commit with changes');
  } catch (error) {
    console.warn(`⚠️ Failed to create Git commit: ${error}`);
  }
}

/**
 * Envoie une notification Slack
 */
function sendSlackNotification(warnings: MigrationWarning[]): void {
  // Simplifié pour l'exemple
  const highSeverityWarnings = warnings.filter(w => w.severity === 'high');
  
  if (highSeverityWarnings.length > 0) {
    console.log(`✅ Would send Slack notification for ${highSeverityWarnings.length} high severity warnings`);
  }
}

/**
 * Crée des issues GitHub pour les warnings
 */
async function createGitHubIssues(warnings: MigrationWarning[]): Promise<void> {
  // Simplifié pour l'exemple
  console.log(`✅ Would create ${warnings.length} GitHub issues for warnings`);
}

// Exécuter le programme
if (require.main === module) {
  main();
}
