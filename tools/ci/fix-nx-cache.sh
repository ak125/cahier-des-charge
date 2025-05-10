#!/bin/bash

# Script pour nettoyer complètement la configuration NX et la reconstruire
# Ce script est utilisé en dernier recours quand les projets NX sont corrompus
# Date: 9 mai 2025

set -e

echo "🧹 Nettoyage complet de la configuration NX..."

# Nettoyer le cache NX
echo "Réinitialisation du cache NX..."
npx nx reset

# Supprimer les fichiers de cache NX
echo "Suppression des fichiers de cache NX..."
find . -name ".nx" -type d -exec rm -rf {} \; 2>/dev/null || true
rm -rf .nx || true
rm -rf node_modules/.cache/nx || true

# Nettoyer tous les dossiers de sauvegarde
echo "Exclusion des dossiers de sauvegarde..."
find . -type d -name "backup*" -o -name "archive*" -o -name "*-backup" | tee /tmp/backup-dirs.txt

# Afficher les doublons de projet.json
echo "Recherche des fichiers project.json dupliqués..."
find . -name "project.json" -not -path "./node_modules/*" -not -path "./.nx/*" | sort > /tmp/project-files.txt
cat /tmp/project-files.txt | xargs dirname | sort | uniq -c | sort -nr | grep -v "^ *1 " || echo "Aucun dossier contenant plusieurs project.json"

# Créer ou mettre à jour .nxignore
echo "Mise à jour du fichier .nxignore..."
cat > .nxignore <<EOF
# Ignorer les dossiers de sauvegarde et d'archive
**/backup/**
**/backup-*/**
**/archive*/**
**/*.backup/**
**/*.backup.*
**/*.bak
**/dist/**
**/.nx/**
EOF

# Mise à jour du cache npm
echo "Mise à jour du cache npm..."
npm cache clean --force

# Réinstaller les dépendances
echo "Réinstallation des dépendances..."
rm -rf node_modules
npm ci --legacy-peer-deps

# Reconstruire la base de données des projets NX
echo "Reconstruction de la base de données des projets NX..."
npx nx graph --file=nx-graph.json

echo "✅ Nettoyage terminé! Essayez maintenant 'npx nx show projects'"
