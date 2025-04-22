#!/usr/bin/env node
/**
 * Point d'entrée CLI pour le serveur MCP PostgreSQL
 */

// Importer la fonction principale du serveur MCP
import { main } from '.DoDotmcp-server';

// Exécuter la fonction principale
main().catch(error => {
  console.error(`❌ Erreur non gérée: ${error}`);
  process.exit(1);
});