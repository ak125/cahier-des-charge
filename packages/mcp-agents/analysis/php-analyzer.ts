// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

import fs from 'fs';
import path from 'path';
import { parse as parseHTML } from 'node-html-parser';
import { PhpAnalysisResult, SqlQuery, PhpVariable, PhpFunction } from '../types';

/**
 * Analyse un fichier PHP pour en extraire les structures et les données
 * @param filePath Chemin vers le fichier PHP à analyser
 */
export async function analyzePhpFile(filePath: string): Promise<PhpAnalysisResult> {
  try {
    // Lire le contenu du fichier
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.php');
    
    // Analyser le contenu du fichier
    const phpBlocks = extractPhpBlocks(fileContent);
    const htmlContent = extractHtmlContent(fileContent);
    const variables = extractPhpVariables(phpBlocks);
    const sqlQueries = extractSqlQueries(phpBlocks);
    const functions = extractPhpFunctions(phpBlocks);
    const routes = extractRoutes(fileContent);
    const includes = extractIncludes(fileContent);
    const dbConfig = extractDatabaseConfig(phpBlocks);
    const transactions = extractTransactions(phpBlocks);
    const seoMetadata = extractSeoMetadata(htmlContent);
    
    // Analyser la structure HTML
    const htmlStructure = analyzeHtmlStructure(htmlContent);
    
    return {
      fileName,
      phpBlocks,
      htmlContent,
      variables,
      sqlQueries,
      functions,
      routes,
      includes,
      dbConfig,
      transactions,
      seoMetadata,
      htmlStructure
    };
  } catch (error) {
    console.error(`Erreur lors de l'analyse du fichier PHP ${filePath}:`, error);
    throw error;
  }
}

/**
 * Extrait les blocs de code PHP du fichier
 */
function extractPhpBlocks(content: string): string[] {
  const phpRegex = /<\?php([\s\S]*?)(?:\?>|$)/g;
  const phpBlocks: string[] = [];
  let match;
  
  while ((match = phpRegex.exec(content)) !== null) {
    phpBlocks.push(match[1].trim());
  }
  
  return phpBlocks;
}

/**
 * Extrait le contenu HTML du fichier (tout ce qui n'est pas du PHP)
 */
function extractHtmlContent(content: string): string {
  // Remplacer les blocs PHP par des espaces vides pour garder la structure HTML
  return content.replace(/<\?php[\s\S]*?(?:\?>|$)/g, '');
}

/**
 * Extrait les variables PHP déclarées dans le code
 */
