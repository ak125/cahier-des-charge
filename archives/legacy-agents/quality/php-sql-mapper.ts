/**
 * PHP SQL Mapper (sync-mapper.ts v2)
 *
 * Assure une synchronisation complète entre les champs SQL utilisés dans
 * le code PHP legacy et les modèles Prisma générés pour PostgreSQL.
 */

import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';
import { parse as phpParse } from './php-parserstructure-agent';
import { PrismaSchemaParser } from './utils/prisma-schema-parserstructure-agent';

// Types pour les résultats du mapping
interface FieldMapping {
  phpVariable: string;
  sqlField: string;
  prismaField: string;
  status: 'mapped' | 'renamed' | 'missing_in_prisma' | 'unused_in_php';
  confidence: number;
}

interface ModelMapping {
  [fieldName: string]: string | { mappedTo: string; status: string; confidence: number };
}

interface MappingReport {
  timestamp: string;
  phpFile: string;
  prismaSchema: string;
  models: {
    [modelName: string]: ModelMapping;
  };
  unmappedPhpFields: string[];
  unusedPrismaFields: Array<{
    model: string;
    field: string;
  }>;
}

interface MigrationAction {
  type: 'rename' | 'add' | 'remove' | 'keep';
  model: string;
  fromField?: string;
  toField?: string;
  reason: string;
}

interface MigrationPatch {
  timestamp: string;
  phpFile: string;
  actions: MigrationAction[];
}

/**
 * Analyser un fichier PHP et le mapper avec un schéma Prisma
 */
export async function mapPhpSqlFields(
  phpFilePath: string,
  prismaSchemaPath: string,
  outputDir: string,
  options = { updateAudit: true, updateBacklog: true }
): Promise<void> {
  console.log(`📊 Analysing PHP file: ${phpFilePath}`);

  // 1. Lire les fichiers d'entrée
  const phpContent = fs.readFileSync(phpFilePath, 'utf8');
  const prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf8');

  // 2. Extraire les modèles Prisma
  const prismaModels = PrismaSchemaParser.parse(prismaSchema);
  console.log(`📋 Found ${prismaModels.length} Prisma models`);

  // 3. Analyser le PHP pour extraire les accès aux champs SQL
  const sqlFields = extractSqlFieldsFromPhp(phpContent);
  console.log(`🔍 Detected ${sqlFields.length} SQL field accesses in PHP`);

  // 4. Effectuer le mapping entre les champs PHP et Prisma
  const fieldMappings = mapFieldsToPrismaModels(sqlFields, prismaModels);

  // 5. Générer le rapport de mapping
  const mappingReport = generateMappingReport(
    phpFilePath,
    prismaSchemaPath,
    fieldMappings,
    prismaModels
  );

  // 6. Générer les actions de migration
  const migrationPatch = generateMigrationPatch(phpFilePath, fieldMappings);

  // 7. Écrire les fichiers de sortie
  const baseName = path.basename(phpFilePath, '.php');

  const mappingReportPath = path.join(outputDir, `${baseName}_mapping_report.json`);
  fs.writeFileSync(mappingReportPath, JSON.stringify(mappingReport, null, 2));
  console.log(`✅ Mapping report written to: ${mappingReportPath}`);

  const migrationPatchPath = path.join(outputDir, `${baseName}_migration_patch.json`);
  fs.writeFileSync(migrationPatchPath, JSON.stringify(migrationPatch, null, 2));
  console.log(`✅ Migration patch written to: ${migrationPatchPath}`);

  // 8. Mettre à jour les fichiers d'audit et de backlog si demandé
  if (options.updateAudit) {
    await updateAuditFile(phpFilePath, fieldMappings, outputDir);
  }

  if (options.updateBacklog) {
    await updateBacklogFile(phpFilePath, migrationPatch, outputDir);
  }

  console.log(`🚀 PHP-SQL mapping completed for: ${phpFilePath}`);
}

/**
 * Extraire les champs SQL utilisés dans le code PHP
 */
