#!/bin/bash

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Titre du script
clear
echo -e "${BOLD}${GREEN}"
echo "╔═════════════════════════════════════════════════╗"
echo "║   Script de Résolution des Conflits MCP Agent   ║"
echo "╚═════════════════════════════════════════════════╝${NC}"

# Créer un dossier pour les sauvegardes
BACKUP_DIR="./conflict-resolution-backups"
mkdir -p "$BACKUP_DIR"

# Fonction pour les en-têtes de section
section_header() {
    local title=$1
    echo -e "\n${CYAN}${BOLD}=== $title ===${NC}"
    echo -e "${CYAN}$(printf '=%.0s' $(seq 1 $((${#title} + 8))))${NC}\n"
}

# Fonction pour les sous-sections
subsection_header() {
    local title=$1
    echo -e "\n${YELLOW}${BOLD}--- $title ---${NC}"
}

# 1. Analyser le rapport de consolidation et les fichiers de log
section_header "ANALYSE DE LA SITUATION"

# Compter les types de problèmes dans le rapport
TOTAL_FILES=$(grep -c "| \./packages" ./consolidation-report.md)
RESOLVED=$(grep -c "✅ Résolu" ./consolidation-report.md)
UNKNOWN=$(grep -c "⚠️ Inconnu" ./consolidation-report.md)
COMPLEX=$(grep -c "⚠️ Complexe" ./consolidation-report.md)

echo -e "${BLUE}Statistiques du rapport de consolidation:${NC}"
echo -e "  ${GREEN}✓${NC} Fichiers résolus: $RESOLVED / $TOTAL_FILES"
echo -e "  ${YELLOW}⚠${NC} Fichiers inconnus à vérifier: $UNKNOWN"
echo -e "  ${RED}⚠${NC} Fichiers complexes à résoudre: $COMPLEX"

# Identifier les agents affectés
echo -e "\n${BLUE}Agents principaux concernés:${NC}"
grep -o "./packages/mcp-agents/[^/]*" ./consolidation-report.md | sort | uniq -c | sort -nr | while read count agent; do
    echo -e "  - ${MAGENTA}$agent${NC}: $count fichiers"
done

# Fonction pour créer une sauvegarde avant modification
backup_file() {
    local file=$1
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local backup_file="${BACKUP_DIR}/$(basename "$file").backup-${timestamp}"
    
    if [ -f "$file" ]; then
        cp "$file" "$backup_file"
        echo -e "${GREEN}Sauvegarde créée: ${backup_file}${NC}"
        return 0
    else
        echo -e "${RED}Erreur: Le fichier $file n'existe pas${NC}"
        return 1
    fi
}

# Fonction pour restaurer une sauvegarde
restore_backup() {
    section_header "RESTAURATION DE SAUVEGARDE"
    
    local backups=$(find "$BACKUP_DIR" -type f -name "*.backup-*" | sort)
    
    if [ -z "$backups" ]; then
        echo -e "${RED}Aucune sauvegarde disponible${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Sauvegardes disponibles:${NC}"
    echo "$backups" | nl
    
    read -p "Numéro de la sauvegarde à restaurer (0 pour annuler): " backup_num
    
    if [ "$backup_num" = "0" ]; then
        echo -e "${YELLOW}Restauration annulée${NC}"
        return 0
    fi
    
    backup_file=$(echo "$backups" | sed -n "${backup_num}p")
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}Numéro de sauvegarde invalide${NC}"
        return 1
    fi
    
    # Déterminer le fichier d'origine
    original_filename=$(basename "$backup_file" | sed 's/\.backup-.*//')
    
    read -p "Chemin du fichier à restaurer: " target_file
    
    if [ -f "$target_file" ]; then
        cp "$backup_file" "$target_file"
        echo -e "${GREEN}Fichier restauré avec succès: ${target_file}${NC}"
        return 0
    else
        echo -e "${RED}Le fichier cible n'existe pas: ${target_file}${NC}"
        return 1
    fi
}

