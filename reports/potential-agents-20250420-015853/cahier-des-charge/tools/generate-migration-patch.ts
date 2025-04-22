#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { program } from 'commander';
import { parse as parseMarkdown } from 'marked';

// Types
interface FieldMapping {
  sql_column: string;
  legacy_php_var: string;
  prisma_model: string;
  prisma_field: string;
  change_type: 'keep' | 'rename' | 'add' | 'remove';
  reason: string;
  confidence: number;
  verified: boolean;
}

interface FileMigrationPatch {
  source_file: string;
  status: 'pending_review' | 'in_progress' | 'validated' | 'completed';
  reviewer: string | null;
  last_update: string;
  mappings: FieldMapping[];
}

interface MigrationPatch {
  migration_batch: string;
  generated_at: string;
  files: FileMigrationPatch[];
}

interface SchemaMap {
  tables: {
    name: string;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      primary?: boolean;
      references?: {
        table: string;
        column: string;
      };
    }[];
  }[];
}

interface AuditFile {
  file: string;
  queries: {
    query: string;
    line: number;
    variables: string[];
    tables: string[];
    columns: { table: string; column: string }[];
  }[];
  blocks: {
    name: string;
    startLine: number;
    endLine: number;
    description: string;
  }[];
}

// Init commander
program
  .name('generate-migration-patch')
  .description('Generate migration patch files for PHP to Prisma/NestJS migration')
  .version('1.0.0');

program
  .option('-f, --from <dir>', 'Source directory or file')
  .option('-s, --schema <file>', 'Schema map JSON file', 'schema_map.json')
  .option('-p, --prisma <file>', 'Prisma schema file', 'schema.prisma')
  .option('-o, --output <file>', 'Output file', 'migration_patch.json')
  .option('-a, --audit <dir>', 'Directory with audit files', 'audit')
  .option('-m, --merge', 'Merge with existing migration patch', false)
  .option('-b, --batch <name>', 'Migration batch name', `batch_${new Date().toISOString().slice(0, 10)}`);

program.parse();

const options = program.opts();

// Main execution
async function main() {
  console.log('🔍 Generating migration patch...');

  // Check if needed files exist
  if (!fs.existsSync(options.schema)) {
    console.error(`❌ Schema map file not found: ${options.schema}`);
    process.exit(1);
  }

  // Load schema map
  const schemaMap: SchemaMap = JSON.parse(fs.readFileSync(options.schema, 'utf8'));
  console.log(`✅ Loaded schema map from ${options.schema}`);

  // Initialize patch
  let migrationPatch: MigrationPatch = {
    migration_batch: options.batch,
    generated_at: new Date().toISOString(),
    files: []
  };

  // Load existing patch if merge option is enabled
  if (options.merge && fs.existsSync(options.output)) {
    try {
      migrationPatch = JSON.parse(fs.readFileSync(options.output, 'utf8'));
      console.log(`✅ Loaded existing migration patch from ${options.output}`);
    } catch (error) {
      console.warn(`⚠️ Could not parse existing migration patch: ${error}`);
    }
  }

  // Process files
  const sourcePattern = options.from.endsWith('.php') 
    ? options.from 
    : path.join(options.from, '**', '*.php');
  
  const sourceFiles = glob.sync(sourcePattern);
  
  if (sourceFiles.length === 0) {
    console.warn(`⚠️ No PHP files found matching: ${sourcePattern}`);
    process.exit(0);
  }

  console.log(`🔍 Found ${sourceFiles.length} PHP files to process`);

  // Process each file
  for (const phpFile of sourceFiles) {
    const auditFile = await loadAuditFile(phpFile, options.audit);
    
    if (!auditFile) {
      console.warn(`⚠️ No audit file found for ${phpFile}, skipping...`);
      continue;
    }

    console.log(`🔍 Processing ${phpFile}...`);
    const filePatch = await generateFilePatch(phpFile, auditFile, schemaMap);
    
    // Update or add file patch
    const existingFileIndex = migrationPatch.files.findIndex(f => f.source_file === phpFile);
    if (existingFileIndex >= 0) {
      migrationPatch.files[existingFileIndex] = mergeFilePatches(
        migrationPatch.files[existingFileIndex],
        filePatch
      );
    } else {
      migrationPatch.files.push(filePatch);
    }
  }

  // Sort files alphabetically
  migrationPatch.files.sort((a, b) => a.source_file.localeCompare(b.source_file));

  // Update generation timestamp
  migrationPatch.generated_at = new Date().toISOString();

  // Write the migration patch
  fs.writeFileSync(options.output, JSON.stringify(migrationPatch, null, 2));
  console.log(`✅ Migration patch written to ${options.output}`);

  // If requested, merge with schema_migration_diff.json
  if (fs.existsSync('schema_migration_diff.json')) {
    await mergeSchemaMigrationDiff(migrationPatch, 'schema_migration_diff.json');
    console.log('✅ Updated schema_migration_diff.json with mappings');
  }
}

