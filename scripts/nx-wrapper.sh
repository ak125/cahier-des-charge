#!/bin/bash

# Script permettant d'utiliser nx localement sans installation globale
# Usage: ./scripts/nx-wrapper.sh [commande nx]
# Exemple: ./scripts/nx-wrapper.sh lint

# Vérifier si des arguments sont fournis
if [ $# -eq 0 ]; then
  echo "Usage: $0 [commande nx]"
  echo "Exemple: $0 lint"
  exit 1
fi

# Chemin vers le binaire nx installé localement
NX_BIN="./node_modules/.bin/nx"

# Vérifier si le binaire nx existe
if [ ! -f "$NX_BIN" ]; then
  echo "Erreur: Binaire nx non trouvé dans $NX_BIN"
  echo "Essai d'installation de nx..."
  npm install nx --save-dev
  
  if [ ! -f "$NX_BIN" ]; then
    echo "Erreur: Impossible de trouver ou d'installer nx. Essayez d'exécuter 'npm install' ou 'pnpm install'"
    exit 1
  fi
fi

# Exécuter nx directement depuis le chemin du binaire
$NX_BIN "$@"