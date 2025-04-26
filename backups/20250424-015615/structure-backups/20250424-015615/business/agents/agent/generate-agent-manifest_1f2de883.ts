/**
 * Generate Agent Manifest
 * 
 * Script qui analyse récursivement le dossier des agents pour générer ou mettre à jour
 * automatiquement le fichier agent-manifest.json en extrayant les métadonnées
 * directement depuis le code source.
 */

import fs from fs-extrastructure-agent';
import path from pathstructure-agent';
import ts from typescriptstructure-agent';
import glob from globstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';
import { AgentManifest, AgentManifestEntry } from ./agentRegistrystructure-agent';

const logger = new Logger('ManifestGenerator');

/**
 * Configuration pour le générateur de manifest
 */
interface GeneratorConfig {
  agentsDir: string;
  outputFile: string;
  preserveExisting: boolean;
  project: string;
  useJsonComments: boolean;
}

/**
 * Les métadonnées qui peuvent être extraites d'une classe d'agent
 */
interface ExtractedAgentMetadata {
  className: string;
  id: string;
  version?: string;
  description?: string;
  dependencies?: string[];
  tags?: string[];
  config?: Record<string, any>;
  apiEndpoint?: string;
  runInGithubActions?: boolean;
}

/**
 * Convertit un nom de classe en ID d'agent
 * Par exemple: QAAnalyzer -> QaAnalyzer
 */
