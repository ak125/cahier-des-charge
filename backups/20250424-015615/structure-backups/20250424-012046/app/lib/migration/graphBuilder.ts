import { Relation } from ~/types/migrationstructure-agent';

/**
 * Convertit un graphe de relations en syntaxe Mermaid
 * @param relations Les relations entre tables
 * @param highlightedTable Table à mettre en évidence (optionnel)
 * @returns Chaîne de caractères en syntaxe Mermaid
 */
export function buildMermaidGraph(
  relations: Relation[],
  highlightedTable?: string | null
): string {
  let graphDefinition = "graph TD\n";
  
  // Ajouter les relations au graphe
  relations.forEach(rel => {
    const sourceNode = highlightedTable === rel.source 
      ? `${rel.source}["<strong style='color:orange'>${rel.source}</strong>"]`
      : `${rel.source}["${rel.source}"]`;
      
    const targetNode = highlightedTable === rel.target 
      ? `${rel.target}["<strong style='color:orange'>${rel.target}</strong>"]`
      : `${rel.target}["${rel.target}"]`;
    
    const relationType = rel.type || "hasMany";
    
    graphDefinition += `  ${sourceNode} -->|${relationType}| ${targetNode}\n`;
  });
  
  // Si une table est mise en évidence mais n'a pas de relations, l'ajouter quand même
  if (highlightedTable && !relations.some(
    rel => rel.source === highlightedTable || rel.target === highlightedTable
  )) {
    graphDefinition += `  ${highlightedTable}["<strong style='color:orange'>${highlightedTable}</strong>"]\n`;
  }
  
  return graphDefinition;
}

/**
 * Convertit un graphe de relations en format D3.js compatible
 * @param relations Les relations entre tables
 * @returns Objet de données compatible avec D3.js
 */
export function buildD3Graph(relations: Relation[]) {
  // Collecter toutes les tables uniques
  const tableSet = new Set<string>();
  relations.forEach(rel => {
    tableSet.add(rel.source);
    tableSet.add(rel.target);
  });
  
  // Créer les nœuds
  const nodes = Array.from(tableSet).map(tableName => ({
    id: tableName,
    name: tableName,
    group: 1 // Peut être modifié selon la catégorie de la table
  }));
  
  // Créer les liens
  const links = relations.map(rel => ({
    source: rel.source,
    target: rel.target,
    value: 1, // Peut représenter l'importance de la relation
    type: rel.type || "hasMany"
  }));
  
  return { nodes, links };
}

/**
 * Filtre les relations pour n'inclure que certaines tables
 * @param relations Toutes les relations
 * @param includedTables Tables à inclure dans le graphe
 * @returns Relations filtrées
 */
export function filterRelations(
  relations: Relation[],
  includedTables: string[]
): Relation[] {
  if (!includedTables || includedTables.length === 0) {
    return relations;
  }
  
  const includedSet = new Set(includedTables);
  
  return relations.filter(
    rel => includedSet.has(rel.source) && includedSet.has(rel.target)
  );
}

/**
 * Identifie les clusters de tables liées dans un graphe
 * Utile pour diviser un grand graphe en sous-graphes plus petits
 * @param relations Relations entre tables
 * @returns Groupes de tables liées
 */
export function identifyClusters(relations: Relation[]): string[][] {
  const graphMap = new Map<string, Set<string>>();
  
  // Construire la carte des connexions
  relations.forEach(rel => {
    if (!graphMap.has(rel.source)) {
      graphMap.set(rel.source, new Set<string>());
    }
    if (!graphMap.has(rel.target)) {
      graphMap.set(rel.target, new Set<string>());
    }
    
    graphMap.get(rel.source)!.add(rel.target);
    graphMap.get(rel.target)!.add(rel.source);
  });
  
  // Identifier les clusters avec un algorithme simple de parcours en largeur
  const visited = new Set<string>();
  const clusters: string[][] = [];
  
  Array.from(graphMap.keys()).forEach(table => {
    if (!visited.has(table)) {
      const cluster: string[] = [];
      const queue: string[] = [table];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (!visited.has(current)) {
          visited.add(current);
          cluster.push(current);
          
          const neighbors = graphMap.get(current) || new Set<string>();
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          });
        }
      }
      
      clusters.push(cluster);
    }
  });
  
  return clusters;
}

/**
 * Génère un style CSS pour les nœuds du graphe en fonction de leur statut de migration
 * @param tableName Nom de la table
 * @param status Statut de migration
 * @returns Styles CSS à appliquer au nœud
 */
export function getNodeStyle(tableName: string, status?: string): string {
  if (!status) return '';
  
  const statusColors = {
    pending: 'gray',
    in_progress: 'blue',
    migrated: 'green',
    validated: 'purple',
    blocked: 'red',
    ignored: 'lightgray'
  };
  
  const color = statusColors[status as keyof typeof statusColors] || 'black';
  
  return `style ${tableName} fill:#f9f9f9,stroke:${color},stroke-width:2px`;
}