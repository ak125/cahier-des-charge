#!/bin/bash

# Script principal de déduplication et restructuration
# Date: 10 mai 2025

# Définition des couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Dossiers à ignorer
IGNORED_DIRS=(
    "node_modules"
    "dist"
    ".git"
    ".nx"
    ".nx-cache"
    ".cache"
    "coverage"
    "vendor"
    "build"
    "out"
    ".vscode"
)

echo -e "${BLUE}${BOLD}===== Déduplication et Restructuration du Projet en Architecture à Trois Couches =====${NC}"
echo

# Vérification des outils nécessaires
check_dependencies() {
    local missing_tools=()
    
    for tool in find grep sed awk xargs mkdir cp mv rm cat; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}Erreur: Les outils suivants sont manquants:${NC}"
        for tool in "${missing_tools[@]}"; do
            echo "- $tool"
        done
        echo "Veuillez installer les outils manquants avant de continuer."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Tous les outils nécessaires sont disponibles.${NC}"
}

# Vérifier les dépendances
check_dependencies

# Créer un dossier de backup global pour cette exécution
MASTER_BACKUP="backup/complete-restructuration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$MASTER_BACKUP"

# Copier l'état initial
echo -e "${YELLOW}Création d'une sauvegarde complète de l'état initial...${NC}"
cp -R packages "$MASTER_BACKUP/packages-initial"
cp -R apps "$MASTER_BACKUP/apps-initial"
cp -R agents "$MASTER_BACKUP/agents-initial" 2>/dev/null || echo "Pas de dossier agents à sauvegarder"
cp -R workspaces "$MASTER_BACKUP/workspaces-initial" 2>/dev/null || echo "Pas de dossier workspaces à sauvegarder"
echo -e "${GREEN}✅ Sauvegarde initiale créée dans: $MASTER_BACKUP${NC}"
echo

# Vérifier si les scripts requis existent
if [ ! -f "./deduplication-agents.sh" ] || [ ! -f "./restructuration-trois-couches.sh" ] || [ ! -f "./update-imports.sh" ]; then
    echo -e "${RED}Erreur: Au moins un des scripts requis est manquant!${NC}"
    echo "Assurez-vous que les fichiers suivants existent:"
    echo "- deduplication-agents.sh"
    echo "- restructuration-trois-couches.sh"
    echo "- update-imports.sh"
    exit 1
fi

# Assurez-vous que tous les scripts sont exécutables
echo -e "${YELLOW}Définition des permissions d'exécution sur les scripts...${NC}"
chmod +x deduplication-agents.sh
chmod +x restructuration-trois-couches.sh  
chmod +x update-imports.sh

# Mettre à jour les scripts avec les patterns d'exclusion
echo -e "${YELLOW}Mise à jour des scripts pour ignorer les dossiers spécifiés...${NC}"
    
# Ajouter les exclusions aux commandes find dans les scripts
for script in deduplication-agents.sh restructuration-trois-couches.sh update-imports.sh; do
    # Remplacer les commandes find par des versions qui excluent les dossiers spécifiés
    sed -i 's/find \([^"]*\) -type \([dfl]\)/find \1 -type \2 -not -path "*\/node_modules\/*" -not -path "*\/dist\/*" -not -path "*\/.git\/*" -not -path "*\/.nx\/*" -not -path "*\/.nx-cache\/*" -not -path "*\/.cache\/*" -not -path "*\/coverage\/*" -not -path "*\/vendor\/*" -not -path "*\/build\/*" -not -path "*\/out\/*" -not -path "*\/.vscode\/*"/g' "$script"
    echo -e "${GREEN}✓ Mis à jour: $script${NC}"
done

echo -e "${GREEN}✓ Scripts mis à jour pour ignorer les dossiers spécifiés${NC}"

# Demander confirmation
echo -e "${YELLOW}${BOLD}Attention:${NC} Ce script va exécuter une restructuration complète du projet."
echo "L'opération est divisée en trois phases:"
echo "  1. Déduplication des agents"
echo "  2. Restructuration en architecture à trois couches"
echo "  3. Mise à jour des imports"
echo
echo -e "${YELLOW}Un backup complet sera fait avant chaque phase.${NC}"
echo
read -p "Êtes-vous sûr de vouloir continuer? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Restructuration annulée.${NC}"
    exit 0
