#!/bin/bash
# prisma-pg-sync.sh - Script pour synchroniser PostgreSQL avec Prisma et mettre à jour les composants NestJS/Remix
# Auteur: DevOps Team
# Date: 2025-04-13

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MYSQL_DB_URL="${MYSQL_DB_URL:-mysql://user:password@localhost:3306/db_name}"
PG_DB_URL="${PG_DB_URL:-postgresql://postgres:postgres@localhost:5432/db_name}"
PRISMA_SCHEMA_PATH="./packages/database/prisma/schema.prisma"
SUGGESTED_SCHEMA_PATH="./packages/database/prisma/suggested_schema.prisma"
TYPE_MAPPING_PATH="./packages/database/prisma/type_mapping.json"
SCHEMA_DIFF_PATH="./packages/database/prisma/schema_migration_diff.json"
MIGRATION_WARNINGS_PATH="./reports/migration_warnings.json"
NESTJS_SERVICES_PATH="./apps/mcp-server-postgres/src/services"
REMIX_LOADERS_PATH="./apps/frontend/app/routes"
ENTITY_GRAPH_PATH="./docs/entity_graph.json"

# Afficher l'aide
function show_help {
  echo -e "${BLUE}Synchronisation PostgreSQL + Prisma : Intégration Fluide Backend / Frontend${NC}"
  echo ""
  echo "Ce script automatise la synchronisation entre PostgreSQL et Prisma,"
  echo "tout en mettant à jour les composants NestJS et Remix en conséquence."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -m, --mysql-url URL      URL de connexion MySQL (défaut: $MYSQL_DB_URL)"
  echo "  -p, --pg-url URL         URL de connexion PostgreSQL (défaut: $PG_DB_URL)"
  echo "  -s, --schema PATH        Chemin du schéma Prisma (défaut: $PRISMA_SCHEMA_PATH)"
  echo "  --analyze-only           Analyser uniquement, sans migrer"
  echo "  --migrate-schema         Migrer le schéma Prisma à partir des suggestions"
  echo "  --update-code            Mettre à jour le code NestJS et Remix"
  echo "  --generate-tests         Générer des tests unitaires"
  echo "  --update-docs            Mettre à jour la documentation"
  echo "  --create-dashboard       Créer un tableau de bord Remix pour la visualisation"
  echo "  --full                   Exécuter toutes les étapes (analyse, migration, mise à jour du code, tests, documentation)"
  echo "  --help                   Afficher cette aide"
  echo ""
  echo "Exemple:"
  echo "  $0 --full"
  exit 0
}

# Traiter les arguments
ANALYZE_ONLY=false
MIGRATE_SCHEMA=false
UPDATE_CODE=false
GENERATE_TESTS=false
UPDATE_DOCS=false
CREATE_DASHBOARD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--mysql-url)
      MYSQL_DB_URL="$2"
      shift 2
      ;;
    -p|--pg-url)
      PG_DB_URL="$2"
      shift 2
      ;;
    -s|--schema)
      PRISMA_SCHEMA_PATH="$2"
      shift 2
      ;;
    --analyze-only)
      ANALYZE_ONLY=true
      shift
      ;;
    --migrate-schema)
      MIGRATE_SCHEMA=true
      shift
      ;;
    --update-code)
      UPDATE_CODE=true
      shift
      ;;
    --generate-tests)
      GENERATE_TESTS=true
      shift
      ;;
    --update-docs)
      UPDATE_DOCS=true
      shift
      ;;
    --create-dashboard)
      CREATE_DASHBOARD=true
      shift
      ;;
    --full)
      ANALYZE_ONLY=true
      MIGRATE_SCHEMA=true
      UPDATE_CODE=true
      GENERATE_TESTS=true
      UPDATE_DOCS=true
      CREATE_DASHBOARD=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo -e "${RED}Option inconnue: $1${NC}"
      show_help
      ;;
  esac
done

# Créer les répertoires nécessaires
mkdir -p $(dirname "$PRISMA_SCHEMA_PATH")
mkdir -p $(dirname "$SUGGESTED_SCHEMA_PATH")
mkdir -p $(dirname "$TYPE_MAPPING_PATH")
mkdir -p $(dirname "$SCHEMA_DIFF_PATH")
mkdir -p $(dirname "$MIGRATION_WARNINGS_PATH")
mkdir -p $(dirname "$ENTITY_GRAPH_PATH")
mkdir -p "$NESTJS_SERVICES_PATH"
mkdir -p "$REMIX_LOADERS_PATH"
mkdir -p "./reports"
mkdir -p "./docs"

