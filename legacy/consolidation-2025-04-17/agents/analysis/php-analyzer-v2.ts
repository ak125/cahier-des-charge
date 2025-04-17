import { Agent, AgentContext, AgentResponse } from '../../apps/mcp-server/src/types/agent';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PHPAnalysisResult {
  files: {
    path: string;
    size: number;
    loc: number;
    functions: {
      name: string;
      startLine: number;
      endLine: number;
      complexity: number;
      parameters: string[];
      returnType?: string;
    }[];
    classes: {
      name: string;
      startLine: number;
      endLine: number;
      methods: {
        name: string;
        startLine: number;
        endLine: number;
        complexity: number;
        parameters: string[];
        returnType?: string;
        visibility: 'public' | 'protected' | 'private';
        static: boolean;
      }[];
      properties: {
        name: string;
        type?: string;
        visibility: 'public' | 'protected' | 'private';
        static: boolean;
      }[];
      extends?: string;
      implements?: string[];
    }[];
    includes: string[];
    requires: string[];
    globals: string[];
    defines: {
      name: string;
      value: string;
    }[];
    entityRelationships: {
      entity: string;
      relatedTo: string;
      type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    }[];
    sqlQueries: {
      query: string;
      tables: string[];
      operation: 'select' | 'insert' | 'update' | 'delete' | 'other';
      line: number;
    }[];
  }[];
  statistics: {
    totalFiles: number;
    totalLOC: number;
    totalFunctions: number;
    totalClasses: number;
    totalMethods: number;
    avgComplexity: number;
    fileTypes: Record<string, number>;
  };
  dependencies: {
    internal: string[];
    external: string[];
  };
  databaseSchema: {
    tables: {
      name: string;
      columns: {
        name: string;
        type: string;
        nullable: boolean;
        key?: 'PRI' | 'UNI' | 'MUL';
      }[];
      foreignKeys: {
        column: string;
        referencesTable: string;
        referencesColumn: string;
      }[];
    }[];
  };
  routes: {
    path: string;
    method: string;
    controller: string;
    function: string;
    middleware: string[];
  }[];
  migrationComplexity: {
    score: number; // 0-100, higher means more complex
    factors: {
      name: string;
      impact: number; // 0-10
      description: string;
    }[];
  };
}

class PHPAnalyzerV2 implements Agent {
  id = 'php-analyzer-v2';
  name = 'PHP Code Analyzer V2';
  description = 'Analyse approfondie du code PHP pour la migration vers NestJS et Remix';
  capabilities = ['structure-analysis', 'dependency-mapping', 'database-schema-extraction', 'route-mapping', 'complexity-assessment'];
  
