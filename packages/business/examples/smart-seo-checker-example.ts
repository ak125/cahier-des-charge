/**
 * Exemple d'utilisation de l'agent SEO intelligent avec mémoire
 * 
 * Cet exemple démontre comment initialiser et utiliser le SmartSeoCheckerAgent
 * avec ses capacités de mémoire pour l'analyse SEO et l'apprentissage.
 */

import { SmartSeoCheckerAgent } from ..@cahier-des-charge/business/src/agents/seo/smart-seo-checker-agent';

/**
 * Fonction principale d'exemple
 */
async function run() {
    console.log('=== DÉMARRAGE DE L\'EXEMPLE D\'AGENT SEO INTELLIGENT ===');

    // Créer l'agent SEO intelligent
    const agent = new SmartSeoCheckerAgent({
        name: 'SEO Analyzer Pro',
        version: '1.0.0',

        // Configuration de la mémoire
        memory: {
            storeNamePrefix: 'seo-agent',

            // Configuration de la mémoire à court terme
            shortTerm: {
                enabled: true,
                ttl: 60 * 60 * 1000 // 1 heure
            },

            // Configuration de la mémoire à long terme
            longTerm: {
                enabled: true,
                mode: 'json',
                storagePath: './.memo-storage',
                vectorIndexing: false // Activer pour la recherche sémantique
            },

            // Configuration de la traçabilité
            tracing: {
                enabled: true,
                detailLevel: 'standard'
            }
        },

        // Configuration spécifique au SEO
        config: {
            maxDepth: 2,
            maxUrls: 20,
            keywords: ['mcp', 'seo', 'analysis'],
            enableLearning: true
        }
    });

    // Initialiser l'agent (inclut l'initialisation de la mémoire)
    await agent.initialize();
    console.log('✅ Agent SEO intelligent initialisé');

    try {
        // Premier site à vérifier
        console.log('\n🔍 ANALYSE DU PREMIER SITE...');
        const firstResult = await agent.checkSite('https://example.com');

        console.log(`Site vérifié: ${firstResult.baseUrl}`);
        console.log(`URLs vérifiées: ${firstResult.urlsChecked}`);
        console.log(`Score moyen: ${firstResult.averageScore.toFixed(2)}/100`);
        console.log(`Top problèmes: ${firstResult.topIssues.length}`);

        // Attendre un moment pour simuler le passage du temps
        console.log('\nAttente avant la deuxième analyse...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Deuxième site à vérifier - l'agent pourra utiliser l'expérience de la première vérification
        console.log('\n🔍 ANALYSE DU DEUXIÈME SITE...');
        const secondResult = await agent.checkSite('https://another-example.org', {
            keywords: ['mcp', 'seo', 'best practices']
        });

        console.log(`Site vérifié: ${secondResult.baseUrl}`);
        console.log(`URLs vérifiées: ${secondResult.urlsChecked}`);
        console.log(`Score moyen: ${secondResult.averageScore.toFixed(2)}/100`);
        console.log(`Top problèmes: ${secondResult.topIssues.length}`);

        // Attendre un moment pour simuler le passage du temps
        console.log('\nAttente avant la troisième analyse...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Troisième site à vérifier - l'agent utilisera maintenant les deux expériences précédentes
        console.log('\n🔍 ANALYSE DU TROISIÈME SITE...');
        const thirdResult = await agent.checkSite('https://third-example.net');

        console.log(`Site vérifié: ${thirdResult.baseUrl}`);
        console.log(`URLs vérifiées: ${thirdResult.urlsChecked}`);
        console.log(`Score moyen: ${thirdResult.averageScore.toFixed(2)}/100`);
        console.log(`Top problèmes: ${thirdResult.topIssues.length}`);

        // Générer un rapport d'apprentissage
        console.log('\n📊 GÉNÉRATION DU RAPPORT D\'APPRENTISSAGE...');
        const learningReport = await agent.generateLearningReport();
        console.log('\nRAPPORT D\'APPRENTISSAGE:');
        console.log(learningReport);

        // Vérifier le contenu de la mémoire
        console.log('\n💾 EXPLORATION DE LA MÉMOIRE...');

        // Rechercher des entrées spécifiques en mémoire
        const memorizedChecks = await agent.searchMemory({
            type: 'seo-check-result'
        });
        console.log(`Nombre de vérifications en mémoire: ${memorizedChecks.length}`);

        // Afficher les domaines mémorisés
        const domains = new Set<string>();
        memorizedChecks.forEach(check => {
            if (check.data && check.metadata?.domain) {
                domains.add(check.metadata.domain as string);
            }
        });
        console.log('Domaines en mémoire:', Array.from(domains));

        // Nettoyer la mémoire (optionnel)
        // console.log('\nNettoyage de la mémoire...');
        // const cleanupResult = await agent.cleanupMemory();
        // console.log(`Entrées nettoyées: Court terme=${cleanupResult.shortTerm}, Long terme=${cleanupResult.longTerm}`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de l\'exemple:', error);
    } finally {
        // Fermer proprement l'agent
        await agent.shutdown();
        console.log('\n✅ Agent arrêté proprement');
        console.log('=== FIN DE L\'EXEMPLE ===');
    }
}

// Exécuter l'exemple
run()
    .then(() => console.log('Exemple terminé avec succès'))
    .catch(err => console.error('Erreur lors de l\'exécution de l\'exemple:', err));
