import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { BusinessAgent } from '../agents/BusinessAgent';
import { StructureAgent } from '../agents/StructureAgent';
import { DataAgent } from '../agents/DataAgent';
import { DependencyAgent } from '../agents/DependencyAgent';
import { QualityAgent } from '../agents/QualityAgent';
import { StrategyAgent } from '../agents/StrategyAgent';
import { AssemblerAgent } from '../agents/AssemblerAgent';

const exec = promisify(execCallback);

interface AuditConfig {
  phpFilePath: string;
  outputDir?: string;
  createGitHubIssue?: boolean;
  assignee?: string;
  runAgents?: string[];
}

/**
 * Orchestrateur des agents d'audit qui exécute chaque agent dans l'ordre
 * et combine leurs résultats.
 */
class AgentOrchestrator {
  private config: AuditConfig;
  
  constructor(config: AuditConfig) {
    this.config = {
      outputDir: path.dirname(config.phpFilePath),
      createGitHubIssue: false,
      assignee: undefined,
      runAgents: ['business', 'structure', 'data', 'dependency', 'quality', 'strategy', 'assembler'],
      ...config
    };
  }
  
  /**
   * Valide si le fichier PHP existe
   */
  private async validateFile(): Promise<void> {
    try {
      await fs.access(this.config.phpFilePath);
    } catch (error) {
      throw new Error(`Le fichier PHP spécifié n'existe pas: ${this.config.phpFilePath}`);
    }
  }
  
  /**
   * Initialise le rapport d'audit avec un template vide si celui-ci n'existe pas
   */
  private async initializeAuditFile(): Promise<void> {
    const baseFilename = path.basename(this.config.phpFilePath);
    const outputDir = this.config.outputDir;
    const auditTemplateFilePath = path.join(__dirname, '../templates/audit_template.md');
    const auditSectionsFilePath = path.join(outputDir, `${baseFilename}.audit.sections.json`);
    
    try {
      // Vérifier si le fichier de sections existe déjà
      await fs.access(auditSectionsFilePath);
      console.log(`Fichier de sections d'audit existant trouvé: ${auditSectionsFilePath}`);
    } catch (error) {
      // Créer un fichier de sections vide
      console.log(`Création d'un nouveau fichier de sections d'audit: ${auditSectionsFilePath}`);
      await fs.writeFile(auditSectionsFilePath, '[]', 'utf8');
    }
    
    // Copier le template d'audit si nécessaire
    const auditFilePath = path.join(outputDir, `${baseFilename}.audit.md`);
    try {
      await fs.access(auditFilePath);
      console.log(`Fichier d'audit existant trouvé: ${auditFilePath}`);
    } catch (error) {
      console.log(`Création d'un nouveau fichier d'audit à partir du template: ${auditFilePath}`);
      
      // Lire le contenu du template
      let templateContent = await fs.readFile(auditTemplateFilePath, 'utf8');
      
      // Remplacer le placeholder du nom de fichier
      templateContent = templateContent.replace('${FILENAME}', baseFilename);
      
      // Écrire le fichier d'audit
      await fs.writeFile(auditFilePath, templateContent, 'utf8');
    }
  }
  
  /**
   * Exécute un agent d'audit spécifique
   */
  private async runAgent(agentType: string): Promise<void> {
    console.log(`Exécution de l'agent: ${agentType}`);
    
    try {
      switch (agentType) {
        case 'business':
          const businessAgent = new BusinessAgent(this.config.phpFilePath);
          await businessAgent.process();
          break;
        case 'structure':
          const structureAgent = new StructureAgent(this.config.phpFilePath);
          await structureAgent.process();
          break;
        case 'data':
          const dataAgent = new DataAgent(this.config.phpFilePath);
          await dataAgent.process();
          break;
        case 'dependency':
          const dependencyAgent = new DependencyAgent(this.config.phpFilePath);
          await dependencyAgent.process();
          break;
        case 'quality':
          const qualityAgent = new QualityAgent(this.config.phpFilePath);
          await qualityAgent.process();
          break;
        case 'strategy':
          const strategyAgent = new StrategyAgent(this.config.phpFilePath);
          await strategyAgent.process();
          break;
        case 'assembler':
          const assemblerAgent = new AssemblerAgent(this.config.phpFilePath);
          await assemblerAgent.process();
          break;
        default:
          console.warn(`Agent inconnu: ${agentType}`);
      }
      
      console.log(`✅ Agent ${agentType} terminé avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de l'agent ${agentType}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crée une issue GitHub pour le rapport d'audit
   */
  private async createGitHubIssue(): Promise<void> {
    if (!this.config.createGitHubIssue) {
      return;
    }
    
    const baseFilename = path.basename(this.config.phpFilePath);
    
    try {
      console.log('Création d\'une issue GitHub pour le rapport d\'audit...');
      
      // Construire la commande pour créer l'issue
      let command = `gh issue create \
        --title "Audit PHP: ${baseFilename}" \
        --body "L'audit du fichier ${baseFilename} a été réalisé. Consultez les rapports générés." \
        --label "audit,migration,php"`;
      
      // Ajouter l'assignee si spécifié
      if (this.config.assignee) {
        command += ` --assignee "${this.config.assignee}"`;
      }
      
      // Exécuter la commande
      const { stdout } = await exec(command);
      console.log(`✅ Issue GitHub créée: ${stdout.trim()}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de l'issue GitHub: ${error.message}`);
    }
  }
  
  /**
   * Exécute tous les agents d'audit
   */
  public async runAll(): Promise<void> {
    try {
      console.log(`Démarrage de l'audit pour ${this.config.phpFilePath}`);
      
      // Valider si le fichier existe
      await this.validateFile();
      
      // Initialiser le fichier d'audit
      await this.initializeAuditFile();
      
      // Exécuter chaque agent dans l'ordre
      for (const agentType of this.config.runAgents) {
        await this.runAgent(agentType);
      }
      
      // Créer une issue GitHub si demandé
      await this.createGitHubIssue();
      
      console.log(`✅ Audit terminé pour ${this.config.phpFilePath}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'audit: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Point d'entrée principal
 */
async function main(): Promise<void> {
  // Récupérer le chemin du fichier à partir des arguments de ligne de commande
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('❌ Veuillez spécifier le chemin du fichier PHP à auditer');
    process.exit(1);
  }

  const phpFilePath = args[0];
  const config: AuditConfig = {
    phpFilePath,
    createGitHubIssue: args.includes('--create-issue'),
    assignee: args.includes('--assignee') ? args[args.indexOf('--assignee') + 1] : undefined
  };
  
  // Filtrer les agents à exécuter si spécifiés
  if (args.includes('--agents')) {
    const agentsIndex = args.indexOf('--agents');
    if (agentsIndex < args.length - 1) {
      config.runAgents = args[agentsIndex + 1].split(',');
    }
  }

  try {
    const orchestrator = new AgentOrchestrator(config);
    await orchestrator.runAll();
  } catch (error) {
    console.error(`❌ Erreur lors de l'audit: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter l'orchestrateur si le script est appelé directement
if (require.main === module) {
  main();
}

export { AgentOrchestrator };
