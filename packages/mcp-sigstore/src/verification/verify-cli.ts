#!/usr/bin/env node
/**
 * Outil en ligne de commande pour vérifier les signatures SIGSTORE
 */
import * as fs from 'fs';
import * as path from 'path';
import { SigstoreVerifier } from './sigstore-verifier';
import { SigstoreConfig } from '../types';

// Fonction principale
async function main() {
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: verify-cli [signaturesDir] [agentId] [runId] [filePath]');
        console.error('    signaturesDir: Répertoire contenant les signatures');
        console.error('    agentId: Identifiant de l\'agent');
        console.error('    runId: Identifiant de l\'exécution');
        console.error('    filePath: (Optionnel) Chemin du fichier à vérifier');
        process.exit(1);
    }

    const signaturesDir = args[0];
    const agentId = args[1];
    const runId = args[2];
    const filePath = args.length > 3 ? args[3] : undefined;

    // Configurer le vérificateur
    const config: SigstoreConfig = {
        signaturesDir
    };

    const verifier = new SigstoreVerifier(config);

    try {
        let result;

        if (filePath) {
            // Vérifier un fichier
            console.log(`Vérification de la signature pour le fichier: ${filePath}`);
            result = await verifier.verifyFile(agentId, runId, filePath);
        } else {
            // Vérifier si on peut trouver un fichier de résultat JSON correspondant
            const resultPath = path.join(signaturesDir, agentId, `${runId}.json`);
            if (fs.existsSync(resultPath)) {
                console.log(`Vérification de la signature pour le fichier de résultat: ${resultPath}`);
                result = await verifier.verifyFile(agentId, runId, resultPath);
            } else {
                console.error(`Aucun fichier de résultat trouvé pour l'agent ${agentId} et l'exécution ${runId}`);
                process.exit(1);
            }
        }

        // Afficher le résultat
        if (result.valid) {
            console.log('✅ Signature valide');
            console.log('Informations de signature:');
            console.log(`  Agent: ${result.signatureInfo?.agentId}`);
            console.log(`  Run ID: ${result.signatureInfo?.runId}`);
            console.log(`  Hash: ${result.signatureInfo?.resultHash}`);
            console.log(`  Timestamp: ${new Date(result.signatureInfo?.timestamp || 0).toISOString()}`);
            console.log(`  Chemin de la signature: ${result.signatureInfo?.signaturePath}`);
            if (result.signatureInfo?.rekorLogEntry) {
                console.log(`  Entrée Rekor: ${result.signatureInfo.rekorLogEntry}`);
            }
            process.exit(0);
        } else {
            console.error('❌ Signature invalide');
            console.error(`Erreur: ${result.error}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        process.exit(1);
    }
}

// Exécuter le script
main().catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
});