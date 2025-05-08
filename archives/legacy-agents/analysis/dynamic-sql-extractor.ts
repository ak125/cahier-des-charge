import * as fs from 'fs';

/**
 * Extracteur dynamique de requêtes SQL depuis du code PHP
 *
 * Ce module est capable d'analyser les requêtes SQL dans le code PHP,
 * même celles qui sont construites dynamiquement par concaténation
 * ou interpolation de variables.
 */

/**
 * Représente une requête SQL extraite
 */
interface ExtractedSQLQuery {
  query: string; // Requête SQL brute
  line: number; // Numéro de ligne
  contextLine: string; // Ligne complète contenant la requête
  tables: string[]; // Tables référencées dans la requête
  columns: Array<{
    // Colonnes référencées dans la requête
    table: string;
    column: string;
  }>;
  variables: string[]; // Variables PHP utilisées dans la requête
}

/**
 * Extrait les requêtes SQL depuis un contenu de fichier d'audit Markdown
 */
export function extractSQLQueries(auditContent: string): ExtractedSQLQuery[] {
  const queries: ExtractedSQLQuery[] = [];

  // Rechercher la section "SQL Queries" dans le fichier d'audit
  const sqlSectionRegex = /## SQL Queries\s*\n\s*\n```php\s*\n([\s\S]*?)```/g;
  let sqlSectionMatch;

  // Modification pour éviter l'affectation dans l'expression
  sqlSectionMatch = sqlSectionRegex.exec(auditContent);
  while (sqlSectionMatch !== null) {
    const sqlSection = sqlSectionMatch[1];

    // Extraire les requêtes SQL individuelles
    extractQueriesFromSection(sqlSection, queries);

    // Avancer à la prochaine correspondance
    sqlSectionMatch = sqlSectionRegex.exec(auditContent);
  }

  // Rechercher d'autres requêtes SQL potentielles dans d'autres sections
  const codeBlockRegex = /```php\s*\n([\s\S]*?)```/g;
  let codeBlockMatch;

  // Modification pour éviter l'affectation dans l'expression
  codeBlockMatch = codeBlockRegex.exec(auditContent);
  while (codeBlockMatch !== null) {
    const codeBlock = codeBlockMatch[1];
    // Vérifier si ce n'est pas déjà une section SQL analysée
    if (!auditContent.includes(`## SQL Queries\n\n\`\`\`php\n${codeBlock}`)) {
      extractQueriesFromSection(codeBlock, queries);
    }

    // Avancer à la prochaine correspondance
    codeBlockMatch = codeBlockRegex.exec(auditContent);
  }

  return queries;
}

/**
 * Extrait les requêtes SQL depuis une section de code PHP
 */
function extractQueriesFromSection(codeSection: string, queries: ExtractedSQLQuery[]): void {
  // Analyser ligne par ligne
  const lines = codeSection.split('\n');
  let lineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Détecter les indices de ligne spécifiques dans les commentaires
    const lineMatch = line.match(/\/\/ Line (\d+)/);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
      continue;
    }
    // Suppression du else inutile
    lineNumber++;

    // Ignorer les lignes vides ou commentaires
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      continue;
    }

    // Analyser les requêtes SQL explicites (assignation de variable)
    if (
      trimmedLine.includes('SELECT') ||
      trimmedLine.includes('INSERT') ||
      trimmedLine.includes('UPDATE') ||
      trimmedLine.includes('DELETE')
    ) {
      const query = extractFullQuery(lines, i);
      if (query) {
        const extractedQuery = analyzeQuery(query, lineNumber, line);
        queries.push(extractedQuery);

        // Avancer i pour sauter le reste de la requête sur plusieurs lignes
        i += query.split('\n').length - 1;
      }
    }

    // Analyser les requêtes construites par concaténation
    if (
      trimmedLine.includes('$query') ||
      trimmedLine.includes('$sql') ||
      (trimmedLine.includes('=') &&
        (trimmedLine.includes("'SELECT") ||
          trimmedLine.includes('"SELECT') ||
          trimmedLine.includes("'INSERT") ||
          trimmedLine.includes("'UPDATE") ||
          trimmedLine.includes("'DELETE")))
    ) {
      const concatenatedQuery = extractConcatenatedQuery(lines, i);
      if (concatenatedQuery) {
        const extractedQuery = analyzeQuery(concatenatedQuery, lineNumber, line);
        queries.push(extractedQuery);

        // Avancer i pour sauter le reste de la requête sur plusieurs lignes
        i += concatenatedQuery.split('\n').length - 1;
      }
    }
  }
}

/**
 * Extrait une requête SQL complète qui peut s'étendre sur plusieurs lignes
 */