/**
 * Load audit file for a PHP file
 */
async function loadAuditFile(phpFile: string, auditDir: string): Promise<AuditFile | null> {
  const baseName = path.basename(phpFile, '.php');
  const auditFilePath = path.join(auditDir, `${baseName}.audit.md`);
  
  if (!fs.existsSync(auditFilePath)) {
    return null;
  }

  try {
    const auditContent = fs.readFileSync(auditFilePath, 'utf8');
    return parseAuditFile(auditContent, phpFile);
  } catch (error) {
    console.error(`❌ Error parsing audit file for ${phpFile}: ${error}`);
    return null;
  }
}

/**
 * Parse audit file content
 */
function parseAuditFile(content: string, phpFile: string): AuditFile {
  const audit: AuditFile = {
    file: phpFile,
    queries: [],
    blocks: []
  };

  // Extract SQL queries
  const sqlSectionRegex = /## SQL Queries\s*\n\s*\n```php\s*\n([\s\S]*?)```/g;
  let sqlSectionMatch;
  
  while ((sqlSectionMatch = sqlSectionRegex.exec(content)) !== null) {
    const sqlSection = sqlSectionMatch[1];
    const queries = extractSQLQueries(sqlSection);
    audit.queries.push(...queries);
  }

  // Extract logic blocks
  const blocksRegex = /## Logic Blocks:\s*\n\s*\n([\s\S]*?)(?=\n##|$)/;
  const blocksMatch = content.match(blocksRegex);
  
  if (blocksMatch) {
    const blocksSection = blocksMatch[1];
    const blockRegex = /(\d+)\.\s+\*\*(.*?)\*\*:\s*Lines\s+(\d+)-(\d+)([\s\S]*?)(?=\n\d+\.\s+\*\*|\n\s*\n|$)/g;
    
    let match;
    while ((match = blockRegex.exec(blocksSection)) !== null) {
      audit.blocks.push({
        name: match[2].trim(),
        startLine: parseInt(match[3], 10),
        endLine: parseInt(match[4], 10),
        description: match[5] ? match[5].trim() : ''
      });
    }
  }

  return audit;
}

/**
 * Extract SQL queries from PHP code section
 */
function extractSQLQueries(code: string): Array<{
  query: string;
  line: number;
  variables: string[];
  tables: string[];
  columns: Array<{ table: string; column: string }>;
}> {
  const queries: Array<{
    query: string;
    line: number;
    variables: string[];
    tables: string[];
    columns: Array<{ table: string; column: string }>;
  }> = [];

  // Simple regex-based extraction for the example
  // A real implementation would need more robust parsing
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract line number if present
    let lineNumber = i + 1;
    const lineMatch = line.match(/\/\/ Line (\d+)/);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }
    
    // Identify SQL queries
    if (
      line.includes('SELECT') || 
      line.includes('INSERT') || 
      line.includes('UPDATE') || 
      line.includes('DELETE')
    ) {
      // Basic extraction of query, tables, and columns
      const query = line;
      
      // Extract tables (simplified)
      const tables: string[] = [];
      const fromMatch = query.match(/FROM\s+([a-z0-9_]+)/i);
      if (fromMatch) {
        tables.push(fromMatch[1]);
      }
      
      const joinMatch = query.match(/JOIN\s+([a-z0-9_]+)/i);
      if (joinMatch) {
        tables.push(joinMatch[1]);
      }
      
      // Extract columns (simplified)
      const columns: Array<{ table: string; column: string }> = [];
      
      // For SELECT queries
      if (query.includes('SELECT')) {
        const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i);
        if (selectMatch) {
          const columnsPart = selectMatch[1];
          
          if (columnsPart.trim() === '*' && tables.length > 0) {
            columns.push({ table: tables[0], column: '*' });
          } else {
            const columnItems = columnsPart.split(',');
            columnItems.forEach(col => {
              const colTrimmed = col.trim();
              
              // Handle table.column format
              const tableColMatch = colTrimmed.match(/([a-z0-9_]+)\.([a-z0-9_*]+)/i);
              if (tableColMatch) {
                columns.push({ table: tableColMatch[1], column: tableColMatch[2] });
              } 
              // Handle column only (use first table as default)
              else if (tables.length > 0) {
                columns.push({ table: tables[0], column: colTrimmed });
              }
            });
          }
        }
      }
      
      // Extract variables (simplified)
      const variables: string[] = [];
      const varMatches = query.match(/\$[a-z0-9_]+/gi);
      if (varMatches) {
        varMatches.forEach(v => {
          if (!variables.includes(v)) {
            variables.push(v);
          }
        });
      }
      
      queries.push({ query, line: lineNumber, variables, tables, columns });
    }
  }
  
  return queries;
}