# Fonction pour vérifier les dépendances
function check_dependencies {
  echo -e "${BLUE}Vérification des dépendances...${NC}"
  
  # Vérifier Node.js et npm
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
  fi
  
  # Vérifier que Prisma CLI est installé
  if ! npx prisma -v &> /dev/null; then
    echo -e "${YELLOW}⚠️ Prisma CLI n'est pas installé. Installation en cours...${NC}"
    npm install -g prisma
  fi
  
  # Vérifier pgloader pour la migration
  if ! command -v pgloader &> /dev/null; then
    echo -e "${YELLOW}⚠️ pgloader n'est pas installé. Il sera nécessaire pour la migration des données.${NC}"
    echo -e "   Installez-le avec: sudo apt-get install pgloader"
  fi
  
  # Vérifier jq pour le traitement JSON
  if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️ jq n'est pas installé. Installation en cours...${NC}"
    sudo apt-get install -y jq
  fi
  
  echo -e "${GREEN}✅ Toutes les dépendances sont disponibles${NC}"
}

# Fonction pour analyser MySQL et suggérer un schéma Prisma
function analyze_mysql_schema {
  echo -e "${BLUE}Analyse du schéma MySQL et génération d'un schéma Prisma suggéré...${NC}"
  
  # Exécuter l'agent sql-analyzer
  node ./agents/analysis/sql-analyzer.js \
    --source mysql \
    --url "$MYSQL_DB_URL" \
    --output-schema "$SUGGESTED_SCHEMA_PATH" \
    --output-mapping "$TYPE_MAPPING_PATH"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schéma Prisma suggéré généré avec succès: $SUGGESTED_SCHEMA_PATH${NC}"
    echo -e "${GREEN}✅ Mapping des types généré avec succès: $TYPE_MAPPING_PATH${NC}"
  else
    echo -e "${RED}❌ Erreur lors de l'analyse du schéma MySQL${NC}"
    exit 1
  fi
  
  # Générer le diff entre le schéma actuel et suggéré
  if [ -f "$PRISMA_SCHEMA_PATH" ]; then
    echo -e "${BLUE}Génération du diff entre le schéma actuel et suggéré...${NC}"
    
    node ./agents/analysis/schema-differ.js \
      --current "$PRISMA_SCHEMA_PATH" \
      --suggested "$SUGGESTED_SCHEMA_PATH" \
      --output "$SCHEMA_DIFF_PATH"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Diff du schéma généré avec succès: $SCHEMA_DIFF_PATH${NC}"
      
      # Afficher un résumé des différences
      echo -e "${BLUE}Résumé des différences:${NC}"
      jq -r '.summary' "$SCHEMA_DIFF_PATH"
      
      # Générer les avertissements de migration
      echo -e "${BLUE}Génération des avertissements de migration...${NC}"
      
      node ./agents/analysis/migration-warnings.js \
        --diff "$SCHEMA_DIFF_PATH" \
        --output "$MIGRATION_WARNINGS_PATH"
      
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Avertissements de migration générés avec succès: $MIGRATION_WARNINGS_PATH${NC}"
        
        # Afficher les avertissements critiques
        CRITICAL_WARNINGS=$(jq '.warnings | map(select(.severity == "critical")) | length' "$MIGRATION_WARNINGS_PATH")
        if [ "$CRITICAL_WARNINGS" -gt 0 ]; then
          echo -e "${RED}⚠️ $CRITICAL_WARNINGS avertissements critiques détectés!${NC}"
          jq -r '.warnings | map(select(.severity == "critical")) | .[] | "- " + .message' "$MIGRATION_WARNINGS_PATH"
        fi
      else
        echo -e "${RED}❌ Erreur lors de la génération des avertissements de migration${NC}"
      fi
    else
      echo -e "${RED}❌ Erreur lors de la génération du diff du schéma${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Aucun schéma Prisma existant trouvé. Aucun diff généré.${NC}"
  fi
}

