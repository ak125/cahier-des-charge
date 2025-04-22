/**
 * mysql-analyzer.ts
 * 
 * Point d'entrée principal de l'analyseur MySQL
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { program } from 'commander';

import { SQLParser } from './core/parser';
import { TypeConverter } from './core/TypeConverter';
import { TableClassifier } from './core/classifier';
import { RelationAnalyzer } from './core/RelationAnalyzer';
import { DebtAnalyzer } from './core/DebtAnalyzer';
import { SchemaAnalyzer } from './core/SchemaAnalyzer';
import { PrismaGenerator } from './core/PrismaGenerator';
import { saveToJson, saveToMarkdown, validateSchema, printColoredMessage } from './utils/helpers';
import { MySQLSchema, DebtIssue } from './models/schema';

// Paramètres par défaut
const DEFAULT_OUTPUT_DIR = './output';

// Configuration de l'interface en ligne de commande
program
  .name('mysql-analyzer')
  .description('Analyseur structurel de schéma MySQL avec génération Prisma')
  .version('1.0.0')
  .requiredOption('-i, --input <file>', 'Fichier SQL à analyser (dump MySQL)')
  .option('-o, --output <dir>', 'Répertoire de sortie', DEFAULT_OUTPUT_DIR)
  .option('-a, --analyze-joins', 'Analyse les JOIN SQL pour détecter les relations implicites', false)
  .option('-p, --generate-prisma', 'Génère un schéma Prisma préliminaire', false)
  .option('-v, --verbose', 'Affiche des informations détaillées pendant l\'analyse', false)
  .parse(process.argv);

const options = program.opts();

/**
 * Fonction principale d'analyse
 */
async function analyzeSchema() {
  try {
    // 1. Lire le fichier SQL
    printColoredMessage(`Lecture du fichier ${options.input}...`, 'info');
    const sqlContent = readSqlFile(options.input);
    
    // 2. Parser le fichier SQL
    printColoredMessage('Parsing du schéma MySQL...', 'info');
    const parser = new SQLParser();
    let schema = parser.parse(sqlContent);
    
    // Valider le schéma
    const validationErrors = validateSchema(schema);
    if (validationErrors.length > 0) {
      printColoredMessage('Avertissements lors de la validation du schéma:', 'warning');
      validationErrors.forEach(error => console.log(`- ${error}`));
    }
    
    // 3. Convertir les types
    printColoredMessage('Conversion des types MySQL vers PostgreSQL/Prisma...', 'info');
    const typeConverter = new TypeConverter();
    schema = typeConverter.convert(schema);
    
    // 4. Classifier les tables
    printColoredMessage('Classification des tables...', 'info');
    const tableClassifier = new TableClassifier();
    schema = tableClassifier.classify(schema);
    
    // 5. Analyser les relations
    printColoredMessage('Analyse des relations entre tables...', 'info');
    const relationAnalyzer = new RelationAnalyzer(options.analyzeJoins);
    schema = await relationAnalyzer.analyze(schema, sqlContent);
    
    // 6. Analyser la dette technique
    printColoredMessage('Détection des problèmes et de la dette technique...', 'info');
    const debtAnalyzer = new DebtAnalyzer();
    const { schema: analyzedSchema, issues } = await debtAnalyzer.analyze(schema);
    
    // 7. Générer les statistiques et le mapping
    printColoredMessage('Génération des statistiques et mappings...', 'info');
    const schemaAnalyzer = new SchemaAnalyzer();
    const stats = schemaAnalyzer.generateStats(analyzedSchema);
    const prismaMapping = schemaAnalyzer.generatePrismaMapping(analyzedSchema);
    
    // 8. Générer le schéma Prisma si demandé
    let prismaSchema = '';
    if (options.generatePrisma) {
      printColoredMessage('Génération du schéma Prisma préliminaire...', 'info');
      const prismaGenerator = new PrismaGenerator();
      prismaSchema = prismaGenerator.generate(analyzedSchema);
    }
    
    // 9. Enregistrer les résultats
    saveResults(analyzedSchema, stats, issues, prismaMapping, prismaSchema);
    
    // 10. Générer un rapport d'analyse en Markdown
    generateAnalysisReport(analyzedSchema, stats, issues);
    
    printColoredMessage('Analyse terminée avec succès!', 'success');
    console.log(`Les résultats ont été enregistrés dans le répertoire ${options.output}`);
    
  } catch (error) {
    printColoredMessage('Erreur lors de l\'analyse:', 'error');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Lit un fichier SQL, avec prise en charge des fichiers compressés .gz
 */
function readSqlFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier ${filePath} n'existe pas.`);
  }
  
  if (filePath.endsWith('.gz')) {
    const compressed = fs.readFileSync(filePath);
    return zlib.gunzipSync(compressed).toString('utf8');
  } else {
    return fs.readFileSync(filePath, 'utf8');
  }
}