/**
 * Generate migration patch for a file
 */
async function generateFilePatch(
  phpFile: string, 
  auditFile: AuditFile, 
  schemaMap: SchemaMap
): Promise<FileMigrationPatch> {
  const filePatch: FileMigrationPatch = {
    source_file: phpFile,
    status: 'pending_review',
    reviewer: null,
    last_update: new Date().toISOString(),
    mappings: []
  };

  // Process SQL queries to extract mappings
  for (const query of auditFile.queries) {
    // For each column in the query
    for (const column of query.columns) {
      if (column.column === '*') continue;
      
      // Find corresponding table in schema map
      const table = schemaMap.tables.find(t => 
        t.name.toLowerCase() === column.table.toLowerCase()
      );
      
      if (!table) continue;
      
      // Find corresponding column in table
      const schemaColumn = table.columns.find(c => 
        c.name.toLowerCase() === column.column.toLowerCase()
      );
      
      if (!schemaColumn) continue;
      
      // Determine Prisma model and field names
      const prismaModel = getPrismaModelFromTable(table.name);
      const prismaField = getPrismaFieldFromColumn(column.column);
      
      // Determine change type
      let changeType: 'keep' | 'rename' | 'add' | 'remove' = 'keep';
      let reason = 'match exact';
      let confidence = 1.0;
      
      if (prismaField !== column.column) {
        changeType = 'rename';
        reason = determineChangeReason(column.column, prismaField);
        confidence = calculateConfidence(column.column, prismaField);
      }
      
      // Determine PHP variable (simplified)
      const legacyPhpVar = `$row['${column.column}']`;
      
      // Add mapping if not already exists
      const existingMapping = filePatch.mappings.find(m => 
        m.sql_column === column.column && m.prisma_model === prismaModel
      );
      
      if (!existingMapping) {
        filePatch.mappings.push({
          sql_column: column.column,
          legacy_php_var: legacyPhpVar,
          prisma_model: prismaModel,
          prisma_field: prismaField,
          change_type: changeType,
          reason,
          confidence,
          verified: false
        });
      }
    }
  }

  return filePatch;
}

/**
 * Get Prisma model name from table name
 */
