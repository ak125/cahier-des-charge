import * as fs from 'fs';
import * as path from 'path';
import { parse as parseMarkdown } from 'marked';
import { PrismaSchemaParser } from './utils/prisma-schema-parser';
import { extractSQLQueries } from './dynamic_sql_extractor';
import { 
  FieldMapping, 
  RefactorTask, 
  MigrationPatch,
  SchemaMigrationDiff 
} from '../types/migration-types';

/**
 * Agent php-sql-sync-mapper.ts
 * 
 * Cet agent analyse les fichiers PHP et les correspondances SQL pour générer
 * des tâches de refactorisation et assurer la cohérence entre les champs PHP,
 * les requêtes SQL et les modèles Prisma.
 */
export async function mapPhpSqlSync(
  auditFilePath: string,
  schemaMapPath: string,
  prismaSchemaPath: string,
  outputDir: string
): Promise<void> {
  console.log(`🧠 Démarrage de l'analyse pour ${auditFilePath}`);
  
  // 1. Charger les fichiers d'entrée
  const auditContent = fs.readFileSync(auditFilePath, 'utf8');
  const schemaMap = JSON.parse(fs.readFileSync(schemaMapPath, 'utf8'));
  const prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf8');
  
  // 2. Extraire les informations de l'audit PHP
  const phpInfo = extractPhpInfo(auditContent);
  console.log(`📄 Fichier PHP source: ${phpInfo.sourceFile}`);
  
  // 3. Extraire les requêtes SQL depuis l'audit
  const sqlQueries = extractSQLQueries(auditContent);
  console.log(`🔍 Requêtes SQL détectées: ${sqlQueries.length}`);
  
  // 4. Analyser le schéma Prisma
  const prismaModels = PrismaSchemaParser.parse(prismaSchema);
  
  // 5. Générer les correspondances entre SQL et Prisma
  const fieldMappings = generateFieldMappings(sqlQueries, schemaMap, prismaModels);
  console.log(`🔄 Correspondances de champs générées: ${fieldMappings.length}`);
  
  // 6. Générer les tâches de refactorisation
  const refactorTasks = generateRefactorTasks(phpInfo, sqlQueries, fieldMappings);
  console.log(`🛠 Tâches de refactorisation générées: ${refactorTasks.length}`);
  
  // 7. Générer le patch de migration
  const migrationPatch = generateMigrationPatch(fieldMappings);
  
  // 8. Mettre à jour le backlog
  const backlogPath = path.join(
    outputDir, 
    `${path.basename(phpInfo.sourceFile, '.php')}.backlog.json`
  );
  
  updateBacklog(backlogPath, refactorTasks);
  
  // 9. Générer le fichier refactor_tasks.json
  const refactorTasksPath = path.join(outputDir, 'refactor_tasks.json');
  fs.writeFileSync(refactorTasksPath, JSON.stringify(refactorTasks, null, 2));
  
  // 10. Générer le fichier migration_patch.json
  const migrationPatchPath = path.join(outputDir, 'migration_patch.json');
  fs.writeFileSync(migrationPatchPath, JSON.stringify(migrationPatch, null, 2));
  
  // 11. Mettre à jour schema_migration_diff.json
  updateSchemaMigrationDiff(
    path.join(outputDir, 'schema_migration_diff.json'),
    fieldMappings
  );
  
  console.log(`✅ Analyse et génération terminées. Résultats dans ${outputDir}`);
}

/**
 * Extrait les informations du fichier PHP à partir du fichier d'audit
 */
