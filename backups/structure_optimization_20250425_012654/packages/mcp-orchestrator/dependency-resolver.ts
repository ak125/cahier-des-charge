/**
 * Dependency Resolver - Composant de l'orchestrateur MCP
 * 
 * Module responsable d'analyser et de résoudre les dépendances entre fichiers PHP
 * pour garantir un ordre d'exécution correct des migrations.
 * 
 * Fonctionnalités principales:
 * - Analyse statique des fichiers PHP pour détecter les inclusions (require, include)
 * - Détection des modèles partagés et des dépendances fonctionnelles
 * - Construction d'un graphe orienté des dépendances
 * - Résolution de l'ordre optimal de migration
 * - Détection des dépendances circulaires
 */

import fs from fs-extrastructure-agent';
import path from pathstructure-agent';
import { Logger } from @nestjs/commonstructure-agent';

// Types
interface DependencyMap {
  [filePath: string]: string[];
}

interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

interface DependencyResolverConfig {
  scanDir?: string;
  cacheFile?: string;
  resolveIncludes?: boolean;
  resolveModels?: boolean;
  enableCache?: boolean;
}

/**
 * Classe principale pour résoudre les dépendances
 */
export class DependencyResolver {
  private readonly logger = new Logger('DependencyResolver');
  private readonly scanDir: string;
  private readonly cacheFile: string;
  private readonly resolveIncludes: boolean;
  private readonly resolveModels: boolean;
  private readonly enableCache: boolean;
  
  private dependencyMap: DependencyMap = {};
  private dependencyGraph: DependencyGraph = { nodes: new Set(), edges: new Map() };
  
  /**
   * Constructeur
   */
  constructor(
    private readonly config: DependencyResolverConfig = {}
  ) {
    this.scanDir = config.scanDir || './legacy';
    this.cacheFile = config.cacheFile || './dependencies_map.json';
    this.resolveIncludes = config.resolveIncludes !== false;
    this.resolveModels = config.resolveModels !== false;
    this.enableCache = config.enableCache !== false;
  }
  