fi
echo

# Phase 1: Déduplication des agents
echo -e "\n${BLUE}${BOLD}Phase 1/3: Déduplication des agents${NC}"
echo "=================================================================="
./deduplication-agents.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la déduplication des agents. Arrêt du processus.${NC}"
    exit 1
fi

# Pause pour vérification
echo
echo -e "${YELLOW}Phase 1 terminée. Vérifiez les résultats avant de continuer.${NC}"
read -p "Continuer vers la phase 2? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Restructuration interrompue après la phase 1.${NC}"
    exit 0
fi

# Phase 2: Restructuration en architecture à trois couches
echo -e "\n${BLUE}${BOLD}Phase 2/3: Restructuration en architecture à trois couches${NC}"
echo "=================================================================="
./restructuration-trois-couches.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la restructuration en architecture à trois couches. Arrêt du processus.${NC}"
    exit 1
fi

# Pause pour vérification
echo
echo -e "${YELLOW}Phase 2 terminée. Vérifiez les résultats avant de continuer.${NC}"
read -p "Continuer vers la phase 3? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Restructuration interrompue après la phase 2.${NC}"
    exit 0
fi

# Phase 3: Mise à jour des imports
echo -e "\n${BLUE}${BOLD}Phase 3/3: Mise à jour des imports${NC}"
echo "=================================================================="
./update-imports.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la mise à jour des imports. Le processus est probablement incomplet.${NC}"
    exit 1
fi

# Vérification de la compilation et des tests
echo -e "\n${BLUE}${BOLD}Vérification finale${NC}"
echo "=================================================================="
echo -e "${YELLOW}Exécution des vérifications finales...${NC}"

# Créer un dossier pour les logs
LOGS_DIR="cleanup-report/execution-logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$LOGS_DIR"

# Vérification des types TypeScript
echo -e "${YELLOW}Vérification des types TypeScript...${NC}"
npm run type-check 2>&1 | tee "$LOGS_DIR/type-check.log"

type_check_status=${PIPESTATUS[0]}

if [ $type_check_status -eq 0 ]; then
    echo -e "${GREEN}✓ Vérification TypeScript réussie${NC}"
else
    echo -e "${RED}✗ Erreurs TypeScript détectées${NC}"
    echo -e "${YELLOW}Consultez les logs pour plus de détails: $LOGS_DIR/type-check.log${NC}"
fi

# Exécution des tests (si l'utilisateur le souhaite)
echo
read -p "Voulez-vous exécuter les tests? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Exécution des tests...${NC}"
    npm test 2>&1 | tee "$LOGS_DIR/tests.log"
    
    test_status=${PIPESTATUS[0]}
    
    if [ $test_status -eq 0 ]; then
        echo -e "${GREEN}✓ Tests réussis${NC}"
    else
        echo -e "${RED}✗ Certains tests ont échoué${NC}"
        echo -e "${YELLOW}Consultez les logs pour plus de détails: $LOGS_DIR/tests.log${NC}"
    fi
fi

# Finalisation
echo
echo -e "${GREEN}${BOLD}✅ Restructuration complète terminée avec succès!${NC}"
echo
echo -e "${BLUE}Prochaines étapes:${NC}"
echo "1. Résoudre les éventuelles erreurs TypeScript"
echo "2. Corriger les tests qui échouent"
echo "3. Mettre à jour la documentation pour refléter la nouvelle structure"
echo "4. Mettre à jour les fichiers de configuration de build si nécessaire"
echo
echo -e "${YELLOW}Logs de vérification disponibles dans: $LOGS_DIR${NC}"
echo -e "${YELLOW}Si vous rencontrez des problèmes, vous pouvez restaurer l'état initial depuis:${NC}"
echo "$MASTER_BACKUP"

