#!/bin/bash

# Script de déduplication phase 2 - Traitement des fichiers similaires
# Date: $(date +%Y-%m-%d)

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Répertoires et fichiers
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
BACKUP_DIR="${WORKSPACE_ROOT}/backup/deduplication-phase2-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${BACKUP_DIR}/deduplication-phase2-log.txt"
SIMILARITY_REPORT="${WORKSPACE_ROOT}/cleanup-report/similar-files-report.md"
PLAN_FILE="${WORKSPACE_ROOT}/cleanup-scripts/deduplication-plan/similar-files-plan.json"
ANALYZER_SCRIPT="${WORKSPACE_ROOT}/cleanup-scripts/similar-files-analyzer.js"
MERGE_SCRIPT="${WORKSPACE_ROOT}/cleanup-scripts/merge-similar-files.js"
INTERACTIVE=${1:-true} # Mode interactif par défaut, peut être désactivé avec false

# Fonction pour journaliser les actions
log() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Fonction pour sauvegarder un fichier avant modification
backup_file() {
    local file="$1"
    local relative_path="${file#$WORKSPACE_ROOT/}"
    local backup_path="$BACKUP_DIR/$relative_path"
    
    # Créer le répertoire de destination s'il n'existe pas
    mkdir -p "$(dirname "$backup_path")"
    
    # Copier le fichier
    cp "$file" "$backup_path" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "Sauvegarde effectuée: $file -> $backup_path"
        return 0
    else
        log "${RED}ERREUR: Impossible de sauvegarder $file${NC}"
        return 1
    fi
}