# Fonction améliorée pour résoudre les problèmes courants automatiquement
auto_fix_common_issues() {
    local file=$1
    local fixed_file="${file}.auto-fixed"
    
    echo -e "${YELLOW}Tentative de correction automatique des problèmes courants dans: ${file}${NC}"
    
    # Créer une copie du fichier
    cp "$file" "$fixed_file"
    
    # 1. Corriger les implémentations d'interfaces multiples
    sed -i -E 's/implements ([A-Za-z]+, )+([A-Za-z]+, )+([A-Za-z]+, )+/implements /g' "$fixed_file"
    
    # 2. Dédupliquer les déclarations de propriétés id, type et version
    awk '
    BEGIN {
        id_seen = 0
        type_seen = 0
        version_seen = 0
    }
    /id: string = '\''/ {
        if (id_seen) next
        id_seen = 1
    }
    /type: string = '\''/ {
        if (type_seen) next
        type_seen = 1
    }
    /version: string = '\''[0-9]+\.[0-9]+\.[0-9]+'\''/ {
        if (version_seen) next
        version_seen = 1
    }
    { print }
    ' "$fixed_file" > "${fixed_file}.tmp" && mv "${fixed_file}.tmp" "$fixed_file"
    
    # 3. Dédupliquer les imports identiques
    awk '
    BEGIN {
        imports = ""
    }
    /^import / {
        if (imports !~ $0) {
            imports = imports $0 "\n"
            print
        }
        next
    }
    { print }
    ' "$fixed_file" > "${fixed_file}.tmp" && mv "${fixed_file}.tmp" "$fixed_file"
    
    echo -e "${GREEN}Vérification automatique terminée. Fichier corrigé: ${fixed_file}${NC}"
    echo -e "${YELLOW}Veuillez vérifier les corrections avant d'appliquer le fichier.${NC}"
    
    # Afficher les différences
    echo -e "\n${BLUE}Différences entre l'original et le fichier corrigé:${NC}"
    diff -u "$file" "$fixed_file" | grep -E "^(\+|\-)" || echo "Aucune différence détectée"
    
    read -p "Voulez-vous utiliser le fichier corrigé automatiquement? (y/n): " use_fixed
    
    if [ "$use_fixed" = "y" ]; then
        mv "$fixed_file" "$file"
        echo -e "${GREEN}Fichier mis à jour avec les corrections automatiques${NC}"
    else
        rm "$fixed_file"
        echo -e "${YELLOW}Corrections automatiques ignorées${NC}"
    fi
}

# Fonction pour comparer visuellement des fichiers
compare_files() {
    local file1=$1
    local file2=$2
    
    if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
        echo -e "${RED}L'un des fichiers n'existe pas${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Comparaison de:${NC}"
    echo -e "  1: ${YELLOW}${file1}${NC}"
    echo -e "  2: ${YELLOW}${file2}${NC}"
    
    # Vérifier si meld est installé
    if command -v meld &> /dev/null; then
        meld "$file1" "$file2" &
    # Vérifier si VSCode est installé
    elif command -v code &> /dev/null; then
        code --diff "$file1" "$file2"
    else
        # Fallback à diff
        diff -u "$file1" "$file2" | less
    fi
}

