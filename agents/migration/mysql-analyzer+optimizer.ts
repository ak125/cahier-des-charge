#!/usr/bin/env node
/**
 * mysql-analyzer+optimizer.ts
 * 
 * Analyseur stratégique multi-axe qui décompose un schéma SQL en 4 axes d'analyse 
 * pour générer une base Prisma/PostgreSQL solide et durable.
 * 
 * Orchestration de 4 agents spécialisés:
 * 1. Analyse des relations et normalisation
 * 2. Audit des types SQL
 * 3. Détection de dette technique
 * 4. Génération des modèles Prisma
 * 
 * Usage: ts-node mysql-analyzer+optimizer.ts <chemin-dump.sql> [options]
 * Options:
 *   --output-dir=<dossier>  Dossier de sortie (défaut: ./outputs)
 *   --compressed            Indique que le fichier d'entrée est compressé (*.sql.gz)
 *   --analyze-php=<dossier> Analyse les fichiers PHP pour détecter les relations implicites
 *   --skip-validation       Désactive la validation du schéma Prisma généré
 * 
 * Date: 11 avril 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { program } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as glob from 'glob';

// Importation des composants d'analyse principaux
import { SQLParser } from './mysql-analyzer/core/parser';
import { TableClassifier } from './mysql-analyzer/core/classifier';
import { TypeConverter } from './mysql-analyzer/core/type-converter';
import { RelationAnalyzer } from './mysql-analyzer/core/relation-analyzer';
import { DebtAnalyzer } from './mysql-analyzer/core/debt-analyzer';
import { PrismaGenerator } from './mysql-analyzer/core/prisma-generator';

// Importation des agents spécialisés
import { RelationalNormalizer } from './mysql-analyzer/agents/relational-normalizer';
import { TypeAuditor } from './mysql-analyzer/agents/type-auditor';
import { DebtDetector } from './mysql-analyzer/agents/debt-detector';
import { PrismaModelGenerator } from './mysql-analyzer/agents/prisma-model-generator';

// Modèles et interfaces
import { 
  MySQLSchema, 
  TableInfo, 
  ColumnInfo,
  SchemaStats,
  PrismaMapping,
  DebtIssue,
  TableType,
  RelationIssue,
  TypeConversionMap,
  NormalizationSuggestion,
  DebtScore,
  FieldRenamingSuggestion
} from './mysql-analyzer/models/schema';

// Utilitaires
import { 
  saveToJson, 
  saveToMarkdown, 
  validateSchema,
  printColoredMessage,
  saveToPrismaFile,
  createDiffReport
} from './mysql-analyzer/utils/helpers';

const execPromise = promisify(exec);

// Configuration de la ligne de commande
program
  .version('2.0.0')
  .description('Analyseur stratégique multi-axe SQL → Prisma')
  .argument('<fichier-sql>', 'Chemin vers le fichier SQL à analyser')
  .option('--output-dir <dossier>', 'Dossier de sortie', './outputs')
  .option('--compressed', 'Indique que le fichier d\'entrée est compressé (*.sql.gz)')
  .option('--analyze-php <dossier>', 'Analyse les fichiers PHP pour détecter les JOIN et relations implicites')
  .option('--skip-validation', 'Désactive la validation du schéma Prisma généré')
  .option('--split-models', 'Génère un fichier Prisma par modèle', false)
  .parse(process.argv);

const options = program.opts();
const sqlFilePath = program.args[0];

/**
 * Fonction principale d'analyse multi-axe
 */
