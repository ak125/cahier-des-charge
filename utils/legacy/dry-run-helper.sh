#!/bin/bash

# Fichier d'aide pour la gestion du mode "dry run"
# À sourcer dans les autres scripts avec: source "$(dirname "$0")/dry-run-helper.sh"

# Vérifier le mode dry run
DRY_RUN=false
if [ "$1" = "--dry-run" ] || [ "$DRY_RUN" = "true" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}[Mode simulation] Aucune modification ne sera effectuée${NC}"
fi

# Fonction pour vérifier si on est en mode dry run
is_dry_run() {
    if [ "$DRY_RUN" = "true" ]; then
        return 0  # Vrai
    else
        return 1  # Faux
    fi
}

# Fonction pour exécuter une commande en fonction du mode
run_command() {
    local cmd="$1"
    
    if is_dry_run; then
        echo -e "${YELLOW}[DRY RUN] Simulation de: ${cmd}${NC}"
    else
        eval "$cmd"
    fi
}

# Fonction pour créer ou modifier un fichier
modify_file() {
    local file="$1"
    local content="$2"
    local operation="${3:-write}" # write ou append
    
    if is_dry_run; then
        echo -e "${YELLOW}[DRY RUN] Simulation de: $([ "$operation" = "write" ] && echo "écriture dans" || echo "ajout à") ${file}${NC}"
        echo -e "${YELLOW}[DRY RUN] Contenu à $([ "$operation" = "write" ] && echo "écrire" || echo "ajouter"):${NC}"
        echo "$content" | head -n 3
        if [ $(echo "$content" | wc -l) -gt 3 ]; then
            echo -e "${YELLOW}[DRY RUN] (... et $(echo "$content" | wc -l) lignes au total)${NC}"
        fi
    else
        if [ "$operation" = "write" ]; then
            echo "$content" > "$file"
        else
            echo "$content" >> "$file"
        fi
    fi
}
