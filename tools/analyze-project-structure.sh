#!/bin/bash
# Script d'analyse de la structure du projet pour identifier les doublons et éléments obsolètes
# Date: 9 mai 2025

# Définition des couleurs pour la lisibilité
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="./reports/structure-analysis-$(date +%Y%m%d-%H%M%S)"
mkdir -p $OUTPUT_DIR

echo -e "${BLUE}[INFO]${NC} Analyse de la structure du projet en cours..."

# 1. Identifier les dossiers de backup et archive
echo -e "${BLUE}[INFO]${NC} Identification des dossiers de sauvegarde et d'archives..."
find . -type d -name "*backup*" -o -name "*archive*" | sort > "$OUTPUT_DIR/backup-folders.txt"
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/backup-folders.txt") dossiers de sauvegarde identifiés"

# 2. Identifier les fichiers dupliqués (basé sur le contenu)
echo -e "${BLUE}[INFO]${NC} Identification des fichiers dupliqués par contenu (peut prendre du temps)..."
find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs md5sum | sort | uniq -w32 -d --all-repeated=separate > "$OUTPUT_DIR/duplicate-files-content.txt"
echo -e "${GREEN}[SUCCESS]${NC} Fichiers dupliqués identifiés par contenu"

# 3. Identifier les modules dupliqués par nom
echo -e "${BLUE}[INFO]${NC} Identification des modules dupliqués par nom..."
find . -type f -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" | xargs grep -l "name" | sort > "$OUTPUT_DIR/package-json-files.txt"
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/package-json-files.txt") fichiers package.json identifiés"

# 4. Identifier les fichiers de configuration dupliqués
echo -e "${BLUE}[INFO]${NC} Identification des fichiers de configuration dupliqués..."
find . -type f -name "tsconfig.json" -o -name "jest.config.js" -o -name ".eslintrc.js" -o -name ".prettierrc" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort > "$OUTPUT_DIR/config-files.txt"
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/config-files.txt") fichiers de configuration identifiés"

# 5. Identifier les fichiers avec préfixe legacy
echo -e "${BLUE}[INFO]${NC} Identification des fichiers et dossiers legacy..."
find . -name "*legacy*" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort > "$OUTPUT_DIR/legacy-files.txt"
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/legacy-files.txt") éléments avec préfixe 'legacy' identifiés"

# 6. Analyser la structure des dossiers
echo -e "${BLUE}[INFO]${NC} Analyse de la structure des dossiers..."
find . -type d -mindepth 1 -maxdepth 3 -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" | sort > "$OUTPUT_DIR/folder-structure.txt"
echo -e "${GREEN}[SUCCESS]${NC} Structure des dossiers analysée"

# 7. Identifier les fichiers d'orchestration potentiellement dupliqués
echo -e "${BLUE}[INFO]${NC} Recherche des orchestrateurs dupliqués..."
find . -type f -name "*orchestrat*" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort > "$OUTPUT_DIR/orchestrator-files.txt"
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/orchestrator-files.txt") fichiers d'orchestration identifiés"

# 8. Identifier les agents dupliqués
echo -e "${BLUE}[INFO]${NC} Recherche des agents dupliqués..."
find . -type f -path "*/agents/*" -name "*.ts" -o -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" | sort > "$OUTPUT_DIR/agent-files.txt" 
echo -e "${GREEN}[SUCCESS]${NC} $(wc -l < "$OUTPUT_DIR/agent-files.txt") fichiers d'agents identifiés"

# 9. Analyser les dépendances du package.json racine
echo -e "${BLUE}[INFO]${NC} Analyse des dépendances du package.json racine..."
jq '.dependencies, .devDependencies' package.json > "$OUTPUT_DIR/root-dependencies.json"
echo -e "${GREEN}[SUCCESS]${NC} Dépendances racine analysées"

# 10. Création d'un rapport de synthèse
echo -e "${BLUE}[INFO]${NC} Création du rapport de synthèse..."
cat > "$OUTPUT_DIR/analysis-summary.md" << EOF
# Rapport d'analyse de la structure du projet
Date: $(date +"%d/%m/%Y %H:%M:%S")

## Résumé

- **Dossiers de sauvegarde**: $(wc -l < "$OUTPUT_DIR/backup-folders.txt") dossiers
- **Fichiers dupliqués** (par contenu): voir duplicate-files-content.txt
- **Fichiers package.json**: $(wc -l < "$OUTPUT_DIR/package-json-files.txt") fichiers
- **Fichiers de configuration**: $(wc -l < "$OUTPUT_DIR/config-files.txt") fichiers
- **Éléments legacy**: $(wc -l < "$OUTPUT_DIR/legacy-files.txt") éléments
- **Fichiers d'orchestration**: $(wc -l < "$OUTPUT_DIR/orchestrator-files.txt") fichiers
- **Fichiers d'agents**: $(wc -l < "$OUTPUT_DIR/agent-files.txt") fichiers

## Prochaines étapes recommandées

1. Supprimer les dossiers de sauvegarde obsolètes
2. Fusionner les fichiers dupliqués
3. Standardiser les fichiers de configuration
4. Migrer ou supprimer les éléments legacy
5. Consolider les orchestrateurs et agents
EOF

echo -e "${GREEN}[SUCCESS]${NC} Analyse terminée. Rapport disponible dans $OUTPUT_DIR"
echo -e "\n${BLUE}[INFO]${NC} Pour des actions automatisées de nettoyage, consultez le rapport et exécutez le script de nettoyage adapté."
