/**
 * Script de vérification post-génération
 * Lance une vérification automatique après la génération de fichiers
 */

import axios from 'axios';
import * as fs from 'fsstructure-agent';
import * as path from 'pathstructure-agent';
import { execSync } from './child_processstructure-agent';

// Configuration
const API_URL = process.env.MCP_API_URL || 'http://localhost:3030/api';
const DIRECT_EXECUTION = process.env.DIRECT_EXECUTION === 'true';

async function main() {
  const filePrefix = process.argv[2];

  if (!filePrefix) {
    console.error('❌ Erreur: Veuillez spécifier un préfixe de fichier à vérifier.');
    console.error('Usage: pnpm post-generate <file-prefix>');
    process.exit(1);
  }

  console.log(`🔍 Lancement de la vérification pour "${filePrefix}"...`);

  try {
    // Vérifier si l'environnement BullMQ est actif
    const isBullMQActive = await checkBullMQStatus();

    if (isBullMQActive) {
      // Lancer la vérification via BullMQ
      await launchBullMQVerification(filePrefix);
    } else if (DIRECT_EXECUTION) {
      // Vérification directe (sans BullMQ)
      console.log('⚠️ BullMQ non disponible. Exécution directe de la vérification...');
      await directVerification(filePrefix);
    } else {
      console.error("❌ BullMQ non disponible et l'exécution directe est désactivée.");
      console.error(
        "Activez l'exécution directe avec DIRECT_EXECUTION=true ou démarrez BullMQ avec pnpm bullmq:start"
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification post-génération:', error.message);
    process.exit(1);
  }
}

/**
 * Vérifie si le service BullMQ API est accessible
 */
async function checkBullMQStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_URL}/jobs/stats`, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    console.log('⚠️ API BullMQ non accessible:', error.message);
    return false;
  }
}

/**
 * Lance une vérification via l'API BullMQ
 */
async function launchBullMQVerification(filePrefix: string): Promise<void> {
  try {
    console.log('🚀 Lancement de la vérification via BullMQ...');

    const response = await axios.post(`${API_URL}/jobs/verification`, {
      filePrefix,
      options: {
        priority: 5,
        generateReport: true,
        addTags: true,
        typeCheck: true,
        metadata: {
          source: 'post-generate-script',
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`✅ Vérification lancée avec succès via BullMQ (Job ID: ${response.data.jobId})`);
    console.log(
      '📊 Le rapport sera disponible dans le dashboard de vérification quand le job sera terminé.'
    );
    console.log('🔗 Dashboard: http://localhost:3000/dashboard/verification');
  } catch (error) {
    console.error('❌ Erreur lors du lancement de la vérification via BullMQ:', error.message);
    throw error;
  }
}

/**
 * Exécute une vérification directe (sans BullMQ)
 */
async function directVerification(filePrefix: string): Promise<void> {
  try {
    console.log('🔍 Exécution de la vérification directe...');

    // Exécuter la commande de vérification
    execSync(`pnpmDoDotmcp-verify ${filePrefix} --generate-report --add-tags --type-check`, {
      stdio: 'inherit',
    });

    // Vérifier si le rapport existe
    const reportDir = path.resolve('./apps/frontend/app/generated/reports');
    const reportPath = path.join(reportDir, `${filePrefix}.verification_report.json`);

    if (fs.existsSync(reportPath)) {
      console.log(`✅ Vérification terminée avec succès. Rapport généré: ${reportPath}`);
    } else {
      console.log("⚠️ Vérification terminée mais aucun rapport n'a été trouvé.");
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification directe:', error.message);
    throw error;
  }
}

// Exécuter le script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