/**
 * Enregistre les résultats de l'analyse
 */
function saveResults(
  schema: MySQLSchema, 
  stats: any, 
  issues: DebtIssue[], 
  prismaMapping: any, 
  prismaSchema: string
) {
  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }
  
  // Enregistrer la structure brute extraite
  saveToJson(path.join(options.output, 'mysql_schema_map.json'), schema);
  
  // Enregistrer les statistiques des tables
  saveToJson(path.join(options.output, 'mysql_table_stats.json'), stats);
  
  // Enregistrer les problèmes détectés
  saveToJson(path.join(options.output, 'mysql_debt_issues.json'), issues);
  
  // Enregistrer le mapping vers Prisma
  saveToJson(path.join(options.output, 'mysql_to_prisma_map.json'), prismaMapping);
  
  // Enregistrer le schéma Prisma si généré
  if (prismaSchema) {
    fs.writeFileSync(path.join(options.output, 'schema.prisma.suggestion'), prismaSchema, 'utf8');
  }
}

/**
 * Génère un rapport d'analyse en Markdown
 */
function generateAnalysisReport(schema: MySQLSchema, stats: any, issues: DebtIssue[]) {
  let report = `# Analyse de la structure MySQL
  
## Résumé

- **Nombre total de tables**: ${stats.totalTables}
- **Nombre total de colonnes**: ${stats.totalColumns}
- **Nombre total d'index**: ${stats.totalIndexes}
- **Nombre total de clés étrangères**: ${stats.totalForeignKeys}

## Classification des tables

| Type | Nombre |
|------|--------|
${Object.entries(stats.tablesByType)
  .filter(([_, count]) => (count as number) > 0)
  .map(([type, count]) => `| ${type} | ${count} |`)
  .join('\n')}

## Distribution des types de colonnes

${Object.entries(stats.columnsTypeDistribution)
  .sort(([_, countA], [_, countB]) => (countB as number) - (countA as number))
  .slice(0, 10)
  .map(([type, count]) => `- **${type}**: ${count} occurrences`)
  .join('\n')}

## Analyse de la dette technique

${issues.length === 0 
  ? '**Aucun problème détecté**' 
  : `**${issues.length} problèmes détectés**

### Problèmes critiques

${issues.filter(issue => issue.severity === 'high')
  .map(issue => `- **${issue.tableName}${issue.columnName ? `.${issue.columnName}` : ''}**: ${issue.message}${issue.recommendation ? ` - *${issue.recommendation}*` : ''}`)
  .join('\n') || 'Aucun problème critique détecté'}

### Problèmes moyens

${issues.filter(issue => issue.severity === 'medium')
  .slice(0, 10)  // Limiter à 10 pour la lisibilité
  .map(issue => `- **${issue.tableName}${issue.columnName ? `.${issue.columnName}` : ''}**: ${issue.message}`)
  .join('\n')}
${issues.filter(issue => issue.severity === 'medium').length > 10 ? `Et ${issues.filter(issue => issue.severity === 'medium').length - 10} autres problèmes moyens...` : ''}`}

## Tables principales

${Object.entries(stats.tableStats)
  .filter(([_, tableStats]) => 
    !((tableStats as any).hasSpecialUsage) && 
    Object.keys(schema.tables[tableStats.name].columns).length > 5
  )
  .slice(0, 15)
  .map(([_, tableStats]) => {
    const table = schema.tables[tableStats.name];
    return `### ${tableStats.name} (${table.tableType})

- **Colonnes**: ${tableStats.columnCount}
- **Index**: ${tableStats.indexCount}
- **FK**: ${tableStats.foreignKeyCount}
- **PK**: ${tableStats.primaryKeyColumns.join(', ')}
- **Description**: ${table.comment || 'Non documentée'}
`;
  })
  .join('\n')}

## Suggestions de conversion

${Object.entries(stats.suggestedTypeConversions)
  .sort(([_, countA], [_, countB]) => (countB as number) - (countA as number))
  .map(([conversion, count]) => `- **${conversion}**: ${count} occurrences`)
  .join('\n')}
`;

  saveToMarkdown(path.join(options.output, 'mysql_field_analysis.md'), report);
}

// Lancer l'analyse
analyzeSchema();



















import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import { BusinessAgent, AnalyzerAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/business';































































































































































































































