#!/bin/bash

echo "🚀 Démarrage de l'audit complet du pipeline de migration..."

# === Chemins de base ===
AGENTS_DIR="./agents"
AUDIT_OUTPUT_DIR="./audit"
LOG_DIR="./logs"

# === Fichiers d'output ===
PIPELINE_AUDIT="$AUDIT_OUTPUT_DIR/pipeline_audit.json"
STRATEGY_AUDIT="$AUDIT_OUTPUT_DIR/migration_strategy_audit.json"
SUMMARY_MD="$AUDIT_OUTPUT_DIR/pipeline_migration.audit.md"

# === Création des dossiers si absents ===
mkdir -p "$AUDIT_OUTPUT_DIR"
mkdir -p "$LOG_DIR"

# === Audit pipeline + stratégie via agent TypeScript ===
echo "🔍 Exécution de pipeline-strategy-auditor.ts..."
npx ts-node "$AGENTS_DIR/pipeline-strategy-auditor.ts" \
  --output-pipeline "$PIPELINE_AUDIT" \
  --output-strategy "$STRATEGY_AUDIT" \
  --summary "$SUMMARY_MD" \
  2>&1 | tee "$LOG_DIR/pipeline_audit.log"

# === Résumé ===
echo ""
echo "✅ Audit terminé. Résultats :"
echo " - Rapport pipeline     : $PIPELINE_AUDIT"
echo " - Rapport stratégie    : $STRATEGY_AUDIT"
echo " - Résumé lisible (.md) : $SUMMARY_MD"
echo " - Log complet          : $LOG_DIR/pipeline_audit.log"