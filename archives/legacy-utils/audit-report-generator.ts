import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

/**
 * Interface pour les options de génération de rapport
 */
interface AuditReportOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeToc?: boolean;
  includeStatistics?: boolean;
  includeComplexityWarnings?: boolean;
  includeRecommendations?: boolean;
  maxComplexityThreshold?: number;
  outputFormat?: 'markdown' | 'html';
}

/**
 * Génère un rapport d'audit Markdown à partir des résultats d'analyse PHP
 *
 * @param analysisResult Résultat d'analyse de l'agent PHP Analyzer
 * @param outputPath Chemin de sortie pour le fichier .audit.md
 * @param options Options de configuration du rapport
 * @returns Chemin du fichier généré ou null en cas d'erreur
 */
export async function generateAuditReport(
  analysisResult: any,
  outputPath: string,
  options: AuditReportOptions = {}
): Promise<string | null> {
  try {
    // Options par défaut
    const reportOptions: Required<AuditReportOptions> = {
      includeHeader: options.includeHeader !== undefined ? options.includeHeader : true,
      includeFooter: options.includeFooter !== undefined ? options.includeFooter : true,
      includeToc: options.includeToc !== undefined ? options.includeToc : true,
      includeStatistics: options.includeStatistics !== undefined ? options.includeStatistics : true,
      includeComplexityWarnings:
        options.includeComplexityWarnings !== undefined ? options.includeComplexityWarnings : true,
      includeRecommendations:
        options.includeRecommendations !== undefined ? options.includeRecommendations : true,
      maxComplexityThreshold: options.maxComplexityThreshold || 10,
      outputFormat: options.outputFormat || 'markdown',
    };

    // Vérifier si le résultat d'analyse est valide
    if (!analysisResult || !analysisResult.files || !Array.isArray(analysisResult.files)) {
      throw new Error("Format de résultat d'analyse invalide");
    }

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Générer le contenu du rapport
    let reportContent = '';

    // Ajouter l'en-tête
    if (reportOptions.includeHeader) {
      reportContent += generateHeader(analysisResult);
    }

    // Ajouter la table des matières
    if (reportOptions.includeToc) {
      reportContent += generateTableOfContents(analysisResult);
    }

    // Ajouter les statistiques
    if (reportOptions.includeStatistics) {
      reportContent += generateStatistics(analysisResult);
    }

    // Ajouter les détails des fichiers
    reportContent += generateFileDetails(analysisResult, reportOptions);

    // Ajouter les avertissements de complexité
    if (reportOptions.includeComplexityWarnings) {
      reportContent += generateComplexityWarnings(
        analysisResult,
        reportOptions.maxComplexityThreshold
      );
    }

    // Ajouter les schémas de base de données
    reportContent += generateDatabaseSchema(analysisResult);

    // Ajouter les routes
    reportContent += generateRoutes(analysisResult);

    // Ajouter les recommandations
    if (reportOptions.includeRecommendations) {
      reportContent += generateRecommendations(analysisResult);
    }

    // Ajouter le pied de page
    if (reportOptions.includeFooter) {
      reportContent += generateFooter(analysisResult);
    }

    // Écrire le fichier de sortie
    if (reportOptions.outputFormat === 'html') {
      // Convertir le Markdown en HTML
      const htmlContent = marked(reportContent);
      const htmlOutputPath = outputPath.replace(/\.md$/, '.html');

      // Ajouter les styles CSS au HTML
      const styledHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'audit - Migration PHP → NestJS + Remix</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #2C3E50; border-bottom: 2px solid #3498DB; padding-bottom: 10px; }
    h2 { color: #2980B9; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    h3 { color: #3498DB; }
    h4 { color: #2C3E50; }
    code { background-color: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    pre code { background-color: transparent; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .warning { background-color: #FFF3CD; border-left: 4px solid #F0AD4E; padding: 10px; margin: 10px 0; }
    .danger { background-color: #F8D7DA; border-left: 4px solid #DC3545; padding: 10px; margin: 10px 0; }
    .info { background-color: #D1ECF1; border-left: 4px solid #17A2B8; padding: 10px; margin: 10px 0; }
    .success { background-color: #D4EDDA; border-left: 4px solid #28A745; padding: 10px; margin: 10px 0; }
    .complexity-high { color: #DC3545; font-weight: bold; }
    .complexity-medium { color: #F0AD4E; font-weight: bold; }
    .complexity-low { color: #28A745; font-weight: bold; }
    .toc { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .toc ul { list-style-type: none; padding-left: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d; font-size: 0.9em; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
      `;

      fs.writeFileSync(htmlOutputPath, styledHtml);
      console.log(`✅ Rapport HTML généré : ${htmlOutputPath}`);

      // Également écrire la version Markdown
      fs.writeFileSync(outputPath, reportContent);
      console.log(`✅ Rapport Markdown généré : ${outputPath}`);

      return htmlOutputPath;
    }
    // Écrire le fichier Markdown
    fs.writeFileSync(outputPath, reportContent);
    console.log(`✅ Rapport Markdown généré : ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("❌ Erreur lors de la génération du rapport d'audit:", error);
    return null;
  }
}

/**
 * Génère l'en-tête du rapport
 */
function generateHeader(analysisResult: any): string {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const sourceDir = analysisResult.sourceDir || 'Non spécifié';

  return `# Rapport d'Audit - Migration PHP → NestJS + Remix

> **Date:** ${timestamp}  
> **Répertoire source:** \`${sourceDir}\`  
> **Score de complexité de migration:** ${analysisResult.migrationComplexity?.score || 'N/A'}/10  

Ce rapport présente une analyse détaillée du code PHP en vue de sa migration vers une architecture NestJS (backend) et Remix (frontend). Il identifie les structures, dépendances, et points de complexité qui nécessiteront une attention particulière pendant le processus de migration.

`;
}

/**
 * Génère la table des matières
 */
function generateTableOfContents(_analysisResult: any): string {
  return `## Table des matières

- [Sommaire statistique](#sommaire-statistique)
- [Détails des fichiers](#détails-des-fichiers)
- [Avertissements de complexité](#avertissements-de-complexité)
- [Schéma de base de données](#schéma-de-base-de-données)
- [Routes identifiées](#routes-identifiées)
- [Recommandations](#recommandations)

`;
}

/**
 * Génère la section des statistiques
 */
function generateStatistics(analysisResult: any): string {
  const stats = analysisResult.statistics || {};

  return `## Sommaire statistique

- **Nombre total de fichiers:** ${stats.totalFiles || 0}
- **Lignes de code:** ${stats.totalLOC || 0}
- **Fonctions:** ${stats.totalFunctions || 0}
- **Classes:** ${stats.totalClasses || 0}
- **Méthodes:** ${stats.totalMethods || 0}
- **Complexité cyclomatique moyenne:** ${stats.avgComplexity?.toFixed(2) || 'N/A'}

### Répartition par type de fichier

${generateFileTypeTable(stats.fileTypes || {})}

### Facteurs de complexité de migration

${generateComplexityFactorsTable(analysisResult.migrationComplexity?.factors || [])}

`;
}

/**
 * Génère un tableau de répartition des fichiers par type
 */
function generateFileTypeTable(fileTypes: Record<string, number>): string {
  if (Object.keys(fileTypes).length === 0) {
    return '_Aucune information sur les types de fichiers_\n\n';
  }

  let table = '| Type de fichier | Nombre |\n| --- | ---: |\n';

  Object.entries(fileTypes).forEach(([type, count]) => {
    table += `| ${type} | ${count} |\n`;
  });

  return table;
}

/**
 * Génère un tableau des facteurs de complexité
 */
function generateComplexityFactorsTable(
  factors: Array<{ name: string; impact: number; description: string }>
): string {
  if (factors.length === 0) {
    return '_Aucune information sur les facteurs de complexité_\n\n';
  }

  let table = '| Facteur | Impact (0-10) | Description |\n| --- | ---: | --- |\n';

  factors.forEach((factor) => {
    table += `| ${formatComplexityFactorName(factor.name)} | ${factor.impact.toFixed(1)} | ${
      factor.description
    } |\n`;
  });

  return table;
}

/**
 * Formate le nom d'un facteur de complexité
 */
function formatComplexityFactorName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

/**
 * Génère les détails des fichiers
 */
function generateFileDetails(analysisResult: any, options: Required<AuditReportOptions>): string {
  const files = analysisResult.files || [];

  if (files.length === 0) {
    return '## Détails des fichiers\n\n_Aucun fichier analysé_\n\n';
  }

  let content = '## Détails des fichiers\n\n';

  // Trier les fichiers par complexité (décroissante)
  const sortedFiles = [...files].sort((a, b) => {
    const calcComplexity = (file: any) => {
      let total = 0;
      let count = 0;

      if (file.functions && Array.isArray(file.functions)) {
        file.functions.forEach((func: any) => {
          if (typeof func.complexity === 'number') {
            total += func.complexity;
            count++;
          }
        });
      }

      if (file.classes && Array.isArray(file.classes)) {
        file.classes.forEach((cls: any) => {
          if (cls.methods && Array.isArray(cls.methods)) {
            cls.methods.forEach((method: any) => {
              if (typeof method.complexity === 'number') {
                total += method.complexity;
                count++;
              }
            });
          }
        });
      }

      return count > 0 ? total / count : 0;
    };

    return calcComplexity(b) - calcComplexity(a);
  });

  // Limiter à 20 fichiers pour ne pas rendre le rapport trop long
  const filesToShow = sortedFiles.slice(0, 20);

  filesToShow.forEach((file) => {
    content += generateFileSection(file, options);
  });

  if (sortedFiles.length > 20) {
    content += `\n> **Note:** ${
      sortedFiles.length - 20
    } fichiers supplémentaires ont été analysés mais ne sont pas affichés dans ce rapport pour des raisons de lisibilité.\n\n`;
  }

  return content;
}

/**
 * Génère une section pour un fichier
 */
function generateFileSection(file: any, options: Required<AuditReportOptions>): string {
  const filePath = file.path || 'Chemin inconnu';
  const fileName = path.basename(filePath);
  const loc = file.loc || 0;
  const size = file.size || 0;

  let content = `### ${fileName}\n\n`;
  content += `- **Chemin:** \`${filePath}\`\n`;
  content += `- **Lignes de code:** ${loc}\n`;
  content += `- **Taille:** ${formatFileSize(size)}\n\n`;

  // Ajouter les classes
  if (file.classes && Array.isArray(file.classes) && file.classes.length > 0) {
    content += '#### Classes\n\n';

    file.classes.forEach((cls: any) => {
      const className = cls.name || 'Nom inconnu';
      const baseClass = cls.extends ? ` extends ${cls.extends}` : '';
      const interfaces =
        cls.implements && cls.implements.length > 0
          ? ` implements ${cls.implements.join(', ')}`
          : '';

      content += `##### ${className}${baseClass}${interfaces}\n\n`;

      // Propriétés
      if (cls.properties && Array.isArray(cls.properties) && cls.properties.length > 0) {
        content += '**Propriétés:**\n\n';
        content += '| Nom | Visibilité | Type | Static |\n';
        content += '| --- | --- | --- | :---: |\n';

        cls.properties.forEach((prop: any) => {
          const propName = prop.name || 'Nom inconnu';
          const visibility = prop.visibility || 'public';
          const type = prop.type || 'mixed';
          const isStatic = prop.static ? '✓' : ' ';

          content += `| ${propName} | ${visibility} | ${type} | ${isStatic} |\n`;
        });

        content += '\n';
      }

      // Méthodes
      if (cls.methods && Array.isArray(cls.methods) && cls.methods.length > 0) {
        content += '**Méthodes:**\n\n';
        content += '| Nom | Visibilité | Complexité | Paramètres | Static |\n';
        content += '| --- | --- | :---: | --- | :---: |\n';

        cls.methods.forEach((method: any) => {
          const methodName = method.name || 'Nom inconnu';
          const visibility = method.visibility || 'public';
          const complexity =
            typeof method.complexity === 'number'
              ? formatComplexity(method.complexity, options.maxComplexityThreshold)
              : 'N/A';
          const params =
            method.parameters && Array.isArray(method.parameters)
              ? method.parameters.join(', ')
              : '';
          const isStatic = method.static ? '✓' : ' ';

          content += `| ${methodName} | ${visibility} | ${complexity} | ${params} | ${isStatic} |\n`;
        });

        content += '\n';
      }
    });
  }

  // Ajouter les fonctions
  if (file.functions && Array.isArray(file.functions) && file.functions.length > 0) {
    content += '#### Fonctions\n\n';
    content += '| Nom | Complexité | Paramètres |\n';
    content += '| --- | :---: | --- |\n';

    file.functions.forEach((func: any) => {
      const funcName = func.name || 'Nom inconnu';
      const complexity =
        typeof func.complexity === 'number'
          ? formatComplexity(func.complexity, options.maxComplexityThreshold)
          : 'N/A';
      const params =
        func.parameters && Array.isArray(func.parameters) ? func.parameters.join(', ') : '';

      content += `| ${funcName} | ${complexity} | ${params} |\n`;
    });

    content += '\n';
  }

  // Ajouter les dépendances
  const includes = file.includes || [];
  const requires = file.requires || [];

  if (includes.length > 0 || requires.length > 0) {
    content += '#### Dépendances\n\n';

    if (includes.length > 0) {
      content += '**Includes:**\n\n';
      includes.forEach((inc: string) => {
        content += `- \`${inc}\`\n`;
      });
      content += '\n';
    }

    if (requires.length > 0) {
      content += '**Requires:**\n\n';
      requires.forEach((req: string) => {
        content += `- \`${req}\`\n`;
      });
      content += '\n';
    }
  }

  // Ajouter les requêtes SQL
  if (file.sqlQueries && Array.isArray(file.sqlQueries) && file.sqlQueries.length > 0) {
    content += '#### Requêtes SQL\n\n';

    file.sqlQueries.forEach((query: any, index: number) => {
      const operation = query.operation || 'unknown';
      const tables = query.tables && Array.isArray(query.tables) ? query.tables.join(', ') : '';

      content += `**Query ${index + 1} (${operation.toUpperCase()})** - Tables: ${tables}\n\n`;
      content += '```sql\n';
      content += query.query || 'Requête non disponible';
      content += '\n```\n\n';
    });
  }

  // Ajouter les relations d'entité
  if (
    file.entityRelationships &&
    Array.isArray(file.entityRelationships) &&
    file.entityRelationships.length > 0
  ) {
    content += "#### Relations d'entité\n\n";
    content += '| Entité | Relation | Entité liée |\n';
    content += '| --- | --- | --- |\n';

    file.entityRelationships.forEach((rel: any) => {
      const entity = rel.entity || 'Inconnue';
      const relatedTo = rel.relatedTo || 'Inconnue';
      const type = formatRelationType(rel.type || 'unknown');

      content += `| ${entity} | ${type} | ${relatedTo} |\n`;
    });

    content += '\n';
  }

  return content;
}

/**
 * Formate la taille d'un fichier en unités lisibles
 */
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} octets`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Formate la complexité avec code couleur
 */
function formatComplexity(complexity: number, threshold: number): string {
  if (complexity > threshold) {
    return `<span class="complexity-high">${complexity}</span>`;
  }
  if (complexity > threshold * 0.7) {
    return `<span class="complexity-medium">${complexity}</span>`;
  }
  return `<span class="complexity-low">${complexity}</span>`;
}

/**
 * Formate le type de relation
 */
function formatRelationType(type: string): string {
  switch (type) {
    case 'one-to-one':
      return '1:1';
    case 'one-to-many':
      return '1:N';
    case 'many-to-one':
      return 'N:1';
    case 'many-to-many':
      return 'N:M';
    default:
      return type;
  }
}

/**
 * Génère la section des avertissements de complexité
 */
function generateComplexityWarnings(analysisResult: any, threshold: number): string {
  let content = '## Avertissements de complexité\n\n';

  const complexItems: Array<{ name: string; type: string; path: string; complexity: number }> = [];

  // Collecter toutes les fonctions et méthodes avec une complexité élevée
  analysisResult.files.forEach((file: any) => {
    const filePath = file.path || 'Chemin inconnu';

    // Fonctions
    if (file.functions && Array.isArray(file.functions)) {
      file.functions.forEach((func: any) => {
        if (func.complexity && func.complexity > threshold * 0.7) {
          complexItems.push({
            name: func.name || 'Fonction inconnue',
            type: 'Fonction',
            path: filePath,
            complexity: func.complexity,
          });
        }
      });
    }

    // Méthodes de classe
    if (file.classes && Array.isArray(file.classes)) {
      file.classes.forEach((cls: any) => {
        const className = cls.name || 'Classe inconnue';

        if (cls.methods && Array.isArray(cls.methods)) {
          cls.methods.forEach((method: any) => {
            if (method.complexity && method.complexity > threshold * 0.7) {
              complexItems.push({
                name: `${className}::${method.name || 'Méthode inconnue'}`,
                type: 'Méthode',
                path: filePath,
                complexity: method.complexity,
              });
            }
          });
        }
      });
    }
  });

  // Trier par complexité décroissante
  complexItems.sort((a, b) => b.complexity - a.complexity);

  if (complexItems.length === 0) {
    content += "_Aucun élément avec une complexité élevée n'a été identifié._\n\n";
    return content;
  }

  content += `Les éléments suivants présentent une complexité cyclomatique élevée (> ${
    threshold * 0.7
  }) et nécessiteront une attention particulière lors de la migration :\n\n`;

  content += '| Type | Nom | Fichier | Complexité |\n';
  content += '| --- | --- | --- | :---: |\n';

  complexItems.forEach((item) => {
    const complexityFormatted =
      item.complexity > threshold
        ? `<span class="complexity-high">${item.complexity}</span>`
        : `<span class="complexity-medium">${item.complexity}</span>`;

    content += `| ${item.type} | ${item.name} | \`${path.basename(
      item.path
    )}\` | ${complexityFormatted} |\n`;
  });

  content += '\n';

  if (complexItems.some((item) => item.complexity > threshold)) {
    content += `<div class="warning">
⚠️ **Attention**: Les éléments avec une complexité > ${threshold} peuvent nécessiter une refactorisation importante ou une décomposition en composants plus petits lors de la migration vers NestJS + Remix.
</div>\n\n`;
  }

  return content;
}

/**
 * Génère la section des schémas de base de données
 */
function generateDatabaseSchema(analysisResult: any): string {
  const schema = analysisResult.databaseSchema || {};
  const tables = schema.tables || [];

  let content = '## Schéma de base de données\n\n';

  if (tables.length === 0) {
    content += "_Aucune information de schéma de base de données n'a été extraite._\n\n";
    return content;
  }

  content += `${tables.length} tables ont été identifiées dans le code source :\n\n`;

  tables.forEach((table: any) => {
    const tableName = table.name || 'Table inconnue';

    content += `### Table: ${tableName}\n\n`;

    // Colonnes
    if (table.columns && Array.isArray(table.columns) && table.columns.length > 0) {
      content += '| Colonne | Type | Nullable | Clé |\n';
      content += '| --- | --- | :---: | --- |\n';

      table.columns.forEach((column: any) => {
        const columnName = column.name || 'Colonne inconnue';
        const type = column.type || 'unknown';
        const nullable = column.nullable ? '✓' : ' ';
        const key = column.key || ' ';

        content += `| ${columnName} | ${type} | ${nullable} | ${key} |\n`;
      });

      content += '\n';
    }

    // Clés étrangères
    if (table.foreignKeys && Array.isArray(table.foreignKeys) && table.foreignKeys.length > 0) {
      content += '**Clés étrangères:**\n\n';

      table.foreignKeys.forEach((fk: any) => {
        content += `- \`${fk.column || 'Colonne inconnue'}\` → \`${
          fk.referencesTable || 'Table inconnue'
        }\`.\`${fk.referencesColumn || 'Colonne inconnue'}\`\n`;
      });

      content += '\n';
    }
  });

  return content;
}

/**
 * Génère la section des routes
 */
function generateRoutes(analysisResult: any): string {
  const routes = analysisResult.routes || [];

  let content = '## Routes identifiées\n\n';

  if (routes.length === 0) {
    content += "_Aucune route n'a été identifiée dans le code source._\n\n";
    return content;
  }

  content += `${routes.length} routes ont été identifiées dans le code source :\n\n`;

  content += '| Méthode | Chemin | Contrôleur | Fonction |\n';
  content += '| --- | --- | --- | --- |\n';

  routes.forEach((route: any) => {
    const method = route.method || 'GET';
    const path = route.path || '/';
    const controller = route.controller || '-';
    const func = route.function || '-';

    content += `| ${method} | \`${path}\` | ${controller} | ${func} |\n`;
  });

  content += '\n';

  return content;
}

/**
 * Génère la section des recommandations
 */
function generateRecommendations(analysisResult: any): string {
  let content = '## Recommandations\n\n';

  // Générer des recommandations en fonction du score de complexité
  const complexityScore = analysisResult.migrationComplexity?.score || 0;

  if (complexityScore > 7) {
    content += '<div class="danger">\n';
    content +=
      '⚠️ **Complexité élevée** - Cette base de code présente une complexité de migration importante. Considérez :\n\n';
    content += '1. Une approche de migration progressive par modules ou fonctionnalités\n';
    content += '2. Une refactorisation préliminaire du code PHP pour réduire la complexité\n';
    content +=
      "3. L'utilisation de wrappers temporaires pour interfacer le nouveau code avec le code existant\n";
    content += '4. La création de tests automatisés avant de commencer la migration\n';
    content += '</div>\n\n';
  } else if (complexityScore > 4) {
    content += '<div class="warning">\n';
    content +=
      '🔄 **Complexité moyenne** - Cette base de code présente une complexité modérée. Recommandations :\n\n';
    content += '1. Commencer par migrer les modules les plus indépendants\n';
    content += '2. Porter une attention particulière aux éléments identifiés comme complexes\n';
    content +=
      '3. Définir une stratégie claire pour la migration des requêtes SQL vers TypeORM/Prisma\n';
    content += '</div>\n\n';
  } else {
    content += '<div class="success">\n';
    content +=
      '✅ **Complexité faible** - Cette base de code présente une faible complexité de migration. Vous pouvez :\n\n';
    content += '1. Procéder à une migration complète en une seule fois\n';
    content += '2. Utiliser la génération automatisée de code pour accélérer le processus\n';
    content +=
      "3. Moderniser l'architecture en implémentant des modèles supplémentaires (CQRS, Repository, etc.)\n";
    content += '</div>\n\n';
  }

  // Recommandations basées sur les statistiques
  const _stats = analysisResult.statistics || {};

  content += '### Architecture recommandée\n\n';

  // Backend (NestJS)
  content += '#### Backend (NestJS)\n\n';
  content += '```\n';
  content += 'src/\n';
  content += "├── main.ts                   # Point d'entrée de l'application\n";
  content += '├── app.module.ts             # Module principal\n';
  content += '├── common/                   # Éléments partagés (gardes, filtres, etc.)\n';

  // Modules en fonction des entités identifiées
  const entities = new Set<string>();

  // Collecter les entités à partir des relations
  analysisResult.files.forEach((file: any) => {
    if (file.entityRelationships && Array.isArray(file.entityRelationships)) {
      file.entityRelationships.forEach((rel: any) => {
        if (rel.entity) entities.add(rel.entity);
        if (rel.relatedTo) entities.add(rel.relatedTo);
      });
    }
  });

  // Collecter les entités à partir des tables
  const schema = analysisResult.databaseSchema || {};
  const tables = schema.tables || [];

  tables.forEach((table: any) => {
    if (table.name) entities.add(table.name);
  });

  if (entities.size > 0) {
    const entitiesArray = Array.from(entities).sort();
    entitiesArray.slice(0, 5).forEach((entity) => {
      content += `├── ${entity.toLowerCase()}/\n`;
      content += `│   ├── ${entity.toLowerCase()}.module.ts\n`;
      content += `│   ├── ${entity.toLowerCase()}.controller.ts\n`;
      content += `│   ├── ${entity.toLowerCase()}.service.ts\n`;
      content += '│   ├── dto/                 # Data Transfer Objects\n';
      content += '│   └── entities/            # Entités TypeORM/Prisma\n';
    });

    if (entitiesArray.length > 5) {
      content += '├── [...]\n';
    }
  } else {
    content += '├── modules/                 # Organiser par modules fonctionnels\n';
  }

  content += "└── config/                  # Configuration de l'application\n";
  content += '```\n\n';

  // Frontend (Remix)
  content += '#### Frontend (Remix)\n\n';
  content += '```\n';
  content += 'app/\n';
  content += '├── root.tsx                 # Composant racine\n';
  content += "├── entry.client.tsx         # Point d'entrée client\n";
  content += "├── entry.server.tsx         # Point d'entrée serveur\n";
  content += '├── components/              # Composants réutilisables\n';
  content += "│   ├── ui/                  # Composants d'interface\n";
  content += '│   └── domain/              # Composants spécifiques au domaine\n';
  content += '├── models/                  # Types/Interfaces\n';
  content += '├── routes/                  # Pages et routes\n';

  // Routes en fonction des routes identifiées
  const routePaths = new Set<string>();
  const routes = analysisResult.routes || [];

  routes.forEach((route: any) => {
    if (route.path) {
      const path = route.path.replace(/^\//, '').split('/')[0];
      if (path && path !== '*' && path !== '') {
        routePaths.add(path);
      }
    }
  });

  if (routePaths.size > 0) {
    const routePathsArray = Array.from(routePaths).sort();
    routePathsArray.slice(0, 5).forEach((routePath) => {
      content += `│   ├── ${routePath}/\n`;
      content += '│   │   ├── index.tsx\n';
      content += '│   │   └── $id.tsx     # Route dynamique\n';
    });

    if (routePathsArray.length > 5) {
      content += '│   ├── [...]\n';
    }
  }

  content += "│   └── index.tsx            # Page d'accueil\n";
  content += '├── services/                # Services API\n';
  content += '└── utils/                   # Utilitaires\n';
  content += '```\n\n';

  // Autres recommandations
  content += '### Recommandations techniques\n\n';

  if (complexityScore > 6) {
    content +=
      "- **État**: Envisagez d'utiliser Redux ou Zustand pour gérer l'état global complexe\n";
  } else {
    content += "- **État**: Utiliser les hooks React et le Context API pour la gestion d'état\n";
  }

  content += '- **Base de données**: ';
  if (tables.length > 10) {
    content += 'TypeORM avec une stratégie de migration pour gérer le schéma complexe\n';
  } else {
    content += 'Prisma pour un mapping objet-relationnel type-safe\n';
  }

  content += '- **Authentification**: Implémenter Passport.js avec JWT pour la sécurité\n';
  content += '- **Validation**: Utiliser class-validator côté NestJS et Zod côté Remix\n';
  content +=
    '- **Tests**: Mettre en place Jest pour les tests unitaires et Cypress pour les tests E2E\n';

  return content;
}

/**
 * Génère le pied de page du rapport
 */
function generateFooter(_analysisResult: any): string {
  return `
---

<div class="footer">
Généré par le pipeline de migration PHP → NestJS + Remix | Timestamp: ${new Date().toISOString()}
</div>
`;
}

// Exporter la fonction principale
export default generateAuditReport;
