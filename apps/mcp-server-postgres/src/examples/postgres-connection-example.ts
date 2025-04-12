/**
 * Exemple d'utilisation du service de connexion à PostgreSQL
 */

import { DatabaseConnectionService } from '../services/database-connection-service';

/**
 * Fonction principale pour démontrer l'utilisation du service de connexion
 */
async function main() {
  // Créer une instance du service avec une chaîne de connexion
  const connectionString = 'postgresql://migration:migration_password@localhost:5432/migration_db?schema=public';
  const dbService = new DatabaseConnectionService(connectionString);
  
  // Configurer des écouteurs d'événements pour surveiller les activités
  dbService.on('connected', () => {
    console.log('🔌 Connecté à la base de données PostgreSQL');
  });
  
  dbService.on('disconnected', () => {
    console.log('🔌 Déconnecté de la base de données PostgreSQL');
  });
  
  dbService.on('error', (error) => {
    console.error('❌ Erreur de base de données:', error.message);
  });
  
  dbService.on('query', (query, params, duration) => {
    console.log(`⏱️ Requête exécutée en ${duration}ms: ${query.substring(0, 80)}${query.length > 80 ? '...' : ''}`);
  });
  
  try {
    // Se connecter à la base de données
    await dbService.connect();
    
    // Lister les schémas disponibles
    const schemas = await dbService.listSchemas();
    console.log('📊 Schémas disponibles:', schemas);
    
    // Exécuter une requête simple
    const result = await dbService.executeQuery('SELECT current_database() as db, current_user as user, version() as version');
    console.log('ℹ️ Informations sur la base de données:', result.rows[0]);
    
    // Utiliser une transaction
    await dbService.withTransaction(async (client) => {
      // Créer une table temporaire pour le test
      await client.query(`
        CREATE TEMPORARY TABLE IF NOT EXISTS test_table (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Insérer des données
      await client.query(`
        INSERT INTO test_table (name) VALUES 
        ('Test 1'), 
        ('Test 2'), 
        ('Test 3')
      `);
      
      // Lire les données
      const data = await client.query('SELECT * FROM test_table');
      console.log('📝 Données de test:', data.rows);
      
      // Supprimer la table (pas vraiment nécessaire pour une table temporaire)
      await client.query('DROP TABLE test_table');
      
      console.log('✅ Transaction complétée avec succès');
    });
    
    // Obtenir les statistiques du pool
    const poolStats = dbService.getPoolStats();
    console.log('📊 Statistiques du pool:', poolStats);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'exemple:', error.message);
  } finally {
    // Fermer la connexion proprement
    await dbService.disconnect();
  }
}

// Exécuter l'exemple si ce fichier est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
  });
}

// Exporter la fonction main pour une utilisation externe
export { main };