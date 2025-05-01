/**
 * integration.ts
 *
 * Intègre le système de plugins dans le pipeline MCP existant
 * Ce fichier sert de pont entre le gestionnaire de plugins et l'orchestrateur MCP
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import pluginManager from './manager';
import { MigrationContext } from './types';

/**
 * Initialise le système de plugins au démarrage du pipeline MCP
 */
export async function initializePluginSystem(api: any, logger: any): Promise<void> {
  // Configurer le gestionnaire de plugins avec l'API et le logger MCP
  const manager = pluginManager as any;
  manager.api = api;
  manager.logger = logger;

  // Découvrir tous les plugins disponibles
  const discoveredPlugins = await pluginManager.discoverPlugins();
  logger.info(`Système de plugins initialisé. ${discoveredPlugins.length} plugins découverts.`);

  // Initialiser tous les plugins découverts
  try {
    await pluginManager.initializePlugins();
    logger.info('Tous les plugins ont été initialisés avec succès.');
  } catch (err) {
    logger.error(`Erreur lors de l'initialisation des plugins: ${err.message}`);
  }
}

/**
 * Arrête proprement le système de plugins
 */
export async function shutdownPluginSystem(): Promise<void> {
  await pluginManager.shutdownPlugins();
}

/**
 * Fonction à appeler quand une migration commence
 */
export async function onMigrationStart(migration: MigrationContext): Promise<void> {
  await pluginManager.triggerHook('onMigrationStart', migration);
}

/**
 * Fonction à appeler quand une migration se termine
 */
export async function onMigrationComplete(migration: MigrationContext, result: any): Promise<void> {
  await pluginManager.triggerHook('onMigrationComplete', migration, result);
}

/**
 * Fonction à appeler quand un agent commence à s'exécuter
 */
export async function onAgentStart(agentId: string, input: any): Promise<void> {
  await pluginManager.triggerHook('onAgentStart', agentId, input);
}

/**
 * Fonction à appeler quand un agent termine son exécution
 */
export async function onAgentComplete(agentId: string, result: any): Promise<void> {
  await pluginManager.triggerHook('onAgentComplete', agentId, result);
}

/**
 * Fonction à appeler quand un agent rencontre une erreur
 */
export async function onAgentError(agentId: string, error: Error): Promise<void> {
  await pluginManager.triggerHook('onAgentError', agentId, error);
}

/**
 * Fonction à appeler quand le pipeline démarre
 */
export async function onPipelineStart(): Promise<void> {
  await pluginManager.triggerHook('onPipelineStart');
}

/**
 * Fonction à appeler quand le pipeline se termine
 */
export async function onPipelineComplete(): Promise<void> {
  await pluginManager.triggerHook('onPipelineComplete');
}

/**
 * Exécute un plugin spécifique avec des données d'entrée
 */
export async function executePlugin<T, R>(pluginId: string, input: T): Promise<R> {
  return await pluginManager.executePlugin<T, R>(pluginId, input);
}

/**
 * Vérifie si un plugin est disponible
 */
export function hasPlugin(pluginId: string): boolean {
  return pluginManager.hasPlugin(pluginId);
}

/**
 * Enregistre un plugin dans le système pendant l'exécution
 * (principalement utilisé pour les tests ou l'injection dynamique)
 */
export async function registerPlugin(pluginPath: string): Promise<boolean> {
  try {
    // Vérifier si le plugin existe
    const manifestPath = path.join(pluginPath, 'manifest.json');
    const manifestExists = await fs
      .access(manifestPath)
      .then(() => true)
      .catch(() => false);

    if (!manifestExists) {
      throw new Error(`Manifest non trouvé: ${manifestPath}`);
    }

    // Forcer la découverte du plugin
    await pluginManager.discoverPlugins();
    return true;
  } catch (err) {
    console.error(`Échec de l'enregistrement du plugin: ${err.message}`);
    return false;
  }
}
