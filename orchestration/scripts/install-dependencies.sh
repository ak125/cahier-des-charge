#!/bin/bash

# Script pour installer les dépendances manquantes repérées lors des analyses TypeScript
# Date: 21 avril 2025

echo "📦 Installation des dépendances manquantes"
echo "🔍 Analyse des imports non résolus..."

# Liste des dépendances à installer avec leurs versions
DEPENDENCIES=(
  "@supabase/supabase-js@2.39.3"
  "php-parser@3.1.5"
  "table@6.8.1"
  "execa@7.2.0"
  "bullmq@4.13.2"
  "redis@4.6.12"
  "@nestjs/event-emitter@2.0.2"
  "@sentry/node@7.93.0"
  "langchain@0.1.4"
  "yargs@17.7.2"
)

# Création d'un journal d'installation
REPORT_DIR="/workspaces/cahier-des-charge/reports"
mkdir -p "$REPORT_DIR"
INSTALL_LOG="$REPORT_DIR/dependencies-install-$(date +"%Y%m%d-%H%M%S").log"

echo "Installation des dépendances - $(date)" > "$INSTALL_LOG"
echo "===================================" >> "$INSTALL_LOG"

# Vérifier si package.json existe
if [ ! -f "/workspaces/cahier-des-charge/package.json" ]; then
  echo "⚠️ Aucun fichier package.json trouvé à la racine. Création..." | tee -a "$INSTALL_LOG"
  
  # Créer un package.json minimal
  cat > "/workspaces/cahier-des-charge/package.json" << EOL
{
  "name": "mcp-agents-migration",
  "version": "1.0.0",
  "description": "Projet de migration avec agents MCP",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "build": "tsc -b"
  }
}
EOL

  echo "✅ Fichier package.json créé" | tee -a "$INSTALL_LOG"
fi

# Installer les dépendances
echo "📦 Installation des dépendances..." | tee -a "$INSTALL_LOG"

for dep in "${DEPENDENCIES[@]}"; do
  echo "📦 Installation de $dep..." | tee -a "$INSTALL_LOG"
  npm install --save "$dep" >> "$INSTALL_LOG" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ $dep installé avec succès" | tee -a "$INSTALL_LOG"
  else
    echo "❌ Erreur lors de l'installation de $dep" | tee -a "$INSTALL_LOG"
  fi
done

# Installation des dépendances de développement TypeScript
DEV_DEPENDENCIES=(
  "typescript@5.2.2"
  "@types/node@20.10.4"
  "@types/yargs@17.0.32"
  "@types/execa@2.0.0"
  "@types/table@6.3.2"
  "@types/redis@4.0.11"
  "eslint@8.56.0"
  "@typescript-eslint/eslint-plugin@6.15.0"
  "@typescript-eslint/parser@6.15.0"
  "ts-node@10.9.2"
)

echo "📦 Installation des dépendances de développement..." | tee -a "$INSTALL_LOG"

for dep in "${DEV_DEPENDENCIES[@]}"; do
  echo "📦 Installation de $dep..." | tee -a "$INSTALL_LOG"
  npm install --save-dev "$dep" >> "$INSTALL_LOG" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ $dep installé avec succès" | tee -a "$INSTALL_LOG"
  else
    echo "❌ Erreur lors de l'installation de $dep" | tee -a "$INSTALL_LOG"
  fi
done

# Configuration des types PHP Parser
echo "📝 Configuration des types pour php-parser..." | tee -a "$INSTALL_LOG"
mkdir -p "/workspaces/cahier-des-charge/@types/php-parser"
cat > "/workspaces/cahier-des-charge/@types/php-parser/index.d.ts" << EOL
declare module 'php-parser' {
  export class Parser {
    constructor(options?: any);
    parse(code: string, filename?: string): any;
  }
  
  export const parse: (code: string, options?: any) => any;
  export const tokenizer: any;
  export const tokens: any;
  
  export interface Location {
    start: {
      line: number;
      column: number;
      offset: number;
    };
    end: {
      line: number;
      column: number;
      offset: number;
    };
  }
  
  // Types de base pour les nœuds AST
  export interface Node {
    kind: string;
    loc?: Location;
  }
  
  // Types spécifiques
  export interface Program extends Node {
    kind: 'program';
    children: Node[];
  }
  
  export interface Namespace extends Node {
    kind: 'namespace';
    name: string;
    children: Node[];
  }
  
  export interface Class extends Node {
    kind: 'class';
    name: string | Identifier;
    extends: Name | null;
    implements: Name[] | null;
    body: ClassStatement[];
  }
  
  export interface Method extends Node {
    kind: 'method';
    name: string | Identifier;
    body: Block;
    arguments: Parameter[];
    type: Node | null;
    visibility: 'public' | 'protected' | 'private';
    static: boolean;
  }
  
  export interface Property extends Node {
    kind: 'property';
    name: string | Identifier;
    value: Node | null;
    visibility: 'public' | 'protected' | 'private';
    static: boolean;
  }
  
  export interface ClassStatement extends Node {
    kind: string;
  }
  
  export interface Block extends Node {
    kind: 'block';
    children: Node[];
  }
  
  export interface Parameter extends Node {
    kind: 'parameter';
    name: string;
    type: Node | null;
    value: Node | null;
    byref: boolean;
    variadic: boolean;
  }
  
  export interface Identifier extends Node {
    kind: 'identifier';
    name: string;
  }
  
  export interface Name extends Node {
    kind: 'name';
    name: string;
    resolution: 'uqn' | 'fqn' | 'rn';
  }
}
EOL

echo "✅ Types pour php-parser configurés" | tee -a "$INSTALL_LOG"

# Ajout de la référence des types personnalisés dans le tsconfig
echo "📝 Mise à jour du chemin des types personnalisés dans le package.json..." | tee -a "$INSTALL_LOG"
node -e "
const fs = require('fs');
const pkgPath = '/workspaces/cahier-des-charge/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.typesVersions = pkg.typesVersions || {};
pkg.typesVersions['*'] = pkg.typesVersions['*'] || {};
pkg.typesVersions['*']['php-parser'] = ['./@types/php-parser/index.d.ts'];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
" 2>> "$INSTALL_LOG"

echo "✅ Installation des dépendances terminée"
echo "📋 Journal d'installation : $INSTALL_LOG"