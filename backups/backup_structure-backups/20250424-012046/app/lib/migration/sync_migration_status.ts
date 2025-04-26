import fs from fsstructure-agent';
import path from pathstructure-agent';
import { createClient } from @supabase/supabase-jsstructure-agent';

// Configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Fonction principale
async function syncMigrationStatus() {
  console.log('Démarrage de la synchronisation avec Supabase...');
  
  if (!supabaseKey) {
    console.error('Erreur: SUPABASE_ANON_KEY non définie dans les variables d\'environnement');
    process.exit(1);
  }
  
  // Initialiser le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Chargement des données depuis les fichiers JSON
    const schemaMap = loadJsonFile('agents/migration/examples/mysql_schema_map.json');
    const migrationPlan = loadJsonFile('reports/migration_plan.json', true);
    const relationGraph = loadJsonFile('reports/relation_graph.json', true);
    const debtReport = loadJsonFile('reports/sql_debt_report.json', true);
    
    // 2. Traitement et mise à jour des tables dans Supabase
    await syncTables(supabase, schemaMap);
    await syncMigrationPlan(supabase, migrationPlan);
    await syncDebtReport(supabase, debtReport);
    await syncRelations(supabase, relationGraph);
    
    console.log('Synchronisation terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

// Charger un fichier JSON avec gestion d'erreur
function loadJsonFile(filePath, optional = false) {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    if (optional) {
      console.warn(`Fichier optionnel non trouvé: ${filePath}`);
      return null;
    } else {
      throw new Error(`Fichier requis non trouvé: ${filePath}`);
    }
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
  }
}

// Synchroniser les tables avec Supabase
async function syncTables(supabase, schemaMap) {
  if (!schemaMap || !schemaMap.tables) {
    console.warn('Aucune information de table trouvée dans le schéma');
    return;
  }
  
  console.log(`Synchronisation de ${Object.keys(schemaMap.tables).length} tables...`);
  
  const tables = Object.entries(schemaMap.tables).map(([tableName, tableData]) => ({
    table_name: tableName,
    schema_data: tableData,
    column_count: tableData.columns?.length || 0,
    has_primary_key: tableData.primaryKey?.length > 0,
    foreign_key_count: tableData.foreignKeys?.length || 0,
    category: tableData.category || 'uncategorized',
    updated_at: new Date().toISOString()
  }));
  
  // Diviser en petits lots pour éviter les limites de taille des requêtes
  const batchSize = 50;
  for (let i = 0; i < tables.length; i += batchSize) {
    const batch = tables.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('sql_tables')
      .upsert(batch, { onConflict: 'table_name' });
    
    if (error) {
      console.error(`Erreur lors de la synchronisation du lot de tables ${i}-${i + batch.length}:`, error);
    }
  }
  
  console.log(`${tables.length} tables synchronisées`);
}

// Synchroniser le plan de migration avec Supabase
async function syncMigrationPlan(supabase, migrationPlan) {
  if (!migrationPlan) {
    console.warn('Aucun plan de migration trouvé, utilisation des valeurs par défaut');
    return;
  }
  
  console.log(`Synchronisation du statut de migration pour ${Object.keys(migrationPlan).length} tables...`);
  
  const migrationStatus = Object.entries(migrationPlan).map(([tableName, statusData]) => ({
    table_name: tableName,
    status: statusData.status || 'pending',
    progress: statusData.progress || 0,
    assigned_to: statusData.assignedTo || null,
    notes: statusData.notes || null,
    updated_at: new Date().toISOString()
  }));
  
  // Traitement par lots
  const batchSize = 50;
  for (let i = 0; i < migrationStatus.length; i += batchSize) {
    const batch = migrationStatus.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('migration_status')
      .upsert(batch, { onConflict: 'table_name' });
    
    if (error) {
      console.error(`Erreur lors de la synchronisation du lot de statuts ${i}-${i + batch.length}:`, error);
    }
  }
  
  console.log(`Statut de migration de ${migrationStatus.length} tables synchronisé`);
}

// Synchroniser le rapport de dette technique avec Supabase
async function syncDebtReport(supabase, debtReport) {
  if (!debtReport) {
    console.warn('Aucun rapport de dette technique trouvé');
    return;
  }
  
  console.log(`Synchronisation du rapport de dette pour ${Object.keys(debtReport).length} tables...`);
  
  const debtEntries = Object.entries(debtReport).map(([tableName, debtData]) => ({
    table_name: tableName,
    debt_score: debtData.score || 0,
    metrics: debtData.metrics || [],
    suggestions: debtData.suggestions || [],
    updated_at: new Date().toISOString()
  }));
  
  // Traitement par lots
  const batchSize = 50;
  for (let i = 0; i < debtEntries.length; i += batchSize) {
    const batch = debtEntries.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('technical_debt')
      .upsert(batch, { onConflict: 'table_name' });
    
    if (error) {
      console.error(`Erreur lors de la synchronisation du lot de rapports de dette ${i}-${i + batch.length}:`, error);
    }
  }
  
  console.log(`Rapport de dette technique de ${debtEntries.length} tables synchronisé`);
}

// Synchroniser les relations avec Supabase
async function syncRelations(supabase, relationGraph) {
  if (!relationGraph || !relationGraph.relations) {
    console.warn('Aucune information de relation trouvée');
    return;
  }
  
  console.log(`Synchronisation de ${relationGraph.relations.length} relations...`);
  
  // Supprimer les relations existantes pour éviter les doublons
  const { error: deleteError } = await supabase
    .from('table_relations')
    .delete()
    .neq('id', 0); // Condition pour tout supprimer
  
  if (deleteError) {
    console.error('Erreur lors de la suppression des relations existantes:', deleteError);
  }
  
  // Ajouter les nouvelles relations
  const relations = relationGraph.relations.map((relation, index) => ({
    source_table: relation.source,
    target_table: relation.target,
    relation_type: relation.type || 'unknown',
    updated_at: new Date().toISOString()
  }));
  
  // Traitement par lots
  const batchSize = 50;
  for (let i = 0; i < relations.length; i += batchSize) {
    const batch = relations.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('table_relations')
      .insert(batch);
    
    if (error) {
      console.error(`Erreur lors de la synchronisation du lot de relations ${i}-${i + batch.length}:`, error);
    }
  }
  
  console.log(`${relations.length} relations synchronisées`);
}

// Exécution du script si appelé directement
if (require.main === module) {
  syncMigrationStatus().catch(error => {
    console.error('Erreur fatale lors de la synchronisation:', error);
    process.exit(1);
  });
}

// Export pour utilisation dans d'autres scripts
export default syncMigrationStatus;