# Fonction pour migrer le schéma Prisma
function migrate_prisma_schema {
  echo -e "${BLUE}Migration du schéma Prisma...${NC}"
  
  # Vérifier si le schéma suggéré existe
  if [ ! -f "$SUGGESTED_SCHEMA_PATH" ]; then
    echo -e "${RED}❌ Aucun schéma suggéré trouvé. Exécutez d'abord l'analyse.${NC}"
    exit 1
  fi
  
  # Créer une sauvegarde du schéma actuel si existant
  if [ -f "$PRISMA_SCHEMA_PATH" ]; then
    BACKUP_PATH="${PRISMA_SCHEMA_PATH}.backup-$(date +%Y%m%d%H%M%S)"
    cp "$PRISMA_SCHEMA_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}✅ Sauvegarde du schéma actuel créée: $BACKUP_PATH${NC}"
  fi
  
  # Copier le schéma suggéré vers le schéma final
  cp "$SUGGESTED_SCHEMA_PATH" "$PRISMA_SCHEMA_PATH"
  echo -e "${GREEN}✅ Schéma Prisma mis à jour avec succès${NC}"
  
  # Générer le client Prisma
  echo -e "${BLUE}Génération du client Prisma...${NC}"
  cd $(dirname "$PRISMA_SCHEMA_PATH")/../..
  npx prisma generate
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client Prisma généré avec succès${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération du client Prisma${NC}"
    exit 1
  fi
  
  cd - > /dev/null
}

# Fonction pour mettre à jour le code NestJS
function update_nestjs_code {
  echo -e "${BLUE}Mise à jour des services, DTOs et controllers NestJS...${NC}"
  
  # Exécuter le générateur de code NestJS
  node ./agents/migration/dev-generator.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --output "$NESTJS_SERVICES_PATH" \
    --type nestjs
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code NestJS mis à jour avec succès${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la mise à jour du code NestJS${NC}"
    exit 1
  fi
}

# Fonction pour mettre à jour le code Remix
function update_remix_code {
  echo -e "${BLUE}Mise à jour des loaders, actions et meta Remix...${NC}"
  
  # Exécuter le générateur de code Remix
  node ./agents/migration/remix-generator.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --output "$REMIX_LOADERS_PATH"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code Remix mis à jour avec succès${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la mise à jour du code Remix${NC}"
    exit 1
  fi
}

# Fonction pour générer des tests unitaires
function generate_tests {
  echo -e "${BLUE}Génération des tests unitaires...${NC}"
  
  # Générer des tests pour NestJS
  echo -e "${BLUE}Génération des tests NestJS...${NC}"
  node ./agents/quality/test-writer.js \
    --source "$NESTJS_SERVICES_PATH" \
    --type nestjs
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests NestJS générés avec succès${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération des tests NestJS${NC}"
    exit 1
  fi
  
  # Générer des tests pour Remix
  echo -e "${BLUE}Génération des tests Remix...${NC}"
  node ./agents/quality/test-writer.js \
    --source "$REMIX_LOADERS_PATH" \
    --type remix
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests Remix générés avec succès${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération des tests Remix${NC}"
    exit 1
  fi
}

# Fonction pour mettre à jour la documentation
function update_documentation {
  echo -e "${BLUE}Mise à jour de la documentation...${NC}"
  
  # Générer le graphe d'entités
  echo -e "${BLUE}Génération du graphe d'entités...${NC}"
  node ./agents/documentation/entity-graph-generator.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --output "$ENTITY_GRAPH_PATH"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Graphe d'entités généré avec succès: $ENTITY_GRAPH_PATH${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération du graphe d'entités${NC}"
    exit 1
  fi
  
  # Générer le plan de migration
  echo -e "${BLUE}Génération du plan de migration...${NC}"
  node ./agents/documentation/migration-plan-generator.js \
    --diff "$SCHEMA_DIFF_PATH" \
    --warnings "$MIGRATION_WARNINGS_PATH" \
    --output "./docs/migration_plan.md"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Plan de migration généré avec succès: ./docs/migration_plan.md${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération du plan de migration${NC}"
    exit 1
  fi
  
  # Générer les notes d'optimisation du schéma
  echo -e "${BLUE}Génération des notes d'optimisation du schéma...${NC}"
  node ./agents/documentation/schema-optimization-notes.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --output "./docs/schema_optimization_notes.md"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Notes d'optimisation du schéma générées avec succès: ./docs/schema_optimization_notes.md${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la génération des notes d'optimisation du schéma${NC}"
    exit 1
  fi
}

# Fonction pour créer un tableau de bord de migration Remix
function create_dashboard {
  echo -e "${BLUE}Création du tableau de bord de migration Remix...${NC}"
  
  # Créer le composant de tableau de bord
  mkdir -p "./apps/frontend/app/routes/dashboard"
  
  node ./agents/documentation/dashboard-generator.js \
    --diff "$SCHEMA_DIFF_PATH" \
    --warnings "$MIGRATION_WARNINGS_PATH" \
    --entity-graph "$ENTITY_GRAPH_PATH" \
    --output "./apps/frontend/app/routes/dashboard/prisma-migration.tsx"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tableau de bord de migration Remix créé avec succès: ./apps/frontend/app/routes/dashboard/prisma-migration.tsx${NC}"
  else
    echo -e "${RED}❌ Erreur lors de la création du tableau de bord de migration Remix${NC}"
    exit 1
  fi
}

# Ajoutons une fonction de vérification d'intégrité bidirectionnelle
function verify_bidirectional_integrity {
  echo -e "${BLUE}Vérification de l'intégrité bidirectionnelle (Prisma ⟷ PostgreSQL)...${NC}"
  
  # Vérifier que le schéma PostgreSQL correspond au schéma Prisma
  node ./agents/analysis/integrity-checker.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --db-url "$PG_DB_URL" \
    --output "./reports/integrity_report.json"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vérification d'intégrité terminée${NC}"
    
    # Afficher un résumé des problèmes d'intégrité
    INTEGRITY_ISSUES=$(jq '.issues | length' "./reports/integrity_report.json")
    if [ "$INTEGRITY_ISSUES" -gt 0 ]; then
      echo -e "${YELLOW}⚠️ $INTEGRITY_ISSUES problèmes d'intégrité détectés!${NC}"
      jq -r '.issues | .[] | "- " + .message' "./reports/integrity_report.json"
      
      # Proposer des corrections automatiques
      echo -e "${BLUE}Génération de corrections automatiques...${NC}"
      node ./agents/migration/integrity-fixer.js \
        --report "./reports/integrity_report.json" \
        --schema "$PRISMA_SCHEMA_PATH" \
        --output "./packages/database/prisma/schema_fixed.prisma"
      
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Corrections générées: ./packages/database/prisma/schema_fixed.prisma${NC}"
        echo -e "${YELLOW}⚠️ Vérifiez les corrections avant de les appliquer:${NC}"
        echo -e "   diff $PRISMA_SCHEMA_PATH ./packages/database/prisma/schema_fixed.prisma"
      else
        echo -e "${RED}❌ Erreur lors de la génération des corrections${NC}"
      fi
    else
      echo -e "${GREEN}✅ Aucun problème d'intégrité détecté${NC}"
    fi
  else
    echo -e "${RED}❌ Erreur lors de la vérification d'intégrité${NC}"
    exit 1
  fi
}

# Ajoutons une fonction pour la synchronisation sémantique des relations Prisma
function sync_prisma_relations {
  echo -e "${BLUE}Synchronisation sémantique des relations Prisma...${NC}"
  
  # Analyser les relations entre les modèles
  node ./agents/analysis/relation-analyzer.js \
    --schema "$PRISMA_SCHEMA_PATH" \
    --output "./reports/relation_analysis.json"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Analyse des relations terminée${NC}"
    
    # Optimisation des relations
    echo -e "${BLUE}Optimisation des relations...${NC}"
    node ./agents/optimization/relation-optimizer.js \
      --analysis "./reports/relation_analysis.json" \
      --schema "$PRISMA_SCHEMA_PATH" \
      --output "./packages/database/prisma/schema_optimized.prisma"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Optimisation des relations terminée${NC}"
      echo -e "${YELLOW}⚠️ Vérifiez les optimisations proposées:${NC}"
      echo -e "   diff $PRISMA_SCHEMA_PATH ./packages/database/prisma/schema_optimized.prisma"
    else
      echo -e "${RED}❌ Erreur lors de l'optimisation des relations${NC}"
    fi
  else
    echo -e "${RED}❌ Erreur lors de l'analyse des relations${NC}"
  fi
}

# Fonction principale
function main {
  # Vérifier les dépendances
  check_dependencies
  
  # Analyse du schéma MySQL
  if [ "$ANALYZE_ONLY" = true ]; then
    analyze_mysql_schema
  fi
  
  # Migration du schéma Prisma
  if [ "$MIGRATE_SCHEMA" = true ]; then
    migrate_prisma_schema
  fi
  
  # Vérification bidirectionnelle de l'intégrité
  verify_bidirectional_integrity
  
  # Synchronisation des relations Prisma
  sync_prisma_relations
  
  # Mise à jour du code
  if [ "$UPDATE_CODE" = true ]; then
    update_nestjs_code
    update_remix_code
  fi
  
  # Génération des tests
  if [ "$GENERATE_TESTS" = true ]; then
    generate_tests
  fi
  
  # Mise à jour de la documentation
  if [ "$UPDATE_DOCS" = true ]; then
    update_documentation
  fi
  
  # Création du tableau de bord
  if [ "$CREATE_DASHBOARD" = true ]; then
    create_dashboard
  fi
  
  echo -e "\n${GREEN}✅ Synchronisation PostgreSQL + Prisma terminée avec succès !${NC}"
}

# Exécuter la fonction principale
main