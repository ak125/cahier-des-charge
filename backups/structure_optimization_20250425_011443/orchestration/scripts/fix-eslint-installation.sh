#!/bin/bash

# Script pour corriger les problèmes d'installation d'ESLint
# Date: 21 avril 2025

echo "🔧 Correction des problèmes d'installation d'ESLint"

# Créer un fichier de log
LOG_FILE="/workspaces/cahier-des-charge/reports/eslint-fix-$(date +"%Y%m%d-%H%M%S").log"
mkdir -p /workspaces/cahier-des-charge/reports
touch "$LOG_FILE"

echo "Correction d'ESLint - $(date)" > "$LOG_FILE"
echo "=========================" >> "$LOG_FILE"

# 1. Nettoyer le cache npm
echo "🧹 Nettoyage du cache npm..." | tee -a "$LOG_FILE"
npm cache clean --force >> "$LOG_FILE" 2>&1

# 2. Supprimer les node_modules et package-lock.json
echo "🗑️ Suppression des dépendances existantes..." | tee -a "$LOG_FILE"
rm -rf node_modules package-lock.json >> "$LOG_FILE" 2>&1

# 3. Vérifier s'il existe des versions précises d'ESLint qui fonctionnent bien ensemble
echo "📦 Installation des versions compatibles d'ESLint et ses plugins..." | tee -a "$LOG_FILE"

# Installer les dépendances principales
npm install --save-dev eslint@8.56.0 >> "$LOG_FILE" 2>&1

# Installer les plugins ESLint séparément pour éviter les conflits de version
npm install --save-dev @typescript-eslint/eslint-plugin@6.14.0 >> "$LOG_FILE" 2>&1
npm install --save-dev @typescript-eslint/parser@6.14.0 >> "$LOG_FILE" 2>&1
npm install --save-dev eslint-plugin-import@2.29.0 >> "$LOG_FILE" 2>&1
npm install --save-dev eslint-config-prettier@9.0.0 >> "$LOG_FILE" 2>&1
npm install --save-dev eslint-plugin-react@7.33.2 >> "$LOG_FILE" 2>&1
npm install --save-dev eslint-plugin-react-hooks@4.6.0 >> "$LOG_FILE" 2>&1

# 4. Installer spécifiquement les modules manquants
echo "📦 Installation spécifique du module manquant..." | tee -a "$LOG_FILE"
npm install --save-dev @eslint/eslintrc >> "$LOG_FILE" 2>&1

# 5. Réinstaller toutes les dépendances pour s'assurer que tout est cohérent
echo "🔄 Réinstallation de toutes les dépendances..." | tee -a "$LOG_FILE"
npm install >> "$LOG_FILE" 2>&1

# 6. Vérifier si ESLint fonctionne maintenant
echo "🧪 Test d'ESLint..." | tee -a "$LOG_FILE"
npx eslint --version >> "$LOG_FILE" 2>&1
if [ $? -eq 0 ]; then
  echo "✅ ESLint est maintenant correctement installé" | tee -a "$LOG_FILE"
else
  echo "⚠️ Il y a encore des problèmes avec ESLint" | tee -a "$LOG_FILE"
  echo "📝 Essai d'une approche alternative..." | tee -a "$LOG_FILE"
  
  # Solution alternative en utilisant npx pour installer ESLint globalement
  echo "📦 Installation globale d'ESLint via npx..." | tee -a "$LOG_FILE"
  npm install -g eslint >> "$LOG_FILE" 2>&1
  
  # Créer une configuration ESLint minimale
  echo "📝 Création d'une configuration ESLint minimale..." | tee -a "$LOG_FILE"
  cat > .eslintrc.json << EOL
{
  "root": true,
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "extends": [
    "eslint:recommended"
  ],
  "rules": {
    "no-unused-vars": "warn"
  }
}
EOL
  
  # Adapter les scripts dans package.json pour utiliser la configuration minimale
  echo "🔄 Adaptation des scripts dans package.json..." | tee -a "$LOG_FILE"
  node -e "
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.lint = 'npx eslint --config .eslintrc.json . --ext .ts,.tsx';
    packageJson.scripts['lint:fix'] = 'npx eslint --config .eslintrc.json . --ext .ts,.tsx --fix';
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  " >> "$LOG_FILE" 2>&1
  
  # Tester à nouveau
  echo "🧪 Test final d'ESLint..." | tee -a "$LOG_FILE"
  npx eslint --version >> "$LOG_FILE" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ ESLint est maintenant correctement installé (méthode alternative)" | tee -a "$LOG_FILE"
  else
    echo "❌ La correction a échoué. Veuillez consulter le journal pour plus de détails: $LOG_FILE" | tee -a "$LOG_FILE"
  fi
fi

echo "📋 Journal complet disponible dans: $LOG_FILE"