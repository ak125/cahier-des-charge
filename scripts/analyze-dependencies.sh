#!/bin/bash

# Script pour analyser les dépendances non utilisées dans un monorepo
# Utilise depcheck pour détecter les dépendances non utilisées

set -e

MONOREPO_ROOT=$(pwd)
OUTPUT_DIR="$MONOREPO_ROOT/reports/dependencies"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="$OUTPUT_DIR/depcheck-report-$TIMESTAMP.json"

# Créer le répertoire de sortie s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

# Vérifier si depcheck est installé
if ! command -v depcheck &> /dev/null; then
    echo "depcheck n'est pas installé. Installation en cours..."
    pnpm add -D depcheck -w
fi

# Fonction pour analyser un package spécifique
analyze_package() {
    local package_path=$1
    local package_name=$(basename "$package_path")
    
    echo "Analyse des dépendances pour $package_name..."
    
    # Exécution de depcheck si package.json existe
    if [ -f "$package_path/package.json" ]; then
        echo "Analyse de $package_path"
        npx depcheck "$package_path" --json >> "$OUTPUT_FILE.tmp"
        echo "," >> "$OUTPUT_FILE.tmp"
    fi
}

# Fonction pour analyser tous les packages
analyze_all_packages() {
    echo "{" > "$OUTPUT_FILE.tmp"
    
    # Analyser les applications
    if [ -d "$MONOREPO_ROOT/apps" ]; then
        echo "Analyse des applications..."
        for app in "$MONOREPO_ROOT/apps"/*; do
            if [ -d "$app" ]; then
                analyze_package "$app"
            fi
        done
    fi
    
    # Analyser les packages
    if [ -d "$MONOREPO_ROOT/packages" ]; then
        echo "Analyse des packages..."
        for pkg in "$MONOREPO_ROOT/packages"/*; do
            if [ -d "$pkg" ]; then
                analyze_package "$pkg"
            fi
        done
    fi
    
    # Autres dossiers à analyser si nécessaire
    for dir in "src" "business" "agents" "orchestration"; do
        if [ -d "$MONOREPO_ROOT/$dir" ] && [ -f "$MONOREPO_ROOT/$dir/package.json" ]; then
            analyze_package "$MONOREPO_ROOT/$dir"
        fi
    done
    
    # Finalisation du fichier JSON
    # Retirer la dernière virgule et fermer l'accolade
    sed '$ s/,$//' "$OUTPUT_FILE.tmp" > "$OUTPUT_FILE.tmp2"
    echo "}" >> "$OUTPUT_FILE.tmp2"
    mv "$OUTPUT_FILE.tmp2" "$OUTPUT_FILE"
    rm -f "$OUTPUT_FILE.tmp"
    
    echo "Analyse terminée. Rapport disponible dans $OUTPUT_FILE"
}

# Fonction pour générer un rapport synthétique
generate_summary() {
    echo "Génération du résumé des dépendances non utilisées..."
    
    # Créer un fichier de résumé
    SUMMARY_FILE="$OUTPUT_DIR/depcheck-summary-$TIMESTAMP.md"
    
    echo "# Rapport des dépendances non utilisées - $TIMESTAMP" > "$SUMMARY_FILE"
    echo "" >> "$SUMMARY_FILE"
    echo "## Résumé" >> "$SUMMARY_FILE"
    
    # Analyser le fichier JSON et générer un résumé
    npx -y json2md -i "$OUTPUT_FILE" -o "$SUMMARY_FILE.tmp"
    
    # Personnaliser le format du résumé
    cat "$SUMMARY_FILE.tmp" >> "$SUMMARY_FILE"
    rm -f "$SUMMARY_FILE.tmp"
    
    echo "" >> "$SUMMARY_FILE"
    echo "## Recommandations" >> "$SUMMARY_FILE"
    echo "" >> "$SUMMARY_FILE"
    echo "Pour nettoyer les dépendances inutilisées, exécutez :" >> "$SUMMARY_FILE"
    echo '```bash' >> "$SUMMARY_FILE"
    echo "# Pour un package spécifique" >> "$SUMMARY_FILE"
    echo "cd chemin/vers/package" >> "$SUMMARY_FILE"
    echo "pnpm remove [package-name]" >> "$SUMMARY_FILE"
    echo "" >> "$SUMMARY_FILE"
    echo "# Pour supprimer plusieurs packages à la fois" >> "$SUMMARY_FILE"
    echo "pnpm remove [package1] [package2] [package3]" >> "$SUMMARY_FILE"
    echo '```' >> "$SUMMARY_FILE"
    
    echo "Résumé généré dans $SUMMARY_FILE"
}

# Fonction principale
main() {
    echo "Démarrage de l'analyse des dépendances..."
    
    analyze_all_packages
    generate_summary
    
    echo "Analyse complète."
}

# Exécution du script
main