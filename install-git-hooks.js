#!/usr/bin/env node

/**
 * Script d'installation des hooks Git pour prévenir les collisions de noms
 * et autres problèmes de structure dans le projet
 * 
 * Ce script installe un hook pre-commit qui exécute le script de validation
 * avant chaque commit pour empêcher l'introduction de nouveaux problèmes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_DIR = process.cwd();
const GIT_DIR = path.join(BASE_DIR, '.git');
const HOOKS_DIR = path.join(GIT_DIR, 'hooks');
const PRE_COMMIT_HOOK = path.join(HOOKS_DIR, 'pre-commit');

// Couleurs pour la sortie console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

console.log(`${colors.blue}Installation des hooks Git pour le projet...${colors.reset}`);

// Vérifier si le répertoire .git existe
if (!fs.existsSync(GIT_DIR)) {
    console.error(`${colors.red}Erreur: Le répertoire .git n'existe pas dans ${BASE_DIR}${colors.reset}`);
    console.log('Ce script doit être exécuté à la racine d\'un dépôt Git.');
    process.exit(1);
}

// Vérifier/créer le répertoire hooks
if (!fs.existsSync(HOOKS_DIR)) {
    console.log(`${colors.yellow}Création du répertoire de hooks: ${HOOKS_DIR}${colors.reset}`);
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
}

// Contenu du hook pre-commit
const preCommitContent = `#!/bin/sh

# Hook pre-commit pour valider la structure du projet
# Installé automatiquement par install-git-hooks.js

echo "\\033[34mValidation de la structure du projet avant commit...\\033[0m"

# Exécuter le script de validation
node "${path.relative(HOOKS_DIR, path.join(BASE_DIR, 'validate-structure.js'))}"

# Vérifier le résultat
if [ $? -ne 0 ]; then
  echo "\\033[31m❌ La validation de la structure a échoué. Commit annulé.\\033[0m"
  echo "\\033[33mUtilisez 'node fix-package-name-collisions.js' pour résoudre les problèmes automatiquement.\\033[0m"
  exit 1
fi

echo "\\033[32m✅ Structure du projet validée avec succès.\\033[0m"
exit 0
`;

// Écrire le hook pre-commit
fs.writeFileSync(PRE_COMMIT_HOOK, preCommitContent);
fs.chmodSync(PRE_COMMIT_HOOK, '755'); // Rendre le hook exécutable

console.log(`${colors.green}✅ Hook pre-commit installé avec succès dans ${PRE_COMMIT_HOOK}${colors.reset}`);

// Créer un fichier README pour les hooks
const readmeContent = `# Hooks Git pour la prévention des collisions de noms

Des hooks Git ont été installés dans ce dépôt pour prévenir l'introduction de
problèmes structurels, en particulier les collisions de noms de packages.

## Hooks installés

- **pre-commit**: Vérifie la structure du projet avant chaque commit
  - Détecte les collisions de noms dans les package.json
  - Identifie les structures de dossiers problématiques
  - Vérifie la profondeur maximale des dossiers (recommandation: <5 niveaux)

## Outils disponibles

- \`node validate-structure.js\`: Vérifier manuellement la structure du projet
- \`node fix-package-name-collisions.js\`: Résoudre automatiquement les collisions de noms de packages
- \`bash clean-recursive-structure.sh\`: Nettoyer les structures récursives problématiques

## Comment bypasser les hooks

En cas d'urgence, vous pouvez contourner la vérification avec la commande:
\`\`\`
git commit --no-verify -m "Votre message de commit"
\`\`\`

**Note**: Cette pratique est déconseillée, car elle peut introduire des problèmes dans le projet.
`;

fs.writeFileSync(path.join(HOOKS_DIR, 'README.md'), readmeContent);

// Générer aussi un CONTRIBUTING.md à la racine du projet
const contributingContent = `# Guide de contribution

Ce projet utilise des conventions de nommage strictes pour éviter les collisions de noms
et maintenir une structure de code propre et cohérente.

## Conventions de nommage des packages

- Utilisez des noms uniques pour chaque package
- Suivez le format \`@mcp/[fonctionnalité]-[type]\` où:
  - \`fonctionnalité\` décrit le rôle principal du package
  - \`type\` indique la catégorie du package (analyzer, generator, validator, etc.)

## Structure des dossiers

- Évitez les structures récursives
- Limitez la profondeur des dossiers à 5 niveaux maximum
- Utilisez le kebab-case pour les noms de dossiers
- Évitez les dossiers avec des noms similaires à différentes casses (PascalCase vs kebab-case)

## Avant chaque commit

- Exécutez \`node validate-structure.js\` pour vérifier votre structure
- Utilisez \`node fix-package-name-collisions.js\` si des collisions sont détectées

## Liste des outils de qualité disponibles

- \`validate-structure.js\`: Vérifie la structure du projet
- \`fix-package-name-collisions.js\`: Résout automatiquement les collisions de noms
- \`clean-recursive-structure.sh\`: Nettoie les structures récursives problématiques
`;

fs.writeFileSync(path.join(BASE_DIR, 'CONTRIBUTING.md'), contributingContent);
console.log(`${colors.green}✅ Fichier CONTRIBUTING.md créé à la racine du projet${colors.reset}`);

// Vérifier si les scripts de validation et de correction existent
const requiredScripts = [
    'validate-structure.js',
    'fix-package-name-collisions.js',
    'clean-recursive-structure.sh'
];

for (const script of requiredScripts) {
    const scriptPath = path.join(BASE_DIR, script);

    if (!fs.existsSync(scriptPath)) {
        console.log(`${colors.yellow}⚠️ Le script ${script} n'existe pas dans ${BASE_DIR}${colors.reset}`);
        console.log(`  Ce script est nécessaire pour le bon fonctionnement des hooks.`);
    } else {
        // Vérifier les permissions
        fs.chmodSync(scriptPath, '755'); // Rendre le script exécutable
        console.log(`${colors.green}✓ Le script ${script} est présent et exécutable${colors.reset}`);
    }
}

console.log('\n=== Installation des hooks Git terminée ===');
console.log(`${colors.yellow}N'oubliez pas d'effectuer les actions suivantes:${colors.reset}`);
console.log(`1. Exécuter 'node validate-structure.js' pour vérifier votre structure`);
console.log(`2. Utiliser 'node fix-package-name-collisions.js' pour résoudre les collisions`);
console.log(`3. Partager le fichier CONTRIBUTING.md avec votre équipe`);