#!/bin/bash

# Script de déduplication en profondeur - Phase 1: Agents
# Date: 10 mai 2025

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Déduplication en profondeur - Phase 1: Agents ===${NC}"

# Création du backup
BACKUP_DIR="backup/deduplication-phase1-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${YELLOW}Création d'une copie de sauvegarde...${NC}"
cp -R packages "$BACKUP_DIR/packages"
cp -R agents "$BACKUP_DIR/agents"
cp -R workspaces "$BACKUP_DIR/workspaces"
echo -e "${GREEN}✅ Sauvegarde créée dans: $BACKUP_DIR${NC}"

# Fichier de rapport
REPORT_FILE="cleanup-report/deduplication-agents-phase1-$(date +%Y%m%d-%H%M%S).md"
echo "# Rapport de déduplication des agents - Phase 1" > "$REPORT_FILE"
echo "Date: $(date +%Y-%m-%d)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Actions effectuées" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Standardisation des noms d'agents - Consolidation en kebab-case
echo -e "${YELLOW}1. Standardisation des noms d'agents...${NC}"
echo "### 1. Standardisation des noms d'agents" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Identifier les paires d'agents qui ont des noms similaires 
# (un avec tirets et un sans tirets)
if [ -d "packages/mcp-agents/analyzers" ]; then
    echo -e "Analyseurs dans packages/mcp-agents/analyzers:"
    
    # Trouver les agents en kebab-case et leurs équivalents sans tiret
    KEBAB_AGENTS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -name "*-*-agent" -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" | sort)
    
    for agent in $KEBAB_AGENTS; do
        agent_name=$(basename "$agent")
        
        # Construire le nom sans tiret (en enlevant tous les tirets)
        no_dash_name=$(echo "$agent_name" | tr -d '-')
        
        # Vérifier si la version sans tiret existe
        if [ -d "packages/mcp-agents/analyzers/$no_dash_name" ]; then
            echo -e "${YELLOW}Trouvé: $agent_name et $no_dash_name${NC}"
            echo "- Trouvé: $agent_name et $no_dash_name" >> "$REPORT_FILE"
            
            # Vérifier si les répertoires ont du contenu
            kebab_files=$(find "$agent" -type f | wc -l)
            nodash_files=$(find "packages/mcp-agents/analyzers/$no_dash_name" -type f | wc -l)
            
            # Si l'un est vide et l'autre non, conserver le non-vide
            if [ "$kebab_files" -eq 0 ] && [ "$nodash_files" -gt 0 ]; then
                echo -e "${YELLOW}  $agent_name est vide, $no_dash_name contient $nodash_files fichiers${NC}"
                echo "  - $agent_name est vide, $no_dash_name contient $nodash_files fichiers" >> "$REPORT_FILE"
                echo "  - Pas de consolidation nécessaire" >> "$REPORT_FILE"
            elif [ "$nodash_files" -eq 0 ] && [ "$kebab_files" -gt 0 ]; then
                echo -e "${YELLOW}  $no_dash_name est vide, $agent_name contient $kebab_files fichiers${NC}"
                echo "  - $no_dash_name est vide, $agent_name contient $kebab_files fichiers" >> "$REPORT_FILE"
                echo "  - Suppression du répertoire vide: $no_dash_name" >> "$REPORT_FILE"
                rm -rf "packages/mcp-agents/analyzers/$no_dash_name"
                echo -e "${GREEN}  ✅ Supprimé: packages/mcp-agents/analyzers/$no_dash_name${NC}"
            else
                # Les deux ont du contenu, consolider dans la version kebab-case
                echo -e "${YELLOW}  Consolidation de $no_dash_name vers $agent_name${NC}"
                echo "  - Consolidation de $no_dash_name vers $agent_name" >> "$REPORT_FILE"
                
                # Copier tout fichier unique de no_dash vers kebab-case
                echo "  - Fichiers copiés:" >> "$REPORT_FILE"
                for file in $(find "packages/mcp-agents/analyzers/$no_dash_name" -type f); do
                    rel_path=${file#packages/mcp-agents/analyzers/$no_dash_name/}
                    target_path="$agent/$rel_path"
                    
                    if [ ! -f "$target_path" ]; then
                        mkdir -p "$(dirname "$target_path")"
                        cp "$file" "$target_path"
                        echo "    - $rel_path" >> "$REPORT_FILE"
                    fi
                done
                
                # Supprimer la version sans tiret après consolidation
                rm -rf "packages/mcp-agents/analyzers/$no_dash_name"
                echo -e "${GREEN}  ✅ Consolidé et supprimé: packages/mcp-agents/analyzers/$no_dash_name${NC}"
                echo "  - ✅ Supprimé après consolidation: packages/mcp-agents/analyzers/$no_dash_name" >> "$REPORT_FILE"
            fi
        fi
    done
fi

# 2. Migration des agents orphelins dans le dossier agents/ racine vers packages/mcp-agents
echo -e "\n${YELLOW}2. Migration des agents orphelins de agents/ vers packages/mcp-agents...${NC}"
echo -e "\n### 2. Migration des agents orphelins" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -d "agents" ]; then
    ROOT_AGENTS=$(find agents -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" | grep -v "^agents$" | sort)
    
    for agent in $ROOT_AGENTS; do
        agent_name=$(basename "$agent")
        echo -e "${YELLOW}Migration de $agent_name depuis le dossier agents/ racine${NC}"
        echo "- Migration de $agent_name depuis le dossier agents/ racine" >> "$REPORT_FILE"
        
        # Créer le répertoire cible si nécessaire
        mkdir -p "packages/mcp-agents/analyzers/$agent_name"
        
        # Copier tous les fichiers
        if [ -n "$(find "$agent" -type f)" ]; then
            for file in $(find "$agent" -type f); do
                rel_path=${file#$agent/}
                target_path="packages/mcp-agents/analyzers/$agent_name/$rel_path"
                
                mkdir -p "$(dirname "$target_path")"
                cp "$file" "$target_path"
            done
            
            echo -e "${GREEN}✅ Migré: $agent_name vers packages/mcp-agents/analyzers/$agent_name${NC}"
            echo "  - ✅ Migré vers packages/mcp-agents/analyzers/$agent_name" >> "$REPORT_FILE"
        else
            echo -e "${YELLOW}Agent $agent_name est vide, création d'un fichier placeholder${NC}"
            echo "  - Agent $agent_name est vide, création d'un fichier placeholder" >> "$REPORT_FILE"
            echo "// Agent $agent_name - Placeholder pour future implémentation" > "packages/mcp-agents/analyzers/$agent_name/index.ts"
        fi
    done
    
    # Ne pas supprimer le dossier agents/ racine pour maintenir la compatibilité temporairement
    echo -e "${BLUE}Note: Le dossier agents/ racine est conservé pour compatibilité temporaire${NC}"
    echo "- Note: Le dossier agents/ racine est conservé pour compatibilité temporaire" >> "$REPORT_FILE"
fi

# 3. Vérification des fichiers vides et création de fichiers index.ts manquants
echo -e "\n${YELLOW}3. Vérification des fichiers vides et création de fichiers index.ts manquants...${NC}"
echo -e "\n### 3. Création de fichiers index.ts manquants" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

AGENT_DIRS=$(find packages/mcp-agents/analyzers -maxdepth 1 -type d -not -path "*node_modules*" -not -path "*dist*" -not -path "*.git*" -not -path "*.nx*" -not -path "*.nx-cache*" | grep -v "^packages/mcp-agents/analyzers$" | sort)

for dir in $AGENT_DIRS; do
    dir_name=$(basename "$dir")
    
    # Vérifier si le répertoire a un fichier index.ts
    if [ ! -f "$dir/index.ts" ]; then
        echo -e "${YELLOW}Création du fichier index.ts manquant pour $dir_name${NC}"
        echo "- Création du fichier index.ts manquant pour $dir_name" >> "$REPORT_FILE"
        
        # Créer un fichier index.ts de base
        echo "/**
 * Agent: $dir_name
 * Ce module expose les fonctionnalités de l'agent $dir_name
 */

// Exporter les fonctionnalités
export * from './types';
" > "$dir/index.ts"

        # Si le fichier types.ts n'existe pas, le créer
        if [ ! -f "$dir/types.ts" ]; then
            echo "/**
 * Types pour l'agent $dir_name
 */

export interface ${dir_name//-agent/Agent}Config {
  // Configuration de l'agent
}

export interface ${dir_name//-agent/Agent}Result {
  // Résultat de l'agent
}
" > "$dir/types.ts"
        fi
        
        echo -e "${GREEN}✅ Fichier index.ts créé pour $dir_name${NC}"
    fi
done

echo -e "\n${GREEN}✅ Déduplication des agents terminée !${NC}"
echo -e "${BLUE}Rapport disponible dans: $REPORT_FILE${NC}"
echo -e "${YELLOW}N'oubliez pas de vérifier les imports dans votre code qui pourraient faire référence aux anciens chemins d'agents.${NC}"

# Mise à jour du rapport final
echo -e "\n## Prochaines étapes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Vérifier et mettre à jour les imports dans le code qui font référence aux anciens chemins" >> "$REPORT_FILE"
echo "2. Exécuter la phase 2 de déduplication pour consolider l'architecture en trois couches" >> "$REPORT_FILE"
echo "3. Mettre à jour la documentation pour refléter la nouvelle structure" >> "$REPORT_FILE"