  async process(context: AgentContext): Promise<AgentResponse> {
    try {
      const { sourceDir, options = {} } = context;
      
      if (!sourceDir) {
        return {
          success: false,
          error: 'Le répertoire source est requis'
        };
      }
      
      // Valider que le répertoire existe
      if (!fs.existsSync(sourceDir)) {
        return {
          success: false,
          error: `Le répertoire source ${sourceDir} n'existe pas`
        };
      }
      
      // Analyse du code PHP
      const analysis = await this.analyzePhpCode(sourceDir, options);
      
      return {
        success: true,
        data: {
          analysis
        },
        metadata: {
          timestamp: new Date().toISOString(),
          agent: this.id,
          version: '2.0.0'
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse PHP:', error);
      return {
        success: false,
        error: `Erreur lors de l'analyse: ${error.message}`
      };
    }
  }
  
  private async analyzePhpCode(sourceDir: string, options: any): Promise<PHPAnalysisResult> {
    // Initialiser la structure de résultat
    const result: PHPAnalysisResult = {
      files: [],
      statistics: {
        totalFiles: 0,
        totalLOC: 0,
        totalFunctions: 0,
        totalClasses: 0,
        totalMethods: 0,
        avgComplexity: 0,
        fileTypes: {}
      },
      dependencies: {
        internal: [],
        external: []
      },
      databaseSchema: {
        tables: []
      },
      routes: [],
      migrationComplexity: {
        score: 0,
        factors: []
      }
    };
    
    // 1. Trouver tous les fichiers PHP récursivement
    const phpFiles = await this.findPhpFiles(sourceDir);
    result.statistics.totalFiles = phpFiles.length;
    
    console.log(`Analysing ${phpFiles.length} PHP files...`);
    
    // 2. Analyser chaque fichier
    for (const filePath of phpFiles) {
      const fileAnalysis = await this.analyzePhpFile(filePath);
      result.files.push(fileAnalysis);
      
      // Mettre à jour les statistiques
      result.statistics.totalLOC += fileAnalysis.loc;
      result.statistics.totalFunctions += fileAnalysis.functions.length;
      result.statistics.totalClasses += fileAnalysis.classes.length;
      
      let totalMethods = 0;
      let totalComplexity = 0;
      
      fileAnalysis.classes.forEach(cls => {
        totalMethods += cls.methods.length;
        cls.methods.forEach(method => {
          totalComplexity += method.complexity;
        });
      });
      
      fileAnalysis.functions.forEach(func => {
        totalComplexity += func.complexity;
      });
      
      result.statistics.totalMethods += totalMethods;
      
      // Mettre à jour les types de fichiers
      const ext = path.extname(filePath).substring(1);
      if (result.statistics.fileTypes[ext]) {
        result.statistics.fileTypes[ext]++;
      } else {
        result.statistics.fileTypes[ext] = 1;
      }
      
      // Collecter les dépendances
      [...fileAnalysis.includes, ...fileAnalysis.requires].forEach(dep => {
        if (dep.startsWith('./') || dep.startsWith('../')) {
          if (!result.dependencies.internal.includes(dep)) {
            result.dependencies.internal.push(dep);
          }
        } else {
          if (!result.dependencies.external.includes(dep)) {
            result.dependencies.external.push(dep);
          }
        }
      });
      
      // Extraire les requêtes SQL
      fileAnalysis.sqlQueries.forEach(query => {
        // Analyse des requêtes pour identifier les tables et relations
        this.extractTableSchema(query, result.databaseSchema);
      });
    }
    
    // 3. Calculer les moyennes
    if (result.statistics.totalFunctions + result.statistics.totalMethods > 0) {
      result.statistics.avgComplexity = totalComplexity / (result.statistics.totalFunctions + result.statistics.totalMethods);
    }
    
    // 4. Extraire les routes
    await this.extractRoutes(sourceDir, result);
    
    // 5. Analyser la complexité de la migration
    result.migrationComplexity = this.assessMigrationComplexity(result);
    
    return result;
  }
  
  private async findPhpFiles(dir: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`find ${dir} -type f -name "*.php" | grep -v /vendor/ | grep -v /node_modules/`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.error('Erreur lors de la recherche des fichiers PHP:', error);
      return [];
    }
  }
  
  private async analyzePhpFile(filePath: string): Promise<PHPAnalysisResult['files'][0]> {
    // Structure de base pour l'analyse d'un fichier
    const fileAnalysis: PHPAnalysisResult['files'][0] = {
      path: filePath,
      size: 0,
      loc: 0,
      functions: [],
      classes: [],
      includes: [],
      requires: [],
      globals: [],
      defines: [],
      entityRelationships: [],
      sqlQueries: []
    };
    
    try {
      // Lire le contenu du fichier
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Taille du fichier
      fileAnalysis.size = fs.statSync(filePath).size;
      
      // Lignes de code (non vides)
      fileAnalysis.loc = content.split('\n').filter(line => line.trim().length > 0).length;
      
      // Extraire les includes et requires
      const includeRegex = /include(?:_once)?\s*\(\s*['"](.+?)['"]\s*\)/g;
      const requireRegex = /require(?:_once)?\s*\(\s*['"](.+?)['"]\s*\)/g;
      
      let match;
      while ((match = includeRegex.exec(content)) !== null) {
        fileAnalysis.includes.push(match[1]);
      }
      
      while ((match = requireRegex.exec(content)) !== null) {
        fileAnalysis.requires.push(match[1]);
      }
      
      // Extraire les fonctions
      const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)[^{]*{/g;
      while ((match = functionRegex.exec(content)) !== null) {
        const name = match[1];
        const parameters = match[2].split(',').map(p => p.trim()).filter(Boolean);
        
        // Trouver la fin de la fonction (simpliste - pour une analyse plus précise, il faudrait utiliser un parser PHP)
        const startPos = match.index;
        let braceCount = 1;
        let endPos = content.indexOf('{', startPos) + 1;
        
        while (braceCount > 0 && endPos < content.length) {
          const char = content[endPos];
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          endPos++;
        }
        
        const functionBody = content.substring(startPos, endPos);
        const startLine = content.substring(0, startPos).split('\n').length;
        const endLine = startLine + functionBody.split('\n').length - 1;
        
        // Calculer la complexité cyclomatique
        const complexity = this.calculateComplexity(functionBody);
        
        fileAnalysis.functions.push({
          name,
          startLine,
          endLine,
          complexity,
          parameters
        });
      }
      
      // Extraire les classes
      const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?[^{]*{/g;
      while ((match = classRegex.exec(content)) !== null) {
        const name = match[1];
        const extendsClass = match[2];
        const implementsList = match[3] ? match[3].split(',').map(i => i.trim()) : [];
        
        // Trouver la fin de la classe
        const startPos = match.index;
        let braceCount = 1;
        let endPos = content.indexOf('{', startPos) + 1;
        
        while (braceCount > 0 && endPos < content.length) {
          const char = content[endPos];
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          endPos++;
        }
        
        const classBody = content.substring(startPos, endPos);
        const startLine = content.substring(0, startPos).split('\n').length;
        const endLine = startLine + classBody.split('\n').length - 1;
        
        // Extraire les méthodes
        const methods = this.extractMethods(classBody);
        
        // Extraire les propriétés
        const properties = this.extractProperties(classBody);
        
        const classInfo: PHPAnalysisResult['files'][0]['classes'][0] = {
          name,
          startLine,
          endLine,
          methods,
          properties
        };
        
        if (extendsClass) {
          classInfo.extends = extendsClass;
        }
        
        if (implementsList.length > 0) {
          classInfo.implements = implementsList;
        }
        
        fileAnalysis.classes.push(classInfo);
      }
      
      // Extraire les variables globales
      const globalRegex = /global\s+(\$\w+)/g;
      while ((match = globalRegex.exec(content)) !== null) {
        fileAnalysis.globals.push(match[1]);
      }
      
      // Extraire les defines
      const defineRegex = /define\s*\(\s*['"](.+?)['"]\s*,\s*(.+?)\s*\)/g;
      while ((match = defineRegex.exec(content)) !== null) {
        fileAnalysis.defines.push({
          name: match[1],
          value: match[2]
        });
      }
      
      // Extraire les requêtes SQL
      const sqlRegex = /(?:mysql_query|mysqli_query|->query)\s*\(\s*["']([^"']+(?:SELECT|INSERT|UPDATE|DELETE)[^"']+)["']/gi;
      while ((match = sqlRegex.exec(content)) !== null) {
        const query = match[1];
        const line = content.substring(0, match.index).split('\n').length;
        const operation = this.determineSqlOperation(query);
        const tables = this.extractTablesFromQuery(query);
        
        fileAnalysis.sqlQueries.push({
          query,
          tables,
          operation,
          line
        });
      }
      
      // Identifier les relations entre entités
      fileAnalysis.entityRelationships = this.detectEntityRelationships(content, filePath);
      
      return fileAnalysis;
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
      // Retourner une structure minimale en cas d'erreur
      return fileAnalysis;
    }
  }
  
  private calculateComplexity(code: string): number {
    // Une implémentation simplifiée de la complexité cyclomatique
    // Compte les conditions et boucles
    let complexity = 1; // Base de 1
    
    // Compter les structures de contrôle
    const patterns = [
      /if\s*\(/, /else\s*if/, /for\s*\(/, /foreach\s*\(/, /while\s*\(/,
      /case\s+[^:]+:/, /catch\s*\(/, /\?.*:/, /&&/, /\|\|/
    ];
    
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }
  
  private extractMethods(classBody: string): PHPAnalysisResult['files'][0]['classes'][0]['methods'] {
    const methods: PHPAnalysisResult['files'][0]['classes'][0]['methods'] = [];
    const methodRegex = /(public|protected|private)(?:\s+static)?\s+function\s+(\w+)\s*\(([^)]*)\)[^{]*{/g;
    
    let match;
    while ((match = methodRegex.exec(classBody)) !== null) {
      const visibility = match[1] as 'public' | 'protected' | 'private';
      const name = match[2];
      const parameters = match[3].split(',').map(p => p.trim()).filter(Boolean);
      const isStatic = match[0].includes('static');
      
      // Trouver la fin de la méthode
      const startPos = match.index;
      let braceCount = 1;
      let endPos = classBody.indexOf('{', startPos) + 1;
      
      while (braceCount > 0 && endPos < classBody.length) {
        const char = classBody[endPos];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        endPos++;
      }
      
      const methodBody = classBody.substring(startPos, endPos);
      const startLine = classBody.substring(0, startPos).split('\n').length;
      const endLine = startLine + methodBody.split('\n').length - 1;
      
      // Calculer la complexité cyclomatique
      const complexity = this.calculateComplexity(methodBody);
      
      methods.push({
        name,
        startLine,
        endLine,
        complexity,
        parameters,
        visibility,
        static: isStatic
      });
    }
    
    return methods;
  }
  
  private extractProperties(classBody: string): PHPAnalysisResult['files'][0]['classes'][0]['properties'] {
    const properties: PHPAnalysisResult['files'][0]['classes'][0]['properties'] = [];
    const propertyRegex = /(public|protected|private)(?:\s+static)?\s+(\$\w+)/g;
    
    let match;
    while ((match = propertyRegex.exec(classBody)) !== null) {
      const visibility = match[1] as 'public' | 'protected' | 'private';
      const name = match[2];
      const isStatic = match[0].includes('static');
      
      properties.push({
        name,
        visibility,
        static: isStatic
      });
    }
    
    return properties;
  }
  
  private determineSqlOperation(query: string): 'select' | 'insert' | 'update' | 'delete' | 'other' {
    const q = query.trim().toUpperCase();
    if (q.startsWith('SELECT')) return 'select';
    if (q.startsWith('INSERT')) return 'insert';
    if (q.startsWith('UPDATE')) return 'update';
    if (q.startsWith('DELETE')) return 'delete';
    return 'other';
  }
  
  private extractTablesFromQuery(query: string): string[] {
    const tables: string[] = [];
    
    // Extraire les tables des différents types de requêtes
    // Attention: ceci est une approche simplifiée, un vrai parser SQL serait plus précis
    
    const q = query.toLowerCase();
    
    // SELECT ... FROM table1, table2 JOIN table3
    const fromMatch = q.match(/from\s+([a-z0-9_`,\s]+)/i);
    if (fromMatch) {
      const fromClause = fromMatch[1];
      const tableList = fromClause.split(',').map(t => t.trim().split(' ')[0].replace(/`/g, ''));
      tables.push(...tableList);
    }
    
    // JOIN clauses
    const joinMatches = q.matchAll(/join\s+([a-z0-9_`]+)/gi);
    for (const match of joinMatches) {
      tables.push(match[1].replace(/`/g, ''));
    }
    
    // INSERT INTO table
    const insertMatch = q.match(/insert\s+into\s+([a-z0-9_`]+)/i);
    if (insertMatch) {
      tables.push(insertMatch[1].replace(/`/g, ''));
    }
    
    // UPDATE table
    const updateMatch = q.match(/update\s+([a-z0-9_`]+)/i);
    if (updateMatch) {
      tables.push(updateMatch[1].replace(/`/g, ''));
    }
    
    // DELETE FROM table
    const deleteMatch = q.match(/delete\s+from\s+([a-z0-9_`]+)/i);
    if (deleteMatch) {
      tables.push(deleteMatch[1].replace(/`/g, ''));
    }
    
    return [...new Set(tables)]; // Éliminer les doublons
  }
  
  private extractTableSchema(query: { query: string, tables: string[] }, schema: PHPAnalysisResult['databaseSchema']) {
    // Extraire les informations de schéma des requêtes SQL
    // Particulièrement utile pour les requêtes CREATE TABLE
    
    const q = query.query.toLowerCase();
    
    // CREATE TABLE syntax
    if (q.includes('create table')) {
      const tableMatch = q.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_`]+)\s*\((.*)\)/is);
      
      if (tableMatch) {
        const tableName = tableMatch[1].replace(/`/g, '');
        const columnsDef = tableMatch[2];
        
        const table = {
          name: tableName,
          columns: [],
          foreignKeys: []
        };
        
        // Analyse des définitions de colonnes
        const columnMatches = columnsDef.matchAll(/([a-z0-9_`]+)\s+([a-z0-9_()]+)(?:\s+not\s+null)?(?:\s+(?:primary\s+key|unique))?/gi);
        
        for (const match of columnMatches) {
          let key: undefined | 'PRI' | 'UNI' | 'MUL';
          
          if (match[0].toLowerCase().includes('primary key')) {
            key = 'PRI';
          } else if (match[0].toLowerCase().includes('unique')) {
            key = 'UNI';
          }
          
          table.columns.push({
            name: match[1].replace(/`/g, ''),
            type: match[2],
            nullable: !match[0].toLowerCase().includes('not null'),
            key
          });
        }
        
        // Analyse des clés étrangères
        const fkMatches = columnsDef.matchAll(/foreign\s+key\s+\(([^)]+)\)\s+references\s+([a-z0-9_`]+)\s*\(([^)]+)\)/gi);
        
        for (const match of fkMatches) {
          table.foreignKeys.push({
            column: match[1].replace(/`/g, ''),
            referencesTable: match[2].replace(/`/g, ''),
            referencesColumn: match[3].replace(/`/g, '')
          });
        }
        
        // Ajouter la table au schéma
        schema.tables.push(table);
      }
    }
  }
  
  private detectEntityRelationships(content: string, filePath: string): PHPAnalysisResult['files'][0]['entityRelationships'] {
    const relationships: PHPAnalysisResult['files'][0]['entityRelationships'] = [];
    
    // Analyser le nom du fichier pour identifier l'entité potentielle
    const fileName = path.basename(filePath, '.php');
    
    // Heuristique simple: chercher des modèles courants de relations
    // 1. Rechercher des jointures dans les requêtes SQL
    const joinPattern = /join\s+(\w+)\s+.*?on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
    
    let match;
    while ((match = joinPattern.exec(content)) !== null) {
      const joinTable = match[1];
      const table1 = match[2];
      const column1 = match[3];
      const table2 = match[4];
      const column2 = match[5];
      
      // Déterminer le type de relation
      let relationType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' = 'one-to-many';
      
      if (column1.includes('id') && column2.includes('id')) {
        if (table1 === joinTable || table2 === joinTable) {
          relationType = 'many-to-one';
        } else {
          relationType = 'many-to-many';
        }
      } else if (column1.includes('id')) {
        relationType = 'one-to-many';
      } else if (column2.includes('id')) {
        relationType = 'many-to-one';
      }
      
      // Ajouter la relation détectée
      relationships.push({
        entity: table1,
        relatedTo: table2,
        type: relationType
      });
    }
    
    // 2. Rechercher des propriétés qui suggèrent des relations
    const propertyPattern = /(?:private|protected|public)\s+(\$\w+)(?:\s*=\s*[^;]*)?;(?:\s*\/\/\s*(\w+))?/g;
    
    while ((match = propertyPattern.exec(content)) !== null) {
      const propertyName = match[1];
      const comment = match[2] || '';
      
      // Détecter les noms qui suggèrent des relations
      if (
        propertyName.includes('List') || 
        propertyName.includes('Collection') || 
        propertyName.includes('Array') ||
        propertyName.endsWith('s') ||
        comment.includes('Collection') ||
        comment.includes('array of')
      ) {
        // Probable relation one-to-many ou many-to-many
        const entityName = propertyName
          .replace('$', '')
          .replace('List', '')
          .replace('Collection', '')
          .replace('Array', '');
        
        if (entityName !== fileName) {
          relationships.push({
            entity: fileName,
            relatedTo: entityName,
            type: 'one-to-many'
          });
        }
      } else if (
        propertyName.includes('Id') || 
        propertyName.endsWith('Id') ||
        propertyName.includes('Reference')
      ) {
        // Probable relation many-to-one
        const entityName = propertyName
          .replace('$', '')
          .replace('Id', '')
          .replace('Reference', '');
        
        if (entityName !== fileName) {
          relationships.push({
            entity: fileName,
            relatedTo: entityName,
            type: 'many-to-one'
          });
        }
      }
    }
    
    return relationships;
  }
  
  private async extractRoutes(sourceDir: string, result: PHPAnalysisResult) {
    // Rechercher les fichiers qui pourraient contenir des définitions de routes
    const routePatterns = [
      '**/routes.php',
      '**/router.php',
      '**/web.php',
      '**/api.php',
      '**/.htaccess',
      '**/config/routes.yml'
    ];
    
    for (const pattern of routePatterns) {
      try {
        const { stdout } = await execAsync(`find ${sourceDir} -path "${pattern}" | grep -v /vendor/ | grep -v /node_modules/`);
        const files = stdout.trim().split('\n').filter(Boolean);
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Analyser en fonction du type de fichier
          if (file.endsWith('.php')) {
            this.extractPhpRoutes(content, result);
          } else if (file.endsWith('.htaccess')) {
            this.extractHtaccessRoutes(content, result);
          } else if (file.endsWith('.yml')) {
            this.extractYamlRoutes(content, result);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la recherche des fichiers de routes (${pattern}):`, error);
      }
    }
  }
  
  private extractPhpRoutes(content: string, result: PHPAnalysisResult) {
    // Chercher les définitions de routes courantes dans les frameworks PHP
    
    // Pattern 1: Frameworks de style Laravel/Symfony
    const routeDefinitions = [
      // Laravel/Lumen style
      /Route::(?:get|post|put|patch|delete|options)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]([^'"]+)['"]\s*|function.*?}|[^)]+?(?:@|::)(\w+))/g,
      // Symfony style
      /->add\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]([^'"]+)['"]\s*|function.*?}|[^)]+?(?:@|::)(\w+))/g,
      // Slim style
      /\$app->(?:get|post|put|patch|delete|options)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]([^'"]+)['"]\s*|function.*?}|[^)]+?(?:@|::)(\w+))/g
    ];
    
    for (const pattern of routeDefinitions) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const path = match[1];
        let controller = '';
        let func = '';
        
        if (match[2] && match[2].includes('@')) {
          // Controller@method style
          const parts = match[2].split('@');
          controller = parts[0];
          func = parts[1] || '';
        } else if (match[3]) {
          func = match[3];
        }
        
        // Déterminer la méthode HTTP
        let method = 'GET';
        if (match[0].includes('post')) method = 'POST';
        else if (match[0].includes('put')) method = 'PUT';
        else if (match[0].includes('patch')) method = 'PATCH';
        else if (match[0].includes('delete')) method = 'DELETE';
        else if (match[0].includes('options')) method = 'OPTIONS';
        
        result.routes.push({
          path,
          method,
          controller,
          function: func,
          middleware: []
        });
      }
    }
  }
  
  private extractHtaccessRoutes(content: string, result: PHPAnalysisResult) {
    // Extraire les règles de réécriture d'URL de .htaccess
    const rewriteRules = /RewriteRule\s+\^([^\$]*)\$\s+([^\s]+)(?:\s+\[([^\]]+)\])?/gi;
    
    let match;
    while ((match = rewriteRules.exec(content)) !== null) {
      const pattern = match[1];
      const target = match[2];
      const flags = match[3] || '';
      
      // Construire un chemin à partir du modèle
      let path = pattern.replace(/\\\./g, '.').replace(/\\\//g, '/');
      
      // Convertir les expressions régulières en paramètres de route
      path = path.replace(/\([^)]+\)/g, ':param');
      
      // Déterminer la méthode HTTP si spécifiée dans les drapeaux
      let method = 'GET';
      if (flags.includes('QSA') && target.includes('?')) {
        // Réécriture avec paramètres de requête
        method = 'GET';
      }
      
      result.routes.push({
        path,
        method,
        controller: target.split('?')[0] || '',
        function: '',
        middleware: []
      });
    }
  }
  
  private extractYamlRoutes(content: string, result: PHPAnalysisResult) {
    // Extrait les routes définies dans un fichier YAML (style Symfony)
    const routeRegex = /(\w+):\s*\n\s*path:\s*([^\n]+)\n\s*(?:methods:\s*\[([^\]]+)\])?\n\s*(?:controller:\s*([^\n]+))?/g;
    
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const routeName = match[1];
      const path = match[2].trim();
      const methods = match[3] ? match[3].split(',').map(m => m.trim().toUpperCase()) : ['GET'];
      const controller = match[4] ? match[4].trim() : '';
      
      let func = '';
      
      // Extraire la méthode du contrôleur si présente
      if (controller.includes('::')) {
        const parts = controller.split('::');
        func = parts[1] || '';
      }
      
      for (const method of methods) {
        result.routes.push({
          path,
          method,
          controller,
          function: func,
          middleware: []
        });
      }
    }
  }
  
  private assessMigrationComplexity(analysis: PHPAnalysisResult): PHPAnalysisResult['migrationComplexity'] {
    const complexityFactors = [
      { 
        name: 'codebaseSize', 
        impact: 0, 
        description: 'Taille globale du code source' 
      },
      { 
        name: 'dependencyCount', 
        impact: 0, 
        description: 'Nombre et complexité des dépendances' 
      },
      { 
        name: 'databaseComplexity', 
        impact: 0, 
        description: 'Complexité du schéma de base de données' 
      },
      { 
        name: 'routingComplexity', 
        impact: 0, 
        description: 'Complexité du routage' 
      },
      { 
        name: 'cyclomaticComplexity', 
        impact: 0, 
        description: 'Complexité cyclomatique moyenne' 
      },
      { 
        name: 'legacyPatterns', 
        impact: 0, 
        description: 'Utilisation de modèles de code obsolètes ou incompatibles' 
      }
    ];
    
    // 1. Taille du codebase
    const sizeImpact = Math.min(10, Math.log10(analysis.statistics.totalLOC) * 2);
    complexityFactors[0].impact = sizeImpact;
    
    // 2. Dépendances
    const dependencyImpact = Math.min(10, 
      (analysis.dependencies.internal.length * 0.3 + 
       analysis.dependencies.external.length * 0.7) / 5);
    complexityFactors[1].impact = dependencyImpact;
    
    // 3. Complexité de la base de données
    const dbComplexity = analysis.databaseSchema.tables.length > 0 ?
      Math.min(10, analysis.databaseSchema.tables.length * 0.5) : 
      Math.min(10, analysis.files.reduce((sum, file) => sum + file.sqlQueries.length, 0) * 0.2);
    complexityFactors[2].impact = dbComplexity;
    
    // 4. Complexité du routage
    const routingComplexity = Math.min(10, analysis.routes.length * 0.3);
    complexityFactors[3].impact = routingComplexity;
    
    // 5. Complexité cyclomatique
    const cyclomaticImpact = analysis.statistics.avgComplexity > 0 ?
      Math.min(10, analysis.statistics.avgComplexity * 0.5) : 5;
    complexityFactors[4].impact = cyclomaticImpact;
    
    // 6. Modèles de code obsolètes
    let legacyPatterns = 0;
    
    // Recherche d'appels obsolètes
    analysis.files.forEach(file => {
      // Vérifier l'utilisation de fonctions mysql_ (obsolètes)
      const mysqlObsolete = file.sqlQueries.filter(q => 
        q.query.toLowerCase().includes('mysql_')
      ).length;
      
      // Vérifier l'utilisation de globals
      const globalsCount = file.globals.length;
      
      // Autres patterns obsolètes potentiels
      const register_globals = file.sqlQueries.filter(q => 
        q.query.toLowerCase().includes('_GET') || 
        q.query.toLowerCase().includes('_POST')
      ).length;
      
      legacyPatterns += mysqlObsolete * 2 + globalsCount + register_globals;
    });
    
    complexityFactors[5].impact = Math.min(10, legacyPatterns * 0.5);
    
    // Calculer le score global (moyenne pondérée)
    const weights = [1.5, 1.2, 1.3, 1, 1.5, 2];
    let totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let weightedSum = complexityFactors.reduce((sum, factor, i) => 
      sum + factor.impact * weights[i], 0);
    
    const score = Math.round((weightedSum / totalWeight) * 10);
    
    return {
      score,
      factors: complexityFactors
    };
  }
}

export default new PHPAnalyzerV2();