#!/bin/bash

# Script de surveillance des ressources système
# Utile pour diagnostiquer les problèmes de performance du Codespace

# Configuration
WORKSPACE_DIR="/workspaces/cahier-des-charge"
OBSOLETE_THRESHOLD=90 # Fichiers non modifiés depuis plus de 90 jours
MAX_FILES_TO_SHOW=10

echo "📊 Surveillance des ressources du Codespace"
echo "Appuyez sur Ctrl+C pour quitter"
echo ""

# Fonction pour afficher l'utilisation des ressources
show_resources() {
  # Afficher l'heure actuelle
  echo "⏰ $(date)"
  echo "-------------------------------------------"
  
  # Utilisation de la mémoire
  echo "🧠 MÉMOIRE:"
  free -h | grep -v + | sed 's/^/  /'
  echo ""
  
  # Utilisation CPU
  echo "💻 CPU (top 5 processus):"
  ps aux --sort=-%cpu | head -6 | awk '{print "  " $1 "\t" $2 "\t" $3 "%" "\t" $4 "%" "\t" $11}' 
  echo ""
  
  # Utilisation disque
  echo "💾 DISQUE:"
  df -h / /workspaces /tmp | sed 's/^/  /'
  echo ""
  
  # Température (si disponible)
  if [ -x "$(command -v sensors)" ]; then
    echo "🌡️ TEMPÉRATURE:"
    sensors | grep temp | sed 's/^/  /'
    echo ""
  fi
}

# Fonction pour identifier les fichiers potentiellement obsolètes
find_obsolete_files() {
  echo "🧹 FICHIERS POTENTIELLEMENT OBSOLÈTES (non modifiés depuis +${OBSOLETE_THRESHOLD} jours):"
  echo "  Recherche en cours..."
  
  find $WORKSPACE_DIR -type f -not -path "*/node_modules/*" -not -path "*/\.git/*" -mtime +$OBSOLETE_THRESHOLD -ls 2>/dev/null | 
    sort -k 7 |
    head -n $MAX_FILES_TO_SHOW |
    awk '{print "  " $11 " (Dernière modif: " $8 " " $9 " " $10 ")"}' || 
    echo "  Aucun fichier obsolète trouvé."
  
  echo ""
  
  # Identifier les dossiers volumineux
  echo "📁 DOSSIERS VOLUMINEUX:"
  du -h --max-depth=2 $WORKSPACE_DIR 2>/dev/null | 
    grep -v "node_modules\|\.git" | 
    sort -hr | 
    head -10 |
    sed 's/^/  /'
  echo ""
}

# Fonction pour suggérer des optimisations
suggest_optimizations() {
  echo "💡 SUGGESTIONS D'OPTIMISATION:"
  
  # Vérifier fichiers temporaires
  TMP_FILES_COUNT=$(find /tmp -maxdepth 1 -type f 2>/dev/null | wc -l)
  echo "  • Fichiers temporaires: $TMP_FILES_COUNT fichiers dans /tmp"
  
  # Vérifier package.json vs node_modules
  if [ -f "$WORKSPACE_DIR/package.json" ] && [ -d "$WORKSPACE_DIR/node_modules" ]; then
    DEPS_COUNT=$(grep -c "\"dependencies\"\\|\"devDependencies\"" "$WORKSPACE_DIR/package.json")
    ACTUAL_COUNT=$(find "$WORKSPACE_DIR/node_modules" -maxdepth 1 -type d | wc -l)
    echo "  • Modules npm: $DEPS_COUNT dépendances dans package.json, $ACTUAL_COUNT dans node_modules"
  fi
  
  # Vérifier les processus node
  NODE_PROCS=$(ps aux | grep node | grep -v grep | wc -l)
  echo "  • Processus Node.js actifs: $NODE_PROCS"
  
  echo ""
}

# Boucle principale
while true; do
  clear
  show_resources
  
  # Exécuter l'analyse seulement toutes les 10 itérations pour économiser des ressources
  if [ $(($RANDOM % 10)) -eq 0 ]; then
    find_obsolete_files
    suggest_optimizations
  else
    echo "🔍 Pour l'analyse des fichiers obsolètes, attendez... (1/10 chance par refresh)"
    echo ""
  fi
  
  echo "-------------------------------------------"
  echo "Rafraîchissement dans 3 secondes. Ctrl+C pour quitter."
  sleep 3
done
