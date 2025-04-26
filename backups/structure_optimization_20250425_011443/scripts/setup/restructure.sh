#!/bin/bash
# filepath: /workspaces/cahier-des-charge/restructure.sh

echo "Début de la restructuration du projet..."

# Créer la structure de dossiers
mkdir -p docs/{architecture,planning,technical,agents}
echo "Structure de dossiers créée"

# Déplacer les fichiers de cahier des charges vers docs/planning
find . -maxdepth 1 -name "cahier-des-charge*.md" -exec mv {} docs/planning/ \;
echo "Cahiers des charges déplacés"

# Déplacer la documentation technique
find . -name "*-technique.md" -exec mv {} docs/technical/ \;
echo "Documentation technique déplacée"

# Déplacer les fichiers agents
find ./agents -name "*.ts" -exec cp {} docs/agents/ \;
echo "Fichiers agents copiés (conservés aussi à l'original pour éviter les erreurs)"

# Créer les fichiers principaux
touch docs/planning/migration-strategy.md
touch backlog.json

echo "Restructuration terminée"