# Fonction pour créer le script de fusion de fichiers similaires
create_merge_script() {
    cat > "$MERGE_SCRIPT" << 'EOF'
/**
 * Script de fusion de fichiers similaires
 * 
 * Ce script prend deux fichiers en entrée et tente de les fusionner
 * en conservant toutes les fonctionnalités uniques.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Arguments attendus: targetFile otherFile
const [,, targetFile, otherFile] = process.argv;

if (!targetFile || !otherFile) {
    console.error('Usage: node merge-similar-files.js <targetFile> <otherFile>');
    process.exit(1);
}

async function mergeFiles() {
    try {
        // Lire les fichiers
        const targetContent = await readFile(targetFile, 'utf8');
        const otherContent = await readFile(otherFile, 'utf8');
        
        // Extraire les fonctions et leurs contenus
        const targetFunctions = extractFunctions(targetContent);
        const otherFunctions = extractFunctions(otherContent);
        
        // Trouver les fonctions qui n'existent que dans l'autre fichier
        const uniqueFunctionsInOther = otherFunctions.filter(
            otherFn => !targetFunctions.some(targetFn => targetFn.name === otherFn.name)
        );
        
        // Préparer le contenu fusionné
        let mergedContent = targetContent;
        
        // Si nous avons des fonctions uniques à ajouter
        if (uniqueFunctionsInOther.length > 0) {
            // Trouver un bon endroit pour insérer les nouvelles fonctions
            // Par défaut, nous les ajouterons à la fin, mais avant les exports si c'est un module
            
            // Vérifier s'il y a une ligne d'export à la fin
            const exportMatch = mergedContent.match(/\n(module\.exports|export |exports\.).*(\n*)$/);
            
            if (exportMatch) {
                // Insérer avant les exports
                const insertPosition = mergedContent.lastIndexOf(exportMatch[0]);
                
                // Préparer les fonctions à ajouter
                const functionsToAdd = uniqueFunctionsInOther
                    .map(fn => `\n\n// Fonction ajoutée depuis ${path.basename(otherFile)}\n${fn.fullText}`)
                    .join('\n');
                
                // Insérer les fonctions
                mergedContent = 
                    mergedContent.substring(0, insertPosition) +
                    functionsToAdd +
                    mergedContent.substring(insertPosition);
            } else {
                // Ajouter à la fin avec une séparation
                mergedContent += '\n\n// Fonctions ajoutées depuis ' + path.basename(otherFile) + '\n';
                uniqueFunctionsInOther.forEach(fn => {
                    mergedContent += `\n${fn.fullText}\n`;
                });
            }
            
            // Ajouter un commentaire en haut du fichier pour documenter la fusion
            const fusionComment = 
                `/**\n` +
                ` * Fichier fusionné\n` +
                ` * Ce fichier contient du contenu fusionné depuis: ${path.basename(otherFile)}\n` +
                ` * Date de fusion: ${new Date().toISOString().split('T')[0]}\n` +
                ` */\n\n`;
            
            mergedContent = fusionComment + mergedContent;
            
            // Écrire le fichier fusionné
            await writeFile(targetFile, mergedContent, 'utf8');
            console.log(`Fusion réussie: ${uniqueFunctionsInOther.length} fonctions de ${otherFile} ont été ajoutées à ${targetFile}`);
            return {
                success: true,
                addedFunctions: uniqueFunctionsInOther.length
            };
        } else {
            console.log(`Aucune fonction unique trouvée dans ${otherFile} à ajouter à ${targetFile}`);
            return {
                success: false,
                addedFunctions: 0
            };
        }
    } catch (error) {
        console.error(`Erreur lors de la fusion des fichiers:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fonction pour extraire les fonctions d'un fichier avec leur contenu complet
function extractFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    
    // Recherche des fonctions et méthodes
    let inFunction = false;
    let currentFunction = null;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Vérifier si on est au début d'une fonction
        if (!inFunction) {
            // Vérifier différents modèles de déclaration de fonction
            const fnMatches = [
                // function name() {
                line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/),
                // const name = () => {
                line.match(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*{/),
                // name() {
                line.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/)
            ];
            
            // Vérifier si l'un des modèles correspond
            const match = fnMatches.find(m => m !== null);
            
            if (match) {
                // Ignorer les structures de contrôle (if, for, etc.)
                const name = match[1];
                if (!['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
                    inFunction = true;
                    braceCount = (line.match(/{/g) || []).length;
                    braceCount -= (line.match(/}/g) || []).length;
                    
                    // Chercher les commentaires au-dessus de la fonction
                    let commentStart = i;
                    while (commentStart > 0 && 
                          (lines[commentStart - 1].trim().startsWith('*') || 
                           lines[commentStart - 1].trim().startsWith('/') || 
                           lines[commentStart - 1].trim() === '')) {
                        commentStart--;
                    }
                    
                    currentFunction = {
                        name,
                        startLine: commentStart,
                        lines: [lines.slice(commentStart, i + 1).join('\n')],
                        fullText: lines.slice(commentStart, i + 1).join('\n')
                    };
                    
                    // Si la fonction se termine sur cette même ligne
                    if (braceCount === 0 && line.includes('}')) {
                        inFunction = false;
                        functions.push(currentFunction);
                        currentFunction = null;
                    }
                }
            }
        } 
        // Si on est déjà dans une fonction, continuer à collecter les lignes
        else if (inFunction) {
            currentFunction.lines.push(line);
            currentFunction.fullText += '\n' + line;
            
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            // Si le nombre d'accolades ouvrantes et fermantes correspond, la fonction est terminée
            if (braceCount === 0) {
                inFunction = false;
                functions.push(currentFunction);
                currentFunction = null;
            }
        }
    }
    
    return functions;
}

// Exécuter la fusion
mergeFiles().then(result => {
    if (result.success) {
        process.exit(0);
    } else if (result.addedFunctions === 0) {
        // Code de sortie spécial pour indiquer qu'aucune fusion n'était nécessaire
        process.exit(2);
    } else {
        process.exit(1);
    }
}).catch(() => process.exit(1));
EOF

    chmod +x "$MERGE_SCRIPT"
    log "Script de fusion créé: $MERGE_SCRIPT"
}

