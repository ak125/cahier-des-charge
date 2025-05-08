#!/usr/bin/env node

/**
 * Script wrapper pour la compatibilité avec les anciens workflows
 * Redirige vers la nouvelle bibliothèque @projet/db-utils-type-mapper
 */

console.log('ATTENTION: Ce script est obsolète. Utilisez la nouvelle bibliothèque @projet/db-utils-type-mapper à la place.');
console.log('Pour plus d\'informations, consultez /packages/db-utils/type-mapper/README.md');
console.log('');

// Importer le CLI de la nouvelle bibliothèque
require('../packages/db-utils/type-mapper/dist/cli');

// Ce script n'exécute aucun code additionnel, il agit simplement comme un wrapper
// pour la nouvelle bibliothèque et préserve la compatibilité avec les scripts existants.