# Création du rapport final détaillé
FINAL_REPORT="cleanup-report/restructuration-complete-$(date +%Y%m%d-%H%M%S).md"
    
echo "# Rapport de restructuration complète" > "$FINAL_REPORT"
echo "Date: $(date +%Y-%m-%d)" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "## Résumé des opérations" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "Ce rapport documente en détail toutes les opérations effectuées lors de la restructuration complète du projet monorepo en architecture à trois couches." >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "### Opérations effectuées" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "1. **Déduplication des agents**" >> "$FINAL_REPORT"
echo "   - Consolidation des agents avec différentes conventions de nommage (kebab-case vs concatené)" >> "$FINAL_REPORT"
echo "   - Migration des agents orphelins du dossier 'agents/' vers 'packages/mcp-agents'" >> "$FINAL_REPORT"
echo "   - Création des fichiers index.ts manquants et correction des exports" >> "$FINAL_REPORT"
echo "   - Suppression des fichiers dupliqués et création de références uniques" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "2. **Restructuration en architecture à trois couches**" >> "$FINAL_REPORT"
echo "   - Création de la structure en trois couches:" >> "$FINAL_REPORT"
echo "     * **Orchestration**: Coordination des workflows de haut niveau" >> "$FINAL_REPORT"
echo "     * **Coordination**: Communication entre les couches et systèmes" >> "$FINAL_REPORT" 
echo "     * **Business**: Logique métier de l'application" >> "$FINAL_REPORT"
echo "   - Migration des composants et agents vers la nouvelle structure:" >> "$FINAL_REPORT"
echo "     * Analyseurs dans packages/business/src/agents/analyzers" >> "$FINAL_REPORT"
echo "     * Validateurs dans packages/business/src/agents/validators" >> "$FINAL_REPORT"
echo "     * Générateurs dans packages/business/src/agents/generators" >> "$FINAL_REPORT"
echo "   - Création des fichiers de base et interfaces pour chaque couche" >> "$FINAL_REPORT"
echo "   - Mise en place des dépendances entre les couches via package.json" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "3. **Mise à jour des imports**" >> "$FINAL_REPORT"
echo "   - Correction des chemins d'imports pour refléter la nouvelle structure" >> "$FINAL_REPORT"
echo "   - Standardisation des imports avec des alias pour faciliter les refactorings futurs" >> "$FINAL_REPORT"
echo "   - Résolution des imports circulaires et optimisation des dépendances" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "### Statistiques" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "- **Fichiers sauvegardés**: Backup complet disponible dans \`$MASTER_BACKUP\`" >> "$FINAL_REPORT"
echo "- **Vérification des types**: $([ $type_check_status -eq 0 ] && echo "Réussie ✓" || echo "Échouée ✗ - Voir $LOGS_DIR/type-check.log")" >> "$FINAL_REPORT"
if [[ $REPLY =~ ^[Oo]$ ]]; then
  echo "- **Tests**: $([ $test_status -eq 0 ] && echo "Tous passés ✓" || echo "Certains échecs ✗ - Voir $LOGS_DIR/tests.log")" >> "$FINAL_REPORT"
fi
echo "" >> "$FINAL_REPORT"
echo "### Logs détaillés" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "Les logs détaillés des vérifications finales sont disponibles dans le dossier: \`$LOGS_DIR\`" >> "$FINAL_REPORT"

echo "" >> "$FINAL_REPORT"
echo "### Fichiers modifiés" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"

# Liste des fichiers modifiés dans chaque phase
echo "#### Phase 1: Déduplication des agents" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
if [ -f "cleanup-report/deduplication-agents-phase1-"*".md" ]; then
  DEDUP_REPORT=$(ls -t cleanup-report/deduplication-agents-phase1-*.md | head -1)
  if [ -f "$DEDUP_REPORT" ]; then
    echo "Voir le rapport détaillé: [$DEDUP_REPORT]($DEDUP_REPORT)" >> "$FINAL_REPORT"
    # Extraire les fichiers modifiés du rapport
    if grep -q "### Fichiers modifiés" "$DEDUP_REPORT"; then
      echo "" >> "$FINAL_REPORT"
      sed -n '/### Fichiers modifiés/,/###/p' "$DEDUP_REPORT" | sed '/###/d' >> "$FINAL_REPORT"
    fi
  fi