function extractSqlFieldsFromPhp(phpContent: string): Array<{
  variable: string;
  field: string;
  line: number;
  context: string;
}> {
  const fields: Array<{
    variable: string;
    field: string;
    line: number;
    context: string;
  }> = [];

  try {
    // Utiliser php-parser pour analyser le code PHP
    const ast = phpParse(phpContent, {
      parser: {
        debug: false,
        locations: true,
        extractDoc: false,
        suppressErrors: true,
      },
      ast: {
        withPositions: true,
      },
    });

    // Parcourir l'AST pour trouver les accès aux tableaux
    traverseAst(ast, (node) => {
      // Détecter les accès de type $row['column_name']
      if (
        node.kind === 'offsetlookup' &&
        node.what?.kind === 'variable' &&
        node.offset?.kind === 'string'
      ) {
        const variable = node.what.name;
        const field = node.offset.value;
        const line = node.loc?.start.line || 0;

        // Extraire une ligne de contexte de code
        const lines = phpContent.split('\n');
        const context = line > 0 && line <= lines.length ? lines[line - 1].trim() : '';

        fields.push({
          variable,
          field,
          line,
          context,
        });
      }

      // Détecter les mysqli_fetch_assoc ou PDO::fetch ou autres méthodes de fetch
      // [Code supplémentaire pour d'autres patterns...]
    });

    return fields;
  } catch (error) {
    console.error(`⚠️ Error parsing PHP file: ${error}`);

    // Fallback: utiliser des regex basiques pour extraire les champs
    return extractSqlFieldsWithRegex(phpContent);
  }
}

/**
 * Méthode de fallback: extraire les champs SQL avec des expressions régulières
 */
function extractSqlFieldsWithRegex(phpContent: string): Array<{
  variable: string;
  field: string;
  line: number;
  context: string;
}> {
  const fields: Array<{
    variable: string;
    field: string;
    line: number;
    context: string;
  }> = [];

  const lines = phpContent.split('\n');

  // Regex pour $row['field_name'] ou $row["field_name"]
  const arrayAccessRegex = /(\$[a-zA-Z0-9_]+)\s*\[\s*['"]([a-zA-Z0-9_]+)['"]\s*\]/g;

  // Analyser chaque ligne
  lines.forEach((line, index) => {
    let match;

    while ((match = arrayAccessRegex.exec(line)) !== null) {
      fields.push({
        variable: match[1],
        field: match[2],
        line: index + 1,
        context: line.trim(),
      });
    }
  });

  return fields;
}

/**
 * Parcourir l'AST PHP récursivement
 */
function traverseAst(node: any, callback: (node: any) => void): void {
  if (!node) return;

  callback(node);

  if (typeof node === 'object') {
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const child = node[key];

        if (Array.isArray(child)) {
          child.forEach((item) => traverseAst(item, callback));
        } else if (typeof child === 'object' && child !== null) {
          traverseAst(child, callback);
        }
      }
    }
  }
}

/**
 * Mapper les champs SQL PHP avec les modèles Prisma
 */
