module.exports = {
    // Appliquer la validation des standards pour les fichiers de workflow Temporal
    '**/*.workflow.ts': [
        'node tools/lint/validate-workflow-standards.js',
        // Ajouter d'autres linters si nécessaire (prettier, eslint, etc.)
        'prettier --write'
    ],
    // Configuration standard pour les autres fichiers
    '**/*.{js,jsx,ts,tsx}': [
        'eslint --fix',
        'prettier --write'
    ],
    '**/*.{json,md}': [
        'prettier --write'
    ]
};