# Fonction améliorée pour résoudre un fichier spécifique
resolve_file() {
    local file=$1
    section_header "RÉSOLUTION DU FICHIER"
    echo -e "${MAGENTA}Fichier:${NC} $file"
    
    # Créer une sauvegarde avant modification
    backup_file "$file"
    
    # Sous-menu pour le fichier
    echo -e "\n${BLUE}Options de résolution:${NC}"
    echo "1) Ouvrir le fichier dans VSCode"
    echo "2) Tenter une correction automatique des problèmes courants"
    echo "3) Comparer avec un autre fichier"
    echo "4) Afficher les conflits dans le fichier"
    echo "5) Retour"
    
    read -p "Choisissez une option: " file_action
    
    case $file_action in
        1)
            # Ouvrir dans VSCode
            code "$file"
            
            # Attendre que l'utilisateur confirme
            read -p "Avez-vous terminé l'édition du fichier? (y/n): " done
            if [ "$done" = "y" ]; then
                echo -e "${GREEN}Fichier édité avec succès${NC}"
            fi
            ;;
        2)
            # Correction automatique
            auto_fix_common_issues "$file"
            ;;
        3)
            # Comparer avec un autre fichier
            echo -e "${YELLOW}Entrez le chemin du fichier à comparer:${NC}"
            read -p "> " compare_target
            compare_files "$file" "$compare_target"
            ;;
        4)
            # Afficher les conflits
            echo -e "${YELLOW}Conflits dans le fichier:${NC}"
            grep -n -A 1 -B 1 "CONTENU DE" "$file" || echo "Aucun marqueur de conflit standard trouvé"
            echo ""
            grep -n -A 1 -B 1 "<<<<<<< HEAD" "$file" || echo "Aucun marqueur de conflit Git trouvé"
            ;;
        5)
            return 0
            ;;
        *)
            echo -e "${RED}Option invalide${NC}"
            ;;
    esac
    
    # Demander si l'utilisateur veut continuer à travailler sur ce fichier
    read -p "Continuer à travailler sur ce fichier? (y/n): " continue_work
    if [ "$continue_work" = "y" ]; then
        resolve_file "$file"
    fi
}

# Fonction pour lister les fichiers à problème avec pagination
list_problem_files() {
    local type=$1
    local page_size=10
    local file_list
    
    if [ "$type" = "complex" ]; then
        file_list=$(grep -n "Complexe" ./consolidation-report.md | awk -F'|' '{print $2}' | sed 's/^ *//')
        title="FICHIERS COMPLEXES"
    elif [ "$type" = "unknown" ]; then
        file_list=$(grep -n "Inconnu" ./consolidation-report.md | awk -F'|' '{print $2}' | sed 's/^ *//')
        title="FICHIERS INCONNUS"
    else
        echo -e "${RED}Type de problème non reconnu${NC}"
        return 1
    fi
    
    local total_files=$(echo "$file_list" | wc -l)
    local total_pages=$(( (total_files + page_size - 1) / page_size ))
    local current_page=1
    
    while true; do
        section_header "$title (Page $current_page/$total_pages)"
        
        # Afficher les fichiers pour la page courante
        echo "$file_list" | sed -n "$((($current_page-1)*$page_size+1)),$(($current_page*$page_size))p" | nl -v $(($current_page*$page_size-$page_size+1))
        
        echo -e "\n${BLUE}Navigation:${NC}"
        echo "n) Page suivante"
        echo "p) Page précédente"
        echo "g) Aller à une page spécifique"
        echo "s) Sélectionner un fichier à résoudre"
        echo "r) Retour au menu principal"
        
        read -p "Choisissez une option: " nav_option
        
        case $nav_option in
            n)
                if [ "$current_page" -lt "$total_pages" ]; then
                    ((current_page++))
                else
                    echo -e "${YELLOW}Vous êtes déjà à la dernière page${NC}"
                    read -p "Appuyez sur Entrée pour continuer"
                fi
                ;;
            p)
                if [ "$current_page" -gt 1 ]; then
                    ((current_page--))
                else
                    echo -e "${YELLOW}Vous êtes déjà à la première page${NC}"
                    read -p "Appuyez sur Entrée pour continuer"
                fi
                ;;
            g)
                read -p "Entrez le numéro de page: " page_num
                if [ "$page_num" -ge 1 ] && [ "$page_num" -le "$total_pages" ]; then
                    current_page=$page_num
                else
                    echo -e "${RED}Numéro de page invalide${NC}"
                    read -p "Appuyez sur Entrée pour continuer"
                fi
                ;;
            s)
                read -p "Entrez le numéro du fichier à résoudre: " file_num
                if [ "$file_num" -ge 1 ] && [ "$file_num" -le "$total_files" ]; then
                    file_to_resolve=$(echo "$file_list" | sed -n "${file_num}p")
                    resolve_file "$file_to_resolve"
                else
                    echo -e "${RED}Numéro de fichier invalide${NC}"
                    read -p "Appuyez sur Entrée pour continuer"
                fi
                ;;
            r)
                return 0
                ;;
            *)
                echo -e "${RED}Option invalide${NC}"
                read -p "Appuyez sur Entrée pour continuer"
                ;;
        esac
    done
}