function extractPhpInfo(auditContent: string): {
  sourceFile: string;
  contexts: Array<{ 
    name: string; 
    startLine: number; 
    endLine: number; 
    description: string 
  }>;
} {
  // Implémentation pour extraire le nom du fichier PHP et les contextes métier
  const sourceFileMatch = auditContent.match(/# Audit: (.*?)(\r?\n|\s|$)/);
  const sourceFile = sourceFileMatch ? sourceFileMatch[1] : 'unknown.php';
  
  // Extraire les blocs de logique métier (Logic Blocks)
  const contexts = [];
  const logicBlockRegex = /## Logic Blocks:\s*\n\s*\n([\s\S]*?)(?=\n##|$)/;
  const logicBlockMatch = auditContent.match(logicBlockRegex);
  
  if (logicBlockMatch) {
    const logicBlocksSection = logicBlockMatch[1];
    const blockRegex = /(\d+)\.\s+\*\*(.*?)\*\*:\s*Lines\s+(\d+)-(\d+)([\s\S]*?)(?=\n\d+\.\s+\*\*|\n\s*\n|$)/g;
    
    let match;
    while ((match = blockRegex.exec(logicBlocksSection)) !== null) {
      contexts.push({
        name: match[2].trim(),
        startLine: parseInt(match[3], 10),
        endLine: parseInt(match[4], 10),
        description: match[5] ? match[5].trim() : ''
      });
    }
  }
  
  return { sourceFile, contexts };
}

/**
 * Génère les correspondances entre les champs SQL et les modèles Prisma
 */
function generateFieldMappings(
  sqlQueries: Array<{
    query: string;
    line: number;
    tables: string[];
    columns: Array<{ table: string; column: string }>;
  }>,
  schemaMap: any,
  prismaModels: any[]
): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  
  // Pour chaque requête SQL
  for (const query of sqlQueries) {
    // Pour chaque colonne dans la requête
    for (const column of query.columns) {
      // Trouver la table correspondante dans le schéma MySQL
      const mysqlTable = schemaMap.tables.find((t: any) => 
        t.name.toLowerCase() === column.table.toLowerCase()
      );
      
      if (!mysqlTable) continue;
      
      // Trouver la colonne correspondante dans la table MySQL
      const mysqlColumn = mysqlTable.columns.find((c: any) => 
        c.name.toLowerCase() === column.column.toLowerCase()
      );
      
      if (!mysqlColumn) continue;
      
      // Trouver le modèle Prisma correspondant
      const prismaModel = prismaModels.find(model => 
        model.mappedTable === mysqlTable.name || 
        model.name.toLowerCase() === mysqlTable.name.toLowerCase()
      );
      
      if (!prismaModel) continue;
      
      // Trouver le champ Prisma correspondant
      let prismaField = prismaModel.fields.find((f: any) => 
        f.name.toLowerCase() === mysqlColumn.name.toLowerCase() ||
        (f.dbName && f.dbName.toLowerCase() === mysqlColumn.name.toLowerCase())
      );
      
      // Déterminer le type de changement
      let change = 'keep';
      let reason = 'match exact';
      let confidence = 1.0;
      
      if (!prismaField) {
        // Essayer de trouver un champ avec un nom similaire
        const similarFields = prismaModel.fields.filter((f: any) => {
          const similarity = calculateSimilarity(f.name, mysqlColumn.name);
          return similarity > 0.7;
        }).sort((a: any, b: any) => {
          return calculateSimilarity(b.name, mysqlColumn.name) - 
                 calculateSimilarity(a.name, mysqlColumn.name);
        });
        
        if (similarFields.length > 0) {
          prismaField = similarFields[0];
          change = 'rename';
          reason = 'nom similaire';
          confidence = calculateSimilarity(prismaField.name, mysqlColumn.name);
        } else {
          // Aucun champ correspondant trouvé
          change = 'add';
          reason = 'champ manquant dans Prisma';
          confidence = 0.9;
          prismaField = {
            name: mysqlColumn.name,
            type: convertMysqlTypeToPrisma(mysqlColumn.type)
          };
        }
      } else if (prismaField.name !== mysqlColumn.name) {
        change = 'rename';
        reason = 'standardisation';
        confidence = 0.95;
      }
      
      // Ajouter la correspondance
      mappings.push({
        sqlTable: column.table,
        sqlColumn: column.column,
        prismaModel: prismaModel.name,
        prismaField: prismaField.name,
        change,
        reason,
        confidence,
        queryLine: query.line,
        queryContext: query.query.substring(0, 100) + (query.query.length > 100 ? '...' : '')
      });
    }
  }
  
  return mappings;
}

/**
 * Calcule la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Implémentation simplifiée pour l'exemple
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  let distance = 0;
  const minLength = Math.min(str1.length, str2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i]) distance++;
  }
  
  distance += Math.abs(str1.length - str2.length);
  return 1 - distance / maxLength;
}

/**
 * Convertit un type MySQL en type Prisma équivalent
 */
