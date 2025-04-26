#!/bin/bash

# Script de vérification du cahier des charges
# Remplace verify-cahier.ts

set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Charger la configuration
CONFIG_FILE="cahier_check.config.json"
CAHIER_PATH="./cahier"
REQUIRE_AUDIT_MD=true

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}📂 Chargement de la configuration...${NC}"
    CAHIER_PATH=$(grep -o '"cahier"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    REQUIRE_VALUE=$(grep -o '"requireAuditMd"[[:space:]]*:[[:space:]]*[a-z]*' "$CONFIG_FILE" | grep -o '[a-z]*$')
    
    if [ "$REQUIRE_VALUE" = "false" ]; then
        REQUIRE_AUDIT_MD=false
    fi
fi

echo -e "${BLUE}🔍 Démarrage de la vérification du cahier des charges...${NC}"
echo -e "📂 Répertoire: $CAHIER_PATH"

# Vérifier si le répertoire existe
if [ ! -d "$CAHIER_PATH" ]; then
    echo -e "${RED}❌ Le répertoire $CAHIER_PATH n'existe pas.${NC}"
    exit 1
fi

# Créer un fichier de rapport
REPORT_FILE="./logs/verification-$(date +%Y%m%d-%H%M%S).md"
mkdir -p ./logs

echo "# Rapport de vérification du cahier des charges" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Généré le $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Initialiser les compteurs
ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction pour ajouter une entrée au rapport
add_to_report() {
    local status="$1"
    local message="$2"
    local details="$3"
    
    if [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
        echo "## ❌ Erreur: $message" >> "$REPORT_FILE"
        ERRORS=$((ERRORS + 1))
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️ $message${NC}"
        echo "## ⚠️ Avertissement: $message" >> "$REPORT_FILE"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ $message${NC}"
        echo "## ✅ Succès: $message" >> "$REPORT_FILE"
        SUCCESS=$((SUCCESS + 1))
    fi
    
    if [ ! -z "$details" ]; then
        echo "$details" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
}

# Vérifier la présence de fichiers essentiels
echo -e "${BLUE}📂 Vérification des fichiers essentiels...${NC}"

# Vérifier le sommaire
SUMMARY_FILE=""
for file in README.md 00-sommaire.md sommaire.md; do
    if [ -f "$CAHIER_PATH/$file" ]; then
        SUMMARY_FILE="$file"
        break
    fi
done

if [ -z "$SUMMARY_FILE" ]; then
    add_to_report "warning" "Aucun fichier de sommaire trouvé (README.md, 00-sommaire.md, sommaire.md)" \
                 "Il est recommandé d'avoir un fichier de sommaire pour faciliter la navigation dans le cahier des charges."
else
    add_to_report "success" "Fichier de sommaire trouvé: $SUMMARY_FILE"
    
    # Vérifier le contenu du sommaire
    if ! grep -q "^#" "$CAHIER_PATH/$SUMMARY_FILE"; then
        add_to_report "warning" "Le fichier de sommaire ne contient pas de titre principal (# Titre)" \
                     "Ajoutez un titre principal au fichier de sommaire."
    fi
    
    # Vérifier les liens dans le sommaire
    LINKS_COUNT=0
    if [ -f "$CAHIER_PATH/$SUMMARY_FILE" ]; then
        LINKS_COUNT=$(grep -c "\[[^]]*\]([^)]*)" "$CAHIER_PATH/$SUMMARY_FILE" || echo 0)
        
        # Assurez-vous que la valeur est un entier valide
        if ! [[ "$LINKS_COUNT" =~ ^[0-9]+$ ]]; then
            LINKS_COUNT=0
        fi
        
        if [ "$LINKS_COUNT" -eq 0 ]; then
            add_to_report "warning" "Le fichier de sommaire ne contient pas de liens vers d'autres fichiers" \
                         "Ajoutez des liens vers les autres fichiers du cahier des charges dans le sommaire."
        else
            add_to_report "success" "Le fichier de sommaire contient $LINKS_COUNT liens"
        fi
    fi
fi

# Vérifier les fichiers d'audit
echo -e "${BLUE}📄 Vérification des fichiers d'audit...${NC}"

AUDIT_FILES=$(find "$CAHIER_PATH" -name "*.audit.md")
AUDIT_COUNT=$(echo "$AUDIT_FILES" | grep -c "." || echo 0)

if [ "$AUDIT_COUNT" -eq 0 ]; then
    if [ "$REQUIRE_AUDIT_MD" = true ]; then
        add_to_report "warning" "Aucun fichier .audit.md trouvé" \
                     "Il est recommandé d'avoir des fichiers d'audit pour documenter l'analyse des fichiers PHP."
    else
        add_to_report "info" "Aucun fichier .audit.md trouvé (non requis selon la configuration)"
    fi
else
    add_to_report "success" "$AUDIT_COUNT fichiers d'audit trouvés"
    
    # Vérifier le contenu des fichiers d'audit
    for audit_file in $AUDIT_FILES; do
        echo -e "${BLUE}🔍 Vérification de $(basename "$audit_file")...${NC}"
        
        # Vérifier les sections obligatoires
        MISSING_SECTIONS=""
        
        if ! grep -q "Rôle\|rôle\|métier" "$audit_file"; then
            MISSING_SECTIONS="${MISSING_SECTIONS}Rôle métier, "
        fi
        
        if ! grep -q "Structure\|structure" "$audit_file"; then
            MISSING_SECTIONS="${MISSING_SECTIONS}Structure, "
        fi
        
        if ! grep -q "Zone\|zone\|fonctionnelle" "$audit_file"; then
            MISSING_SECTIONS="${MISSING_SECTIONS}Zone fonctionnelle, "
        fi
        
        if ! grep -q "Migration\|migration" "$audit_file"; then
            MISSING_SECTIONS="${MISSING_SECTIONS}Migration, "
        fi
        
        if [ ! -z "$MISSING_SECTIONS" ]; then
            MISSING_SECTIONS="${MISSING_SECTIONS%, }"
            add_to_report "warning" "Sections manquantes dans $(basename "$audit_file"): $MISSING_SECTIONS" \
                         "Ajoutez les sections manquantes au fichier d'audit."
        else
            add_to_report "success" "Toutes les sections obligatoires sont présentes dans $(basename "$audit_file")"
        fi
        
        # Vérifier si un fichier backlog correspondant existe
        base_name=$(basename "$audit_file" .audit.md)
        backlog_file="$CAHIER_PATH/${base_name}.backlog.json"
        
        if [ ! -f "$backlog_file" ]; then
            add_to_report "warning" "Fichier backlog manquant pour $(basename "$audit_file")" \
                         "Créez un fichier ${base_name}.backlog.json pour compléter l'audit."
        fi
    done
fi

# Vérifier les fichiers de backlog
echo -e "${BLUE}🔧 Vérification des fichiers de backlog...${NC}"

BACKLOG_FILES=$(find "$CAHIER_PATH" -name "*.backlog.json")
BACKLOG_COUNT=$(echo "$BACKLOG_FILES" | grep -c "." || echo 0)

if [ "$BACKLOG_COUNT" -eq 0 ]; then
    add_to_report "warning" "Aucun fichier .backlog.json trouvé" \
                 "Il est recommandé d'avoir des fichiers de backlog pour planifier la migration."
else
    add_to_report "success" "$BACKLOG_COUNT fichiers de backlog trouvés"
    
    # Vérifier le contenu des fichiers de backlog
    for backlog_file in $BACKLOG_FILES; do
        # Vérifier la syntaxe JSON
        if ! jq . "$backlog_file" >/dev/null 2>&1; then
            add_to_report "error" "Syntaxe JSON invalide dans $(basename "$backlog_file")" \
                         "Corrigez la syntaxe JSON du fichier de backlog."
            continue
        fi
        
        # Vérifier les champs obligatoires
        if ! jq -e '.file' "$backlog_file" >/dev/null 2>&1; then
            add_to_report "warning" "Champ 'file' manquant dans $(basename "$backlog_file")" \
                         "Ajoutez un champ 'file' au fichier de backlog."
        fi
        
        if ! jq -e '.tasks' "$backlog_file" >/dev/null 2>&1; then
            add_to_report "warning" "Champ 'tasks' manquant dans $(basename "$backlog_file")" \
                         "Ajoutez un tableau 'tasks' au fichier de backlog."
        else
            # Vérifier si le tableau des tâches est vide
            TASKS_COUNT=$(jq '.tasks | length' "$backlog_file")
            
            if [ "$TASKS_COUNT" -eq 0 ]; then
                add_to_report "warning" "Aucune tâche définie dans $(basename "$backlog_file")" \
                             "Ajoutez des tâches au fichier de backlog."
            else
                add_to_report "success" "$TASKS_COUNT tâches définies dans $(basename "$backlog_file")"
            fi
        fi
    done
fi

# Vérifier les fichiers d'impact
echo -e "${BLUE}🔄 Vérification des graphes d'impact...${NC}"

IMPACT_FILES=$(find "$CAHIER_PATH" -name "*.impact_graph.json")
IMPACT_COUNT=$(echo "$IMPACT_FILES" | grep -c "." || echo 0)

if [ "$IMPACT_COUNT" -eq 0 ]; then
    add_to_report "info" "Aucun fichier .impact_graph.json trouvé" \
                 "Les graphes d'impact sont utiles pour visualiser les dépendances entre fichiers."
else
    add_to_report "success" "$IMPACT_COUNT graphes d'impact trouvés"
    
    # Vérifier le contenu des graphes d'impact
    for impact_file in $IMPACT_FILES; do
        # Vérifier la syntaxe JSON
        if ! jq . "$impact_file" >/dev/null 2>&1; then
            add_to_report "error" "Syntaxe JSON invalide dans $(basename "$impact_file")" \
                         "Corrigez la syntaxe JSON du graphe d'impact."
            continue
        fi
        
        # Vérifier les champs obligatoires
        if ! jq -e '.nodes' "$impact_file" >/dev/null 2>&1; then
            add_to_report "warning" "Champ 'nodes' manquant dans $(basename "$impact_file")" \
                         "Ajoutez un tableau 'nodes' au graphe d'impact."
        else
            NODES_COUNT=$(jq '.nodes | length' "$impact_file")
            
            if [ "$NODES_COUNT" -eq 0 ]; then
                add_to_report "warning" "Aucun nœud défini dans $(basename "$impact_file")" \
                             "Ajoutez des nœuds au graphe d'impact."
            else
                add_to_report "success" "$NODES_COUNT nœuds définis dans $(basename "$impact_file")"
            fi
        fi
        
        if ! jq -e '.edges' "$impact_file" >/dev/null 2>&1; then
            add_to_report "warning" "Champ 'edges' manquant dans $(basename "$impact_file")" \
                         "Ajoutez un tableau 'edges' au graphe d'impact."
        fi
    done
fi

# Résumé du rapport
echo -e "\n${BLUE}📊 Résumé de la vérification${NC}"
echo "## Résumé" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- ✅ Succès: $SUCCESS" >> "$REPORT_FILE"
echo "- ⚠️ Avertissements: $WARNINGS" >> "$REPORT_FILE"
echo "- ❌ Erreurs: $ERRORS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "${GREEN}✅ $SUCCESS succès${NC}"
echo -e "${YELLOW}⚠️ $WARNINGS avertissements${NC}"
echo -e "${RED}❌ $ERRORS erreurs${NC}"

echo -e "\n${BLUE}📄 Rapport complet disponible: $REPORT_FILE${NC}"

# Si des erreurs ont été trouvées, renvoyer un code d'erreur
if [ "$ERRORS" -gt 0 ]; then
    exit 1
fi
