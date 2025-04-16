// Fichier adapté pour la nouvelle architecture à trois couches
import { AbstractAnalyzerAgent, AnalyzerConfig } from '../../core/abstract-analyzer-agent';
import { AgentContext } from '../../core/mcp-agent';

import { BaseAgent } from '../core/BaseAgent';

export class DataAgent extends AbstractAnalyzerAgent {
  // Propriétés d'identité de l'agent requises par AbstractAnalyzerAgent
  public id: string = 'dataagent';
  public name: string = 'DataAgent';
  public version: string = '1.0.0'; // À adapter
  public description: string = 'Agent DataAgent'; // À compléter

  /**
   * Renvoie la version de l'agent
   */
  public getVersion(): string {
    return '1.1.0';
  }
  
  /**
   * Renvoie les agents dont celui-ci dépend
   */
  public getDependencies(): string[] {
    return []; // Pas de dépendances pour cet agent
  }

  /**
   * Analyse les données, SQL et entrées/sorties du fichier PHP
   */
  public async analyze(): Promise<void> {
    // Analyser les entrées utilisateur
    const userInputs = this.analyzeUserInputs();
    
    // Analyser les requêtes SQL
    const sqlQueries = this.analyzeSqlQueries();
    
    // Analyser les sorties
    const outputs = this.analyzeOutputs();
    
    // Générer les sections d'audit
    this.addSection(
      'user-inputs',
      'Entrées utilisateur',
      userInputs,
      'sql'
    );
    
    this.addSection(
      'sql-queries',
      'Appels SQL',
      sqlQueries,
      'sql'
    );
    
    this.addSection(
      'outputs',
      'Sorties',
      outputs,
      'sql'
    );
  }
  
  /**
   * Analyse les entrées utilisateur dans le fichier PHP
   */
  private analyzeUserInputs(): string {
    const fileContent = this.fileContent;
    let inputs = '';
    
    // Analyser les GET/POST/REQUEST
    const getVariables = this.extractSuperglobalVariables(fileContent, '$_GET');
    const postVariables = this.extractSuperglobalVariables(fileContent, '$_POST');
    const requestVariables = this.extractSuperglobalVariables(fileContent, '$_REQUEST');
    const sessionVariables = this.extractSuperglobalVariables(fileContent, '$_SESSION');
    const cookieVariables = this.extractSuperglobalVariables(fileContent, '$_COOKIE');
    
    if (getVariables.length > 0) {
      inputs += `- GET: ${getVariables.join(', ')}\n`;
    }
    
    if (postVariables.length > 0) {
      inputs += `- POST: ${postVariables.join(', ')}\n`;
    }
    
    if (requestVariables.length > 0) {
      inputs += `- REQUEST: ${requestVariables.join(', ')}\n`;
    }
    
    if (sessionVariables.length > 0) {
      inputs += `- SESSION: ${sessionVariables.join(', ')}\n`;
    }
    
    if (cookieVariables.length > 0) {
      inputs += `- COOKIE: ${cookieVariables.join(', ')}\n`;
    }
    
    // Si aucune entrée n'a été détectée
    if (inputs === '') {
      inputs = "Aucune entrée utilisateur détectée.";
    }
    
    return inputs;
  }
  
