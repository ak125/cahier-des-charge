#!/bin/bash
# Script de synchronisation automatique des agents MCP
# Ce script synchronise les doublons d'agents avec leurs versions principales
# Il préserve les notices de doublon et la structure des fichiers

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
MANIFEST_FILE="$WORKSPACE_ROOT/agent-manifest.json"
LOG_FILE="$WORKSPACE_ROOT/sync-agents-$(date +%Y%m%d-%H%M%S).log"

echo "🔄 Synchronisation des agents MCP..." | tee -a "$LOG_FILE"
echo "📝 Log: $LOG_FILE"

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "❌ Fichier manifeste non trouvé: $MANIFEST_FILE" | tee -a "$LOG_FILE"
  echo "Exécutez d'abord ./clean-agents-duplicates.sh pour générer le manifeste." | tee -a "$LOG_FILE"
  exit 1
fi

# Trouver tous les fichiers marqués comme doublons
echo "🔍 Recherche des fichiers dupliqués..." | tee -a "$LOG_FILE"

find "$WORKSPACE_ROOT" -type f -name "*.ts" -exec grep -l "FICHIER DUPLIQUÉ" {} \; > /tmp/duplicate-files.txt
COUNT=$(wc -l < /tmp/duplicate-files.txt)

echo "📊 $COUNT fichiers dupliqués trouvés" | tee -a "$LOG_FILE"

# Parcourir chaque fichier dupliqué
while IFS= read -r file_path; do
  echo "⚙️ Traitement de: $file_path" | tee -a "$LOG_FILE"
  
  # Extraire le chemin de la version principale
  main_file=$(grep -o "version principale qui se trouve à:.*" "$file_path" | head -1 | cut -d':' -f2- | tr -d ' ' | tr -d '\r')
  
  if [ ! -f "$main_file" ]; then
    echo "  ⚠️ Version principale introuvable: $main_file" | tee -a "$LOG_FILE"
    continue
  fi
  
  # Sauvegarder la notice actuelle
  notice=$(grep -A 10 "FICHIER DUPLIQUÉ" "$file_path" | grep -B 10 "Date de synchronisation:" | grep -v "^--$")
  
  # Remplacer le contenu par celui de la version principale
  cp "$main_file" "$file_path"
  
  # Restaurer la notice au début du fichier, en mettant à jour la date
  notice=$(echo "$notice" | sed "s/Date de synchronisation:.*/Date de synchronisation: $(date +'%Y-%m-%d %H:%M:%S')*/")
  sed -i "1s/^/$notice\n/" "$file_path"
  
  echo "  ✅ Synchronisé avec succès" | tee -a "$LOG_FILE"
done < /tmp/duplicate-files.txt

rm /tmp/duplicate-files.txt

echo "✅ Synchronisation terminée" | tee -a "$LOG_FILE"