async function analyzeAndOptimizeMySQLSchema() {
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
    
    // Créer le dossier pour les modèles séparés si nécessaire
    const splitModelsDir = path.join(outputDir, 'prisma_split_models');
    if (options.splitModels && !fs.existsSync(splitModelsDir)) {
      fs.mkdirSync(splitModelsDir, { recursive: true });
    }
    
    printColoredMessage(`🔍 Analyse stratégique du fichier SQL: ${sqlFilePath}`, 'info');
    
    // Décompresser le fichier si nécessaire
    let effectiveSqlFilePath = sqlFilePath;
    if (options.compressed) {
      effectiveSqlFilePath = path.join(outputDir, 'decompressed.sql');
      await decompressFile(sqlFilePath, effectiveSqlFilePath);
      printColoredMessage(`📂 Fichier décompressé vers ${effectiveSqlFilePath}`, 'success');
    }
    
    // Lire le contenu SQL
    const sqlContent = fs.readFileSync(effectiveSqlFilePath, 'utf8');
    
    // Phase 0: Parsing initial et classification
    printColoredMessage('📊 Phase initiale: extraction du schéma SQL...', 'info');
    const parser = new SQLParser();
    const rawSchema = parser.parse(sqlContent);
    
    const classifier = new TableClassifier();
    const classifiedSchema = classifier.classify(rawSchema);
    
    // Collecte des fichiers PHP pour analyse si demandé
    let phpFiles: string[] = [];
    if (options.analyzePhp) {
      printColoredMessage(`🔍 Recherche de fichiers PHP dans ${options.analyzePhp}...`, 'info');
      phpFiles = await findPhpFiles(options.analyzePhp);
      printColoredMessage(`✅ ${phpFiles.length} fichiers PHP trouvés pour analyse`, 'success');
    }
    
    // Phase 1: Agent 1 - Analyse des relations et normalisation
    printColoredMessage('🔗 Phase 1: Analyse des relations et normalisation...', 'info');
    const relationalNormalizer = new RelationalNormalizer({
      analyzePhp: options.analyzePhp ? true : false,
      phpFiles: phpFiles
    });
    
    const { 
      schema: normalizedSchema, 
      relationIssues, 
      normalizationSuggestions 
    } = await relationalNormalizer.analyze(classifiedSchema, sqlContent);
    
    // Phase 2: Agent 2 - Audit des types SQL
    printColoredMessage('🧬 Phase 2: Audit des types SQL...', 'info');
    const typeAuditor = new TypeAuditor();
    const { 
      schema: typedSchema, 
      conversionMap, 
      fieldTypingIssues 
    } = await typeAuditor.analyze(normalizedSchema);
    
    // Phase 3: Agent 3 - Détection de dette technique
    printColoredMessage('🧹 Phase 3: Détection de dette technique...', 'info');
    const debtDetector = new DebtDetector();
    const { 
      schema: auditedSchema, 
      debtScores, 
      fieldRenamingSuggestions, 
      debtFlags 
    } = await debtDetector.analyze(typedSchema);
    
    // Phase 4: Agent 4 - Génération des modèles Prisma
    printColoredMessage('🛠️ Phase 4: Génération des modèles Prisma...', 'info');
    const prismaModelGenerator = new PrismaModelGenerator();
    const { 
      prismaSchema, 
      prismaEnums, 
      prismaModels, 
      schemaMigrationDiff 
    } = await prismaModelGenerator.generate(auditedSchema);
    
    // Sauvegarder tous les résultats
    printColoredMessage('💾 Sauvegarde des résultats...', 'info');
    
    // Sorties de l'Agent 1
    saveToJson(path.join(outputDir, 'relational_audit.json'), relationIssues);
    saveToMarkdown(path.join(outputDir, 'normalization_suggestions.md'), 
                  generateNormalizationReport(normalizationSuggestions));
    
    // Sorties de l'Agent 2
    saveToJson(path.join(outputDir, 'type_conversion_map.json'), conversionMap);
    saveToMarkdown(path.join(outputDir, 'field_typing_issues.md'), 
                  generateTypingIssuesReport(fieldTypingIssues));
    saveToPrismaFile(path.join(outputDir, 'prisma_enum.suggestion.prisma'), prismaEnums);
    
    // Sorties de l'Agent 3
    saveToJson(path.join(outputDir, 'sql_debt_score.json'), debtScores);
    saveToMarkdown(path.join(outputDir, 'field_renaming_suggestions.md'), 
                  generateRenamingSuggestionsReport(fieldRenamingSuggestions));
    fs.writeFileSync(path.join(outputDir, 'debt_flags.csv'), generateDebtFlagsCSV(debtFlags));
    
    // Sorties de l'Agent 4
    saveToPrismaFile(path.join(outputDir, 'prisma_models.suggestion.prisma'), prismaSchema);
    saveToJson(path.join(outputDir, 'schema_migration_diff.json'), schemaMigrationDiff);
    
    // Si demandé, génère un fichier Prisma par modèle
    if (options.splitModels) {
      for (const [modelName, modelContent] of Object.entries(prismaModels)) {
        saveToPrismaFile(path.join(splitModelsDir, `${modelName}.prisma`), modelContent);
      }
      printColoredMessage(`✅ ${Object.keys(prismaModels).length} modèles Prisma individuels générés dans ${splitModelsDir}`, 'success');
    }
    
    // Validation du schéma Prisma généré si demandé
    if (!options.skipValidation) {
      printColoredMessage('🧪 Validation du schéma Prisma généré...', 'info');
      const validationFile = path.join(outputDir, 'prisma_models.suggestion.prisma');
      
      try {
        await validatePrismaSchema(validationFile);
        printColoredMessage('✅ Le schéma Prisma est valide', 'success');
      } catch (error) {
        printColoredMessage('⚠️ Le schéma Prisma a des erreurs de validation', 'warning');
        printColoredMessage(error.message, 'warning');
      }
    }
    
    // Génération d'un rapport de synthèse global
    generateSummaryReport(
      outputDir,
      {
        tables: Object.keys(auditedSchema.tables).length,
        relationIssues: relationIssues.length,
        fieldTypingIssues: fieldTypingIssues.length,
        debtFlags: debtFlags.length,
        normalizationSuggestions: normalizationSuggestions.length
      },
      debtScores
    );
    
    // Nettoyage si nécessaire
    if (options.compressed && effectiveSqlFilePath !== sqlFilePath) {
      fs.unlinkSync(effectiveSqlFilePath);
    }
    
    printColoredMessage('🚀 Analyse stratégique multi-axe terminée avec succès !', 'success');
    
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
 * Recherche les fichiers PHP dans un répertoire
 */
async function findPhpFiles(directory: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(`${directory}/**/*.php`, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
}

/**
 * Valide un schéma Prisma avec prisma format et prisma validate
 */
async function validatePrismaSchema(schemaPath: string): Promise<void> {
  try {
    // Formater le schéma d'abord
    await execPromise(`npx prisma format --schema "${schemaPath}"`);
    
    // Puis valider le schéma
    await execPromise(`npx prisma validate --schema "${schemaPath}"`);
    
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Génère un rapport de normalisation à partir des suggestions
 */
function generateNormalizationReport(suggestions: NormalizationSuggestion[]): string {
  let markdown = `# Suggestions de Normalisation\n\n`;
  markdown += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  if (suggestions.length === 0) {
    markdown += `## Aucune suggestion de normalisation\n\n`;
    markdown += `Votre schéma est bien normalisé. Aucune modification structurelle majeure n'est nécessaire.\n\n`;
    return markdown;
  }
  
  markdown += `## Décompositions suggérées\n\n`;
  
  const byType = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, NormalizationSuggestion[]>);
  
  // Décomposition en 3NF
  if (byType['3NF_VIOLATION']) {
    markdown += `### Violations de la 3ème forme normale\n\n`;
    
    byType['3NF_VIOLATION'].forEach(suggestion => {
      markdown += `#### Table \`${suggestion.tableName}\`\n\n`;
      markdown += `**Problème**: ${suggestion.description}\n\n`;
      
      markdown += `**Suggestion de décomposition**:\n\n`;
      suggestion.suggestedTables.forEach(table => {
        markdown += `- Nouvelle table \`${table.name}\`:\n`;
        markdown += `  - Colonnes: ${table.columns.join(', ')}\n`;
        markdown += `  - Clé primaire: ${table.primaryKey}\n`;
        if (table.foreignKeys.length > 0) {
          markdown += `  - Clés étrangères: ${table.foreignKeys.map(fk => 
            `${fk.columns} → ${fk.referencedTable}(${fk.referencedColumns})`).join(', ')}\n`;
        }
      });
      
      markdown += `\n**Code SQL suggéré**:\n\n\`\`\`sql\n${suggestion.sql}\n\`\`\`\n\n`;
    });
  }
  
  // Tables redondantes
  if (byType['REDUNDANT_TABLES']) {
    markdown += `### Tables redondantes\n\n`;
    
    byType['REDUNDANT_TABLES'].forEach(suggestion => {
      markdown += `#### Groupes de tables similaires\n\n`;
      markdown += `**Tables concernées**: ${suggestion.tables.join(', ')}\n\n`;
      markdown += `**Problème**: ${suggestion.description}\n\n`;
      markdown += `**Suggestion**: ${suggestion.recommendation}\n\n`;
    });
  }
  
  // Autres suggestions
  const otherTypes = Object.keys(byType).filter(type => 
    !['3NF_VIOLATION', 'REDUNDANT_TABLES'].includes(type));
  
  if (otherTypes.length > 0) {
    markdown += `### Autres suggestions\n\n`;
    
    otherTypes.forEach(type => {
      byType[type].forEach(suggestion => {
        markdown += `#### ${suggestion.tableName}\n\n`;
        markdown += `**Type**: ${type}\n\n`;
        markdown += `**Problème**: ${suggestion.description}\n\n`;
        markdown += `**Suggestion**: ${suggestion.recommendation}\n\n`;
      });
    });
  }
  
  return markdown;
}

/**
 * Génère un rapport sur les problèmes de typage des champs
 */
function generateTypingIssuesReport(issues: any[]): string {
  let markdown = `# Audit des Types SQL\n\n`;
  markdown += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  if (issues.length === 0) {
    markdown += `## Aucun problème de typage détecté\n\n`;
    markdown += `Tous les types sont correctement définis et optimisés.\n\n`;
    return markdown;
  }
  
  markdown += `## Problèmes détectés\n\n`;
  
  const byTable = issues.reduce((acc, issue) => {
    if (!acc[issue.tableName]) {
      acc[issue.tableName] = [];
    }
    acc[issue.tableName].push(issue);
    return acc;
  }, {} as Record<string, any[]>);
  
  Object.entries(byTable).forEach(([tableName, tableIssues]) => {
    markdown += `### Table \`${tableName}\`\n\n`;
    
    markdown += `| Colonne | Type Original | Problème | Suggestion |\n`;
    markdown += `|---------|---------------|----------|------------|\n`;
    
    tableIssues.forEach(issue => {
      markdown += `| ${issue.columnName} | ${issue.originalType} | ${issue.problem} | ${issue.suggestion} |\n`;
    });
    
    markdown += `\n`;
  });
  
  markdown += `## Conversions de types recommandées\n\n`;
  
  // Regrouper par type de conversion
  const byConversion = issues.reduce((acc, issue) => {
    const key = `${issue.originalType} → ${issue.suggestedType}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(issue);
    return acc;
  }, {} as Record<string, any[]>);
  
  markdown += `| Type MySQL | Type PostgreSQL | Type Prisma | Instances | Raison |\n`;
  markdown += `|------------|----------------|-------------|-----------|--------|\n`;
  
  Object.entries(byConversion)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([conversion, convIssues]) => {
      const [mysqlType, postgresType] = conversion.split(' → ');
      const reason = convIssues[0].reason;
      const prismaType = convIssues[0].suggestedPrismaType;
      
      markdown += `| ${mysqlType} | ${postgresType} | ${prismaType} | ${convIssues.length} | ${reason} |\n`;
    });
  
  return markdown;
}

/**
 * Génère un rapport de suggestions de renommage des champs
 */
function generateRenamingSuggestionsReport(suggestions: FieldRenamingSuggestion[]): string {
  let markdown = `# Suggestions de Renommage de Champs\n\n`;
  markdown += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  if (suggestions.length === 0) {
    markdown += `## Aucune suggestion de renommage\n\n`;
    markdown += `Le nommage des champs est cohérent et suit les bonnes pratiques.\n\n`;
    return markdown;
  }
  
  markdown += `## Champs à renommer\n\n`;
  
  const byTable = suggestions.reduce((acc, sugg) => {
    if (!acc[sugg.tableName]) {
      acc[sugg.tableName] = [];
    }
    acc[sugg.tableName].push(sugg);
    return acc;
  }, {} as Record<string, FieldRenamingSuggestion[]>);
  
  Object.entries(byTable).forEach(([tableName, tableSuggestions]) => {
    markdown += `### Table \`${tableName}\`\n\n`;
    
    markdown += `| Nom Actuel | Suggestion | Raison |\n`;
    markdown += `|------------|------------|--------|\n`;
    
    tableSuggestions.forEach(sugg => {
      markdown += `| ${sugg.currentName} | ${sugg.suggestedName} | ${sugg.reason} |\n`;
    });
    
    markdown += `\n`;
  });
  
  markdown += `## Impact du renommage\n\n`;
  markdown += `La modification des noms de champs peut avoir un impact sur le code existant. `;
  markdown += `Assurez-vous d'adapter les requêtes et les mappings après avoir procédé au renommage.\n\n`;
  
  markdown += `### Code SQL pour effectuer les renommages\n\n`;
  
  markdown += `\`\`\`sql\n`;
  Object.entries(byTable).forEach(([tableName, tableSuggestions]) => {
    tableSuggestions.forEach(sugg => {
      markdown += `ALTER TABLE \`${tableName}\` CHANGE COLUMN \`${sugg.currentName}\` \`${sugg.suggestedName}\` ${sugg.columnType};\n`;
    });
  });
  markdown += `\`\`\`\n\n`;
  
  return markdown;
}

/**
 * Génère un fichier CSV des drapeaux de dette technique
 */
function generateDebtFlagsCSV(debtFlags: any[]): string {
  let csv = `table,column,flag_type,severity,description,impact\n`;
  
  debtFlags.forEach(flag => {
    const columnPart = flag.columnName ? flag.columnName : '';
    csv += `"${flag.tableName}","${columnPart}","${flag.type}","${flag.severity}","${flag.description}","${flag.impact}"\n`;
  });
  
  return csv;
}

/**
 * Génère un rapport de synthèse global
 */
function generateSummaryReport(
  outputDir: string, 
  stats: any, 
  debtScores: any[]
): void {
  let markdown = `# Synthèse de l'Analyse Multi-Axe SQL → Prisma\n\n`;
  markdown += `*Généré le ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  markdown += `## Statistiques globales\n\n`;
  markdown += `- Tables analysées: ${stats.tables}\n`;
  markdown += `- Problèmes de relations détectés: ${stats.relationIssues}\n`;
  markdown += `- Problèmes de typage identifiés: ${stats.fieldTypingIssues}\n`;
  markdown += `- Drapeaux de dette technique: ${stats.debtFlags}\n`;
  markdown += `- Suggestions de normalisation: ${stats.normalizationSuggestions}\n\n`;
  
  markdown += `## Scores de dette technique\n\n`;
  
  markdown += `| Table | Score | Gravité | Principales dettes |\n`;
  markdown += `|-------|-------|---------|-------------------|\n`;
  
  debtScores
    .sort((a, b) => a.score - b.score)
    .slice(0, 10)
    .forEach(score => {
      const severity = score.score < 40 ? '🔴 Élevée' : score.score < 70 ? '🟠 Moyenne' : '🟢 Faible';
      markdown += `| ${score.tableName} | ${score.score}/100 | ${severity} | ${score.mainIssues.join(', ')} |\n`;
    });
  
  markdown += `\n`;
  
  markdown += `## Prochaines étapes recommandées\n\n`;
  markdown += `1. **Réviser les suggestions de normalisation** - Examiner et implémenter les décompositions proposées\n`;
  markdown += `2. **Corriger les problèmes de typage** - Adapter les types pour optimiser la base de données\n`;
  markdown += `3. **Nettoyer la dette technique** - Adresser les problèmes prioritaires identifiés\n`;
  markdown += `4. **Finaliser le schéma Prisma** - Ajuster le schéma généré selon vos besoins spécifiques\n`;
  markdown += `5. **Planifier la migration des données** - Préparer les scripts de migration avec les transformations nécessaires\n\n`;
  
  markdown += `## Fichiers générés\n\n`;
  markdown += `- \`relational_audit.json\` - Audit détaillé des relations entre tables\n`;
  markdown += `- \`normalization_suggestions.md\` - Suggestions de décomposition de tables\n`;
  markdown += `- \`type_conversion_map.json\` - Mapping des conversions de types MySQL → PostgreSQL\n`;
  markdown += `- \`field_typing_issues.md\` - Problèmes de typage identifiés\n`;
  markdown += `- \`prisma_enum.suggestion.prisma\` - Enums Prisma générés\n`;
  markdown += `- \`sql_debt_score.json\` - Score de dette technique par table\n`;
  markdown += `- \`field_renaming_suggestions.md\` - Suggestions pour améliorer le nommage\n`;
  markdown += `- \`debt_flags.csv\` - Drapeaux de dette technique au format CSV\n`;
  markdown += `- \`prisma_models.suggestion.prisma\` - Schéma Prisma complet généré\n`;
  markdown += `- \`schema_migration_diff.json\` - Différences entre le schéma MySQL et Prisma\n`;
  
  saveToMarkdown(path.join(outputDir, 'analysis_summary.md'), markdown);
}

// Exécuter la fonction principale
analyzeAndOptimizeMySQLSchema().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});