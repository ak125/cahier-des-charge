import fs from 'fs';
import path from 'path';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
  extra?: string;
}

interface Table {
  name: string;
  category: string;
  columns: Column[];
  primaryKey: string[];
  foreignKeys: {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }[];
}

interface SchemaMap {
  tables: Record<string, Table>;
  version: string;
  generatedAt: string;
}

export async function loadSchemaMap(): Promise<SchemaMap> {
  try {
    // Chemin vers le fichier de structure SQL
    const schemaPath = path.resolve(process.cwd(), 'agents/migration/examples/mysql_schema_map.json');
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(schemaPath)) {
      console.warn(`Fichier de structure SQL non trouvé: ${schemaPath}`);
      return {
        tables: {},
        version: '0.0.0',
        generatedAt: new Date().toISOString()
      };
    }
    
    // Lire et parser le contenu du fichier
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schemaMap = JSON.parse(schemaContent) as SchemaMap;
    
    return schemaMap;
  } catch (error) {
    console.error('Erreur lors du chargement de la structure SQL:', error);
    return {
      tables: {},
      version: '0.0.0',
      generatedAt: new Date().toISOString()
    };
  }
}