function extractFullQuery(lines: string[], startIndex: number): string | null {
  let query = lines[startIndex].trim();
  let endFound = query.endsWith(';');
  let currentIndex = startIndex + 1;

  // Si la requête ne se termine pas par un point-virgule, chercher les lignes suivantes
  while (!endFound && currentIndex < lines.length) {
    const nextLine = lines[currentIndex].trim();

    if (nextLine.endsWith(';')) {
      // Utilisation d'un littéral de gabarit
      query += ` ${nextLine}`;
      endFound = true;
    } else if (nextLine && !nextLine.startsWith('//')) {
      // Utilisation d'un littéral de gabarit
      query += ` ${nextLine}`;
    }

    currentIndex++;
  }

  // Nettoyer la requête
  query = query.replace(/\$[a-zA-Z0-9_]+\s*=/g, ''); // Enlever les assignations

  // Vérifier si c'est une requête SQL valide
  if (
    query.includes('SELECT') ||
    query.includes('INSERT') ||
    query.includes('UPDATE') ||
    query.includes('DELETE')
  ) {
    return query;
  }

  return null;
}

/**
 * Extrait une requête SQL construite par concaténation
 */
function extractConcatenatedQuery(lines: string[], startIndex: number): string | null {
  const queryParts: string[] = [];
  const currentLine = lines[startIndex].trim();

  // Extraire la partie initiale
  const assignmentMatch = currentLine.match(/(\$[a-zA-Z0-9_]+)\s*=\s*(.*)/);
  if (assignmentMatch) {
    const varName = assignmentMatch[1];
    let queryPart = assignmentMatch[2];

    // Enlever les guillemets et concaténations simples
    queryPart = queryPart.replace(/["']\s*\.\s*\$/g, ' $');
    queryPart = queryPart.replace(/\$[a-zA-Z0-9_]+\s*\.\s*["']/g, ' ');
    queryPart = queryPart.replace(/^["']|["'];$/g, '');

    queryParts.push(queryPart);

    // Suivre les concaténations sur les lignes suivantes
    let nextIndex = startIndex + 1;
    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex].trim();

      // Vérifier si c'est une continuation de la même variable
      if (nextLine.startsWith(varName) && nextLine.includes('=')) {
        const continuationMatch = nextLine.match(/\$[a-zA-Z0-9_]+\s*=\s*(.*)/);
        if (continuationMatch) {
          let nextPart = continuationMatch[1];
          nextPart = nextPart.replace(/["']\s*\.\s*\$/g, ' $');
          nextPart = nextPart.replace(/\$[a-zA-Z0-9_]+\s*\.\s*["']/g, ' ');
          nextPart = nextPart.replace(/^["']|["'];$/g, '');

          queryParts.push(nextPart);
        }
        // Utilisation de littéral de gabarit au lieu de concaténation
      } else if (nextLine.startsWith(`${varName} .=`)) {
        const continuationMatch = nextLine.match(/\$[a-zA-Z0-9_]+\s*\.=\s*(.*)/);
        if (continuationMatch) {
          let nextPart = continuationMatch[1];
          nextPart = nextPart.replace(/^["']|["'];$/g, '');

          queryParts.push(nextPart);
        }
      } else if (nextLine.includes('execute') || nextLine.includes('query')) {
        // Arrêter à l'exécution de la requête
        break;
      } else if (!nextLine.includes(varName)) {
        // Ce n'est plus la même variable
        break;
      }

      nextIndex++;
    }

    // Joindre les parties et nettoyer
    const fullQuery = queryParts.join(' ');

    // Vérifier si c'est une requête SQL valide
    if (
      fullQuery.includes('SELECT') ||
      fullQuery.includes('INSERT') ||
      fullQuery.includes('UPDATE') ||
      fullQuery.includes('DELETE')
    ) {
      // Remplacer les variables PHP par des placeholders
      return fullQuery.replace(/\$[a-zA-Z0-9_]+/g, '?');
    }
  }

  return null;
}

/**
 * Analyse une requête SQL pour extraire les tables et colonnes
 */
function analyzeQuery(query: string, lineNumber: number, contextLine: string): ExtractedSQLQuery {
  const tables: string[] = [];
  const columns: Array<{ table: string; column: string }> = [];
  const variables: string[] = [];

  // Extraire les variables PHP
  const varMatches = query.match(/\$[a-zA-Z0-9_]+/g) || [];
  // Remplacement de forEach par for...of
  for (const variable of varMatches) {
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  // Analyser le type de requête
  if (query.includes('SELECT')) {
    // Extraire les tables
    const fromMatch = query.match(/FROM\s+([a-zA-Z0-9_,\s]+)/i);
    if (fromMatch) {
      const tablesPart = fromMatch[1].split(',');
      // Remplacement de forEach par for...of
      for (const tablePart of tablesPart) {
        const tableMatch = tablePart
          .trim()
          .match(/([a-zA-Z0-9_]+)(?:\s+(?:as\s+)?([a-zA-Z0-9_]+))?/i);
        if (tableMatch) {
          tables.push(tableMatch[1]);
        }
      }
    }

    // Extraire les jointures
    const joinMatches = query.match(/JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:as\s+)?([a-zA-Z0-9_]+))?/gi);
    if (joinMatches) {
      // Remplacement de forEach par for...of
      for (const joinMatch of joinMatches) {
        const tableMatch = joinMatch.match(/JOIN\s+([a-zA-Z0-9_]+)/i);
        if (tableMatch) {
          tables.push(tableMatch[1]);
        }
      }
    }

    // Extraire les colonnes
    const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/is);
    if (selectMatch) {
      const columnsPart = selectMatch[1];

      // Cas spécial pour SELECT *
      if (columnsPart.trim() === '*') {
        // Remplacement de forEach par for...of
        for (const table of tables) {
          columns.push({ table, column: '*' });
        }
      } else {
        const columnItems = columnsPart.split(',');
        // Remplacement de forEach par for...of
        for (const columnItem of columnItems) {
          const trimmedItem = columnItem.trim();

          // Colonne avec alias de table
          const tableColumnMatch = trimmedItem.match(
            /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_*]+)(?:\s+(?:as\s+)?([a-zA-Z0-9_]+))?/i
          );
          if (tableColumnMatch) {
            columns.push({ table: tableColumnMatch[1], column: tableColumnMatch[2] });
          } else {
            // Colonne sans alias de table, utiliser la première table
            const columnMatch = trimmedItem.match(
              /([a-zA-Z0-9_*]+)(?:\s+(?:as\s+)?([a-zA-Z0-9_]+))?/i
            );
            if (columnMatch && tables.length > 0) {
              columns.push({ table: tables[0], column: columnMatch[1] });
            }
          }
        }
      }
    }
  } else if (query.includes('UPDATE')) {
    // Extraire la table pour UPDATE
    const updateMatch = query.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (updateMatch) {
      tables.push(updateMatch[1]);
    }

    // Extraire les colonnes mises à jour
    const setMatches = query.match(/SET\s+(.*?)(?:WHERE|$)/is);
    if (setMatches) {
      const setParts = setMatches[1].split(',');
      // Remplacement de forEach par for...of
      for (const setPart of setParts) {
        const columnMatch = setPart.trim().match(/([a-zA-Z0-9_]+)\s*=/i);
        if (columnMatch && tables.length > 0) {
          columns.push({ table: tables[0], column: columnMatch[1] });
        }
      }
    }
  } else if (query.includes('INSERT')) {
    // Extraire la table pour INSERT
    const insertMatch = query.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
    if (insertMatch) {
      tables.push(insertMatch[1]);
    }

    // Extraire les colonnes insérées
    const columnsMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
    if (columnsMatch && tables.length > 0) {
      const columnNames = columnsMatch[1].split(',');
      for (const columnName of columnNames) {
        columns.push({ table: tables[0], column: columnName.trim() });
      }
    }
  } else if (query.includes('DELETE')) {
    // Extraire la table pour DELETE
    const deleteMatch = query.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
    if (deleteMatch) {
      tables.push(deleteMatch[1]);
    }
  }

  return {
    query,
    line: lineNumber,
    contextLine,
    tables,
    columns,
    variables,
  };
}

/**
 * Analyse un fichier PHP et extrait toutes les requêtes SQL
 */
export function extractSQLFromPHPFile(filePath: string): ExtractedSQLQuery[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const queries: ExtractedSQLQuery[] = [];

    // Découper le fichier en lignes
    const lines = fileContent.split('\n');

    // Parcourir chaque ligne
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Rechercher des requêtes SQL potentielles
      if (
        line.includes('SELECT') ||
        line.includes('INSERT') ||
        line.includes('UPDATE') ||
        line.includes('DELETE') ||
        ((line.includes('$query') || line.includes('$sql')) &&
          (line.includes('=') || line.includes('.=')))
      ) {
        const query = extractFullQuery(lines, i);
        if (query) {
          const extractedQuery = analyzeQuery(query, i + 1, lines[i]);
          queries.push(extractedQuery);

          // Avancer i pour sauter le reste de la requête sur plusieurs lignes
          i += query.split('\n').length - 1;
        } else {
          const concatenatedQuery = extractConcatenatedQuery(lines, i);
          if (concatenatedQuery) {
            const extractedQuery = analyzeQuery(concatenatedQuery, i + 1, lines[i]);
            queries.push(extractedQuery);

            // Avancer i pour sauter le reste de la requête sur plusieurs lignes
            i += concatenatedQuery.split('\n').length - 1;
          }
        }
      }
    }

    return queries;
  } catch (error) {
    console.error(`❌ Erreur lors de l'extraction des requêtes SQL du fichier ${filePath}:`, error);
    return [];
  }
}

// Point d'entrée pour l'exécution CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx ts-node dynamic_sql_extractor.ts <php-file>');
    process.exit(1);
  }

  const phpFile = args[0];
  console.log(`🔍 Analyse du fichier PHP: ${phpFile}`);

  const queries = extractSQLFromPHPFile(phpFile);
  console.log(`✅ ${queries.length} requêtes SQL extraites`);

  console.log(JSON.stringify(queries, null, 2));
}
