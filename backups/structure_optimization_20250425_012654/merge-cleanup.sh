#!/bin/bash

# Script pour traiter les fichiers .merged et nettoyer les dossiers de backup
# après consolidation des agents

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dossier racine des agents
ROOT_DIR="./packages/mcp-agents"
LOG_DIR="./consolidation-logs"
REPORT_FILE="./consolidation-report.md"

# Créer le dossier de logs s'il n'existe pas
mkdir -p "$LOG_DIR"

echo -e "${BLUE}=== Traitement des fichiers .merged ===${NC}"
echo "# Rapport de consolidation des agents" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Fichiers fusionnés traités" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Traitement des fichiers .merged
merged_files=$(find "$ROOT_DIR" -type f -name "*.merged")
merged_count=$(echo "$merged_files" | wc -l)

echo -e "${BLUE}Nombre de fichiers .merged trouvés: ${GREEN}$merged_count${NC}"
echo "" >> "$REPORT_FILE"
echo "Nombre total de fichiers fusionnés: $merged_count" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Fichier | Status | Action |" >> "$REPORT_FILE"
echo "|---------|--------|--------|" >> "$REPORT_FILE"

# Pour chaque fichier .merged
for merged_file in $merged_files; do
    echo -e "${YELLOW}Traitement de $merged_file${NC}"
    
    # Extraire le nom du fichier sans l'extension .merged
    original_file="${merged_file%.merged}"
    
    # Créer une copie de sauvegarde du fichier original
    if [ -f "$original_file" ]; then
        cp "$original_file" "${original_file}.backup"
        echo -e "${GREEN}Sauvegarde créée: ${original_file}.backup${NC}"
    fi
    
    # Déterminer si c'est un fichier à vérifier manuellement ou automatiquement
    file_size=$(wc -l < "$merged_file")
    
    if [ "$file_size" -lt 200 ]; then
        # Fichiers courts peuvent être traités automatiquement
        echo -e "${GREEN}Fichier court, traitement automatique${NC}"
        
        # Vérifier s'il contient des conflits évidents (<<<< HEAD, etc.)
        if grep -q "<<<<<<< HEAD\|=======\|>>>>>>> " "$merged_file"; then
            echo -e "${YELLOW}Conflit Git détecté, marquage pour révision manuelle${NC}"
            echo "| $merged_file | ⚠️ Conflit | À résoudre manuellement |" >> "$REPORT_FILE"
            
            # Copier le fichier dans le dossier des logs pour référence
            cp "$merged_file" "$LOG_DIR/$(basename "$merged_file")"
        else
            # Si pas de conflit évident, prendre la version la plus récente
            # (la deuxième partie du fichier .merged contient généralement la version plus récente)
            echo -e "${GREEN}Pas de conflit détecté, extraction de la dernière version${NC}"
            
            # Extraire la dernière partie (après CONTENU DE)
            second_part_line=$(grep -n "// CONTENU DE " "$merged_file" | tail -1 | cut -d':' -f1)
            
            if [ -n "$second_part_line" ]; then
                # Extraire les lignes après la deuxième partie
                tail -n +$((second_part_line + 2)) "$merged_file" > "$original_file"
                echo -e "${GREEN}Version récente extraite vers $original_file${NC}"
                echo "| $merged_file | ✅ Résolu | Version récente utilisée |" >> "$REPORT_FILE"
            else
                echo -e "${RED}Impossible de déterminer la structure du fichier${NC}"
                echo "| $merged_file | ⚠️ Inconnu | À vérifier manuellement |" >> "$REPORT_FILE"
            fi
        fi
    else
        # Fichiers longs nécessitent une révision manuelle
        echo -e "${YELLOW}Fichier complexe, révision manuelle nécessaire${NC}"
        echo "| $merged_file | ⚠️ Complexe | À résoudre manuellement |" >> "$REPORT_FILE"
        
        # Copier le fichier dans le dossier des logs pour référence
        cp "$merged_file" "$LOG_DIR/$(basename "$merged_file")"
    fi
done

echo "" >> "$REPORT_FILE"
echo "## Tests des agents consolidés" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2. Nettoyage des dossiers de backup (désactivé par défaut pour sécurité)
echo -e "${BLUE}=== Dossiers de backup ===${NC}"
backup_dirs=$(find "$ROOT_DIR" -type d -name "*_backup_*" | sort)
backup_count=$(echo "$backup_dirs" | wc -l)

echo -e "${BLUE}Nombre de dossiers backup trouvés: ${GREEN}$backup_count${NC}"
echo "" >> "$REPORT_FILE" 
echo "Nombre de dossiers backup: $backup_count" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Pour nettoyer les dossiers de backup après validation:" >> "$REPORT_FILE"
echo "\`\`\`bash" >> "$REPORT_FILE"
echo "find \"$ROOT_DIR\" -type d -name \"*_backup_*\" | xargs rm -rf" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"

# Lister les dossiers à nettoyer mais ne pas les supprimer
echo -e "${YELLOW}Liste des dossiers de backup (ne seront PAS supprimés automatiquement):${NC}"
echo "$backup_dirs"

# 3. Exécuter des tests pour vérifier les agents consolidés
echo -e "${BLUE}=== Tests des agents consolidés ===${NC}"

# Lister les agents principaux consolidés
echo -e "${YELLOW}Liste des agents principaux à tester:${NC}"
consolidated_agents=$(find "$ROOT_DIR" -maxdepth 3 -type d -not -name "*_backup_*" | grep -v "node_modules")

echo "Les agents suivants ont été consolidés et doivent être testés:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for agent_dir in $consolidated_agents; do
    if [ -f "$agent_dir/package.json" ] || [ -f "$agent_dir/index.ts" ] || [ -f "$agent_dir/index.js" ]; then
        agent_name=$(basename "$agent_dir")
        echo -e "${GREEN}- $agent_name${NC}"
        echo "- [ ] $agent_name" >> "$REPORT_FILE"
        
        # Préparer une commande de test pour cet agent (à adapter à votre système de test)
        if [ -f "$agent_dir/package.json" ]; then
            echo "  Pour tester: cd $agent_dir && npm test"
        fi
    fi
done

echo "" >> "$REPORT_FILE"
echo "## Documentation mise à jour" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "La nouvelle structure du projet suite à la consolidation:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "packages/" >> "$REPORT_FILE"
echo "  mcp-agents/" >> "$REPORT_FILE"
echo "    analyzers/" >> "$REPORT_FILE"
echo "      php-analyzer/         # Agent consolidé" >> "$REPORT_FILE"
echo "    generators/" >> "$REPORT_FILE"
echo "      caddyfile-generator/  # Agent consolidé" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"

echo -e "${BLUE}=== Rapport de consolidation ===${NC}"
echo -e "${GREEN}Un rapport de consolidation a été généré: $REPORT_FILE${NC}"
echo -e "${YELLOW}Veuillez vérifier ce rapport et les fichiers dans $LOG_DIR pour résoudre manuellement les conflits restants.${NC}"

echo ""
echo -e "${BLUE}=== Actions recommandées ===${NC}"
echo -e "${YELLOW}1. Vérifier et résoudre manuellement les fichiers fusionnés complexes dans $LOG_DIR${NC}"
echo -e "${YELLOW}2. Exécuter les tests pour chaque agent consolidé${NC}"
echo -e "${YELLOW}3. Une fois validé, supprimer les dossiers de backup avec:${NC}"
echo -e "${GREEN}   find \"$ROOT_DIR\" -type d -name \"*_backup_*\" | xargs rm -rf${NC}"