function classNameToAgentId(className: string): string {
  return className
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Extrait les métadonnées d'un fichier d'agent TypeScript
 */
async function extractAgentMetadata(filePath: string): Promise<ExtractedAgentMetadata | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    let className = '';
    let version = '1.0.0'; // Valeur par défaut
    let description = '';
    let dependencies: string[] = [];
    let tags: string[] = [];
    let config: Record<string, any> = {};
    let apiEndpoint = '';
    let runInGithubActions = true; // Valeur par défaut

    // Extraire les commentaires JSDoc
    function extractJSDocComments(node: ts.Node): Record<string, any> {
      const result: Record<string, any> = {};
      const jsDocTags = ts.getJSDocTags(node);
      
      for (const tag of jsDocTags) {
        const tagName = tag.tagName.getText();
        
        if (ts.isJSDocVersionTag(tag) && tag.version) {
          result.version = tag.version.text;
        } else if (ts.isJSDocCommentContainingNode(tag) && tag.comment) {
          result.description = tag.comment.toString();
        } else if (tagName === 'dependencies' && tag.comment) {
          result.dependencies = tag.comment.toString().split(',').map(d => d.trim());
        } else if (tagName === 'tags' && tag.comment) {
          result.tags = tag.comment.toString().split(',').map(t => t.trim());
        } else if (tagName === 'config' && tag.comment) {
          try {
            result.config = JSON.parse(tag.comment.toString());
          } catch (e) {
            logger.warn(`Configuration JSON invalide pour ${filePath}`);
          }
        } else if (tagName === 'apiEndpoint' && tag.comment) {
          result.apiEndpoint = tag.comment.toString();
        } else if (tagName === 'runInGithubActions' && tag.comment) {
          result.runInGithubActions = tag.comment.toString() === 'true';
        }
      }
      
      return result;
    }

    // Parcourir l'AST pour trouver les classes
    function visit(node: ts.Node) {
      // Chercher des classes
      if (ts.isClassDeclaration(node) && node.name) {
        className = node.name.text;
        
        // Extraire les métadonnées des commentaires JSDoc de la classe
        const jsdocInfo = extractJSDocComments(node);
        version = jsdocInfo.version || version;
        description = jsdocInfo.description || description;
        dependencies = jsdocInfo.dependencies || dependencies;
        tags = jsdocInfo.tags || tags;
        config = jsdocInfo.config || config;
        apiEndpoint = jsdocInfo.apiEndpoint || apiEndpoint;
        runInGithubActions = jsdocInfo.runInGithubActions ?? runInGithubActions;
        
        // Chercher les méthodes et propriétés de classe pour trouver plus d'informations
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member) && member.name.getText() === 'getVersion') {
            // Chercher une méthode getVersion qui retourne une chaîne littérale
            if (member.body) {
              const returnStatement = member.body.statements.find(stmt => 
                ts.isReturnStatement(stmt) && stmt.expression && ts.isStringLiteral(stmt.expression)
              ) as ts.ReturnStatement | undefined;
              
              if (returnStatement && returnStatement.expression && ts.isStringLiteral(returnStatement.expression)) {
                version = returnStatement.expression.text;
              }
            }
          } else if (ts.isPropertyDeclaration(member) && member.name.getText() === 'version') {
            // Chercher une propriété version avec une valeur littérale
            if (member.initializer && ts.isStringLiteral(member.initializer)) {
              version = member.initializer.text;
            }
          } else if (ts.isMethodDeclaration(member) && member.name.getText() === 'getDependencies') {
            // Chercher une méthode getDependencies
            if (member.body) {
              const returnStatement = member.body.statements.find(stmt => 
                ts.isReturnStatement(stmt) && stmt.expression && ts.isArrayLiteralExpression(stmt.expression)
              ) as ts.ReturnStatement | undefined;
              
              if (returnStatement?.expression && ts.isArrayLiteralExpression(returnStatement.expression)) {
                dependencies = returnStatement.expression.elements
                  .filter(e => ts.isStringLiteral(e))
                  .map(e => (e as ts.StringLiteral).text);
              }
            }
          }
          
          // Extraire plus d'informations des commentaires JSDoc des méthodes
          const memberJsdocInfo = extractJSDocComments(member);
          if (memberJsdocInfo.description && !description) {
            description = memberJsdocInfo.description;
          }
        });
      }
      
      // Visiter récursivement les nœuds enfants
      ts.forEachChild(node, visit);
    }

    // Démarrer la visite de l'AST
    visit(sourceFile);

    if (!className) {
      return null;
    }

    const id = classNameToAgentId(className);
    const relativePath = path.relative(process.cwd(), filePath);
    const modulePath = '@fafaDoDotmcp-agents/' + path.basename(filePath, path.extname(filePath));

    // Si l'endpoint API n'est pas défini, on en génère un par défaut
    if (!apiEndpoint) {
      apiEndpoint = `DoDotmcp/${id}`;
    }

    return {
      className,
      id,
      version,
      description,
      dependencies,
      tags,
      config,
      apiEndpoint,
      runInGithubActions
    };
  } catch (err: any) {
    logger.error(`Erreur lors de l'analyse de ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Trouve tous les fichiers d'agents et extrait leurs métadonnées
 */
async function findAndExtractAgents(config: GeneratorConfig): Promise<AgentManifestEntry[]> {
  const agentsDir = path.resolve(process.cwd(), config.agentsDir);
  const pattern = path.join(agentsDir, '**/*.ts');
  
  logger.log(`Recherche d'agents dans ${pattern}`);
  
  const files = glob.sync(pattern);
  logger.log(`${files.length} fichiers trouvés`);
  
  const agents: AgentManifestEntry[] = [];
  
  for (const file of files) {
    logger.log(`Analyse de ${path.basename(file)}...`);
    const metadata = await extractAgentMetadata(file);
    
    if (metadata) {
      const moduleName = path.basename(file, '.ts');
      const modulePath = `@fafaDoDotmcp-agents/${moduleName}`;
      
      agents.push({
        id: metadata.id,
        name: metadata.className,
        path: modulePath,
        version: metadata.version || '1.0.0',
        description: metadata.description || `Agent ${metadata.className}`,
        status: 'active',
        dependencies: metadata.dependencies || [],
        apiEndpoint: metadata.apiEndpoint || `DoDotmcp/${metadata.id}`,
        runInGithubActions: metadata.runInGithubActions ?? true,
        tags: metadata.tags || [],
        config: metadata.config || {}
      });
      
      logger.log(`✅ Agent extrait: ${metadata.className} (${metadata.id})`);
    }
  }
  
  return agents;
}

/**
 * Génère le fichier agent-manifest.json basé sur les agents détectés
 */
async function generateManifest(config: GeneratorConfig): Promise<void> {
  try {
    let existingManifest: AgentManifest | null = null;
    
    // Charger le manifest existant si demandé
    if (config.preserveExisting && await fs.pathExists(config.outputFile)) {
      try {
        existingManifest = await fs.readJson(config.outputFile);
        logger.log(`Manifest existant chargé depuis ${config.outputFile}`);
      } catch (err: any) {
        logger.warn(`Impossible de charger le manifest existant: ${err.message}`);
      }
    }
    
    // Extraire les métadonnées des agents
    const agents = await findAndExtractAgents(config);
    
    // Fusionner avec le manifest existant si nécessaire
    if (existingManifest && config.preserveExisting) {
      // Créer un map des agents extraits pour une recherche facile
      const extractedAgentsMap = new Map<string, AgentManifestEntry>();
      agents.forEach(agent => extractedAgentsMap.set(agent.id, agent));
      
      // Pour chaque agent dans le manifest existant
      for (const existingAgent of existingManifest.agents) {
        const extractedAgent = extractedAgentsMap.get(existingAgent.id);
        
        if (extractedAgent) {
          // L'agent existe dans les deux, préserver certains champs du manifest existant
          extractedAgentsMap.set(existingAgent.id, {
            ...extractedAgent,
            status: existingAgent.status, // Préserver le statut
            config: { ...existingAgent.config, ...extractedAgent.config } // Fusionner les configs
          });
        } else {
          // L'agent n'existe que dans le manifest existant, le conserver
          agents.push(existingAgent);
        }
      }
    }
    
    // Compter les agents actifs
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const inactiveAgents = agents.length - activeAgents;
    
    // Créer le nouveau manifest
    const newManifest: AgentManifest = {
      version: existingManifest?.version || '1.0.0',
      lastUpdated: new Date().toISOString(),
      project: config.project,
      agents: agents,
      meta: {
        totalAgents: agents.length,
        activeAgents,
        inactiveAgents
      }
    };
    
    // Écrire le fichier
    await fs.writeJson(config.outputFile, newManifest, { spaces: 2 });
    
    logger.log(`✅ Manifest généré avec succès dans ${config.outputFile}`);
    logger.log(`📊 ${agents.length} agents au total, ${activeAgents} actifs, ${inactiveAgents} inactifs`);
    
  } catch (err: any) {
    logger.error(`❌ Erreur lors de la génération du manifest: ${err.message}`);
    throw err;
  }
}

/**
 * Programme principal
 */
async function main() {
  const config: GeneratorConfig = {
    agentsDir: './agents',
    outputFile: './agent-manifest.json',
    preserveExisting: true,
    project: 'MCP-Framework',
    useJsonComments: true
  };
  
  // Analyser les arguments de ligne de commande
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--dir' && i + 1 < process.argv.length) {
      config.agentsDir = process.argv[++i];
    } else if (arg === '--output' && i + 1 < process.argv.length) {
      config.outputFile = process.argv[++i];
    } else if (arg === '--no-preserve') {
      config.preserveExisting = false;
    } else if (arg === '--project' && i + 1 < process.argv.length) {
      config.project = process.argv[++i];
    }
  }
  
  logger.log('🚀 Démarrage de la génération du manifest d\'agents');
  logger.log(`📁 Dossier des agents: ${config.agentsDir}`);
  logger.log(`📄 Fichier de sortie: ${config.outputFile}`);
  
  await generateManifest(config);
}

// Exécuter le programme si appelé directement
if (require.main === module) {
  main().catch(err => {
    logger.error(`❌ Erreur non gérée: ${err.message}`);
    process.exit(1);
  });
}

export { generateManifest, extractAgentMetadata };