function getPrismaModelFromTable(tableName: string): string {
  // Simple implementation - would be replaced by a proper mapping in real use
  // Examples:
  // users -> User
  // order_items -> OrderItem
  
  const parts = tableName.toLowerCase().split('_');
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

/**
 * Get Prisma field name from column name
 */
function getPrismaFieldFromColumn(columnName: string): string {
  // Common transformations:
  // id_user -> userId (foreign keys)
  // first_name -> firstName (camelCase)
  // keep id as id
  
  if (columnName === 'id') return 'id';
  
  // Foreign key pattern: id_table or table_id
  const foreignKeyMatch = columnName.match(/^(?:id_([a-z0-9_]+)|([a-z0-9_]+)_id)$/i);
  if (foreignKeyMatch) {
    const tableName = foreignKeyMatch[1] || foreignKeyMatch[2];
    return `${tableName.toLowerCase()}Id`;
  }
  
  // General snake_case to camelCase
  const parts = columnName.split('_');
  return parts[0] + parts.slice(1).map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

/**
 * Determine reason for field name change
 */
function determineChangeReason(sqlColumn: string, prismaField: string): string {
  // Foreign key pattern
  if (sqlColumn.includes('id_') || sqlColumn.endsWith('_id')) {
    return 'convention camelCase';
  }
  
  // French to English common terms
  const frenchTerms: Record<string, string> = {
    'nom': 'name',
    'prenom': 'firstName',
    'prix': 'price',
    'quantite': 'quantity',
    'date': 'date',
    'utilisateur': 'user',
    'commande': 'order'
  };
  
  for (const [french, english] of Object.entries(frenchTerms)) {
    if (sqlColumn.includes(french) && prismaField.includes(english)) {
      return 'standardisation anglais';
    }
  }
  
  // Snake case to camel case
  if (sqlColumn.includes('_') && !prismaField.includes('_')) {
    return 'convention camelCase';
  }
  
  return 'standardisation';
}

/**
 * Calculate confidence score for field mapping
 */
function calculateConfidence(sqlColumn: string, prismaField: string): number {
  // Exact match
  if (sqlColumn === prismaField) return 1.0;
  
  // Simple implementation - a real one would use more sophisticated logic
  // like Levenshtein distance, semantic similarity, etc.
  
  // High confidence for:
  // - Foreign keys with standard patterns (id_user -> userId)
  if (
    (sqlColumn.startsWith('id_') && prismaField.endsWith('Id')) ||
    (sqlColumn.endsWith('_id') && prismaField.endsWith('Id'))
  ) {
    return 0.95;
  }
  
  // Medium-high confidence for:
  // - Snake case to camel case (first_name -> firstName)
  if (sqlColumn.includes('_') && !prismaField.includes('_')) {
    const snakeParts = sqlColumn.split('_');
    const camelParts = [prismaField[0]];
    
    let lastIndex = 0;
    for (let i = 1; i < prismaField.length; i++) {
      if (prismaField[i] === prismaField[i].toUpperCase()) {
        camelParts.push(prismaField.substring(lastIndex + 1, i));
        lastIndex = i;
      }
    }
    camelParts.push(prismaField.substring(lastIndex + 1));
    
    if (snakeParts.length === camelParts.filter(Boolean).length) {
      return 0.9;
    }
  }
  
  // Lower confidence for more significant changes
  return 0.8;
}

/**
 * Merge two file patches
 */
function mergeFilePatches(
  existing: FileMigrationPatch, 
  newPatch: FileMigrationPatch
): FileMigrationPatch {
  // Keep existing status and reviewer
  const merged: FileMigrationPatch = {
    ...newPatch,
    status: existing.status,
    reviewer: existing.reviewer,
    mappings: []
  };
  
  // Merge mappings
  for (const newMapping of newPatch.mappings) {
    const existingMapping = existing.mappings.find(m => 
      m.sql_column === newMapping.sql_column && 
      m.prisma_model === newMapping.prisma_model
    );
    
    if (existingMapping) {
      // Keep verification status from existing mapping
      merged.mappings.push({
        ...newMapping,
        verified: existingMapping.verified
      });
    } else {
      merged.mappings.push(newMapping);
    }
  }
  
  // Include any mappings from the existing patch that aren't in the new one
  for (const existingMapping of existing.mappings) {
    const includedInNew = merged.mappings.some(m => 
      m.sql_column === existingMapping.sql_column && 
      m.prisma_model === existingMapping.prisma_model
    );
    
    if (!includedInNew) {
      merged.mappings.push(existingMapping);
    }
  }
  
  return merged;
}

/**
 * Merge migration patch with schema_migration_diff.json
 */
async function mergeSchemaMigrationDiff(
  patch: MigrationPatch, 
  diffFile: string
): Promise<void> {
  if (!fs.existsSync(diffFile)) {
    console.warn(`⚠️ Schema migration diff file not found: ${diffFile}`);
    return;
  }
  
  try {
    const schemaDiff = JSON.parse(fs.readFileSync(diffFile, 'utf8'));
    
    // Group mappings by table
    const tablesMappings: Record<string, any[]> = {};
    
    for (const file of patch.files) {
      for (const mapping of file.mappings) {
        // Find table name from model name (simplified)
        const tableName = mapping.prisma_model.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1);
        
        if (!tablesMappings[tableName]) {
          tablesMappings[tableName] = [];
        }
        
        // Don't add duplicates
        const exists = tablesMappings[tableName].some(m => 
          m.column === mapping.sql_column
        );
        
        if (!exists) {
          tablesMappings[tableName].push({
            column: mapping.sql_column,
            change: mapping.change_type === 'keep' ? 'unchanged' : mapping.change_type,
            reason: mapping.reason,
            agent: 'generate-migration-patch',
            timestamp: new Date().toISOString()
          });
          
          // Add specific fields based on change type
          const lastItem = tablesMappings[tableName][tablesMappings[tableName].length - 1];
          
          if (mapping.change_type === 'rename') {
            lastItem.from = mapping.sql_column;
            lastItem.to = mapping.prisma_field;
          }
        }
      }
    }
    
    // Update schema diff
    for (const [tableName, columns] of Object.entries(tablesMappings)) {
      // Find or create table entry
      let tableEntry = schemaDiff.tables.find((t: any) => t.name === tableName);
      
      if (!tableEntry) {
        tableEntry = { name: tableName, columns: [] };
        schemaDiff.tables.push(tableEntry);
      }
      
      // Add or update columns
      for (const column of columns) {
        const existingColumn = tableEntry.columns.findIndex(
          (c: any) => c.column === column.column
        );
        
        if (existingColumn >= 0) {
          tableEntry.columns[existingColumn] = {
            ...tableEntry.columns[existingColumn],
            ...column
          };
        } else {
          tableEntry.columns.push(column);
        }
      }
    }
    
    // Update metadata
    schemaDiff.metadata.updated_at = new Date().toISOString();
    
    // Write updated schema diff
    fs.writeFileSync(diffFile, JSON.stringify(schemaDiff, null, 2));
  } catch (error) {
    console.error(`❌ Error merging with schema migration diff: ${error}`);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