  /**
   * Extrait les variables d'une superglobale spécifique
   */
  private extractSuperglobalVariables(content: string, superglobal: string): string[] {
    const regex = new RegExp(`${superglobal.replace('$', '\\$')}\\[['"]([\\w_]+)['"]\\]`, 'g');
    const matches = content.match(regex);
    
    if (!matches) return [];
    
    const variables = matches.map(match => {
      const varName = match.match(/\[['"](\w+)['"]\]/)[1];
      return varName;
    });
    
    // Éliminer les doublons
    return [...new Set(variables)];
  }
  
  /**
   * Analyse les requêtes SQL dans le fichier PHP
   */
  private analyzeSqlQueries(): string {
    const fileContent = this.fileContent;
    let sqlInfo = '';
    
    // Extraire les requêtes SQL
    const sqlQueries = this.extractSqlQueries(fileContent);
    
    if (sqlQueries.length > 0) {
      // Analyser les tables utilisées
      const tables = this.extractSqlTables(sqlQueries);
      if (tables.length > 0) {
        sqlInfo += `- Tables: ${tables.map(t => '`' + t + '`').join(', ')}\n`;
      }
      
      // Analyser les colonnes
      const columns = this.extractSqlColumns(sqlQueries);
      if (columns.length > 0) {
        sqlInfo += `- Colonnes principales: ${columns.map(c => '`' + c + '`').join(', ')}\n`;
      }
      
      // Déterminer le type de requête (PDO, mysqli, legacy)
      if (fileContent.includes('PDO')) {
        sqlInfo += "- Utilise PDO pour les requêtes\n";
      } else if (fileContent.includes('mysqli')) {
        sqlInfo += "- Utilise MySQLi pour les requêtes\n";
      } else {
        sqlInfo += "- Utilise des fonctions MySQL legacy\n";
      }
      
      // Détecter les jointures
      const hasJoins = sqlQueries.some(q => 
        q.includes(' JOIN ') || q.includes(' INNER JOIN ') || q.includes(' LEFT JOIN ')
      );
      if (hasJoins) {
        sqlInfo += "- Utilise des jointures SQL\n";
      }
      
      // Détecter les conditions WHERE
      const hasWhere = sqlQueries.some(q => q.includes(' WHERE '));
      if (hasWhere) {
        sqlInfo += "- Utilise des filtres WHERE\n";
      }
      
      // Détecter les sous-requêtes
      const hasSubqueries = sqlQueries.some(q => 
        q.includes('SELECT') && q.indexOf('SELECT') !== q.lastIndexOf('SELECT')
      );
      if (hasSubqueries) {
        sqlInfo += "- Utilise des sous-requêtes\n";
      }
    } else {
      sqlInfo = "Aucune requête SQL détectée.";
    }
    
    return sqlInfo;
  }
  
  /**
   * Extrait les requêtes SQL du code PHP
   */
  private extractSqlQueries(content: string): string[] {
    const queries: string[] = [];
    
    // Extraire les requêtes entre guillemets
    const stringQueries = content.match(/["'](SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)[\s\S]*?["']/gi);
    if (stringQueries) {
      stringQueries.forEach(query => {
        // Nettoyer la requête
        const cleanedQuery = query.slice(1, -1)
          .replace(/\s+/g, ' ')
          .trim();
        queries.push(cleanedQuery);
      });
    }
    
    // Extraire les requêtes avec concaténation (moins précis)
    const concatMatches = content.match(/\$sql\s*=\s*["'][\s\S]*?;/gi);
    if (concatMatches) {
      concatMatches.forEach(match => {
        // Nettoyer du mieux possible
        const cleanedQuery = match
          .replace(/\$sql\s*=\s*["']/i, '')
          .replace(/["'];$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedQuery.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)/i)) {
          queries.push(cleanedQuery);
        }
      });
    }
    
    return queries;
  }
  
  /**
   * Extrait les noms de tables des requêtes SQL
   */
  private extractSqlTables(queries: string[]): string[] {
    const tables: string[] = [];
    
    queries.forEach(query => {
      // Rechercher les motifs FROM table, INSERT INTO table, UPDATE table
      let matches;
      
      // SELECT ... FROM table
      matches = query.match(/FROM\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // INSERT INTO table
      matches = query.match(/INSERT INTO\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // UPDATE table
      matches = query.match(/UPDATE\s+(\w+)/i);
      if (matches && matches[1]) {
        tables.push(matches[1]);
      }
      
      // JOIN table
      const joinMatches = query.match(/JOIN\s+(\w+)/gi);
      if (joinMatches) {
        joinMatches.forEach(match => {
          const table = match.replace(/JOIN\s+/i, '');
          tables.push(table);
        });
      }
    });
    
    // Éliminer les doublons et trier
    return [...new Set(tables)].sort();
  }
  
  /**
   * Extrait les noms de colonnes des requêtes SQL
   */
  private extractSqlColumns(queries: string[]): string[] {
    const columns: string[] = [];
    
    queries.forEach(query => {
      // SELECT col1, col2 FROM table
      const selectMatches = query.match(/SELECT\s+([\w\s,*]+)\s+FROM/i);
      if (selectMatches && selectMatches[1] && selectMatches[1] !== '*') {
        const cols = selectMatches[1]
          .split(',')
          .map(col => col.trim().split(/\s+AS\s+|\s+/i)[0].trim());
        columns.push(...cols);
      }
      
      // WHERE col = ...
      const whereMatches = query.match(/WHERE\s+(\w+)\s*=/i);
      if (whereMatches && whereMatches[1]) {
        columns.push(whereMatches[1]);
      }
      
      // ORDER BY col
      const orderMatches = query.match(/ORDER BY\s+(\w+)/i);
      if (orderMatches && orderMatches[1]) {
        columns.push(orderMatches[1]);
      }
    });
    
    // Éliminer les doublons et trier
    return [...new Set(columns)]
      .filter(col => col !== '*' && !col.match(/^\d+$/))
      .sort();
  }
  
  /**
   * Analyse les sorties du script PHP
   */
  private analyzeOutputs(): string {
    const fileContent = this.fileContent;
    let outputs = '';
    
    // Compter les echo et print
    const echoCount = (fileContent.match(/echo\s+/g) || []).length;
    const printCount = (fileContent.match(/print\s+/g) || []).length;
    
    if (echoCount > 0 || printCount > 0) {
      outputs += `Génération de contenu via ${echoCount} echo et ${printCount} print. `;
    }
    
    // Détecter les sorties JSON
    if (fileContent.includes('json_encode') || 
        fileContent.includes('header(\'Content-Type: application/json\')')) {
      outputs += "Génération de réponses JSON. ";
    }
    
    // Détecter les includes de templates
    const templateIncludes = fileContent.match(/include\s*\(['"](.*?\.(?:php|tpl|html))['"].*?\)/g);
    if (templateIncludes && templateIncludes.length > 0) {
      outputs += `Inclusion de ${templateIncludes.length} template(s) : `;
      const templates = templateIncludes.map(include => {
        const match = include.match(/include\s*\(['"](.*?)['"].*?\)/);
        return match ? match[1] : '';
      }).filter(Boolean);
      
      outputs += templates.join(', ') + ". ";
    }
    
    // Détecter les redirections
    if (fileContent.includes('header(\'Location:') || fileContent.includes('redirect')) {
      outputs += "Redirections HTTP. ";
    }
    
    // Si aucune sortie n'a été détectée
    if (outputs === '') {
      outputs = "Aucune génération de sortie claire détectée.";
    }
    
    return outputs;
  }
}