# Fonction améliorée pour tester un agent
test_agent() {
    local agent_path=$1
    section_header "TEST DE L'AGENT: $agent_path"
    
    # Se déplacer dans le répertoire des agents MCP
    cd packages/mcp-agents/ || { 
        echo -e "${RED}Erreur: Impossible d'accéder au répertoire packages/mcp-agents/${NC}";
        read -p "Appuyez sur Entrée pour continuer"
        return 1;
    }
    
    echo -e "${BLUE}Commande exécutée:${NC} pnpm test $agent_path"
    echo -e "${YELLOW}Les logs des tests seront enregistrés dans ${BACKUP_DIR}/test-logs-$(basename $agent_path).log${NC}"
    
    # Exécuter les tests et sauvegarder les logs
    pnpm test "$agent_path" 2>&1 | tee "${BACKUP_DIR}/test-logs-$(basename $agent_path).log"
    
    # Vérifier si les tests ont réussi
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "\n${GREEN}✓ Tests réussis pour $agent_path${NC}"
    else
        echo -e "\n${RED}✗ Échec des tests pour $agent_path${NC}"
    fi
    
    cd - > /dev/null
    read -p "Appuyez sur Entrée pour continuer"
}

# Fonction pour appliquer un fichier résolu à sa destination
apply_resolved_file() {
    section_header "APPLICATION D'UN FICHIER RÉSOLU"
    
    echo -e "${YELLOW}Fichiers résolus disponibles dans consolidation-logs:${NC}"
    find ./consolidation-logs -type f -name "*.merged*" | sort | nl
    
    read -p "Entrez le numéro du fichier résolu à appliquer (0 pour annuler): " resolved_num
    
    if [ "$resolved_num" = "0" ]; then
        return 0
    fi
    
    resolved_file=$(find ./consolidation-logs -type f -name "*.merged*" | sort | sed -n "${resolved_num}p")
    
    if [ -z "$resolved_file" ]; then
        echo -e "${RED}Numéro de fichier invalide${NC}"
        read -p "Appuyez sur Entrée pour continuer"
        return 1
    fi
    
    echo -e "${GREEN}Fichier sélectionné:${NC} $resolved_file"
    
    # Déterminer le fichier cible probable
    base_filename=$(basename "$resolved_file" | sed -E 's/\.merged.*$//')
    possible_targets=$(find ./packages -name "$base_filename" | sort)
    
    if [ -n "$possible_targets" ]; then
        echo -e "${YELLOW}Destinations potentielles:${NC}"
        echo "$possible_targets" | nl
        read -p "Entrez le numéro de la destination (ou 0 pour spécifier manuellement): " target_num
        
        if [ "$target_num" = "0" ]; then
            read -p "Entrez le chemin complet du fichier de destination: " target_file
        else
            target_file=$(echo "$possible_targets" | sed -n "${target_num}p")
        fi
    else
        read -p "Entrez le chemin complet du fichier de destination: " target_file
    fi
    
    if [ -z "$target_file" ]; then
        echo -e "${RED}Aucun fichier de destination spécifié${NC}"
        read -p "Appuyez sur Entrée pour continuer"
        return 1
    fi
    
    # Créer une sauvegarde de la destination
    if [ -f "$target_file" ]; then
        backup_file "$target_file"
    fi
    
    # Copier le fichier résolu vers la destination
    mkdir -p "$(dirname "$target_file")"
    cp "$resolved_file" "$target_file"
    
    echo -e "${GREEN}✓ Fichier appliqué avec succès:${NC} $target_file"
    read -p "Appuyez sur Entrée pour continuer"
}

