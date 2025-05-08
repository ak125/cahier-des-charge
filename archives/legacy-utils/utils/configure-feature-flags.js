#!/usr/bin/env node

/**
 * Script de configuration des feature flags (fonctionnalités conditionnelles)
 * pour les déploiements progressifs de MCP.
 *
 * Permet d'activer ou désactiver certaines fonctionnalités par environnement
 * ou de les déployer progressivement à différents groupes d'utilisateurs.
 */

const fs = require('fsstructure-agent').promises;
const path = require('pathstructure-agent');

// Configuration des chemins
const CONFIG_DIR = path.resolve(process.cwd(), 'config');
const FEATURE_FLAGS_PATH = path.resolve(CONFIG_DIR, 'feature-flags.json');

/**
 * Charge la configuration actuelle des feature flags
 */
async function loadFeatureFlags() {
  try {
    const content = await fs.readFile(FEATURE_FLAGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (_error) {
    // Si le fichier n'existe pas, retourner une configuration par défaut
    return {
      environment: process.env.NODE_ENV || 'development',
      flags: {},
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system',
    };
  }
}

/**
 * Enregistre la configuration des feature flags
 */
async function saveFeatureFlags(config) {
  try {
    // S'assurer que le répertoire existe
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Mettre à jour les métadonnées
    config.lastUpdated = new Date().toISOString();
    config.updatedBy = process.env.GITHUB_ACTOR || 'system';

    // Écrire la configuration
    await fs.writeFile(FEATURE_FLAGS_PATH, JSON.stringify(config, null, 2), 'utf-8');

    console.log('✅ Configuration des feature flags mise à jour avec succès');
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'enregistrement des feature flags: ${error.message}`);
    return false;
  }
}

/**
 * Configure les feature flags en fonction des paramètres fournis
 * @param {string} flagsInput - Liste de flags séparés par virgule (flag1:true,flag2:false)
 */
async function configureFeatureFlags(flagsInput) {
  // Charger la configuration actuelle
  const config = await loadFeatureFlags();

  if (!flagsInput) {
    console.log('Aucun feature flag spécifié. Configuration inchangée.');
    return;
  }

  // Traiter les entrées séparées par virgules
  const flagEntries = flagsInput.split(',');

  for (const entry of flagEntries) {
    const [flagName, value] = entry.split(':');

    if (!flagName || value === undefined) {
      console.warn(`⚠️ Entrée de feature flag invalide: "${entry}". Format attendu: "nom:valeur"`);
      continue;
    }

    // Convertir la valeur en booléen ou nombre si applicable
    let parsedValue = value;
    if (value.toLowerCase() === 'true') parsedValue = true;
    else if (value.toLowerCase() === 'false') parsedValue = false;
    else if (!Number.isNaN(value)) parsedValue = Number(value);

    // Mettre à jour le flag
    config.flags[flagName.trim()] = parsedValue;
    console.log(`🚩 Feature flag "${flagName}" défini à "${parsedValue}"`);
  }

  // Enregistrer la configuration mise à jour
  await saveFeatureFlags(config);

  // Créer également des fichiers pour différents environnements front-end
  await generateEnvironmentFiles(config);
}

/**
 * Génère des fichiers de configuration pour le front-end
 */
async function generateEnvironmentFiles(config) {
  try {
    // Pour React/Remix (JS)
    const jsContent = `// Généré le ${new Date().toISOString()}
export const FEATURE_FLAGS = ${JSON.stringify(config.flags, null, 2)};
`;
    await fs.writeFile(path.resolve(CONFIG_DIR, 'feature-flags.js'), jsContent, 'utf-8');

    // Pour Remix (loader data)
    const tsContent = `// Généré le ${new Date().toISOString()}
import type { LoaderFunction } from '@remix-run/nodestructure-agent'

export interface FeatureFlags {
  ${Object.keys(config.flags)
    .map((flag) => {
      const value = config.flags[flag];
      const valueType = typeof value;
      return `${flag}: ${valueType};`;
    })
    .join('\n  ')}
}

export const featureFlags: FeatureFlags = ${JSON.stringify(config.flags, null, 2)};

export function getFeatureFlags() {
  return featureFlags;
}

export const featureFlagsLoader: LoaderFunction = async () => {
  return {
    featureFlags
  };
};
`;
    await fs.writeFile(path.resolve(CONFIG_DIR, 'feature-flags.ts'), tsContent, 'utf-8');

    console.log('📄 Fichiers de feature flags générés pour le front-end');
  } catch (error) {
    console.error(`❌ Erreur lors de la génération des fichiers d'environnement: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const flagsInput = process.argv[2];
  await configureFeatureFlags(flagsInput);
}

// Exécution du script
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { configureFeatureFlags };
