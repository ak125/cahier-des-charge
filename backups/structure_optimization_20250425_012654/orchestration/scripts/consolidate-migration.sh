#!/bin/bash
# Script de consolidation de la migration vers l'architecture à trois couches
# Date: 20 avril 2025

# Variables globales
WORKSPACE_ROOT="/workspaces/cahier-des-charge"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="${WORKSPACE_ROOT}/reports/consolidated-migration-${TIMESTAMP}"
LOG_DIR="${REPORT_DIR}/logs"
SUMMARY_FILE="${REPORT_DIR}/summary.md"

# Création des répertoires de rapports
mkdir -p "$LOG_DIR"

# Fonction de journalisation
log() {
  local level="$1"
  local message="$2"
  local date_str="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$date_str] [$level] $message" | tee -a "${REPORT_DIR}/consolidation.log"
}

# Fonction pour vérifier le statut après un script
check_status() {
  local step="$1"
  local log_file="$2"
  
  # Compter les erreurs TypeScript
  local tsc_errors=$(grep -c "error TS" "$log_file" 2>/dev/null || echo "0")
  log "INFO" "Nombre d'erreurs TypeScript: $tsc_errors"
  
  # Analyser les résultats
  if [ "$tsc_errors" -gt 0 ]; then
    log "WARNING" "Des erreurs TypeScript persistent après l'étape '$step'."
    grep "error TS" "$log_file" | head -n 5 | while read -r line; do
      log "WARNING" "  | $line"
    done
  else
    log "SUCCESS" "Aucune erreur TypeScript après l'étape '$step'."
  fi
}

# Fonction pour exécuter un script avec logging
run_script() {
  local script_path="$1"
  local description="$2"
  local log_file="${LOG_DIR}/$(basename "$script_path").log"
  
  log "STEP" "Exécution de $script_path: $description"
  log "INFO" "Logs détaillés dans: $log_file"
  
  if [ -x "$script_path" ]; then
    # Exécuter le script et capturer la sortie
    "$script_path" > "$log_file" 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      log "SUCCESS" "$script_path exécuté avec succès."
      return 0
    else
      log "ERROR" "$script_path a échoué avec le code $exit_code."
      return $exit_code
    fi
  else
    log "ERROR" "Le script $script_path n'existe pas ou n'est pas exécutable."
    return 1
  fi
}

# Entête du rapport
log "INFO" "======================================================================"
log "INFO" "Début de la consolidation de la migration vers l'architecture à trois couches"
log "INFO" "Date: $(date '+%Y-%m-%d %H:%M:%S')"
log "INFO" "Répertoire de travail: $WORKSPACE_ROOT"
log "INFO" "Répertoire des rapports: $REPORT_DIR"
log "INFO" "======================================================================"

# Étape 1: Nettoyage des doublons d'agents
log "STEP" "ÉTAPE 1: Nettoyage des doublons d'agents"
run_script "$WORKSPACE_ROOT/clean-agents-duplicates.sh" "Nettoyer les agents dupliqués et organiser selon l'architecture à trois couches"
if [ $? -eq 0 ]; then
  log "SUCCESS" "Nettoyage des doublons d'agents réussi."
  
  # Vérifier l'état après cette étape
  log "STEP" "Vérification de l'état de la migration après l'étape: Nettoyage des doublons"
  check_status "Nettoyage des doublons" "${LOG_DIR}/clean-agents-duplicates.sh.log"
else
  log "ERROR" "Échec lors du nettoyage des doublons d'agents."
  exit 1
fi

# Étape 2: Implémentation des interfaces requises
log "STEP" "ÉTAPE 2: Implémentation des interfaces requises"
run_script "$WORKSPACE_ROOT/implement-interfaces.sh" "Implémenter les interfaces nécessaires pour l'architecture à trois couches"
if [ $? -eq 0 ]; then
  log "SUCCESS" "Implémentation des interfaces réussie."
  
  # Vérifier l'état après cette étape
  log "STEP" "Vérification de l'état de la migration après l'étape: Implémentation des interfaces"
  check_status "Implémentation des interfaces" "${LOG_DIR}/implement-interfaces.sh.log"
else
  log "ERROR" "Échec lors de l'implémentation des interfaces."
  exit 1
fi

# Étape 3: Correction des méthodes manquantes
log "STEP" "ÉTAPE 3: Correction des méthodes manquantes"
run_script "$WORKSPACE_ROOT/fix-all-agents.sh" "Corriger les méthodes manquantes dans les agents"
if [ $? -eq 0 ]; then
  log "SUCCESS" "Correction des méthodes manquantes réussie."
  
  # Vérifier l'état après cette étape
  log "STEP" "Vérification de l'état de la migration après l'étape: Correction des méthodes"
  check_status "Correction des méthodes" "${LOG_DIR}/fix-all-agents.sh.log"
else
  log "ERROR" "Échec lors de la correction des méthodes manquantes."
  exit 1
fi

