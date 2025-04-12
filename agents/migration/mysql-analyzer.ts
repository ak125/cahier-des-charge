#!/usr/bin/env node
/**
 * mysql-analyzer.ts
 * 
 * Analyseur sémantique de structure MySQL pour migration vers Prisma/PostgreSQL
 * 
 * Ce script analyse un dump SQL MySQL pour extraire sa structure et produire
 * des fichiers d'analyse facilitant la migration vers Prisma et PostgreSQL.
 * 
 * Usage: ts-node mysql-analyzer.ts <chemin-dump.sql> [options]
 * Options:
 *   --analyze-joins         Active la détection de relations implicites via JOINs
 *   --analyze-enum-data     Extrait les énumérations à partir des données distinctes
 *   --output-dir=<dossier>  Dossier de sortie (défaut: ./outputs)
 *   --compressed            Indique que le fichier d'entrée est compressé (*.sql.gz)
 * 
 * Date: 11 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { program } from 'commander';

// Importation des composants d'analyse
import { SQLParser } from './mysql-analyzer/core/parser';
import { TableClassifier } from './mysql-analyzer/core/classifier';
import { TypeConverter } from './mysql-analyzer/core/type-converter';
import { SchemaAnalyzer } from './mysql-analyzer/core/schema-analyzer';
import { PrismaGenerator } from './mysql-analyzer/core/prisma-generator';
import { RelationAnalyzer } from './mysql-analyzer/core/relation-analyzer';
import { DebtAnalyzer } from './mysql-analyzer/core/debt-analyzer';

// Modèles et interfaces
import { 
  MySQLSchema, 
  TableInfo, 
  ColumnInfo,
  SchemaStats, 
  FieldAnalysis,
  PrismaMapping,
  DebtIssue,
  TableType
} from './mysql-analyzer/models/schema';

// Utilitaires
import { 
  saveToJson, 
  saveToMarkdown, 
  validateSchema,
  calculateTableScore,
  printColoredMessage 
} from './mysql-analyzer/utils/helpers';

// Configuration de la ligne de commande
program
  .version('1.0.0')
  .description('Analyseur sémantique de structure MySQL pour migration vers Prisma/PostgreSQL')
  .argument('<fichier-sql>', 'Chemin vers le fichier SQL à analyser')
  .option('--analyze-joins', 'Active la détection de relations implicites via JOINs')
  .option('--analyze-enum-data', 'Extrait les énumérations à partir des données distinctes')
  .option('--output-dir <dossier>', 'Dossier de sortie', './outputs')
  .option('--compressed', 'Indique que le fichier d\'entrée est compressé (*.sql.gz)')
  .parse(process.argv);

const options = program.opts();
const sqlFilePath = program.args[0];

/**
 * Fonction principale d'analyse
 */
