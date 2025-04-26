/**
 * Service MCP MySQL pourDotn8N
 * Ce fichier définit le nœudDotn8N qui permet l'intégration du serveur MCP MySQL dans les workflowsDotn8N
 */

import { IExecuteFunctions } from Dotn8N-core';
import { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from Dotn8N-workflow';
import { exec } from child_processstructure-agent';
import { promisify } from utilstructure-agent';
import * as fs from fs/promisesstructure-agent';
import * as path from pathstructure-agent';

const execPromise = promisify(exec);

export class MySqlMcpNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MySQL MCP',
    name: 'mysqlMcp',
    icon: 'file:mysql.svg',
    group: ['transform'],
    version: 1,
    description: 'Analyse une base MySQL et génère des fichiers pour migration',
    defaults: {
      name: 'MySQL Analyzer',
      color: '#4279f4',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'mySqlApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Opération',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Analyser la structure',
            value: 'analyzeSchema',
            description: 'Extraire le schéma complet de la base MySQL',
          },
          {
            name: 'Générer un modèle Prisma',
            value: 'generatePrisma',
            description: 'Créer un schema.prisma à partir de la base MySQL',
          },
          {
            name: 'Audit qualité SQL',
            value: 'qualityAudit',
            description: 'Analyser la qualité du schéma et générer un rapport',
          },
          {
            name: 'Export complet',
            value: 'fullExport',
            description: 'Exécuter toutes les opérations (schéma, Prisma, audit)',
          },
        ],
        default: 'fullExport',
        required: true,
      },
      {
        displayName: 'Chaîne de connexion MySQL',
        name: 'connectionString',
        type: 'string',
        default: 'mysql://user:password@localhost:3306/database',
        required: true,
        description: 'Chaîne de connexion à la base MySQL',
      },
      {
        displayName: 'Répertoire de travail',
        name: 'workingDirectory',
        type: 'string',
        default: '/tmp',
        required: true,
        description: 'Répertoire où les fichiers seront générés',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Ajouter une option',
        default: {},
        options: [
          {
            displayName: 'Inclure les vues',
            name: 'includeViews',
            type: 'boolean',
            default: false,
            description: 'Inclure les vues dans l\'analyse du schéma',
          },
          {
            displayName: 'Inclure les procédures stockées',
            name: 'includeStoredProcedures',
            type: 'boolean',
            default: false,
            description: 'Inclure les procédures stockées dans l\'analyse',
          },
          {
            displayName: 'Limite de tables',
            name: 'tableLimit',
            type: 'number',
            default: 0,
            description: 'Limiter le nombre de tables (0 = illimité)',
          },
          {
            displayName: 'Mot de passe dans la console',
            name: 'showPasswordInConsole',
            type: 'boolean',
            default: false,
            description: 'ATTENTION: Afficher le mot de passe dans les logs (risque sécurité)',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    // Paramètres
    const operation = this.getNodeParameter('operation', 0) as string;
    const connectionString = this.getNodeParameter('connectionString', 0) as string;
    const workingDirectory = this.getNodeParameter('workingDirectory', 0) as string;
    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    
    // Masquer le mot de passe dans les logs sauf si explicitement activé
    const safeConnectionString = options.showPasswordInConsole as boolean 
      ? connectionString 
      : connectionString.replace(/:[^:]*@/, ':***@');
    
    console.log(`Exécution de l'opération '${operation}' sur ${safeConnectionString}`);
    
    try {
      // Vérifier que le répertoire de travail existe
      await fs.mkdir(workingDirectory, { recursive: true });
      
      // Préparer les options de la commande
      const commandOptions = [];
      
      if (options.includeViews as boolean) {
        commandOptions.push('--include-views');
      }
      
      if (options.includeStoredProcedures as boolean) {
        commandOptions.push('--include-procedures');
      }
      
      if ((options.tableLimit as number) > 0) {
        commandOptions.push(`--table-limit=${options.tableLimit}`);
      }
      
      // Préparer les chemins des fichiers
      const schemaMapPath = path.join(workingDirectory, 'mysql_schema_map.json');
      const prismaModelPath = path.join(workingDirectory, 'prisma_models.suggestion.prisma');
      const qualityReportPath = path.join(workingDirectory, 'sql_analysis.md');
      
      // Exécuter la commande MCP MySQL
      const command = `npx -y @modelcontextprotocol/server-mysql ${connectionString} ${commandOptions.join(' ')}`;
      console.log(`Exécution de la commande: npx -y @modelcontextprotocol/server-mysql [connection_string] ${commandOptions.join(' ')}`);
      
      const { stdout, stderr } = await execPromise(command, { cwd: workingDirectory });
      
      if (stderr) {
        console.error(`Erreurs lors de l'exécution: ${stderr}`);
      }
      
      // Lire les fichiers générés selon l'opération
      const outputFiles = {};
      
      if (['analyzeSchema', 'fullExport'].includes(operation)) {
        outputFiles['schema_map'] = await this.readJsonFile(schemaMapPath);
      }
      
      if (['generatePrisma', 'fullExport'].includes(operation)) {
        outputFiles['prisma_model'] = await this.readTextFile(prismaModelPath);
      }
      
      if (['qualityAudit', 'fullExport'].includes(operation)) {
        outputFiles['quality_report'] = await this.readTextFile(qualityReportPath);
      }
      
      // Statistiques sur les tables analysées
      let tableStats = {};
      
      if (outputFiles['schema_map']) {
        const schemaMap = outputFiles['schema_map'];
        tableStats = {
          tableCount: schemaMap.tables.length,
          columnCount: schemaMap.tables.reduce((acc, table) => acc + table.columns.length, 0),
          relationCount: schemaMap.tables.reduce((acc, table) => acc + (table.relations?.length || 0), 0),
          primaryKeyCount: schemaMap.tables.filter(table => table.primaryKey && table.primaryKey.length > 0).length,
        };
      }
      
      // Préparer l'output
      const output: IDataObject = {
        success: true,
        operation,
        timestamp: new Date().toISOString(),
        workingDirectory,
        ...outputFiles,
        stats: tableStats,
      };
      
      returnData.push({ json: output });
      
      return [returnData];
    } catch (error) {
      console.error(`Erreur lors de l'exécution du MCP MySQL: ${error.message}`);
      throw new Error(`Erreur lors de l'exécution du MCP MySQL: ${error.message}`);
    }
  }
  
  // Méthode utilitaire pour lire un fichier JSON
  private async readJsonFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier JSON ${filePath}: ${error.message}`);
      return {};
    }
  }
  
  // Méthode utilitaire pour lire un fichier texte
  private async readTextFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
      return '';
    }
  }
}