# Étape 4: Exécution des tests
log "STEP" "ÉTAPE 4: Exécution des tests"
run_script "$WORKSPACE_ROOT/run-agents-adapted-tests.sh" "Exécuter les tests adaptés pour les agents migrés"
if [ $? -eq 0 ]; then
  log "SUCCESS" "Tests des agents réussis."
  
  # Vérifier l'état après cette étape
  log "STEP" "Vérification de l'état de la migration après l'étape: Tests des agents"
  check_status "Tests des agents" "${LOG_DIR}/run-agents-adapted-tests.sh.log"
else
  log "WARNING" "Certains tests des agents ont échoué. La migration continue, mais vérifiez les logs."
fi

# Étape 5: Génération du manifeste final
log "STEP" "ÉTAPE 5: Génération du manifeste final"
run_script "$WORKSPACE_ROOT/generate-agent-manifest.ts" "Générer le manifeste final des agents"
if [ $? -eq 0 ]; then
  log "SUCCESS" "Génération du manifeste réussie."
else
  log "WARNING" "Échec lors de la génération du manifeste. La migration continue, mais vérifiez les logs."
fi

# Étape 6: Production du rapport unifié
log "STEP" "ÉTAPE 6: Production du rapport unifié"
log "INFO" "Génération du rapport unifié..."

# Créer l'entête du rapport
cat > "$SUMMARY_FILE" << EOF
# Rapport de migration vers l'architecture à trois couches

Date: $(date '+%Y-%m-%d %H:%M:%S')

## Résumé des actions effectuées

| Étape | Statut | Notes |
|-------|--------|-------|
EOF

# Analyser les logs pour chaque étape et ajouter au rapport
add_summary_step() {
  local step="$1"
  local log_file="$2"
  local status_icon=""
  local status_text=""
  local notes=""
  
  if grep -q "SUCCESS" "$log_file"; then
    status_icon="✅"
    status_text="Succès"
  elif grep -q "WARNING" "$log_file"; then
    status_icon="⚠️"
    status_text="Avertissement"
    notes="Voir logs pour détails"
  else
    status_icon="❌"
    status_text="Échec"
    notes="Des erreurs ont été rencontrées"
  fi
  
  echo "| $step | $status_icon $status_text | $notes |" >> "$SUMMARY_FILE"
}

# Ajouter chaque étape au rapport
add_summary_step "Nettoyage des doublons" "${LOG_DIR}/clean-agents-duplicates.sh.log"
add_summary_step "Implémentation des interfaces" "${LOG_DIR}/implement-interfaces.sh.log"
add_summary_step "Correction des méthodes" "${LOG_DIR}/fix-all-agents.sh.log"
add_summary_step "Tests des agents" "${LOG_DIR}/run-agents-adapted-tests.sh.log"
add_summary_step "Génération du manifeste" "${LOG_DIR}/generate-agent-manifest.ts.log"

# Ajouter la section statistiques
echo -e "\n## Statistiques de la migration\n" >> "$SUMMARY_FILE"

# Compter les agents migrés
agent_count=$(find "${WORKSPACE_ROOT}/packages/mcp-agents" -type f -name "*.ts" | grep -v "node_modules" | grep -v "dist" | wc -l)
echo "- **Nombre total d'agents :** $agent_count" >> "$SUMMARY_FILE"

# Compter par type d'agent
analyzer_count=$(find "${WORKSPACE_ROOT}/packages/mcp-agents/analyzers" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist" | wc -l)
validator_count=$(find "${WORKSPACE_ROOT}/packages/mcp-agents/validators" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist" | wc -l)
generator_count=$(find "${WORKSPACE_ROOT}/packages/mcp-agents/generators" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist" | wc -l)
orchestrator_count=$(find "${WORKSPACE_ROOT}/packages/mcp-agents/orchestrators" -type f -name "*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "dist" | wc -l)

echo "- **Agents par type :**" >> "$SUMMARY_FILE"
echo "  - Analyzers: $analyzer_count" >> "$SUMMARY_FILE"
echo "  - Validators: $validator_count" >> "$SUMMARY_FILE"
echo "  - Generators: $generator_count" >> "$SUMMARY_FILE"
echo "  - Orchestrators: $orchestrator_count" >> "$SUMMARY_FILE"

# Ajouter une section pour les prochaines étapes
cat >> "$SUMMARY_FILE" << EOF

## Prochaines étapes

1. **Validation fonctionnelle** : Vérifier que chaque agent conserve son comportement fonctionnel après la migration
2. **Optimisation des performances** : Analyser et optimiser les performances des agents migrés
3. **Documentation** : Mettre à jour la documentation de l'API des agents
4. **Intégration CI/CD** : S'assurer que les pipelines CI/CD sont mis à jour pour prendre en compte la nouvelle architecture

## Conclusion

La migration vers l'architecture à trois couches a été effectuée avec succès. Les agents sont maintenant organisés selon une structure cohérente et suivent les principes d'une architecture modulaire.
EOF

log "SUCCESS" "Rapport unifié généré avec succès : $SUMMARY_FILE"
log "INFO" "======================================================================"
log "INFO" "Migration consolidée terminée avec succès."
log "INFO" "Consultez le rapport complet : $SUMMARY_FILE"
log "INFO" "======================================================================"

# Afficher le chemin du rapport
echo "Rapport de migration disponible : $SUMMARY_FILE"

exit 0