  /**
   * Initialise le résolveur de dépendances
   */
  async initialize(): Promise<void> {
    try {
      // Charger les dépendances depuis le cache si disponible
      if (this.enableCache && await fs.pathExists(this.cacheFile)) {
        this.dependencyMap = await fs.readJson(this.cacheFile);
        this.logger.log(`Dépendances chargées depuis le cache: ${Object.keys(this.dependencyMap).length} fichiers`);
        
        // Construire le graphe à partir des dépendances chargées
        this.buildDependencyGraph();
        return;
      }
      
      this.logger.log(`Cache non trouvé ou désactivé. Analyse complète des dépendances...`);
      
      // Analyser les dépendances
      await this.analyzeDependencies();
      
      // Sauvegarder dans le cache si activé
      if (this.enableCache) {
        await fs.writeJson(this.cacheFile, this.dependencyMap, { spaces: 2 });
        this.logger.log(`Dépendances sauvegardées dans le cache: ${Object.keys(this.dependencyMap).length} fichiers`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'initialisation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyse les dépendances entre les fichiers PHP
   */
  private async analyzeDependencies(): Promise<void> {
    try {
      // Vérifier si le répertoire de scan existe
      if (!await fs.pathExists(this.scanDir)) {
        this.logger.warn(`Le répertoire de scan ${this.scanDir} n'existe pas`);
        return;
      }
      
      // Récupérer tous les fichiers PHP
      const phpFiles = await this.findPhpFiles(this.scanDir);
      
      this.logger.log(`Analyse de ${phpFiles.length} fichiers PHP`);
      
      // Analyser chaque fichier
      for (const file of phpFiles) {
        const relativePath = path.relative(this.scanDir, file);
        const fileName = path.basename(file);
        
        // Lire le contenu du fichier
        const content = await fs.readFile(file, 'utf-8');
        
        // Trouver les inclusions
        const dependencies: string[] = [];
        
        if (this.resolveIncludes) {
          const includePatterns = [
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /require_once\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /include\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
            /include_once\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
          ];
          
          for (const pattern of includePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const includePath = match[1];
              // Convertir le chemin relatif en nom de fichier
              const includeFile = path.basename(includePath);
              if (!dependencies.includes(includeFile) && includeFile !== fileName) {
                dependencies.push(includeFile);
              }
            }
          }
        }
        
        // Trouver les modèles utilisés
        if (this.resolveModels) {
          const modelPatterns = [
            /new\s+([A-Z][a-zA-Z0-9_]+)Model\s*\(/g,
            /use\s+([A-Z][a-zA-Z0-9_]+)Model/g,
            /([A-Z][a-zA-Z0-9_]+)Model::getInstance\(\)/g,
            /([A-Z][a-zA-Z0-9_]+)Model::[a-zA-Z0-9_]+\(/g,
          ];
          
          for (const pattern of modelPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const modelName = match[1];
              const modelFile = `${modelName.toLowerCase()}.model.php`;
              if (!dependencies.includes(modelFile) && modelFile !== fileName) {
                dependencies.push(modelFile);
              }
            }
          }
        }
        
        // Enregistrer les dépendances
        this.dependencyMap[fileName] = dependencies;
      }
      
      // Construire le graphe
      this.buildDependencyGraph();
      
      this.logger.log(`Analyse des dépendances terminée: ${Object.keys(this.dependencyMap).length} fichiers analysés`);
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'analyse des dépendances: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Trouve tous les fichiers PHP dans un répertoire (récursivement)
   */
  private async findPhpFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(entry => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? this.findPhpFiles(res) : Promise.resolve(
          entry.name.endsWith('.php') ? [res] : []
        );
      })
    );
    
    return Array.prototype.concat(...files);
  }
  
  /**
   * Construit un graphe orienté des dépendances
   */
  private buildDependencyGraph(): void {
    // Réinitialiser le graphe
    this.dependencyGraph = { nodes: new Set(), edges: new Map() };
    
    // Ajouter tous les noeuds (fichiers)
    for (const file of Object.keys(this.dependencyMap)) {
      this.dependencyGraph.nodes.add(file);
    }
    
    // Ajouter les arêtes (dépendances)
    for (const [file, deps] of Object.entries(this.dependencyMap)) {
      if (!this.dependencyGraph.edges.has(file)) {
        this.dependencyGraph.edges.set(file, new Set());
      }
      
      for (const dep of deps) {
        if (this.dependencyGraph.nodes.has(dep)) {
          this.dependencyGraph.edges.get(file)!.add(dep);
        }
      }
    }
  }
  
  /**
   * Détecte les dépendances circulaires
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (node: string, path: string[] = []): void => {
      // Marquer comme visité
      visited.add(node);
      recursionStack.add(node);
      
      // Chemin actuel
      const currentPath = [...path, node];
      
      // Visiter les voisins
      const neighbors = this.dependencyGraph.edges.get(node) || new Set();
      for (const neighbor of neighbors) {
        // Si le voisin est dans la pile de récursion, c'est un cycle
        if (recursionStack.has(neighbor)) {
          const cycleStart = currentPath.indexOf(neighbor);
          if (cycleStart !== -1) {
            const cycle = currentPath.slice(cycleStart);
            cycles.push(cycle);
          }
        } 
        // Sinon, continuer la recherche si pas encore visité
        else if (!visited.has(neighbor)) {
          dfs(neighbor, currentPath);
        }
      }
      
      // Retirer du stack en remontant
      recursionStack.delete(node);
    };
    
    // Lancer la détection pour chaque noeud non visité
    for (const node of this.dependencyGraph.nodes) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
    
    return cycles;
  }
  
  /**
   * Ordonne les fichiers en fonction de leurs dépendances avec tri topologique
   */
  resolveExecutionOrder(): string[] {
    // Détecter les cycles
    const cycles = this.detectCircularDependencies();
    if (cycles.length > 0) {
      this.logger.warn(`Dépendances circulaires détectées: ${cycles.length} cycles trouvés`);
      
      // Log des cycles détectés
      for (const [index, cycle] of cycles.entries()) {
        this.logger.warn(`Cycle ${index + 1}: ${cycle.join(' -> ')} -> ${cycle[0]}`);
      }
      
      // Corriger les cycles en supprimant la dépendance la moins importante
      this.breakCycles(cycles);
    }
    
    // Implémenter l'algorithme de tri topologique (Kahn)
    const orderedFiles: string[] = [];
    
    // Calculer le degré entrant (nombre de fichiers qui dépendent de celui-ci)
    const inDegree = new Map<string, number>();
    for (const node of this.dependencyGraph.nodes) {
      inDegree.set(node, 0);
    }
    
    for (const [_, deps] of this.dependencyGraph.edges.entries()) {
      for (const dep of deps) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }
    
    // Commencer par les fichiers sans dépendances (degré entrant = 0)
    const queue: string[] = [];
    for (const [node, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(node);
      }
    }
    
    // Traiter la file
    while (queue.length > 0) {
      const current = queue.shift()!;
      orderedFiles.push(current);
      
      // Réduire le degré entrant des voisins
      const neighbors = this.dependencyGraph.edges.get(current) || new Set();
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        // Si plus de dépendances, ajouter à la file
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Vérifier si tous les fichiers ont été traités
    if (orderedFiles.length !== this.dependencyGraph.nodes.size) {
      this.logger.warn(`Impossible d'ordonner tous les fichiers: ${orderedFiles.length}/${this.dependencyGraph.nodes.size}`);
      
      // Ajouter les fichiers restants dans un ordre quelconque
      for (const node of this.dependencyGraph.nodes) {
        if (!orderedFiles.includes(node)) {
          orderedFiles.push(node);
        }
      }
    }
    
    return orderedFiles;
  }
  
  /**
   * Brise les cycles de dépendances en supprimant des arêtes stratégiques
   */
  private breakCycles(cycles: string[][]): void {
    for (const cycle of cycles) {
      if (cycle.length >= 2) {
        // Choisir l'arête à supprimer : prendre la première pour simplifier
        const source = cycle[cycle.length - 1];
        const target = cycle[0];
        
        // Supprimer l'arête du graphe
        const edges = this.dependencyGraph.edges.get(source);
        if (edges && edges.has(target)) {
          edges.delete(target);
          
          // Aussi supprimer de la carte de dépendances
          const deps = this.dependencyMap[source] || [];
          this.dependencyMap[source] = deps.filter(dep => dep !== target);
          
          this.logger.warn(`Dépendance brisée: ${source} -> ${target}`);
        }
      }
    }
  }
  
  /**
   * Obtient les dépendances directes pour un fichier donné
   */
  getDependenciesFor(filename: string): string[] {
    // Si le nom du fichier contient un chemin, extraire juste le nom de base
    const baseName = path.basename(filename);
    return this.dependencyMap[baseName] || [];
  }
  
  /**
   * Obtient les dépendants pour un fichier donné
   * (les fichiers qui dépendent de ce fichier)
   */
  getDependantsFor(filename: string): string[] {
    const baseName = path.basename(filename);
    const dependants: string[] = [];
    
    for (const [file, deps] of Object.entries(this.dependencyMap)) {
      if (deps.includes(baseName)) {
        dependants.push(file);
      }
    }
    
    return dependants;
  }
  
  /**
   * Obtient toutes les dépendances, y compris transitives, pour un fichier
   */
  getAllDependenciesFor(filename: string): string[] {
    const baseName = path.basename(filename);
    const allDeps = new Set<string>();
    
    const traverse = (file: string): void => {
      const deps = this.dependencyMap[file] || [];
      for (const dep of deps) {
        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          traverse(dep);
        }
      }
    };
    
    traverse(baseName);
    
    return Array.from(allDeps);
  }
  
  /**
   * Obtient la carte complète des dépendances
   */
  getDependencyMap(): DependencyMap {
    return { ...this.dependencyMap };
  }
  
  /**
   * Exécute l'analyse de dépendances pour une liste de fichiers
   */
  async run(input: { files: string[] }): Promise<{ orderedFiles: string[] }> {
    await this.initialize();
    
    // Filtrer pour ne garder que les fichiers présents dans le graphe
    const filesToProcess = input.files.map(f => path.basename(f)).filter(f => this.dependencyGraph.nodes.has(f));
    
    // Déterminer l'ordre d'exécution global
    const allOrderedFiles = this.resolveExecutionOrder();
    
    // Filtrer pour ne garder que les fichiers demandés, dans l'ordre résolu
    const orderedFiles = allOrderedFiles.filter(f => filesToProcess.includes(f));
    
    return { orderedFiles };
  }
  
  /**
   * Retourne la version du résolveur
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// Point d'entrée si exécuté directement
if (require.main === module) {
  (async () => {
    const resolver = new DependencyResolver({
      scanDir: process.argv[2] || './legacy',
      cacheFile: process.argv[3] || './dependencies_map.json'
    });
    
    try {
      await resolver.initialize();
      
      // Détecter les dépendances circulaires
      const cycles = resolver.detectCircularDependencies();
      console.log(`Dépendances circulaires: ${cycles.length}`);
      if (cycles.length > 0) {
        console.log('Cycles détectés:');
        for (const cycle of cycles) {
          console.log(`  ${cycle.join(' -> ')} -> ${cycle[0]}`);
        }
      }
      
      // Résoudre l'ordre d'exécution
      const orderedFiles = resolver.resolveExecutionOrder();
      console.log(`Ordre d'exécution résolu pour ${orderedFiles.length} fichiers`);
      
      // Afficher les 10 premiers fichiers à titre d'exemple
      console.log('Premiers fichiers à traiter:');
      for (const file of orderedFiles.slice(0, 10)) {
        console.log(`  ${file}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution du résolveur:', error);
      process.exit(1);
    }
  })();
}