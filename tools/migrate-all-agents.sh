#!/bin/bash
# migrate-all-agents.sh
#
# Script de migration par lot pour adapter les agents existants
# à l'architecture à trois couches.

# Répertoire de sortie pour les agents migrés
MIGRATED_DIR="/workspaces/cahier-des-charge/packages/migrated-agents"
REPORT_FILE="/workspaces/cahier-des-charge/tools/migration-report.md"
MIGRATION_SCRIPT="/workspaces/cahier-des-charge/tools/migrate-agent.ts"

# Préparation
echo "Préparation de la migration des agents..."

# S'assurer que les répertoires nécessaires existent
mkdir -p "$MIGRATED_DIR/business"
mkdir -p "$MIGRATED_DIR/coordination"
mkdir -p "$MIGRATED_DIR/orchestration"

# Entête du rapport
cat > "$REPORT_FILE" << EOF
# Rapport de migration des agents - $(date '+%Y-%m-%d')

Ce rapport détaille la migration des agents vers l'architecture à trois couches.

## Résumé

EOF

# Compteurs
TOTAL=0
SUCCESS=0
FAILED=0
SKIPPED=0

# Liste des agents non conformes - méthode plus directe avec find
echo "Recherche des agents à migrer..."
AGENT_PATHS=$(find /workspaces/cahier-des-charge/ -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | grep -v "test" | grep -E "agent\.ts$|agents|validators|parsers|analyzers|generators")

# Fonction pour déterminer le chemin cible en fonction de l'interface détectée
get_target_path() {
    local source_path="$1"
    local detected_interface="$2"
    local filename=$(basename "$source_path")
    local target_dir=""

    case "$detected_interface" in
        *OrchestrationAgent* | *OrchestratorAgent* | *MonitorAgent* | *SchedulerAgent*)
            target_dir="$MIGRATED_DIR/orchestration"
            ;;
        *CoordinationAgent* | *AdapterAgent* | *BridgeAgent* | *RegistryAgent*)
            target_dir="$MIGRATED_DIR/coordination"
            ;;
        *BusinessAgent* | *AnalyzerAgent* | *GeneratorAgent* | *ValidatorAgent* | *ParserAgent*)
            target_dir="$MIGRATED_DIR/business"
            ;;
        *)
            target_dir="$MIGRATED_DIR/business" # Par défaut, on met dans business
            ;;
    esac

    # Crée le répertoire s'il n'existe pas
    mkdir -p "$target_dir"
    
    # Garantir un nom de fichier unique
    local base_name=$(basename "$filename" .ts)
    local counter=1
    local final_filename="$base_name.ts"
    
    while [ -f "$target_dir/$final_filename" ]; do
        final_filename="${base_name}-${counter}.ts"
        counter=$((counter + 1))
    done
    
    echo "$target_dir/$final_filename"
}

# Migration de chaque agent
echo "Début de la migration des agents..."

# Limiter le nombre de fichiers à traiter pour le test
#MAX_FILES=10 # Commenter cette ligne pour traiter tous les fichiers

for AGENT_PATH in $AGENT_PATHS; do
    # Option pour limiter le nombre de fichiers traités
    if [ -n "$MAX_FILES" ]; then
        if [ $TOTAL -ge $MAX_FILES ]; then
            break
        fi
    fi

    # Vérifier que le fichier existe et qu'il contient probablement un agent
    if [ ! -f "$AGENT_PATH" ]; then
        continue
    fi
    
    # Vérifier rapidement si le fichier semble être un agent
    if ! grep -q -E "class|interface|Agent|agent" "$AGENT_PATH"; then
        continue
    fi

    echo "🔍 Analyse de $AGENT_PATH"
    TOTAL=$((TOTAL + 1))

    # Exécuter la détection automatique d'interface sans écrire le fichier
    DETECTION_OUTPUT=$(npx ts-node "$MIGRATION_SCRIPT" -a "$AGENT_PATH" 2>&1)
    
    # Extraire l'interface détectée
    DETECTED_INTERFACE=$(echo "$DETECTION_OUTPUT" | grep "Agent migré avec succès vers l'interface" | sed -E "s/.*'([^']+)'.*/\1/")
    
    if [ -z "$DETECTED_INTERFACE" ]; then
        echo "⚠️ Impossible de détecter une interface pour $AGENT_PATH"
        FAILED=$((FAILED + 1))
        
        # Ajouter au rapport
        cat >> "$REPORT_FILE" << EOF
### ❌ $AGENT_PATH
- **Statut**: Échec de la détection d'interface
- **Erreur**: $DETECTION_OUTPUT

EOF
        continue
    fi
    
    # Déterminer le chemin cible
    TARGET_PATH=$(get_target_path "$AGENT_PATH" "$DETECTED_INTERFACE")
    
    echo "📝 Migration de $AGENT_PATH vers $TARGET_PATH (interface: $DETECTED_INTERFACE)"
    
    # Effectuer la migration avec écriture dans le fichier cible (avec l'option -w explicite)
    RESULT=$(npx ts-node "$MIGRATION_SCRIPT" -a -w -i "$DETECTED_INTERFACE" -o "$TARGET_PATH" "$AGENT_PATH" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration réussie pour $AGENT_PATH"
        SUCCESS=$((SUCCESS + 1))
        
        # Extraire des informations sur les modifications nécessaires
        MISSING_METHODS=$(echo "$RESULT" | grep -A 10 "Méthodes à implémenter:" | tail -n 1)
        MISSING_PROPS=$(echo "$RESULT" | grep -A 10 "Propriétés à ajouter:" | tail -n 1)
        
        # Ajouter au rapport
        cat >> "$REPORT_FILE" << EOF
### ✅ $AGENT_PATH
- **Interface détectée**: $DETECTED_INTERFACE
- **Fichier migré**: $TARGET_PATH
- **Méthodes à implémenter**: $MISSING_METHODS
- **Propriétés à ajouter**: $MISSING_PROPS

EOF
    else
        echo "❌ Échec de la migration pour $AGENT_PATH: $RESULT"
        FAILED=$((FAILED + 1))
        
        # Ajouter au rapport
        cat >> "$REPORT_FILE" << EOF
### ❌ $AGENT_PATH
- **Interface détectée**: $DETECTED_INTERFACE
- **Statut**: Échec de la migration
- **Erreur**: $RESULT

EOF
    fi
done

# Mise à jour du résumé du rapport
sed -i "s/## Résumé/## Résumé\n\n- **Total**: $TOTAL agents\n- **Réussis**: $SUCCESS agents\n- **Échoués**: $FAILED agents\n- **Ignorés**: $SKIPPED agents/" "$REPORT_FILE"

# Finalisation
echo "Migration terminée ! Résultats:"
echo "- Total: $TOTAL agents"
echo "- Réussis: $SUCCESS agents"
echo "- Échoués: $FAILED agents"
echo "- Ignorés: $SKIPPED agents"
echo "Rapport de migration disponible dans $REPORT_FILE"