function convertMysqlTypeToPrisma(mysqlType: string): string {
  const typeMapping: { [key: string]: string } = {
    'int': 'Int',
    'tinyint': 'Int',
    'smallint': 'Int',
    'mediumint': 'Int',
    'bigint': 'BigInt',
    'decimal': 'Decimal',
    'float': 'Float',
    'double': 'Float',
    'varchar': 'String',
    'char': 'String',
    'text': 'String',
    'mediumtext': 'String',
    'longtext': 'String',
    'datetime': 'DateTime',
    'timestamp': 'DateTime',
    'date': 'DateTime',
    'time': 'String',
    'year': 'Int',
    'boolean': 'Boolean',
    'json': 'Json'
  };
  
  const baseType = mysqlType.replace(/\(.*\)/, '').toLowerCase();
  return typeMapping[baseType] || 'String';
}

/**
 * Génère les tâches de refactorisation basées sur les correspondances de champs
 */
function generateRefactorTasks(
  phpInfo: any,
  sqlQueries: any[],
  fieldMappings: FieldMapping[]
): RefactorTask[] {
  const refactorTasks: RefactorTask[] = [];
  
  // Regrouper les correspondances par requête SQL
  const queryMappings = sqlQueries.map(query => {
    const mappings = fieldMappings.filter(mapping => mapping.queryLine === query.line);
    return { query, mappings };
  });
  
  // Pour chaque requête avec des correspondances
  for (const { query, mappings } of queryMappings) {
    // Identifier le contexte métier de cette requête
    const context = phpInfo.contexts.find(ctx => 
      query.line >= ctx.startLine && query.line <= ctx.endLine
    );
    
    const contextName = context ? context.name : 'Unknown Context';
    
    // Créer une tâche de refactorisation pour cette requête
    if (mappings.length > 0) {
      const refactorTask: RefactorTask = {
        file: phpInfo.sourceFile,
        line: query.line,
        detected_query: query.query,
        mapping: mappings.map(mapping => ({
          sql_column: mapping.sqlColumn,
          prisma_model: mapping.prismaModel,
          field: mapping.prismaField,
          change: mapping.change as 'keep' | 'rename' | 'add' | 'remove',
          reason: mapping.reason,
          confidence: mapping.confidence
        })),
        context: contextName,
        refactor_suggestion: generateRefactorSuggestion(mappings, contextName)
      };
      
      refactorTasks.push(refactorTask);
    }
  }
  
  return refactorTasks;
}

/**
 * Génère une suggestion de refactorisation basée sur les correspondances
 */
function generateRefactorSuggestion(
  mappings: FieldMapping[],
  context: string
): string {
  const renamings = mappings
    .filter(m => m.change === 'rename')
    .map(m => `'${m.sqlColumn}' en '${m.prismaField}'`);
  
  const additions = mappings
    .filter(m => m.change === 'add')
    .map(m => `'${m.sqlColumn}'`);
  
  let suggestion = '';
  
  if (renamings.length > 0) {
    suggestion += `Modifier accès direct à ${renamings.join(', ')} dans le bloc ${context}. `;
  }
  
  if (additions.length > 0) {
    suggestion += `Ajouter les champs ${additions.join(', ')} au modèle Prisma. `;
  }
  
  return suggestion.trim();
}

/**
 * Génère le patch de migration basé sur les correspondances de champs
 */
function generateMigrationPatch(fieldMappings: FieldMapping[]): MigrationPatch {
  const models: { [key: string]: any } = {};
  
  // Regrouper les modifications par modèle Prisma
  for (const mapping of fieldMappings) {
    if (!models[mapping.prismaModel]) {
      models[mapping.prismaModel] = {
        sourceTable: mapping.sqlTable,
        targetModel: mapping.prismaModel,
        fields: []
      };
    }
    
    // Éviter les doublons
    const existingField = models[mapping.prismaModel].fields.find(
      (f: any) => f.source === mapping.sqlColumn && f.target === mapping.prismaField
    );
    
    if (!existingField) {
      models[mapping.prismaModel].fields.push({
        source: mapping.sqlColumn,
        target: mapping.prismaField,
        type: mapping.change === 'keep' ? 'direct' : 'transform',
        transformation: mapping.change === 'rename' ? 'RENAME' : undefined
      });
    }
  }
  
  return {
    tables: Object.values(models)
  };
}

