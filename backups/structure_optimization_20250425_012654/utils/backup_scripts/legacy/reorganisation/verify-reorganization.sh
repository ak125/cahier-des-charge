#!/bin/bash
# verify-reorganization.sh - Vérifie que la réorganisation n'a pas causé de problèmes
# Date: 10 avril 2025

echo "🧪 Vérification de la réorganisation du projet..."

# Variables pour le suivi des problèmes
errors=0
warnings=0

# Liste des modules npm standards (à ne pas signaler comme références cassées)
npm_modules=("fs" "fs-extra" "path" "util" "crypto" "http" "https" "events" "os" "stream")

# Fonction pour vérifier l'existence des fichiers clés
check_file_exists() {
  local file_path="$1"
  local importance="$2" # "critical" ou "warning"
  
  if [ ! -f "$file_path" ]; then
    if [ "$importance" == "critical" ]; then
      echo "❌ ERREUR: Fichier critique manquant: $file_path"
      ((errors++))
    else
      echo "⚠️ AVERTISSEMENT: Fichier non critique manquant: $file_path"
      ((warnings++))
    fi
  else
    echo "✅ Fichier présent: $file_path"
  fi
}

# Fonction pour vérifier les références cassées dans un fichier
check_broken_references() {
  local file_path="$1"
  local search_pattern="$2"
  local file_pattern="$3"
  local importance="$4" # "critical" ou "warning"
  
  if [ -f "$file_path" ]; then
    # Rechercher le motif dans le fichier
    if grep -q "$search_pattern" "$file_path"; then
      # Extraire les références importées
      grep -o "$search_pattern" "$file_path" | while read -r match; do
        # Extraire le chemin de fichier de la référence
        referenced_file=$(echo "$match" | sed -E 's/.*["\047]([^"'\'']+)["\047].*/\1/')
        
        # Vérifier si c'est un module npm standard (à ignorer)
        is_npm_module=false
        for module in "${npm_modules[@]}"; do
          if [[ "$referenced_file" == "$module" || "$referenced_file" == "$module/"* ]]; then
            is_npm_module=true
            break
          fi
        done
        
        # Si c'est un module npm, on l'ignore
        if $is_npm_module; then
          continue
        fi
        
        # Vérifier si c'est un chemin relatif ou absolu
        if [[ "$referenced_file" == /* ]] || [[ "$referenced_file" == ~/* ]]; then
          # Chemin absolu
          if [ ! -e "$referenced_file" ]; then
            if [ "$importance" == "critical" ]; then
              echo "❌ ERREUR: Référence cassée dans $file_path: $referenced_file"
              ((errors++))
            else
              echo "⚠️ AVERTISSEMENT: Référence possiblement cassée dans $file_path: $referenced_file"
              ((warnings++))
            fi
          fi
        elif [[ "$referenced_file" != .* && "$referenced_file" != /* && "$referenced_file" != ~/* ]]; then
          # C'est probablement un module npm, on l'ignore
          continue
        else
          # Chemin relatif
          dir_path=$(dirname "$file_path")
          full_path="$dir_path/$referenced_file"
          
          # Vérifier si le fichier existe directement ou avec .ts/.js
          if [ ! -e "$full_path" ] && [ ! -e "${full_path}.ts" ] && [ ! -e "${full_path}.js" ]; then
            # Vérifier des chemins courants pour les imports entre sous-dossiers agents
            alt_paths=(
              "./agents/core/$referenced_file"
              "./agents/core/${referenced_file}.ts"
              "./agents/analysis/$referenced_file"
              "./agents/analysis/${referenced_file}.ts"
              "./agents/migration/$referenced_file"
              "./agents/migration/${referenced_file}.ts"
              "./agents/quality/$referenced_file"
              "./agents/quality/${referenced_file}.ts"
            )
            
            found=false
            for alt_path in "${alt_paths[@]}"; do
              if [ -e "$alt_path" ]; then
                found=true
                break
              fi
            done
            
            if ! $found; then
              if [ "$importance" == "critical" ]; then
                echo "❌ ERREUR: Référence cassée dans $file_path: $referenced_file (chemin complet: $full_path)"
                ((errors++))
              else
                echo "⚠️ AVERTISSEMENT: Référence possiblement cassée dans $file_path: $referenced_file (chemin complet: $full_path)"
                ((warnings++))
              fi
            fi
          fi
        fi
      done
    fi
  fi
}

echo "🔍 Vérification des fichiers critiques..."
# Vérifier les fichiers de configuration principaux
check_file_exists "migration-config.json" "critical"
check_file_exists "package.json" "critical"
check_file_exists "tsconfig.json" "critical"

echo "🔍 Vérification des scripts principaux..."
# Vérifier les scripts essentiels
check_file_exists "scripts/migration/run-progressive-migration.sh" "warning"
check_file_exists "scripts/migration/migration-orchestrator.ts" "warning"

echo "🔍 Vérification des références importantes..."
# Vérifier les références dans les fichiers de configuration
check_broken_references "migration-config.json" "\"cahierDesChargesPath\": \"[^\"]*\"" "*.json" "critical"
check_broken_references "package.json" "\"main\": \"[^\"]*\"" "*.json" "warning"

echo "🔍 Vérification des agents IA..."
# Vérifier les imports dans les agents
find ./agents -name "*.ts" 2>/dev/null | while read agent_file; do
  check_broken_references "$agent_file" "from ['\"][^'\"]*['\"]" "*.ts" "warning"
  check_broken_references "$agent_file" "require\\(['\"][^'\"]*['\"]\\)" "*.ts" "warning"
done

# Résumé des résultats
echo ""
echo "=== RÉSUMÉ DE LA VÉRIFICATION ==="
echo "Vérification terminée avec $errors erreurs et $warnings avertissements."

if [ $errors -gt 0 ]; then
  echo "❌ ATTENTION: Des erreurs critiques ont été détectées. Veuillez les corriger avant de continuer."
  exit 1
elif [ $warnings -gt 0 ]; then
  echo "⚠️ Des avertissements ont été détectés. Il est recommandé de les vérifier."
  exit 0
else
  echo "✅ Aucun problème détecté. La réorganisation semble correcte."
  exit 0
fi