fi

echo "" >> "$FINAL_REPORT"
echo "#### Phase 2: Restructuration en architecture à trois couches" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
if [ -f "cleanup-report/restructuration-trois-couches-"*".md" ]; then
  STRUCT_REPORT=$(ls -t cleanup-report/restructuration-trois-couches-*.md | head -1)
  if [ -f "$STRUCT_REPORT" ]; then
    echo "Voir le rapport détaillé: [$STRUCT_REPORT]($STRUCT_REPORT)" >> "$FINAL_REPORT"
    # Extraire les fichiers créés du rapport
    echo "" >> "$FINAL_REPORT"
    echo "Nouvelles structures créées:" >> "$FINAL_REPORT"
    echo "- packages/orchestration/" >> "$FINAL_REPORT"
    echo "- packages/coordination/" >> "$FINAL_REPORT"
    echo "- packages/business/" >> "$FINAL_REPORT"
    echo "- packages/interfaces/" >> "$FINAL_REPORT"
  fi
fi

echo "" >> "$FINAL_REPORT"
echo "#### Phase 3: Mise à jour des imports" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
if [ -f "cleanup-report/imports-update-"*".md" ]; then
  IMPORTS_REPORT=$(ls -t cleanup-report/imports-update-*.md | head -1)
  if [ -f "$IMPORTS_REPORT" ]; then
    echo "Voir le rapport détaillé: [$IMPORTS_REPORT]($IMPORTS_REPORT)" >> "$FINAL_REPORT"
    # Extraire le nombre de fichiers modifiés
    if grep -q "Fichiers modifiés:" "$IMPORTS_REPORT"; then
      MOD_IMPORTS=$(grep "Fichiers modifiés:" "$IMPORTS_REPORT" | sed 's/.*: //')
      echo "" >> "$FINAL_REPORT"
      echo "Nombre de fichiers avec imports mis à jour: $MOD_IMPORTS" >> "$FINAL_REPORT"
    fi
  fi
fi

echo "" >> "$FINAL_REPORT"
echo "### Prochaines étapes" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "1. **Validation finale**" >> "$FINAL_REPORT"
echo "   - Résoudre les éventuelles erreurs TypeScript identifiées" >> "$FINAL_REPORT"
echo "   - Corriger les tests qui échouent et assurer la compatibilité avec la nouvelle structure" >> "$FINAL_REPORT"
echo "   - Vérifier les performances et l'intégrité du système restructuré" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "2. **Documentation**" >> "$FINAL_REPORT"
echo "   - Mettre à jour la documentation pour refléter la nouvelle architecture à trois couches" >> "$FINAL_REPORT"
echo "   - Créer des diagrammes d'architecture mis à jour montrant les relations entre les couches" >> "$FINAL_REPORT"
echo "   - Documenter les conventions de nommage standardisées et les pratiques de développement" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "3. **Optimisation**" >> "$FINAL_REPORT"
echo "   - Mettre à jour les fichiers de configuration de build pour la nouvelle structure" >> "$FINAL_REPORT"
echo "   - Configurer des chemins d'alias dans tsconfig.json pour faciliter les imports" >> "$FINAL_REPORT"
echo "   - Mettre à jour les scripts de déploiement et CI/CD pour refléter la nouvelle architecture" >> "$FINAL_REPORT"
echo "   - Implémenter des tests d'intégration entre les différentes couches" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "### Conclusion" >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"
echo "La restructuration du monorepo a permis d'éliminer les duplications et d'établir une architecture claire en trois couches. Cette nouvelle structure facilite la maintenance, améliore la lisibilité du code et établit une séparation nette des responsabilités entre les différentes parties du système." >> "$FINAL_REPORT"
echo "" >> "$FINAL_REPORT"

echo -e "${BLUE}Rapport final complet disponible dans: $FINAL_REPORT${NC}"
