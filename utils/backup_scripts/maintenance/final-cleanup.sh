#!/bin/bash
# final-cleanup.sh - Finalise le nettoyage et supprime les dossiers d'origine
# Date: 10 avril 2025

echo "🧹 Finalisation du nettoyage et suppression des dossiers d'origine..."

# Vérifier si les dossiers de destination existent
if [ ! -d "docs/cahier-des-charges" ] || [ ! -d "docs/specifications" ]; then
  echo "❌ ERREUR: Les dossiers de destination ne semblent pas exister."
  echo "Exécutez d'abord ./complete-reorganization.sh avant ce script."
  exit 1
fi

# 1. Vérifier que les fichiers ont bien été copiés
echo "🔍 Vérification que les fichiers ont bien été copiés..."

# Fonction pour vérifier si un fichier a bien été copié
check_copied_file() {
  local src="$1"
  local dest="$2"
  
  if [ -f "$src" ] && [ -f "$dest" ]; then
    local src_size=$(stat -c%s "$src")
    local dest_size=$(stat -c%s "$dest")
    
    if [ "$src_size" -eq "$dest_size" ]; then
      return 0 # Fichier correctement copié
    fi
  fi
  
  return 1 # Fichier non copié ou de taille différente
}

# Vérifier les fichiers du cahier
cahier_ok=true
if [ -d "cahier" ]; then
  find cahier -type f -not -path "*/\.*" | while read src_file; do
    filename=$(basename "$src_file")
    dest_file="docs/specifications/$filename"
    
    if ! check_copied_file "$src_file" "$dest_file"; then
      echo "⚠️ Fichier non copié correctement: $src_file → $dest_file"
      cahier_ok=false
      # Copier le fichier manquant
      cp "$src_file" "$dest_file"
      echo "  ✅ Fichier recopié: $src_file → $dest_file"
    fi
  done
fi

# Vérifier les fichiers du cahier des charges
cdc_ok=true
if [ -d "cahier-des-charges" ]; then
  find cahier-des-charges -type f -not -path "*/\.*" | while read src_file; do
    rel_path=${src_file#cahier-des-charges/}
    dest_file="docs/cahier-des-charges/$rel_path"
    
    # Créer le répertoire de destination si nécessaire
    dest_dir=$(dirname "$dest_file")
    mkdir -p "$dest_dir"
    
    if [ ! -f "$dest_file" ]; then
      echo "⚠️ Fichier non copié: $src_file → $dest_file"
      cdc_ok=false
      # Copier le fichier manquant
      cp "$src_file" "$dest_file"
      echo "  ✅ Fichier recopié: $src_file → $dest_file"
    fi
  done
fi

# Vérifier les fichiers du backup
backup_ok=true
if [ -d "cahier-des-charges-backup-20250410-113108" ]; then
  find cahier-des-charges-backup-20250410-113108 -type f -not -path "*/\.*" | while read src_file; do
    filename=$(basename "$src_file")
    dest_file="docs/cahier-des-charges/$filename"
    
    if ! check_copied_file "$src_file" "$dest_file"; then
      echo "⚠️ Fichier non copié correctement: $src_file → $dest_file"
      backup_ok=false
      # Copier le fichier manquant
      cp "$src_file" "$dest_file"
      echo "  ✅ Fichier recopié: $src_file → $dest_file"
    fi
  done
fi

# 2. Suppression des dossiers et fichiers d'origine
echo "🗑️ Suppression des dossiers et fichiers d'origine..."

# Fonction pour demander confirmation
confirm_deletion() {
  local path="$1"
  
  if [ -e "$path" ]; then
    echo -n "❓ Voulez-vous supprimer $path ? (o/n): "
    read -r answer
    
    if [[ "$answer" =~ ^[oO]$ ]]; then
      if [ -d "$path" ]; then
        rm -rf "$path" && echo "  ✅ Dossier supprimé: $path"
      else
        rm "$path" && echo "  ✅ Fichier supprimé: $path"
      fi
    else
      echo "  ❌ Suppression annulée pour: $path"
    fi
  fi
}

# Demander la confirmation pour chaque dossier/fichier
echo "⚠️ ATTENTION: Vous allez supprimer des dossiers et fichiers d'origine."
echo "              Assurez-vous d'avoir vérifié que tout fonctionne correctement avant de continuer."
echo ""

# Demander confirmation pour supprimer les dossiers principaux
confirm_deletion "cahier"
confirm_deletion "cahier-des-charges"
confirm_deletion "cahier-des-charges-backup-20250410-113108"

# Demander confirmation pour les fichiers déplacés à la racine
root_files=(
  "48-plan-migration-detaille.md"
  "50-revision-controle-qualite.md"
  "checklist-migration-ia.md"
  "exemple-utilisation.md"
  "cahier_check.config.json"
  "cahier-des-charges-lecture-optimisee.html"
  "vue-complete-auto.html"
  "vue-complete.html"
  "health-report.txt"
  "structure_graph.json"
)

for file in "${root_files[@]}"; do
  confirm_deletion "$file"
done

echo ""
echo "✅ Nettoyage finalisé !"
echo ""
echo "📂 Votre projet est maintenant complètement réorganisé et unifié."
echo "   Pour vérifier la nouvelle structure, utilisez: find . -type d -maxdepth 2 | sort"
echo ""
echo "📝 N'oubliez pas de consulter le fichier STRUCTURE.md pour comprendre la nouvelle organisation."