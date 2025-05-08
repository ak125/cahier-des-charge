#!/usr/bin/env node

/**
 * Script d'entrée pour le serveur MCP MySQL
 * Permet d'exécuter le serveur en ligne de commande
 */

import { MySqlMcpServer } from './index';

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

// Démarrer le serveur
MySqlMcpServer.start(args).catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
