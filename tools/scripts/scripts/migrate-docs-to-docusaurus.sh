#!/bin/bash

# Script pour migrer la documentation existante vers la structure Docusaurus

echo "Migration de la documentation existante vers Docusaurus..."

# Création de la structure de base si elle n'existe pas déjà
mkdir -p /workspaces/cahier-des-charge/documentation-site/docs/{getting-started,architecture,agents,workflows,api,guides,conventions,planning}

# Création d'un répertoire temporaire pour la documentation existante
mkdir -p /tmp/temp_docs

# Copie des fichiers markdown existants
echo "Collecte des fichiers de documentation existants..."
find /workspaces/cahier-des-charge -name "*.md" -not -path "*/documentation-site/*" -not -path "*/node_modules/*" -exec cp --parents {} /tmp/temp_docs/ \;

# Déplacer la documentation d'architecture
echo "Migration des documents d'architecture..."
if [ -d "/tmp/temp_docs/workspaces/cahier-des-charge/docs/architecture" ]; then
  cp /tmp/temp_docs/workspaces/cahier-des-charge/docs/architecture/* /workspaces/cahier-des-charge/documentation-site/docs/architecture/ 2>/dev/null || :
fi

# Déplacer les conventions
echo "Migration des conventions de développement..."
if [ -d "/tmp/temp_docs/workspaces/cahier-des-charge/docs/conventions" ]; then
  cp /tmp/temp_docs/workspaces/cahier-des-charge/docs/conventions/* /workspaces/cahier-des-charge/documentation-site/docs/conventions/ 2>/dev/null || :
fi

# Déplacer les documents de planification
echo "Migration des documents de planification..."
if [ -d "/tmp/temp_docs/workspaces/cahier-des-charge/docs/planning" ]; then
  cp /tmp/temp_docs/workspaces/cahier-des-charge/docs/planning/* /workspaces/cahier-des-charge/documentation-site/docs/planning/ 2>/dev/null || :
fi

# Déplacer la documentation des agents
echo "Migration de la documentation des agents..."
mkdir -p /workspaces/cahier-des-charge/documentation-site/docs/agents/specific-agents
if [ -f "/tmp/temp_docs/workspaces/cahier-des-charge/agents/AGENTS.md" ]; then
  cp /tmp/temp_docs/workspaces/cahier-des-charge/agents/AGENTS.md /workspaces/cahier-des-charge/documentation-site/docs/agents/overview.md 2>/dev/null || :
fi

# Copier les autres fichiers des agents
find /tmp/temp_docs/workspaces/cahier-des-charge/agents -name "*.md" -not -name "AGENTS.md" -exec cp {} /workspaces/cahier-des-charge/documentation-site/docs/agents/specific-agents/ 2>/dev/null \; || :

# Copier les fichiers markdown à la racine vers le getting-started
echo "Migration des documents généraux..."
find /tmp/temp_docs/workspaces/cahier-des-charge -maxdepth 1 -name "*.md" -not -name "README.md" -exec cp {} /workspaces/cahier-des-charge/documentation-site/docs/getting-started/ 2>/dev/null \; || :

# Si un README.md existe à la racine, le copier comme introduction
if [ -f "/tmp/temp_docs/workspaces/cahier-des-charge/README.md" ]; then
  cp /tmp/temp_docs/workspaces/cahier-des-charge/README.md /workspaces/cahier-des-charge/documentation-site/docs/intro.md 2>/dev/null || :
fi

# Copier la documentation technique
echo "Migration de la documentation technique..."
if [ -d "/tmp/temp_docs/workspaces/cahier-des-charge/docs/technical" ]; then
  mkdir -p /workspaces/cahier-des-charge/documentation-site/docs/guides/technical
  cp /tmp/temp_docs/workspaces/cahier-des-charge/docs/technical/* /workspaces/cahier-des-charge/documentation-site/docs/guides/technical/ 2>/dev/null || :
fi

# Création d'un index.md pour chaque section si elle n'existe pas
for dir in /workspaces/cahier-des-charge/documentation-site/docs/*/; do
  dirname=$(basename "$dir")
  if [ ! -f "$dir/index.md" ] && [ "$dirname" != "agents" ] && [ "$dirname" != "getting-started" ]; then
    echo "---
sidebar_position: 1
---

# $dirname

Documentation concernant $dirname du projet.

Cette section contient les documents relatifs à $dirname.
" > "$dir/index.md"
  fi
done

# Ajouter une introduction à la documentation
if [ ! -f "/workspaces/cahier-des-charge/documentation-site/docs/intro.md" ]; then
  echo "---
sidebar_position: 1
---

# Introduction

Bienvenue dans la documentation centralisée du projet de migration.

Cette documentation regroupe toutes les informations techniques nécessaires pour comprendre, configurer et contribuer au projet de migration.

## Vue d'ensemble

Cette documentation est conçue pour être un point d'entrée unique pour toutes les informations techniques relatives au projet. Que vous soyez un développeur, un chef de projet ou un autre membre de l'équipe, vous trouverez ici les ressources dont vous avez besoin.

## Structure de la documentation

Notre documentation est organisée selon les sections suivantes :

- **Démarrage Rapide** : Instructions pour commencer à utiliser le projet
- **Architecture** : Documentation sur l'architecture du système
- **Agents** : Informations sur les agents et leur développement
- **Workflows** : Description des workflows de migration et de test
- **API** : Documentation des APIs REST et internes
- **Guides** : Guides pratiques et résolution de problèmes
- **Conventions** : Conventions de développement
- **Planning** : Documents relatifs à la planification de la migration
" > "/workspaces/cahier-des-charge/documentation-site/docs/intro.md"
fi

# Nettoyage
echo "Nettoyage des fichiers temporaires..."
rm -rf /tmp/temp_docs

echo "Migration de la documentation terminée."
echo "Pour démarrer le serveur Docusaurus et visualiser la documentation, exécutez :"
echo "cd /workspaces/cahier-des-charge/documentation-site && npm start"