# Fonction pour nettoyer les dossiers de backup
cleanup_backups() {
    section_header "NETTOYAGE DES DOSSIERS DE BACKUP"
    
    echo -e "${RED}ATTENTION: Cette action va supprimer tous les dossiers de backup dans packages/mcp-agents${NC}"
    echo -e "${YELLOW}Il est recommandé d'exécuter cette opération uniquement après avoir résolu tous les conflits et vérifié que les tests passent.${NC}"
    
    read -p "Êtes-vous sûr de vouloir continuer? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Nettoyage annulé${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Dossiers de backup qui seront supprimés:${NC}"
    find "./packages/mcp-agents" -type d -name "*_backup_*" | sort | nl
    
    read -p "Confirmez la suppression de ces dossiers (yes/no): " final_confirm
    
    if [ "$final_confirm" = "yes" ]; then
        find "./packages/mcp-agents" -type d -name "*_backup_*" | xargs rm -rf
        echo -e "${GREEN}✓ Dossiers de backup supprimés avec succès${NC}"
    else
        echo -e "${YELLOW}Nettoyage annulé${NC}"
    fi
    
    read -p "Appuyez sur Entrée pour continuer"
}

# Fonction pour afficher un guide d'aide
show_help() {
    section_header "GUIDE DE RÉSOLUTION DES CONFLITS"
    
    echo -e "${BOLD}${BLUE}Méthodes de résolution pour différents types de problèmes:${NC}\n"
    
    subsection_header "Pour les conflits de type 'Complexe'"
    echo -e "1. ${GREEN}Identifier les sections conflictuelles${NC} marquées par des commentaires:"
    echo -e "   ${YELLOW}// CONTENU DE ./packages/mcp-agents/...${NC}"
    echo -e "   ${YELLOW}// ----------------------${NC}"
    echo -e "2. ${GREEN}Pour les interfaces dupliquées${NC}:"
    echo -e "   - Garder une seule définition d'interface"
    echo -e "   - Supprimer les duplications"
    echo -e "3. ${GREEN}Pour les implémentations d'interfaces multiples${NC}:"
    echo -e "   - Conserver une seule implémentation complète, par exemple:"
    echo -e "     ${RED}- export class MaClasse implements InterfaceA, InterfaceA, InterfaceB, InterfaceB${NC}"
    echo -e "     ${GREEN}+ export class MaClasse implements InterfaceA, InterfaceB${NC}"
    echo -e "4. ${GREEN}Pour les propriétés id/type/version dupliquées${NC}:"
    echo -e "   - Supprimer les déclarations redondantes"
    echo -e "   - Conserver une seule déclaration par propriété"
    
    subsection_header "Pour les conflits de type 'Inconnu'"
    echo -e "1. ${GREEN}Comparer attentivement${NC} avec la version d'origine"
    echo -e "2. ${GREEN}Vérifier que toutes les fonctionnalités${NC} sont préservées"
    echo -e "3. ${GREEN}S'assurer que les imports sont corrects${NC} et non dupliqués"
    
    subsection_header "Workflow recommandé"
    echo -e "1. Commencer par résoudre les fichiers marqués ${RED}'Complexe'${NC}"
    echo -e "2. Ensuite, vérifier les fichiers marqués ${YELLOW}'Inconnu'${NC}"
    echo -e "3. Après chaque résolution, tester l'agent concerné"
    echo -e "4. Appliquer les fichiers résolus à leur destination"
    echo -e "5. Après avoir résolu tous les conflits et vérifié que les tests passent,"
    echo -e "   procéder au nettoyage des dossiers de backup"
    
    read -p "Appuyez sur Entrée pour continuer"
}

