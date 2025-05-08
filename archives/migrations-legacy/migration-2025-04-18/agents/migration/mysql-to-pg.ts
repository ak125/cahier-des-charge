#!/usr/bin/env node

/**
 * Script wrapper pour la compatibilité avec les anciens workflows
 * Redirige vers la nouvelle bibliothèque @projet/db-utils-type-mapper
 */

console.log('ATTENTION: Ce script est obsolète. Utilisez la nouvelle bibliothèque @projet/db-utils-type-mapper à la place.');
console.log('Pour plus d\'informations, consultez /packages/db-utils/type-mapper/README.md');
console.log('');

// Importer le CLI de la nouvelle bibliothèque et passer les arguments spécifiques à mysql-to-pg
const args = process.argv.slice(2);

// Adaptation des arguments au nouveau format de CLI
// La commande originale mysql-to-pg.ts utilisait un format différent que notre nouveau CLI
const adaptedArgs = args.map(arg => {
    // Si nécessaire, adapter les arguments spécifiques à mysql-to-pg vers le format du nouveau CLI
    // Par exemple: --mysql-schema pourrait devenir -s ou --schema
    if (arg.startsWith('--mysql-schema=')) {
        return arg.replace('--mysql-schema=', '--schema=');
    }
    return arg;
});

// Exécuter avec les arguments adaptés
process.argv = [process.argv[0], process.argv[1], ...adaptedArgs];
require('../../../../../packages/db-utils/type-mapper/dist/cli');