async function analyzeMySQLSchema() {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(sqlFilePath)) {
      printColoredMessage(`❌ Le fichier ${sqlFilePath} n'existe pas`, 'error');
      process.exit(1);
    }
    
    // Préparer le dossier de sortie
    const outputDir = path.resolve(options.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    printColoredMessage(`🔍 Analyse du fichier SQL: ${sqlFilePath}`, 'info');
    
    // Décompresser le fichier si nécessaire
    let effectiveSqlFilePath = sqlFilePath;
    if (options.compressed) {
      effectiveSqlFilePath = path.join(outputDir, 'decompressed.sql');
      await decompressFile(sqlFilePath, effectiveSqlFilePath);
      printColoredMessage(`📂 Fichier décompressé vers ${effectiveSqlFilePath}`, 'success');
    }
    
    // Lire le contenu SQL
    const sqlContent = fs.readFileSync(effectiveSqlFilePath, 'utf8');
    
    // 1. Parsing des structures SQL
    printColoredMessage('1️⃣ Parsing syntaxique...', 'info');
    const parser = new SQLParser();
    const sqlSchemaRaw = parser.parse(sqlContent);
    
    // 2. Classification des tables
    printColoredMessage('2️⃣ Classification des tables...', 'info');
    const classifier = new TableClassifier();
    const classifiedSchema = classifier.classify(sqlSchemaRaw);
    
    // 3. Conversion des types
    printColoredMessage('3️⃣ Conversion des types MySQL → PostgreSQL/Prisma...', 'info');
    const typeConverter = new TypeConverter();
    const convertedSchema = typeConverter.convert(classifiedSchema);
    
    // 4. Analyse des relations et normalisation
    printColoredMessage('4️⃣ Analyse des relations et normalisation...', 'info');
    const relationAnalyzer = new RelationAnalyzer(options.analyzeJoins);
    const normalizedSchema = await relationAnalyzer.analyze(convertedSchema, sqlContent);
    
    // 5. Analyse de la dette technique
    printColoredMessage('5️⃣ Détection de la dette technique...', 'info');
    const debtAnalyzer = new DebtAnalyzer();
    const { schema: analyzedSchema, issues: debtIssues } = await debtAnalyzer.analyze(normalizedSchema);
    
    // 6. Génération du schéma Prisma
    printColoredMessage('6️⃣ Génération du schéma Prisma...', 'info');
    const prismaGenerator = new PrismaGenerator();
    const prismaSchema = prismaGenerator.generate(analyzedSchema);
    
    // 7. Calculer les statistiques et produire les fichiers de sortie
    printColoredMessage('7️⃣ Production des fichiers d\'analyse...', 'info');
    const schemaAnalyzer = new SchemaAnalyzer();
    const stats = schemaAnalyzer.generateStats(analyzedSchema);
    
    // 8. Préparer le mapping Prisma
    const prismaMapping = schemaAnalyzer.generatePrismaMapping(analyzedSchema);
    
    // Générer les scores de qualité par table
    const tableScores = Object.entries(analyzedSchema.tables).reduce((scores, [tableName, tableInfo]) => {
      scores[tableName] = calculateTableScore(tableInfo, debtIssues);
      return scores;
    }, {} as Record<string, { score: number; details: string }>);
    
    // Sauvegarder les résultats
    saveToJson(path.join(outputDir, 'mysql_schema_map.json'), analyzedSchema);
    printColoredMessage('✅ mysql_schema_map.json généré', 'success');
    
    saveToJson(path.join(outputDir, 'mysql_table_stats.json'), stats);
    printColoredMessage('✅ mysql_table_stats.json généré', 'success');
    
    saveToJson(path.join(outputDir, 'mysql_to_prisma_map.json'), prismaMapping);
    printColoredMessage('✅ mysql_to_prisma_map.json généré', 'success');
    
    // Générer l'analyse textuelle des champs
    const fieldAnalysisMd = generateFieldAnalysisMarkdown(analyzedSchema, debtIssues, tableScores);
    saveToMarkdown(path.join(outputDir, 'mysql_field_analysis.md'), fieldAnalysisMd);
    printColoredMessage('✅ mysql_field_analysis.md généré', 'success');
    
    // Sauvegarder le schéma Prisma généré
    fs.writeFileSync(path.join(outputDir, 'schema.prisma.suggestion'), prismaSchema);
    printColoredMessage('✅ schema.prisma.suggestion généré', 'success');
    
    // Afficher le résumé
    printSummary(analyzedSchema, stats, tableScores);
    
    if (options.compressed && effectiveSqlFilePath !== sqlFilePath) {
      fs.unlinkSync(effectiveSqlFilePath); // Nettoyer le fichier temporaire
    }
    
    printColoredMessage('🚀 Analyse terminée avec succès !', 'success');
  } catch (error) {
    printColoredMessage(`❌ Erreur lors de l'analyse: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Décompresse un fichier gzip
 */
async function decompressFile(inputPath: string, outputPath: string): Promise<void> {
  const gunzip = createGunzip();
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);
  
  await pipeline(source, gunzip, destination);
}

/**
 * Génère le rapport d'analyse au format Markdown
 */
function generateFieldAnalysisMarkdown(
  schema: MySQLSchema,
  issues: DebtIssue[],
  tableScores: Record<string, { score: number; details: string }>
): string {
  let markdown = `# Analyse de la Structure MySQL\n\n`;
  markdown += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Résumé global
  markdown += `## Résumé global\n\n`;
  markdown += `- **Nombre total de tables**: ${Object.keys(schema.tables).length}\n`;
  markdown += `- **Problèmes de dette technique identifiés**: ${issues.length}\n\n`;
  
  // Scores de qualité
  markdown += `## 📈 Scores de qualité par table\n\n`;
  markdown += `| Table | Score | Détail |\n`;
  markdown += `|-------|-------|--------|\n`;
  
  Object.entries(tableScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .forEach(([tableName, { score, details }]) => {
      const stars = '⭐️'.repeat(Math.round(score));
      markdown += `| ${tableName} | ${stars} | ${details} |\n`;
    });
  
  markdown += `\n`;
  
  // Problèmes identifiés
  markdown += `## 🧱 Problèmes et Dette Technique\n\n`;
  
  // Grouper les problèmes par table
  const issuesByTable = issues.reduce((acc, issue) => {
    if (!acc[issue.tableName]) {
      acc[issue.tableName] = [];
    }
    acc[issue.tableName].push(issue);
    return acc;
  }, {} as Record<string, DebtIssue[]>);
  
  Object.entries(issuesByTable).forEach(([tableName, tableIssues]) => {
    markdown += `### Table: ${tableName}\n\n`;
    
    tableIssues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟠' : '🟡';
      markdown += `${icon} **${issue.type}**: ${issue.message}\n`;
      if (issue.recommendation) {
        markdown += `   - *Recommandation*: ${issue.recommendation}\n`;
      }
      markdown += `\n`;
    });
  });
  
  // Détection des relations
  markdown += `## 🔗 Relations Détectées\n\n`;
  
  Object.entries(schema.tables).forEach(([tableName, table]) => {
    const relations = table.relations || [];
    if (relations.length > 0) {
      markdown += `### ${tableName}\n\n`;
      relations.forEach(relation => {
        markdown += `- **${relation.type}** avec \`${relation.targetTable}\` `;
        markdown += `(${relation.sourceColumn} → ${relation.targetColumn})\n`;
        if (relation.isImplicit) {
          markdown += `  - *Relation implicite détectée*\n`;
        }
      });
      markdown += `\n`;
    }
  });
  
  // Enums détectés
  markdown += `## 🔁 Enums Détectés\n\n`;
  
  const enumColumns = Object.entries(schema.tables)
    .flatMap(([tableName, table]) => 
      Object.entries(table.columns)
        .filter(([, column]) => column.suggestedPrismaType === 'Enum')
        .map(([columnName, column]) => ({ tableName, columnName, column }))
    );
  
  if (enumColumns.length > 0) {
    enumColumns.forEach(({ tableName, columnName, column }) => {
      markdown += `- **${tableName}.${columnName}**: `;
      markdown += `Valeurs détectées: ${column.enumValues?.join(', ') || 'Non spécifiées'}\n`;
    });
  } else {
    markdown += `Aucun enum détecté dans le schéma.\n`;
  }
  
  markdown += `\n`;
  
  // Champs obsolètes
  markdown += `## 🧮 Champs potentiellement obsolètes\n\n`;
  
  const obsoleteColumns = issues
    .filter(issue => issue.type === 'OBSOLETE_COLUMN')
    .map(issue => ({
      tableName: issue.tableName,
      columnName: issue.columnName as string,
      reason: issue.message
    }));
  
  if (obsoleteColumns.length > 0) {
    markdown += `| Table | Colonne | Raison |\n`;
    markdown += `|-------|---------|--------|\n`;
    
    obsoleteColumns.forEach(({ tableName, columnName, reason }) => {
      markdown += `| ${tableName} | ${columnName} | ${reason} |\n`;
    });
  } else {
    markdown += `Aucun champ obsolète détecté.\n`;
  }
  
  markdown += `\n`;
  
  // Recommandations générales
  markdown += `## 💡 Recommandations générales\n\n`;
  
  // Regrouper les recommandations par type
  const recommendationsByType = issues
    .filter(issue => issue.recommendation)
    .reduce((acc, issue) => {
      const key = `${issue.type}:${issue.recommendation}`;
      if (!acc[key]) {
        acc[key] = { type: issue.type, recommendation: issue.recommendation as string, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { type: string; recommendation: string; count: number }>);
  
  Object.values(recommendationsByType)
    .sort((a, b) => b.count - a.count)
    .forEach(({ type, recommendation, count }) => {
      markdown += `- **${type}** (${count} occurrences): ${recommendation}\n`;
    });
  
  return markdown;
}

/**
 * Affiche un résumé de l'analyse
 */
function printSummary(
  schema: MySQLSchema,
  stats: SchemaStats,
  tableScores: Record<string, { score: number; details: string }>
): void {
  console.log('\n📊 Résumé de l\'analyse:');
  console.log(`- Tables analysées: ${Object.keys(schema.tables).length}`);
  
  const tablesWithIssues = Object.values(tableScores)
    .filter(({ score }) => score < 3)
    .length;
  
  console.log(`- Tables avec problèmes: ${tablesWithIssues}`);
  
  // Top 3 des meilleures tables
  console.log('\n🏆 Top 3 des meilleures tables:');
  Object.entries(tableScores)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3)
    .forEach(([tableName, { score, details }], index) => {
      const stars = '⭐️'.repeat(Math.round(score));
      console.log(`${index + 1}. ${tableName} - ${stars} - ${details}`);
    });
  
  // Tables problématiques
  console.log('\n⚠️ Tables nécessitant attention:');
  Object.entries(tableScores)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .forEach(([tableName, { score, details }], index) => {
      const stars = '⭐️'.repeat(Math.round(score));
      console.log(`${index + 1}. ${tableName} - ${stars} - ${details}`);
    });
}

// Exécuter la fonction principale
analyzeMySQLSchema().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});