# Menu principal amélioré
show_menu() {
    clear
    echo -e "${BOLD}${GREEN}"
    echo "╔═════════════════════════════════════════════════╗"
    echo "║   Script de Résolution des Conflits MCP Agent   ║"
    echo "╚═════════════════════════════════════════════════╝${NC}"
    
    # Afficher une barre de progression
    progress=$((100 * ($RESOLVED) / $TOTAL_FILES))
    progress_bar=""
    for ((i=0; i<$progress/5; i++)); do
        progress_bar="${progress_bar}█"
    done
    for ((i=$progress/5; i<20; i++)); do
        progress_bar="${progress_bar}░"
    done
    
    echo -e "\n${BLUE}Progression:${NC} ${progress_bar} ${progress}% (${RESOLVED}/${TOTAL_FILES})"
    echo -e "  ${GREEN}✓${NC} Résolus: ${RESOLVED}, ${YELLOW}⚠${NC} Inconnus: ${UNKNOWN}, ${RED}⚠${NC} Complexes: ${COMPLEX}\n"
    
    echo -e "${CYAN}${BOLD}MENU PRINCIPAL${NC}"
    echo -e "1) ${RED}Résoudre les fichiers complexes${NC}"
    echo -e "2) ${YELLOW}Vérifier les fichiers inconnus${NC}"
    echo -e "3) ${GREEN}Tester un agent${NC}"
    echo -e "4) ${BLUE}Appliquer un fichier résolu${NC}"
    echo -e "5) ${MAGENTA}Nettoyer les dossiers de backup${NC}"
    echo -e "6) ${CYAN}Comparer deux fichiers${NC}"
    echo -e "7) ${CYAN}Gérer les sauvegardes${NC}"
    echo -e "8) ${CYAN}Afficher le guide d'aide${NC}"
    echo -e "9) ${RED}Quitter${NC}"
    
    read -p "Choisissez une option: " choice
    
    case $choice in
        1) list_problem_files "complex" ;;
        2) list_problem_files "unknown" ;;
        3)
            section_header "TEST D'UN AGENT"
            echo -e "${BLUE}Agents à tester:${NC}"
            echo "1) generators/CaddyfileGenerator"
            echo "2) analyzers/QaAnalyzer"
            echo "3) business/validators/canonical-validator"
            echo "4) business/validators/seo-checker-agent"
            echo "5) Spécifier un autre agent"
            
            read -p "Entrez le numéro de l'agent à tester: " agent_num
            
            case $agent_num in
                1) test_agent "generators/CaddyfileGenerator" ;;
                2) test_agent "analyzers/QaAnalyzer" ;;
                3) test_agent "business/validators/canonical-validator" ;;
                4) test_agent "business/validators/seo-checker-agent" ;;
                5) 
                    read -p "Entrez le chemin de l'agent à tester: " custom_agent
                    test_agent "$custom_agent"
                    ;;
                *) echo -e "${RED}Option invalide${NC}" ;;
            esac
            ;;
        4) apply_resolved_file ;;
        5) cleanup_backups ;;
        6)
            section_header "COMPARAISON DE FICHIERS"
            read -p "Entrez le chemin du premier fichier: " file1
            read -p "Entrez le chemin du deuxième fichier: " file2
            compare_files "$file1" "$file2"
            read -p "Appuyez sur Entrée pour continuer"
            ;;
        7) restore_backup ;;
        8) show_help ;;
        9)
            echo -e "${GREEN}Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Option invalide${NC}"
            read -p "Appuyez sur Entrée pour continuer"
            ;;
    esac
    
    # Retourner au menu
    show_menu
}

# Démarrer le script
show_menu