# Fonction pour traiter les fichiers similaires
process_similar_files() {
    # Vérifier si le plan de déduplication existe
    if [ ! -f "$PLAN_FILE" ]; then
        if [ -f "$ANALYZER_SCRIPT" ]; then
            log "Génération du plan de déduplication des fichiers similaires..."
            node "$ANALYZER_SCRIPT"
        else
            log "${RED}Le script d'analyse des fichiers similaires n'existe pas: $ANALYZER_SCRIPT${NC}"
            return 1
        fi
    fi
    
    # Vérifier à nouveau si le plan existe après la tentative de génération
    if [ ! -f "$PLAN_FILE" ]; then
        log "${RED}Impossible de générer le plan de déduplication${NC}"
        return 1
    fi
    
    # Créer le script de fusion s'il n'existe pas
    if [ ! -f "$MERGE_SCRIPT" ]; then
        create_merge_script
    fi
    
    # Traiter chaque groupe de fichiers similaires selon la stratégie recommandée
    local totalProcessed=0
    local totalMerged=0
    local totalDeduplicated=0
    
    log "Traitement des fichiers similaires selon le plan de déduplication..."
    
    # Utiliser jq pour analyser le JSON si disponible, sinon grep et sed
    local groups=""
    if command -v jq >/dev/null 2>&1; then
        groups=$(jq -c '.[]' "$PLAN_FILE")
    else
        # Version simplifiée pour les systèmes sans jq
        log "${YELLOW}jq non trouvé, utilisation d'une méthode alternative pour analyser le JSON${NC}"
        groups=$(grep -o '{[^}]*}' "$PLAN_FILE")
    fi
    
    echo "$groups" | while read -r group; do
        # Extraction des informations du groupe
        local groupName=$(echo "$group" | grep -o '"groupName":"[^"]*"' | sed 's/"groupName":"//;s/"//')
        local strategy=$(echo "$group" | grep -o '"strategy":"[^"]*"' | sed 's/"strategy":"//;s/"//')
        local keepFile=$(echo "$group" | grep -o '"keepFile":"[^"]*"' | sed 's/"keepFile":"//;s/"//')
        
        if [[ -z "$groupName" || -z "$strategy" ]]; then
            log "${RED}Informations manquantes pour ce groupe de fichiers similaires${NC}"
            continue
        fi
        
        log "Traitement du groupe: $groupName"
        log "Stratégie: $strategy, Fichier à conserver: $keepFile"
        
        # Traiter selon la stratégie
        case "$strategy" in
            "keep-one")
                # Conserver un seul fichier et supprimer les autres
                if [[ -n "$keepFile" && -f "$WORKSPACE_ROOT/$keepFile" ]]; then
                    # Extraire la liste des fichiers à traiter
                    local filesToProcess=$(echo "$group" | grep -o '"filesToProcess":\[[^]]*\]' | sed 's/"filesToProcess":\[//;s/\]//' | sed 's/"//g;s/,/ /g')
                    
                    for file in $filesToProcess; do
                        if [[ -f "$WORKSPACE_ROOT/$file" ]]; then
                            log "Conservation de $keepFile, suppression de $file"
                            
                            # En mode interactif, demander confirmation
                            if [[ "$INTERACTIVE" == "true" ]]; then
                                echo -e "${YELLOW}Confirmer la suppression de $file ? (conserver $keepFile) [y/N]${NC}"
                                read -r response
                                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                                    log "Suppression annulée par l'utilisateur"
                                    continue
                                fi
                            fi
                            
                            # Sauvegarder avant suppression
                            backup_file "$WORKSPACE_ROOT/$file"
                            rm "$WORKSPACE_ROOT/$file"
                            log "${GREEN}Fichier supprimé: $file${NC}"
                            ((totalDeduplicated++))
                        else
                            log "${YELLOW}Fichier déjà supprimé ou inexistant: $file${NC}"
                        fi
                    done
                else
                    log "${RED}Fichier à conserver non trouvé: $keepFile${NC}"
                fi
                ;;
                
            "merge")
                # Fusionner les fichiers
                if [[ -n "$keepFile" && -f "$WORKSPACE_ROOT/$keepFile" ]]; then
                    # Extraire la liste des fichiers à fusionner
                    local filesToProcess=$(echo "$group" | grep -o '"filesToProcess":\[[^]]*\]' | sed 's/"filesToProcess":\[//;s/\]//' | sed 's/"//g;s/,/ /g')
                    
                    for file in $filesToProcess; do
                        if [[ -f "$WORKSPACE_ROOT/$file" ]]; then
                            log "Fusion de $file dans $keepFile"
                            
                            # En mode interactif, demander confirmation
                            if [[ "$INTERACTIVE" == "true" ]]; then
                                echo -e "${YELLOW}Confirmer la fusion de $file dans $keepFile ? [y/N]${NC}"
                                read -r response
                                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                                    log "Fusion annulée par l'utilisateur"
                                    continue
                                fi
                            fi
                            
                            # Sauvegarder les fichiers avant fusion
                            backup_file "$WORKSPACE_ROOT/$keepFile"
                            backup_file "$WORKSPACE_ROOT/$file"
                            
                            # Exécuter le script de fusion
                            node "$MERGE_SCRIPT" "$WORKSPACE_ROOT/$keepFile" "$WORKSPACE_ROOT/$file"
                            local merge_result=$?
                            
                            if [[ $merge_result -eq 0 ]]; then
                                log "${GREEN}Fusion réussie de $file dans $keepFile${NC}"
                                rm "$WORKSPACE_ROOT/$file"
                                log "Fichier $file supprimé après fusion"
                                ((totalMerged++))
                            elif [[ $merge_result -eq 2 ]]; then
                                log "${YELLOW}Aucune fusion nécessaire entre $keepFile et $file${NC}"
                                rm "$WORKSPACE_ROOT/$file"
                                log "Fichier $file supprimé car identique fonctionnellement"
                                ((totalDeduplicated++))
                            else
                                log "${RED}Échec de la fusion de $file dans $keepFile${NC}"
                            fi
                        else
                            log "${YELLOW}Fichier à fusionner non trouvé: $file${NC}"
                        fi
                    done
                else
                    log "${RED}Fichier cible pour la fusion non trouvé: $keepFile${NC}"
                fi
                ;;
                
            "refactor")
                # Pour la refactorisation, on suggère une action manuelle
                log "${YELLOW}Groupe nécessitant une refactorisation manuelle:${NC}"
                local filesToProcess=$(echo "$group" | grep -o '"filesToProcess":\[[^]]*\]' | sed 's/"filesToProcess":\[//;s/\]//' | sed 's/"//g;s/,/ /g')
                
                if [[ -n "$keepFile" ]]; then
                    log "Fichier principal suggéré: $keepFile"
                fi
                
                log "Fichiers à refactoriser manuellement:"
                for file in $filesToProcess; do
                    log "  - $file"
                done
                
                local recommendations=$(echo "$group" | grep -o '"recommendations":\[[^]]*\]' | sed 's/"recommendations":\[//;s/\]//' | sed 's/"//g;s/,/ /g')
                if [[ -n "$recommendations" ]]; then
                    log "Recommandations: $recommendations"
                fi
                ;;
                
            "skip")
                # Groupe à ignorer
                log "${YELLOW}Groupe ignoré pour le traitement${NC}"
                ;;
                
            *)
                log "${RED}Stratégie non reconnue: $strategy${NC}"
                ;;
        esac
        
        ((totalProcessed++))
    done
    
    log "Traitement des fichiers similaires terminé"
    log "Total des groupes traités: $totalProcessed"
    log "Fichiers fusionnés: $totalMerged"
    log "Fichiers dédupliqués: $totalDeduplicated"
    
    return 0
}