function mapFieldsToPrismaModels(
  sqlFields: Array<{ variable: string; field: string; line: number; context: string }>,
  prismaModels: any[]
): FieldMapping[] {
  const mappings: FieldMapping[] = [];

  for (const sqlField of sqlFields) {
    let mapped = false;

    // Pour chaque modèle Prisma, essayer de trouver une correspondance
    for (const model of prismaModels) {
      // 1. Recherche d'une correspondance exacte
      const exactMatch = model.fields.find(
        (f) => f.name === sqlField.field || (f.map && f.map === sqlField.field)
      );

      if (exactMatch) {
        mappings.push({
          phpVariable: sqlField.variable,
          sqlField: sqlField.field,
          prismaField: exactMatch.name,
          status: exactMatch.name === sqlField.field ? 'mapped' : 'renamed',
          confidence: 1.0,
        });
        mapped = true;
        break;
      }

      // 2. Recherche d'une correspondance par convention de nommage
      // Exemple: user_name -> userName ou username
      const normalizedPhpField = sqlField.field.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      const conventionMatch = model.fields.find(
        (f) => f.name.toLowerCase() === normalizedPhpField.toLowerCase()
      );

      if (conventionMatch) {
        mappings.push({
          phpVariable: sqlField.variable,
          sqlField: sqlField.field,
          prismaField: conventionMatch.name,
          status: 'renamed',
          confidence: 0.9,
        });
        mapped = true;
        break;
      }

      // 3. Recherche d'une correspondance par similarité
      const similarMatches = model.fields
        .map((f) => ({
          field: f,
          similarity: calculateSimilarity(sqlField.field, f.name),
        }))
        .filter((match) => match.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity);

      if (similarMatches.length > 0) {
        mappings.push({
          phpVariable: sqlField.variable,
          sqlField: sqlField.field,
          prismaField: similarMatches[0].field.name,
          status: 'renamed',
          confidence: similarMatches[0].similarity,
        });
        mapped = true;
        break;
      }
    }

    // Si aucune correspondance n'a été trouvée
    if (!mapped) {
      mappings.push({
        phpVariable: sqlField.variable,
        sqlField: sqlField.field,
        prismaField: '',
        status: 'missing_in_prisma',
        confidence: 0,
      });
    }
  }

  // Ajouter les champs Prisma qui ne sont pas utilisés dans le PHP
  for (const model of prismaModels) {
    for (const field of model.fields) {
      const isUsed = mappings.some(
        (m) => m.prismaField === field.name || (field.map && m.sqlField === field.map)
      );

      if (!isUsed) {
        mappings.push({
          phpVariable: '',
          sqlField: field.map || field.name,
          prismaField: field.name,
          status: 'unused_in_php',
          confidence: 1.0,
        });
      }
    }
  }

  return mappings;
}

/**
 * Calculer la similarité entre deux chaînes
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Normaliser les chaînes (enlever les underscores, passer en minuscules)
  const normalize = (s: string) => s.toLowerCase().replace(/_/g, '');

  const s1 = normalize(str1);
  const s2 = normalize(str2);

  // Si une des chaînes est vide, pas de similarité
  if (!s1.length || !s2.length) return 0;

  // Levenshtein distance
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  // Calculer la similarité comme 1 - distance/longueurMax
  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Générer le rapport de mapping
 */
function generateMappingReport(
  phpFilePath: string,
  prismaSchemaPath: string,
  fieldMappings: FieldMapping[],
  prismaModels: any[]
): MappingReport {
  // Regrouper les mappings par modèle Prisma
  const modelMappings: { [modelName: string]: ModelMapping } = {};

  for (const model of prismaModels) {
    modelMappings[model.name] = {};
  }

  // Remplir avec les mappings
  for (const mapping of fieldMappings) {
    if (mapping.status === 'missing_in_prisma') continue;

    // Trouver le modèle correspondant
    const model = prismaModels.find((m) => m.fields.some((f) => f.name === mapping.prismaField));

    if (model) {
      if (mapping.status === 'mapped') {
        modelMappings[model.name][mapping.sqlField] = 'mapped';
      } else if (mapping.status === 'renamed') {
        modelMappings[model.name][mapping.sqlField] = `mapped to ${mapping.prismaField}`;
      } else if (mapping.status === 'unused_in_php') {
        modelMappings[model.name][mapping.sqlField] = '⚠️ not found in PHP';
      }
    }
  }

  // Collecter les champs PHP non mappés
  const unmappedPhpFields = fieldMappings
    .filter((m) => m.status === 'missing_in_prisma')
    .map((m) => m.sqlField);

  // Collecter les champs Prisma non utilisés
  const unusedPrismaFields = fieldMappings
    .filter((m) => m.status === 'unused_in_php')
    .map((m) => {
      // Trouver le modèle correspondant
      const model = prismaModels.find((mod) => mod.fields.some((f) => f.name === m.prismaField));

      return {
        model: model ? model.name : 'Unknown',
        field: m.prismaField,
      };
    });

  return {
    timestamp: new Date().toISOString(),
    phpFile: phpFilePath,
    prismaSchema: prismaSchemaPath,
    models: modelMappings,
    unmappedPhpFields,
    unusedPrismaFields,
  };
}

