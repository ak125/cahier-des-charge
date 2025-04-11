#!/bin/bash

# Script d'installation du nœud personnalisé Audit Validator pour n8n
# 
# Ce script compile et installe le nœud personnalisé pour qu'il soit 
# directement utilisable dans l'interface n8n
#
# Usage: ./install-audit-validator-node.sh

set -e

echo "📦 Installation du nœud Audit Validator pour n8n..."

# Répertoire de base
BASE_DIR="/workspaces/cahier-des-charge"
NODE_DIR="$BASE_DIR/custom-nodes/audit-validator"
N8N_CONFIG_DIR="$HOME/.n8n"
COMMUNITY_NODES_DIR="$N8N_CONFIG_DIR/custom"

# Créer le répertoire des nœuds communautaires si nécessaire
mkdir -p "$COMMUNITY_NODES_DIR"

# Aller dans le répertoire du nœud
cd "$NODE_DIR"

# Installer les dépendances
echo "⚙️ Installation des dépendances..."
npm install

# Compiler le nœud TypeScript
echo "🔨 Compilation du nœud..."
npm run build

# Créer un lien symbolique vers le répertoire des nœuds communautaires
if [ ! -L "$COMMUNITY_NODES_DIR/n8n-nodes-audit-validator" ]; then
  echo "🔗 Création du lien symbolique..."
  ln -sf "$NODE_DIR" "$COMMUNITY_NODES_DIR/n8n-nodes-audit-validator"
else
  echo "🔄 Mise à jour du lien symbolique..."
  rm "$COMMUNITY_NODES_DIR/n8n-nodes-audit-validator"
  ln -sf "$NODE_DIR" "$COMMUNITY_NODES_DIR/n8n-nodes-audit-validator"
fi

# Vérifier si n8n est en cours d'exécution
if pgrep -x "n8n" > /dev/null; then
  echo "🔄 Redémarrage de n8n nécessaire pour charger le nouveau nœud."
  echo "⚠️ Veuillez redémarrer n8n manuellement pour que les changements prennent effet."
else
  echo "ℹ️ n8n n'est pas en cours d'exécution. Le nœud sera disponible au prochain démarrage."
fi

echo "✅ Installation terminée avec succès!"
echo "🚀 Le nœud 'Audit Validator' est maintenant disponible dans n8n."
echo "📚 Documentation: Utilisez ce nœud pour valider et corriger automatiquement vos fichiers d'audit."