# Fonction pour générer un rapport final
generate_final_report() {
    local report_file="${WORKSPACE_ROOT}/cleanup-report/deduplication-phase2-report-$(date +%Y%m%d-%H%M%S).md"
    
    echo "# Rapport de déduplication phase 2 - Fichiers similaires" > "$report_file"
    echo "" >> "$report_file"
    echo "Date: $(date +%Y-%m-%d)" >> "$report_file"
    echo "" >> "$report_file"
    echo "## Résumé des actions" >> "$report_file"
    echo "" >> "$report_file"
    echo "- **Répertoire de sauvegarde:** \`$BACKUP_DIR\`" >> "$report_file"
    echo "- **Fichiers traités:** $(find "$BACKUP_DIR" -type f | wc -l)" >> "$report_file"
    echo "" >> "$report_file"
    echo "## Détail des opérations" >> "$report_file"
    echo "" >> "$report_file"
    echo "Le journal complet des opérations est disponible dans: \`$LOG_FILE\`" >> "$report_file"
    
    # Extraire les statistiques du journal
    echo "### Statistiques" >> "$report_file"
    echo "" >> "$report_file"
    echo "- **Groupes de fichiers similaires traités:** $(grep -c "Traitement du groupe:" "$LOG_FILE")" >> "$report_file"
    echo "- **Fichiers fusionnés avec succès:** $(grep -c "Fusion réussie" "$LOG_FILE")" >> "$report_file"
    echo "- **Fichiers supprimés après fusion/déduplication:** $(grep -c "Fichier.*supprimé" "$LOG_FILE")" >> "$report_file"
    echo "" >> "$report_file"
    
    # Ajouter des recommandations pour la prochaine étape
    echo "## Recommandations" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. **Vérification des références:** Assurez-vous que toutes les références aux fichiers supprimés sont mises à jour." >> "$report_file"
    echo "2. **Tests de fonctionnement:** Exécutez des tests pour vérifier que la déduplication n'a pas causé de régression." >> "$report_file"
    echo "3. **Groupes en attente de refactorisation:** Examinez les groupes marqués pour 'refactor' et effectuez une refactorisation manuelle." >> "$report_file"
    echo "" >> "$report_file"
    
    log "Rapport final généré: $report_file"
}