/**
 * Générer les actions de migration
 */
function generateMigrationPatch(
  phpFilePath: string,
  fieldMappings: FieldMapping[]
): MigrationPatch {
  const actions: MigrationAction[] = [];

  // Générer des actions pour chaque mapping
  for (const mapping of fieldMappings) {
    if (mapping.status === 'mapped') {
      actions.push({
        type: 'keep',
        model: getPrismaModelNameFromField(mapping.prismaField, fieldMappings),
        fromField: mapping.sqlField,
        toField: mapping.prismaField,
        reason: 'Field name matches between PHP and Prisma',
      });
    } else if (mapping.status === 'renamed') {
      actions.push({
        type: 'rename',
        model: getPrismaModelNameFromField(mapping.prismaField, fieldMappings),
        fromField: mapping.sqlField,
        toField: mapping.prismaField,
        reason: `Field renaming detected with ${Math.round(mapping.confidence * 100)}% confidence`,
      });
    } else if (mapping.status === 'missing_in_prisma') {
      actions.push({
        type: 'add',
        model: guessModelFromPhpVariable(mapping.phpVariable, fieldMappings),
        fromField: mapping.sqlField,
        reason: 'Field used in PHP but missing in Prisma schema',
      });
    } else if (mapping.status === 'unused_in_php') {
      actions.push({
        type: 'remove',
        model: getPrismaModelNameFromField(mapping.prismaField, fieldMappings),
        toField: mapping.prismaField,
        reason: 'Field defined in Prisma but not used in PHP',
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    phpFile: phpFilePath,
    actions,
  };
}

/**
 * Obtenir le nom du modèle Prisma à partir d'un champ
 */
function getPrismaModelNameFromField(_prismaField: string, _mappings: FieldMapping[]): string {
  // Implémentation simplifiée: en pratique, il faudrait:
  // 1. Utiliser les modèles Prisma pour retrouver le nom du modèle
  // 2. Ou stocker cette information dans les mappings

  // Par défaut, retourner un nom de modèle générique
  return 'UnknownModel';
}

/**
 * Deviner le modèle Prisma à partir d'une variable PHP
 */
function guessModelFromPhpVariable(phpVariable: string, mappings: FieldMapping[]): string {
  // Chercher d'autres champs mappés utilisant la même variable PHP
  const relatedMappings = mappings.filter(
    (m) => m.phpVariable === phpVariable && m.status !== 'missing_in_prisma'
  );

  if (relatedMappings.length > 0) {
    // Utiliser le modèle le plus fréquent
    const modelCounts: { [model: string]: number } = {};

    for (const mapping of relatedMappings) {
      const model = getPrismaModelNameFromField(mapping.prismaField, mappings);
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    }

    // Trouver le modèle le plus fréquent
    let mostFrequentModel = '';
    let maxCount = 0;

    for (const [model, count] of Object.entries(modelCounts)) {
      if (count > maxCount) {
        mostFrequentModel = model;
        maxCount = count;
      }
    }

    if (mostFrequentModel) {
      return mostFrequentModel;
    }
  }

  // Si on ne peut pas deviner, extraire un nom potentiel de la variable
  // Ex: $product -> Product, $userRow -> User
  const match = phpVariable.match(/\$([a-zA-Z0-9_]+)/);
  if (match) {
    const potentialName = match[1]
      .replace(/Row$|List$|Item$|Data$/, '')
      .replace(/^([a-z])/, (_, c) => c.toUpperCase());

    return potentialName;
  }

  return 'UnknownModel';
}

/**
 * Mettre à jour le fichier d'audit avec les informations de mapping
 */
async function updateAuditFile(
  phpFilePath: string,
  fieldMappings: FieldMapping[],
  outputDir: string
): Promise<void> {
  const baseName = path.basename(phpFilePath, '.php');
  const auditPath = path.join(outputDir, `${baseName}.audit.md`);

  // Vérifier si le fichier d'audit existe
  if (!fs.existsSync(auditPath)) {
    console.warn(`⚠️ Audit file not found: ${auditPath}`);
    return;
  }

  let auditContent = fs.readFileSync(auditPath, 'utf8');

  // Préparer le contenu de la section de mapping SQL
  let mappingSection = '\n## SQL to Prisma Mapping\n\n';
  mappingSection += '| SQL Field | PHP Variable | Prisma Field | Status | Confidence |\n';
  mappingSection += '|-----------|--------------|--------------|--------|------------|\n';

  for (const mapping of fieldMappings) {
    const status =
      mapping.status === 'mapped'
        ? '✅ Mapped'
        : mapping.status === 'renamed'
          ? '🔄 Renamed'
          : mapping.status === 'missing_in_prisma'
            ? '❌ Missing'
            : mapping.status === 'unused_in_php'
              ? '⚠️ Unused'
              : '';

    const confidence =
      mapping.status === 'missing_in_prisma' ? 'N/A' : `${Math.round(mapping.confidence * 100)}%`;

    mappingSection += `| \`${mapping.sqlField}\` | \`${mapping.phpVariable}\` | \`${mapping.prismaField}\` | ${status} | ${confidence} |\n`;
  }

  // Vérifier si une section de mapping existe déjà
  const existingMappingSection = auditContent.match(/## SQL to Prisma Mapping\n[\s\S]*?(?=\n##|$)/);

  if (existingMappingSection) {
    // Remplacer la section existante
    auditContent = auditContent.replace(existingMappingSection[0], mappingSection);
  } else {
    // Ajouter la section à la fin
    auditContent += `\n${mappingSection}`;
  }

  // Écrire le fichier d'audit mis à jour
  fs.writeFileSync(auditPath, auditContent);
  console.log(`✅ Updated audit file: ${auditPath}`);
}

/**
 * Mettre à jour le fichier de backlog avec les informations de migration
 */
async function updateBacklogFile(
  phpFilePath: string,
  migrationPatch: MigrationPatch,
  outputDir: string
): Promise<void> {
  const baseName = path.basename(phpFilePath, '.php');
  const backlogPath = path.join(outputDir, `${baseName}.backlog.json`);

  // Initialiser un backlog par défaut si le fichier n'existe pas
  let backlog: any = {
    file: phpFilePath,
    status: 'pending',
    tasks: [],
  };

  // Charger le backlog existant s'il existe
  if (fs.existsSync(backlogPath)) {
    try {
      backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
    } catch (error) {
      console.warn(`⚠️ Error parsing backlog file: ${error}`);
    }
  }

  // Filtrer les actions existantes liées au mapping SQL
  backlog.tasks = backlog.tasks.filter((task: any) => task.type !== 'sql_mapping');

  // Ajouter les nouvelles tâches de mapping
  for (const action of migrationPatch.actions) {
    if (action.type === 'keep') continue; // Ignorer les champs inchangés

    backlog.tasks.push({
      type: 'sql_mapping',
      action: action.type,
      model: action.model,
      fromField: action.fromField,
      toField: action.toField,
      reason: action.reason,
      status: 'todo',
      createdAt: new Date().toISOString(),
    });
  }

  // Écrire le fichier de backlog mis à jour
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  console.log(`✅ Updated backlog file: ${backlogPath}`);
}

// Point d'entrée pour l'exécution CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error(`
Usage: npx ts-node php-sql-mapper.ts <php-file> <prisma-schema> <output-dir> [options]

Options:
  --no-audit    Skip updating audit file
  --no-backlog  Skip updating backlog file
    `);
    process.exit(1);
  }

  const phpFilePath = args[0];
  const prismaSchemaPath = args[1];
  const outputDir = args[2];

  const options = {
    updateAudit: !args.includes('--no-audit'),
    updateBacklog: !args.includes('--no-backlog'),
  };

  mapPhpSqlFields(phpFilePath, prismaSchemaPath, outputDir, options)
    .then(() => console.log('✅ PHP SQL mapping completed'))
    .catch((err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}
