#!/bin/bash

# Script d'audit approfondi de la structure du projet et des doublons
# Date: 10 mai 2025

echo -e "\n\033[1;34m=== Audit de la structure du projet et des doublons ===\033[0m\n"

# Création du dossier pour le rapport
REPORT_DIR="/workspaces/cahier-des-charge/reports/audit-structure-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/rapport-audit-structure.md"

# En-tête du rapport
echo "# Audit de structure et doublons - $(date +%Y-%m-%d)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## 1. Structure générale du projet" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Analyse de la structure générale
echo "### 1.1 Répertoires racine" >> "$REPORT_FILE"
find . -maxdepth 1 -type d | sort | grep -v "^\.$" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Analyse des principaux dossiers
echo "### 1.2 Statistiques des principaux répertoires" >> "$REPORT_FILE"
echo "| Répertoire | Nombre fichiers | Nombre sous-dossiers | Taille totale |" >> "$REPORT_FILE"
echo "|------------|----------------|---------------------|---------------|" >> "$REPORT_FILE"

for dir in agents apps archives_old backup cleanup-report cleanup-scripts docs packages tools workspaces; do
    if [ -d "$dir" ]; then
        FILES=$(find "$dir" -type f | wc -l)
        DIRS=$(find "$dir" -type d | wc -l)
        SIZE=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
        echo "| $dir | $FILES | $DIRS | $SIZE |" >> "$REPORT_FILE"
    fi
done
echo "" >> "$REPORT_FILE"

# Analyse des doublons potentiels
echo -e "\033[0;33mAnalyse des doublons potentiels...\033[0m"
echo "## 2. Doublons potentiels dans la structure" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2.1 Dossiers avec des noms similaires
echo "### 2.1 Dossiers avec des noms similaires" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
find . -type d -name "*agent*" | sort >> "$REPORT_FILE"
echo -e "\n--------------------------------------------------\n" >> "$REPORT_FILE"
find . -type d -name "*server*" | sort >> "$REPORT_FILE"
echo -e "\n--------------------------------------------------\n" >> "$REPORT_FILE"
find . -type d -name "*mcp*" | sort >> "$REPORT_FILE"
echo -e "\n--------------------------------------------------\n" >> "$REPORT_FILE"
find . -type d -name "*utils*" | sort >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2.2 Fichiers importants dupliqués dans différents chemins
echo "### 2.2 Fichiers potentiellement dupliqués" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "# Fichiers README.md" >> "$REPORT_FILE"
find . -name "README.md" | sort >> "$REPORT_FILE"
echo -e "\n--------------------------------------------------\n" >> "$REPORT_FILE"
echo "# Fichiers package.json" >> "$REPORT_FILE"
find . -name "package.json" | sort >> "$REPORT_FILE"
echo -e "\n--------------------------------------------------\n" >> "$REPORT_FILE"
echo "# Fichiers de configuration" >> "$REPORT_FILE"
find . -name "*.config.js" -o -name "*.config.ts" | sort >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2.3 Recherche de modules en double
echo "### 2.3 Modules potentiellement dupliqués" >> "$REPORT_FILE"
echo "Recherche des fichiers d'index similaires dans différents chemins:" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
find . -name "index.ts" -o -name "index.js" | grep -v "node_modules" | sort >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2.4 Fichiers vides (potentiellement problématiques)
echo "### 2.4 Fichiers vides" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -size 0 | sort >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Analyse des imports et dépendances problématiques
echo "## 3. Analyse des imports problématiques" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### 3.1 Imports absolus vs relatifs" >> "$REPORT_FILE"
echo "Recherche des différentes façons d'importer les mêmes modules:" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
grep -r "import.*from" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep "\@" | head -20 >> "$REPORT_FILE"
echo -e "\n...(limité aux 20 premiers résultats)\n" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Recommandations basées sur l'analyse
echo "## 4. Recommandations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Sur la base de cette analyse, voici les principales recommandations pour résoudre les problèmes de structure et de doublons:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Consolidation des dossiers d'agents** - Unifier les différentes variantes des dossiers d'agents" >> "$REPORT_FILE"
echo "2. **Standardisation des serveurs MCP** - Consolider les différentes implémentations des serveurs" >> "$REPORT_FILE"
echo "3. **Normalisation des utilitaires** - Regrouper les utilitaires similaires dans une structure cohérente" >> "$REPORT_FILE"
echo "4. **Nettoyage des fichiers vides** - Supprimer ou compléter les fichiers vides" >> "$REPORT_FILE"
echo "5. **Standardisation des imports** - Adopter une convention cohérente pour les imports (absolus ou relatifs)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "\033[0;32mAudit terminé. Rapport généré dans $REPORT_FILE\033[0m"