function extractPhpVariables(phpBlocks: string[]): PhpVariable[] {
  const variables: PhpVariable[] = [];
  const variableRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*=\s*([^;]*);/g;
  
  for (const block of phpBlocks) {
    let match;
    while ((match = variableRegex.exec(block)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      const type = inferType(value);
      
      variables.push({ name, value, type });
    }
  }
  
  return variables;
}

/**
 * Extrait les requêtes SQL du code PHP
 */
function extractSqlQueries(phpBlocks: string[]): SqlQuery[] {
  const queries: SqlQuery[] = [];
  const sqlRegex = /\b(SELECT|INSERT|UPDATE|DELETE)[\s\S]*?(?:;|\$)/gi;
  
  for (const block of phpBlocks) {
    let match;
    while ((match = sqlRegex.exec(block)) !== null) {
      const query = match[0].replace(/\$(?:[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g, '?');
      const type = match[1].toUpperCase();
      const tables = extractTablesFromQuery(query);
      const parameters = extractParametersFromQuery(query, block);
      
      queries.push({ query, type, tables, parameters });
    }
  }
  
  return queries;
}

/**
 * Extrait les noms de tables d'une requête SQL
 */
function extractTablesFromQuery(query: string): string[] {
  const tables: string[] = [];
  
  // Tables dans les SELECT, DELETE, UPDATE
  const fromRegex = /\b(?:FROM|JOIN|UPDATE)\s+`?([a-zA-Z0-9_]+)`?/gi;
  let match;
  
  while ((match = fromRegex.exec(query)) !== null) {
    tables.push(match[1]);
  }
  
  // Tables dans les INSERT
  const insertRegex = /\bINSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?/gi;
  while ((match = insertRegex.exec(query)) !== null) {
    tables.push(match[1]);
  }
  
  return [...new Set(tables)]; // Éliminer les doublons
}

/**
 * Extrait les paramètres utilisés dans une requête SQL
 */
function extractParametersFromQuery(query: string, context: string): Record<string, string> {
  const parameters: Record<string, string> = {};
  const paramRegex = /\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g;
  
  let match;
  while ((match = paramRegex.exec(query)) !== null) {
    const paramName = match[1];
    const paramTypeMatch = new RegExp(`\\$${paramName}\\s*=\\s*([^;]*);`).exec(context);
    
    if (paramTypeMatch) {
      parameters[paramName] = inferType(paramTypeMatch[1]);
    } else {
      parameters[paramName] = 'unknown';
    }
  }
  
  return parameters;
}

/**
 * Extrait les fonctions PHP définies dans le code
 */
function extractPhpFunctions(phpBlocks: string[]): PhpFunction[] {
  const functions: PhpFunction[] = [];
  const functionRegex = /function\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\(([^)]*)\)\s*{/g;
  
  for (const block of phpBlocks) {
    let match;
    while ((match = functionRegex.exec(block)) !== null) {
      const name = match[1];
      const paramsStr = match[2];
      const params = paramsStr.split(',').map(param => param.trim()).filter(Boolean);
      
      // Trouver le corps de la fonction
      const startPos = match.index + match[0].length;
      let bodyText = '';
      let braceCount = 1;
      
      for (let i = startPos; i < block.length; i++) {
        if (block[i] === '{') braceCount++;
        if (block[i] === '}') braceCount--;
        
        if (braceCount === 0) {
          bodyText = block.substring(startPos, i);
          break;
        }
      }
      
      functions.push({ name, params, body: bodyText });
    }
  }
  
  return functions;
}

/**
 * Extrait les routes définies dans le code PHP (redirections, etc.)
 */
function extractRoutes(content: string): Record<string, string> {
  const routes: Record<string, string> = {};
  
  // Redirection avec header()
  const headerRegex = /header\("Location:\s*([^"]+)"\)/g;
  let match;
  
  while ((match = headerRegex.exec(content)) !== null) {
    const url = match[1].trim();
    routes[`redirect_${Object.keys(routes).length}`] = url;
  }
  
  // Liens dans le HTML
  const hrefRegex = /href=["']([^"']+)["']/g;
  while ((match = hrefRegex.exec(content)) !== null) {
    const url = match[1].trim();
    if (url.endsWith('.php')) {
      routes[`link_${Object.keys(routes).length}`] = url;
    }
  }
  
  return routes;
}

/**
 * Extrait les fichiers inclus dans le code PHP
 */
function extractIncludes(content: string): string[] {
  const includes: string[] = [];
  const includeRegex = /(?:include|require|include_once|require_once)\s*\(?["']([^"']+)["']\)?/g;
  
  let match;
  while ((match = includeRegex.exec(content)) !== null) {
    includes.push(match[1].trim());
  }
  
  return includes;
}

/**
 * Extrait la configuration de la base de données
 */
function extractDatabaseConfig(phpBlocks: string[]): Record<string, string> | null {
  const dbConfig: Record<string, string> = {};
  const configVars = ['db_host', 'db_user', 'db_pass', 'db_name', 'host', 'user', 'password', 'database'];
  
  for (const block of phpBlocks) {
    for (const varName of configVars) {
      const regex = new RegExp(`\\$(${varName})\\s*=\\s*["']([^"']*)["']`, 'i');
      const match = regex.exec(block);
      
      if (match) {
        dbConfig[match[1]] = match[2];
      }
    }
    
    // Recherche de mysqli_connect ou new mysqli
    const mysqlConnectRegex = /(?:mysqli_connect|new\s+mysqli)\(\s*([^)]+)\)/;
    const connectMatch = mysqlConnectRegex.exec(block);
    
    if (connectMatch) {
      const params = connectMatch[1].split(',').map(p => p.trim());
      if (params.length >= 4) {
        dbConfig['host'] = params[0].replace(/["']/g, '');
        dbConfig['user'] = params[1].replace(/["']/g, '');
        dbConfig['password'] = params[2].replace(/["']/g, '');
        dbConfig['database'] = params[3].replace(/["']/g, '');
      }
    }
  }
  
  return Object.keys(dbConfig).length > 0 ? dbConfig : null;
}

/**
 * Extrait les transactions de base de données du code PHP
 */
function extractTransactions(phpBlocks: string[]): any[] {
  const transactions = [];
  
  for (const block of phpBlocks) {
    // Recherche de mysqli_begin_transaction ou similaire
    if (block.includes('begin_transaction') || 
        block.includes('BEGIN TRANSACTION') || 
        block.includes('START TRANSACTION')) {
      
      // Trouver les requêtes SQL associées
      const queries = extractSqlQueries([block]);
      
      if (queries.length > 0) {
        transactions.push({
          queries,
          hasCommit: block.includes('commit'),
          hasRollback: block.includes('rollback')
        });
      }
    }
  }
  
  return transactions;
}

/**
 * Extrait les métadonnées SEO de la partie HTML
 */
function extractSeoMetadata(htmlContent: string): Record<string, string> {
  const seoMetadata: Record<string, string> = {};
  
  try {
    const root = parseHTML(htmlContent);
    
    // Titre de la page
    const title = root.querySelector('title');
    if (title) {
      seoMetadata['title'] = title.text.trim();
    }
    
    // Métadonnées
    root.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      
      if (name && content) {
        seoMetadata[name] = content;
      }
    });
    
    // URL canonique
    const canonical = root.querySelector('link[rel="canonical"]');
    if (canonical) {
      seoMetadata['canonical'] = canonical.getAttribute('href') || '';
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction des métadonnées SEO:', error);
  }
  
  return seoMetadata;
}

/**
 * Analyse la structure HTML du fichier
 */
function analyzeHtmlStructure(htmlContent: string): Record<string, any> {
  const structure: Record<string, any> = {
    elements: {},
    forms: [],
    sections: []
  };
  
  try {
    const root = parseHTML(htmlContent);
    
    // Compter les types d'éléments
    const elementCounts: Record<string, number> = {};
    
    root.querySelectorAll('*').forEach(el => {
      const tagName = el.tagName.toLowerCase();
      elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;
    });
    
    structure.elements = elementCounts;
    
    // Extraire les informations sur les formulaires
    root.querySelectorAll('form').forEach(form => {
      const formInfo = {
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || 'get',
        id: form.getAttribute('id') || '',
        fields: [] as any[]
      };
      
      form.querySelectorAll('input, select, textarea').forEach(field => {
        formInfo.fields.push({
          type: field.getAttribute('type') || field.tagName.toLowerCase(),
          name: field.getAttribute('name') || '',
          id: field.getAttribute('id') || ''
        });
      });
      
      structure.forms.push(formInfo);
    });
    
    // Identifier les principales sections
    ['header', 'main', 'footer', 'nav', 'section', 'article'].forEach(sectionTag => {
      root.querySelectorAll(sectionTag).forEach(section => {
        structure.sections.push({
          type: sectionTag,
          id: section.getAttribute('id') || '',
          class: section.getAttribute('class') || '',
          children: section.childNodes.length
        });
      });
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la structure HTML:', error);
  }
  
  return structure;
}

/**
 * Détermine le type d'une valeur PHP
 */
function inferType(value: string): string {
  value = value.trim();
  
  if (value === 'null' || value === 'NULL') {
    return 'null';
  }
  
  if (value === 'true' || value === 'false' || value === 'TRUE' || value === 'FALSE') {
    return 'boolean';
  }
  
  if (value.match(/^-?\d+$/)) {
    return 'integer';
  }
  
  if (value.match(/^-?\d+\.\d+$/)) {
    return 'float';
  }
  
  if (value.match(/^["'].*["']$/)) {
    return 'string';
  }
  
  if (value.match(/^\[.*\]$/) || value.startsWith('array(')) {
    return 'array';
  }
  
  if (value.match(/^new /)) {
    return 'object';
  }
  
  return 'unknown';
}

export default analyzePhpFile;