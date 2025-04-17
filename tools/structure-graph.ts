/**
 * structure-graph.ts
 * 
 * Génère un graphe des dépendances entre les fichiers et agents du projet MCP OS
 * 
 * Ce script analyse les relations entre les fichiers et génère:
 * - Un graphe JSON pour une visualisation technique (structure_graph.json)
 * - Un diagramme Mermaid pour une visualisation dans la documentation (structure_graph.mmd)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Types pour le graphe
interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'agent' | 'directory';
  layer?: 'orchestration' | 'coordination' | 'business' | 'shared' | 'unknown';
  domain?: string;
  path: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'import' | 'execution' | 'reference' | 'dependency';
}

interface StructureGraph {
  timestamp: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    layers: Record<string, number>;
    domains: Record<string, number>;
  };
}

interface ProjectIndex {
  files: Array<{
    path: string;
    relativePath: string;
    imports?: string[];
    exports?: string[];
    tags: {
      layer?: string;
      domain?: string;
      status?: string;
    };
    layer?: string;
    domain?: string;
    usedBy?: string[];
  }>;
}

interface StatusFile {
  pipelines: Array<{
    id: string;
    name: string;
    type: string;
    usedBy: string[];
    dependsOn: string[];
    configuration: string;
  }>;
}

// Configuration
const BASE_DIR = process.cwd();
const REPORTS_DIR = path.join(BASE_DIR, 'reports');
const PROJECT_INDEX_PATH = path.join(REPORTS_DIR, 'project_index.json');
const STATUS_FILE_PATH = path.join(BASE_DIR, 'status.json');
const OUTPUT_JSON_PATH = path.join(REPORTS_DIR, 'structure_graph.json');
const OUTPUT_MERMAID_PATH = path.join(REPORTS_DIR, 'structure_graph.mmd');

// Assurer que le répertoire des rapports existe
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Charger le fichier d'index du projet
function loadProjectIndex(): ProjectIndex | null {
  if (fs.existsSync(PROJECT_INDEX_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROJECT_INDEX_PATH, 'utf8'));
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier d'index du projet: ${error}`);
    }
  } else {
    console.warn(`Fichier d'index du projet non trouvé: ${PROJECT_INDEX_PATH}`);
    console.warn('Veuillez d\'abord exécuter: npx ts-node tools/project-indexer.ts');
  }
  return null;
}

// Charger le fichier de statut
function loadStatusFile(): StatusFile | null {
  if (fs.existsSync(STATUS_FILE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATUS_FILE_PATH, 'utf8'));
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier de statut: ${error}`);
    }
  }
  return null;
}

// Déterminer si un fichier est un agent
function isAgent(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  
  return (
    fileName.includes('agent') ||
    fileName.includes('analyzer') ||
    fileName.includes('generator') ||
    fileName.includes('parser') ||
    fileName.includes('validator') ||
    content.includes('extends BaseAgent') ||
    content.includes('implements') && (
      content.includes('Agent') ||
      content.includes('Analyzer') ||
      content.includes('Generator') ||
      content.includes('Parser') ||
      content.includes('Validator')
    )
  );
}

// Créer un graphe à partir de l'index du projet et du fichier de statut
function createGraph(projectIndex: ProjectIndex | null, statusFile: StatusFile | null): StructureGraph {
  console.log('Création du graphe de structure...');
  
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const layerCount: Record<string, number> = {};
  const domainCount: Record<string, number> = {};
  
  // Ajouter les fichiers de l'index du projet
  if (projectIndex) {
    for (const file of projectIndex.files) {
      const isAgentFile = isAgent(file.path);
      const fileId = file.relativePath;
      const fileName = path.basename(file.relativePath);
      
      const node: GraphNode = {
        id: fileId,
        label: fileName,
        type: isAgentFile ? 'agent' : 'file',
        layer: file.layer as any || 'unknown',
        domain: file.domain || 'unknown',
        path: file.relativePath
      };
      
      nodes.push(node);
      nodeMap.set(fileId, node);
      
      // Compter par couche et domaine
      const layer = node.layer || 'unknown';
      const domain = node.domain || 'unknown';
      
      layerCount[layer] = (layerCount[layer] || 0) + 1;
      domainCount[domain] = (domainCount[domain] || 0) + 1;
      
      // Ajouter les arêtes pour les imports
      if (file.imports) {
        for (const importPath of file.imports) {
          // Ignorer les imports de bibliothèques externes
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            continue;
          }
          
          // Trouver le fichier correspondant à l'import
          let resolvedPath = importPath;
          if (importPath.startsWith('.')) {
            resolvedPath = path.join(path.dirname(file.path), importPath);
          }
          
          // Normaliser le chemin
          resolvedPath = path.normalize(resolvedPath);
          
          // Ajouter l'extension si nécessaire
          if (!path.extname(resolvedPath)) {
            const extensions = ['.ts', '.tsx', '.js', '.jsx'];
            for (const ext of extensions) {
              const fullPath = resolvedPath + ext;
              if (fs.existsSync(fullPath)) {
                resolvedPath = fullPath;
                break;
              }
            }
          }
          
          // Convertir en chemin relatif
          const relativeResolvedPath = path.relative(BASE_DIR, resolvedPath);
          
          // S'assurer que le fichier importé existe dans notre index
          const targetFile = projectIndex.files.find(f => f.relativePath === relativeResolvedPath);
          
          if (targetFile) {
            edges.push({
              source: fileId,
              target: relativeResolvedPath,
              type: 'import'
            });
          }
        }
      }
    }
  }
  
  // Ajouter les pipelines du fichier de statut
  if (statusFile) {
    for (const pipeline of statusFile.pipelines) {
      const pipelineId = `pipeline:${pipeline.id}`;
      const pipelineType = pipeline.type === 'n8n' ? 'orchestration' : 
                          pipeline.type === 'bullmq' ? 'coordination' : 
                          'business';
      
      // Créer un nœud pour le pipeline
      const node: GraphNode = {
        id: pipelineId,
        label: pipeline.name,
        type: 'agent',
        layer: pipelineType as any,
        domain: 'pipeline',
        path: pipeline.configuration
      };
      
      nodes.push(node);
      nodeMap.set(pipelineId, node);
      
      // Compter par couche
      layerCount[pipelineType] = (layerCount[pipelineType] || 0) + 1;
      domainCount['pipeline'] = (domainCount['pipeline'] || 0) + 1;
      
      // Ajouter les arêtes pour les dépendances
      for (const depId of pipeline.dependsOn) {
        const targetId = `pipeline:${depId}`;
        edges.push({
          source: pipelineId,
          target: targetId,
          type: 'dependency'
        });
      }
      
      // Ajouter les arêtes pour les utilisateurs
      for (const userId of pipeline.usedBy) {
        const sourceId = `pipeline:${userId}`;
        edges.push({
          source: sourceId,
          target: pipelineId,
          type: 'execution'
        });
      }
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      layers: layerCount,
      domains: domainCount
    }
  };
}

// Convertir le graphe en diagramme Mermaid
function generateMermaidDiagram(graph: StructureGraph): string {
  console.log('Génération du diagramme Mermaid...');
  
  let mermaidContent = 'graph TB\n';
  mermaidContent += '  %% Classes pour le style\n';
  mermaidContent += '  classDef orchestration fill:#f96,stroke:#333,stroke-width:1px;\n';
  mermaidContent += '  classDef coordination fill:#9cf,stroke:#333,stroke-width:1px;\n';
  mermaidContent += '  classDef business fill:#9f9,stroke:#333,stroke-width:1px;\n';
  mermaidContent += '  classDef shared fill:#fcf,stroke:#333,stroke-width:1px;\n';
  mermaidContent += '  classDef unknown fill:#eee,stroke:#333,stroke-width:1px;\n\n';
  
  // Ajouter les nœuds (limités aux 100 plus importants pour la lisibilité)
  mermaidContent += '  %% Nœuds\n';
  
  // Prioritiser les nœuds avec le plus de connexions
  const nodeConnections = new Map<string, number>();
  for (const edge of graph.edges) {
    nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
    nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
  }
  
  const importantNodes = [...graph.nodes]
    .sort((a, b) => (nodeConnections.get(b.id) || 0) - (nodeConnections.get(a.id) || 0))
    .slice(0, 100);
    
  for (const node of importantNodes) {
    const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    mermaidContent += `  ${nodeId}["${node.label}"]\n`;
    mermaidContent += `  class ${nodeId} ${node.layer || 'unknown'};\n`;
  }
  
  mermaidContent += '\n  %% Connexions\n';
  
  // Filtrer les arêtes pour n'inclure que celles des nœuds importants
  const importantNodeIds = new Set(importantNodes.map(n => n.id));
  const filteredEdges = graph.edges.filter(e => importantNodeIds.has(e.source) && importantNodeIds.has(e.target));
  
  // Ajouter les arêtes
  for (const edge of filteredEdges) {
    const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    
    let arrow;
    switch (edge.type) {
      case 'import':
        arrow = '-->';
        break;
      case 'execution':
        arrow = '==>|exécute|';
        break;
      case 'reference':
        arrow = '-.->|référence|';
        break;
      case 'dependency':
        arrow = '-->|dépend de|';
        break;
      default:
        arrow = '-->';
    }
    
    mermaidContent += `  ${sourceId} ${arrow} ${targetId}\n`;
  }
  
  return mermaidContent;
}

// Point d'entrée principal
(async function main() {
  try {
    console.log('=== Génération du graphe de structure du projet MCP OS ===');
    
    // Charger les données nécessaires
    const projectIndex = loadProjectIndex();
    const statusFile = loadStatusFile();
    
    if (!projectIndex) {
      console.error('Impossible de continuer sans fichier d\'index du projet.');
      process.exit(1);
    }
    
    // Créer le graphe
    const graph = createGraph(projectIndex, statusFile);
    
    // Enregistrer le graphe au format JSON
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(graph, null, 2));
    console.log(`✅ Graphe JSON enregistré: ${OUTPUT_JSON_PATH}`);
    
    // Générer et enregistrer le diagramme Mermaid
    const mermaidDiagram = generateMermaidDiagram(graph);
    fs.writeFileSync(OUTPUT_MERMAID_PATH, mermaidDiagram);
    console.log(`✅ Diagramme Mermaid enregistré: ${OUTPUT_MERMAID_PATH}`);
    
    // Afficher des statistiques
    console.log('\n=== Statistiques du graphe ===');
    console.log(`Nœuds: ${graph.metadata.totalNodes}`);
    console.log(`Arêtes: ${graph.metadata.totalEdges}`);
    console.log('\nRépartition par couche:');
    for (const [layer, count] of Object.entries(graph.metadata.layers)) {
      console.log(`- ${layer}: ${count} nœuds`);
    }
    
    console.log('\nRépartition par domaine:');
    for (const [domain, count] of Object.entries(graph.metadata.domains)) {
      console.log(`- ${domain}: ${count} nœuds`);
    }
    
    // Conseils pour visualiser
    console.log('\n=== Visualisation du graphe ===');
    console.log('Le diagramme Mermaid peut être visualisé:');
    console.log('- Dans GitHub en intégrant le contenu du fichier .mmd dans un bloc de code Mermaid');
    console.log('- Dans VS Code avec l\'extension "Markdown Preview Mermaid Support"');
    console.log('- Sur https://mermaid-js.github.io/mermaid-live-editor/');
    console.log('\nLe graphe JSON peut être visualisé avec:');
    console.log('- D3.js (pour les développeurs web)');
    console.log('- Cytoscape.js (pour les développeurs web)');
    console.log('- Gephi (application autonome pour l\'analyse de graphes)');
    
  } catch (error) {
    console.error(`Erreur lors de la génération du graphe de structure: ${error}`);
    process.exit(1);
  }
})();