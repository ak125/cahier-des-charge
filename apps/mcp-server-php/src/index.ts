import path from 'path';
import { McpServer } from '@model-context-protocol/server';
import dotenv from 'dotenv';
import { phpAnalyzerRoute } from './routes/phpAnalyzer';
import { createLogger } from './utils/logger';

// Chargement des variables d'environnement
dotenv.config();

const logger = createLogger('mcp-server-php');
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  try {
    // Création du serveur MCP
    const server = new McpServer({
      id: process.env.MCP_SERVER_ID || 'PhpAnalyzer',
      version: '1.0.0',
      name: 'PHP Analyzer MCP Server',
      description: "Serveur MCP pour l'analyse de code PHP avec intégration Supabase",
      baseUrl: process.env.BASE_URL || `http://localhost:${port}`
    });

    // Configuration des routes
    server.app.use('/api/analyze', phpAnalyzerRoute);

    // Endpoint pour la vérification de santé
    server.app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Démarrage du serveur
    await server.start(port);
    logger.info(`🚀 MCP PHP Analyzer Server démarré sur le port ${port}`);
    logger.info(`📡 Health check: http://localhost:${port}/health`);
    logger.info(`🔍 Endpoint d'analyse: http://localhost:${port}/api/analyze`);
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur MCP:', error);
    process.exit(1);
  }
}

// Démarrage du serveur
startServer();
