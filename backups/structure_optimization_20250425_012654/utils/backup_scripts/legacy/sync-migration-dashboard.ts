#!/usr/bin/env node

/**
 * Script de synchronisation des données de migration vers Supabase
 * 
 * Utilisation:
 *   npm run sync-migration
 *   
 * Environnement requis:
 *   SUPABASE_URL=https://votre-projet.supabase.co
 *   SUPABASE_ANON_KEY=votre-clé-supabase
 */

import syncMigrationStatus from ../app/lib/migration/sync_migration_statusstructure-agent';

// Vérifier les variables d'environnement requises
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('\x1b[31mErreur: Variables d\'environnement manquantes\x1b[0m');
  console.error('\x1b[33mAssurez-vous de définir SUPABASE_URL et SUPABASE_ANON_KEY\x1b[0m');
  console.error('Exemple:');
  console.error('  SUPABASE_URL=https://votre-projet.supabase.co SUPABASE_ANON_KEY=votre-clé-supabase npm run sync-migration');
  process.exit(1);
}

console.log('\x1b[36m=== Synchronisation des données de migration vers Supabase ===\x1b[0m');
console.log('Date:', new Date().toLocaleString());

// Exécuter la synchronisation
syncMigrationStatus()
  .then(() => {
    console.log('\x1b[32m✓ Synchronisation terminée avec succès!\x1b[0m');
    process.exit(0);
  })
  .catch(error => {
    console.error('\x1b[31m✗ Erreur lors de la synchronisation:\x1b[0m', error);
    process.exit(1);
  });