# Programme principal
main() {
    echo -e "${BLUE}${BOLD}Déduplication Phase 2 - Traitement des fichiers similaires${NC}"
    echo -e "${YELLOW}Date: $(date)${NC}"
    
    # Créer le répertoire de sauvegarde
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        echo -e "${GREEN}Répertoire de sauvegarde créé: $BACKUP_DIR${NC}"
    fi
    
    # Initialiser le fichier de log
    echo "=== Journal de déduplication phase 2 - $(date) ===" > "$LOG_FILE"
    
    # Vérifier si le rapport d'analyse existe déjà
    if [ ! -f "$SIMILARITY_REPORT" ]; then
        # Exécuter le script d'analyse si nécessaire
        if [ -f "$ANALYZER_SCRIPT" ]; then
            echo -e "${YELLOW}Rapport d'analyse des fichiers similaires non trouvé. Génération...${NC}"
            node "$ANALYZER_SCRIPT"
            
            if [ $? -ne 0 ]; then
                echo -e "${RED}Échec de la génération du rapport d'analyse${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Le script d'analyse des fichiers similaires n'existe pas: $ANALYZER_SCRIPT${NC}"
            exit 1
        fi
    fi
    
    # Traiter les fichiers similaires
    process_similar_files
    
    # Générer un rapport final
    generate_final_report
    
    echo -e "${GREEN}${BOLD}Déduplication phase 2 terminée avec succès${NC}"
    echo -e "${YELLOW}Voir le rapport pour plus de détails: ${WORKSPACE_ROOT}/cleanup-report/deduplication-phase2-report-*.md${NC}"
}

# Exécution du script
main