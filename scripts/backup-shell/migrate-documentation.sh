#!/bin/bash

# Script pour migrer la documentation existante vers la nouvelle structure Docusaurus

echo "Migration de la documentation existante..."

# Création d'un répertoire temporaire pour la documentation existante
mkdir -p temp_docs

# Copie des fichiers markdown existants
find .. -name "*.md" -not -path "../documentation-site/*" -not -path "../node_modules/*" -exec cp --parents {} temp_docs/ \;

# Maintenant on peut trier et déplacer les fichiers vers la bonne structure
# Par exemple, déplacer les fichiers d'architecture
if [ -d "temp_docs/../docs/architecture" ]; then
  cp temp_docs/../docs/architecture/* docs/architecture/
fi

# Déplacer les conventions
if [ -d "temp_docs/../docs/conventions" ]; then
  cp temp_docs/../docs/conventions/* docs/conventions/
fi

# Déplacer les documents de planification
if [ -d "temp_docs/../docs/planning" ]; then
  cp temp_docs/../docs/planning/* docs/planning/
fi

# Déplacer la documentation des agents
if [ -d "temp_docs/../agents" ]; then
  mkdir -p docs/agents/specific-agents
  cp temp_docs/../agents/AGENTS.md docs/agents/overview.md
  # Copier les autres fichiers des agents
  find temp_docs/../agents -name "*.md" -not -name "AGENTS.md" -exec cp {} docs/agents/specific-agents/ \;
fi

# Nettoyage
rm -rf temp_docs

echo "Migration de la documentation terminée."
