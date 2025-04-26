import fs from fsstructure-agent';
import path from pathstructure-agent';

interface DebtMetric {
  name: string;
  value: number;
  description: string;
}

interface DebtData {
  score: number;
  metrics: DebtMetric[];
  suggestions: string[];
}

export async function loadDebtReport(): Promise<Record<string, DebtData>> {
  try {
    // Chemin vers le fichier de rapport de dette technique
    const debtPath = path.resolve(process.cwd(), 'reports/sql_debt_report.json');
    
    // Vérifier si le fichier existe
    if (fs.existsSync(debtPath)) {
      const content = fs.readFileSync(debtPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Si le fichier n'existe pas, essayer de générer un rapport simplifié à partir du schéma
    const schemaPath = path.resolve(process.cwd(), 'agents/migration/examples/mysql_schema_map.json');
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const schemaMap = JSON.parse(schemaContent);
      
      // Générer un rapport de dette technique simplifié pour chaque table
      const debtReport: Record<string, DebtData> = {};
      
      Object.entries(schemaMap.tables).forEach(([tableName, tableData]: [string, any]) => {
        // Calculer le score de complexité basé sur le nombre de colonnes et de relations
        const columnCount = tableData.columns?.length || 0;
        const relationCount = tableData.foreignKeys?.length || 0;
        
        // Détecter les problèmes potentiels
        const hasPrimaryKey = tableData.primaryKey?.length > 0;
        const hasNonStandardColumns = tableData.columns?.some((col: any) => 
          col.type.includes('BLOB') || 
          col.type.includes('TEXT') || 
          col.type.includes('ENUM')
        );
        
        // Calculer un score approximatif de dette technique
        let score = 0;
        score += !hasPrimaryKey ? 50 : 0;
        score += hasNonStandardColumns ? 30 : 0;
        score += Math.min(30, columnCount > 20 ? 30 : columnCount / 20 * 30);
        score += Math.min(20, relationCount > 5 ? 20 : relationCount / 5 * 20);
        
        // Limiter le score entre 0 et 100
        score = Math.min(100, Math.max(0, score));
        
        // Créer les métriques de dette technique
        const metrics: DebtMetric[] = [
          {
            name: 'Structure',
            value: !hasPrimaryKey ? 100 : 0,
            description: !hasPrimaryKey 
              ? 'Table sans clé primaire définie' 
              : 'Structure correcte avec clé primaire'
          },
          {
            name: 'Complexité',
            value: Math.min(100, columnCount > 20 ? 100 : columnCount / 20 * 100),
            description: `Table avec ${columnCount} colonnes (>20 = complexe)`
          },
          {
            name: 'Types non standards',
            value: hasNonStandardColumns ? 100 : 0,
            description: hasNonStandardColumns 
              ? 'Utilise des types BLOB, TEXT ou ENUM difficiles à migrer' 
              : 'Utilise des types standards'
          },
          {
            name: 'Relations',
            value: Math.min(100, relationCount > 5 ? 100 : relationCount / 5 * 100),
            description: `${relationCount} relations avec d'autres tables`
          }
        ];
        
        // Générer des suggestions d'amélioration
        const suggestions: string[] = [];
        
        if (!hasPrimaryKey) {
          suggestions.push('Ajouter une clé primaire à cette table');
        }
        
        if (hasNonStandardColumns) {
          suggestions.push('Convertir les types BLOB/TEXT/ENUM en types standards PostgreSQL');
        }
        
        if (columnCount > 20) {
          suggestions.push('Envisager de normaliser cette table en plusieurs tables');
        }
        
        debtReport[tableName] = {
          score: Math.round(score),
          metrics,
          suggestions
        };
      });
      
      return debtReport;
    }
    
    // Si aucune source n'est disponible, retourner un exemple de base
    return {
      'UTILISATEURS': {
        score: 25,
        metrics: [
          { name: 'Structure', value: 0, description: 'Structure correcte avec clé primaire' },
          { name: 'Complexité', value: 50, description: 'Table avec 10 colonnes' },
          { name: 'Types non standards', value: 0, description: 'Utilise des types standards' },
          { name: 'Relations', value: 60, description: '3 relations avec d\'autres tables' }
        ],
        suggestions: []
      },
      'COMMANDES': {
        score: 60,
        metrics: [
          { name: 'Structure', value: 0, description: 'Structure correcte avec clé primaire' },
          { name: 'Complexité', value: 75, description: 'Table avec 15 colonnes' },
          { name: 'Types non standards', value: 100, description: 'Utilise des champs TEXT pour les commentaires' },
          { name: 'Relations', value: 80, description: '4 relations avec d\'autres tables' }
        ],
        suggestions: [
          'Convertir les champs TEXT en VARCHAR avec une longueur définie',
          'Envisager de déplacer les données de commentaires dans une table séparée'
        ]
      },
      'PRODUITS': {
        score: 45,
        metrics: [
          { name: 'Structure', value: 0, description: 'Structure correcte avec clé primaire' },
          { name: 'Complexité', value: 60, description: 'Table avec 12 colonnes' },
          { name: 'Types non standards', value: 100, description: 'Utilise ENUM pour le statut du produit' },
          { name: 'Relations', value: 40, description: '2 relations avec d\'autres tables' }
        ],
        suggestions: [
          'Remplacer ENUM par une table de référence ou un type CHECK dans PostgreSQL'
        ]
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement du rapport de dette technique:', error);
    return {};
  }
}