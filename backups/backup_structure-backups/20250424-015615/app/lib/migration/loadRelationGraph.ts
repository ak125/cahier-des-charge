import fs from fsstructure-agent';
import path from pathstructure-agent';

interface Relation {
  source: string;
  target: string;
  type: string;
}

interface RelationGraph {
  relations: Relation[];
  version: string;
  generatedAt: string;
}

export async function loadRelationGraph(): Promise<RelationGraph> {
  try {
    // Chemin vers le fichier de relations
    const relationPath = path.resolve(process.cwd(), 'reports/relation_graph.json');
    
    // Vérifier si le fichier existe
    if (fs.existsSync(relationPath)) {
      const content = fs.readFileSync(relationPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Si le fichier n'existe pas, générer un graphe à partir du schéma SQL
    const schemaPath = path.resolve(process.cwd(), 'agents/migration/examples/mysql_schema_map.json');
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const schemaMap = JSON.parse(schemaContent);
      
      // Générer les relations à partir des clés étrangères du schéma
      const relations: Relation[] = [];
      
      Object.values(schemaMap.tables).forEach((table: any) => {
        if (table.foreignKeys && Array.isArray(table.foreignKeys)) {
          table.foreignKeys.forEach((fk: any) => {
            relations.push({
              source: table.name,
              target: fk.referencedTable,
              type: 'belongsTo'
            });
            
            // Ajouter aussi la relation inverse (hasMany/hasOne)
            relations.push({
              source: fk.referencedTable,
              target: table.name,
              type: 'hasMany'
            });
          });
        }
      });
      
      return {
        relations,
        version: '1.0.0',
        generatedAt: new Date().toISOString()
      };
    }
    
    // Si aucune source n'est disponible, retourner un exemple de base
    return {
      relations: [
        { source: 'UTILISATEURS', target: 'COMMANDES', type: 'hasMany' },
        { source: 'COMMANDES', target: 'UTILISATEURS', type: 'belongsTo' },
        { source: 'COMMANDES', target: 'LIGNES_COMMANDE', type: 'hasMany' },
        { source: 'LIGNES_COMMANDE', target: 'COMMANDES', type: 'belongsTo' },
        { source: 'LIGNES_COMMANDE', target: 'PRODUITS', type: 'belongsTo' },
        { source: 'PRODUITS', target: 'LIGNES_COMMANDE', type: 'hasMany' },
        { source: 'PRODUITS', target: 'CATEGORIES', type: 'belongsTo' },
        { source: 'CATEGORIES', target: 'PRODUITS', type: 'hasMany' }
      ],
      version: '0.0.1',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur lors du chargement du graphe de relations:', error);
    return {
      relations: [],
      version: '0.0.0',
      generatedAt: new Date().toISOString()
    };
  }
}