/**
 * Met à jour le fichier backlog avec les nouvelles tâches
 */
function updateBacklog(backlogPath: string, tasks: RefactorTask[]): void {
  let backlog: { tasks: RefactorTask[] } = { tasks: [] };
  
  // Charger le backlog existant s'il existe
  if (fs.existsSync(backlogPath)) {
    try {
      backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
    } catch (e) {
      console.warn(`⚠️ Erreur lors de la lecture du backlog existant: ${e}`);
    }
  }
  
  // Mettre à jour les tâches existantes ou ajouter de nouvelles tâches
  for (const task of tasks) {
    const existingTaskIndex = backlog.tasks.findIndex(t => 
      t.file === task.file && t.line === task.line
    );
    
    if (existingTaskIndex >= 0) {
      backlog.tasks[existingTaskIndex] = task;
    } else {
      backlog.tasks.push(task);
    }
  }
  
  // Écrire le backlog mis à jour
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
}

/**
 * Met à jour le fichier schema_migration_diff.json avec les nouvelles correspondances
 */
function updateSchemaMigrationDiff(
  diffPath: string, 
  fieldMappings: FieldMapping[]
): void {
  let diff: SchemaMigrationDiff = {
    metadata: {
      source: {
        type: 'MySQL',
        dump_hash: '',
        extracted_at: new Date().toISOString()
      },
      target: {
        type: 'Prisma',
        version: '1.0.0',
        generated_at: new Date().toISOString()
      },
      diff_id: `schema_diff_${Date.now()}`,
      detected_by: 'php-sql-sync-mapper',
      confirmed_by: null
    },
    tables: []
  };
  
  // Charger le diff existant s'il existe
  if (fs.existsSync(diffPath)) {
    try {
      diff = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
    } catch (e) {
      console.warn(`⚠️ Erreur lors de la lecture du diff existant: ${e}`);
    }
  }
  
  // Regrouper les mappings par table
  const tableMap: { [key: string]: any } = {};
  for (const mapping of fieldMappings) {
    if (!tableMap[mapping.sqlTable]) {
      tableMap[mapping.sqlTable] = [];
    }
    
    // Ne pas ajouter de doublons
    const existingMapping = tableMap[mapping.sqlTable].find(
      (m: any) => m.column === mapping.sqlColumn
    );
    
    if (!existingMapping) {
      tableMap[mapping.sqlTable].push({
        column: mapping.sqlColumn,
        change: mapping.change === 'keep' ? 'unchanged' : mapping.change,
        reason: mapping.reason,
        agent: 'php-sql-sync-mapper',
        timestamp: new Date().toISOString()
      });
      
      // Ajouter des propriétés spécifiques selon le type de changement
      const lastMapping = tableMap[mapping.sqlTable][tableMap[mapping.sqlTable].length - 1];
      
      if (mapping.change === 'rename') {
        lastMapping.from = mapping.sqlColumn;
        lastMapping.to = mapping.prismaField;
      } else if (mapping.change === 'add') {
        lastMapping.to_type = convertMysqlTypeToPrisma(mapping.sqlColumn);
      }
    }
  }
  
  // Mettre à jour le diff
  for (const [tableName, columns] of Object.entries(tableMap)) {
    // Vérifier si la table existe déjà
    let table = diff.tables.find(t => t.name === tableName);
    
    if (!table) {
      table = {
        name: tableName,
        columns: []
      };
      diff.tables.push(table);
    }
    
    // Ajouter ou mettre à jour les colonnes
    for (const column of columns as any[]) {
      const existingColumnIndex = table.columns.findIndex(
        (c: any) => c.column === column.column && c.change === column.change
      );
      
      if (existingColumnIndex >= 0) {
        table.columns[existingColumnIndex] = column;
      } else {
        table.columns.push(column);
      }
    }
  }
  
  // Écrire le diff mis à jour
  fs.writeFileSync(diffPath, JSON.stringify(diff, null, 2));
}

// Point d'entrée pour l'exécution CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: npx ts-node php-sql-sync-mapper.ts <audit-file> <schema-map> <prisma-schema> <output-dir>');
    process.exit(1);
  }
  
  mapPhpSqlSync(args[0], args[1], args[2], args[3])
    .catch(err => {
      console.error('❌ Erreur:', err);
      process.exit(1);
    });
}
