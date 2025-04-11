#!/bin/bash

# Script pour lancer l'analyse de qualité des audits
# Usage: ./analyze-audit-quality.sh [--verbose] [--report-only]

VERBOSE=false
REPORT_ONLY=false

# Traitement des arguments
for arg in "$@"
do
    case $arg in
        --verbose)
        VERBOSE=true
        shift
        ;;
        --report-only)
        REPORT_ONLY=true
        shift
        ;;
    esac
done

# Couleurs pour les sorties
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Analyse de qualité des audits...${NC}"

# Exécuter uniquement l'analyse sans rapport si --report-only n'est pas activé
if [ "$REPORT_ONLY" = false ]; then
    if [ "$VERBOSE" = true ]; then
        npx ts-node utils/audit-quality-analyzer.ts --verbose
    else
        npx ts-node utils/audit-quality-analyzer.ts
    fi
fi

# Vérifier que le rapport existe
QUALITY_REPORT="./reports/audit_quality_metrics.json"
if [ ! -f "$QUALITY_REPORT" ]; then
    echo -e "${RED}❌ Rapport de qualité non trouvé: $QUALITY_REPORT${NC}"
    exit 1
fi

# Afficher un résumé du rapport
echo -e "\n${BLUE}=== Résumé de la qualité des audits ===${NC}"

# Extraction des métriques
TOTAL_AUDITS=$(jq '.totalAudits' $QUALITY_REPORT)
COMPLETENESS=$(jq '.averageMetrics.completeness' $QUALITY_REPORT)
CONSISTENCY=$(jq '.averageMetrics.consistency' $QUALITY_REPORT)
MIGRATION_READINESS=$(jq '.averageMetrics.migrationReadiness' $QUALITY_REPORT)

IMPROVING_COUNT=$(jq '.trends.improving | length' $QUALITY_REPORT)
DECLINING_COUNT=$(jq '.trends.declining | length' $QUALITY_REPORT)
PRIORITY_COUNT=$(jq '.recommendations.priority | length' $QUALITY_REPORT)

# Fonction pour coloriser les pourcentages selon leur valeur
colorize_percent() {
    local value=$1
    if (( $(echo "$value > 80" | bc -l) )); then
        echo -e "${GREEN}$(printf "%.1f" $value)%${NC}"
    elif (( $(echo "$value > 50" | bc -l) )); then
        echo -e "${YELLOW}$(printf "%.1f" $value)%${NC}"
    else
        echo -e "${RED}$(printf "%.1f" $value)%${NC}"
    fi
}

# Affichage des métriques moyennes
echo -e "Nombre total d'audits: $TOTAL_AUDITS"
echo -e "Complétude moyenne: $(colorize_percent $COMPLETENESS)"
echo -e "Cohérence moyenne: $(colorize_percent $CONSISTENCY)"
echo -e "Préparation à la migration: $(colorize_percent $MIGRATION_READINESS)"

echo -e "\n${BLUE}=== Tendances ===${NC}"
echo -e "Audits en amélioration: ${GREEN}$IMPROVING_COUNT${NC}"
echo -e "Audits en déclin: ${RED}$DECLINING_COUNT${NC}"

# Affichage des recommandations prioritaires
if [ $PRIORITY_COUNT -gt 0 ]; then
    echo -e "\n${BLUE}=== Audits prioritaires à améliorer ===${NC}"
    jq -r '.recommendations.priority[]' $QUALITY_REPORT | while read -r slug; do
        echo -e "- ${RED}$slug${NC}"
    done
    
    # Si beaucoup d'audits prioritaires, afficher un message d'avertissement
    if [ $PRIORITY_COUNT -gt 5 ]; then
        echo -e "\n${RED}⚠️  Attention: Un grand nombre d'audits ($PRIORITY_COUNT) nécessitent des améliorations urgentes!${NC}"
    fi
else
    echo -e "\n${GREEN}✅ Aucun audit prioritaire détecté${NC}"
fi

# Affichage des audits exemplaires
EXEMPLARY_COUNT=$(jq '.recommendations.exemplary | length' $QUALITY_REPORT)
if [ $EXEMPLARY_COUNT -gt 0 ]; then
    echo -e "\n${BLUE}=== Audits exemplaires ===${NC}"
    jq -r '.recommendations.exemplary[]' $QUALITY_REPORT | while read -r slug; do
        echo -e "- ${GREEN}$slug${NC}"
    done
fi

echo -e "\n${BLUE}Pour voir le tableau de bord complet:${NC} http://localhost:3000/quality-dashboard"

exit 0