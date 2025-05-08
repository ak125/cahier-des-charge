#!/bin/bash

# Script de migration des packages pour réorganiser mcp-core et mcp-cli
# Créé le 26 avril 2025

echo "Démarrage de la migration des packages..."

# 1. Création des nouveaux packages s'ils n'existent pas déjà
mkdir -p packages/mcp-domain/src
mkdir -p packages/mcp-domain/dist
mkdir -p packages/mcp-services/src
mkdir -p packages/mcp-services/dist
mkdir -p packages/mcp-agents/src
mkdir -p packages/mcp-agents/dist
mkdir -p packages/mcp-utils/src
mkdir -p packages/mcp-utils/dist
mkdir -p packages/ui-remix/src/hooks
mkdir -p packages/ui-remix/src/components
mkdir -p packages/ui-remix/dist

echo "Structures des dossiers créées avec succès."

# 2. Création des fichiers package.json de base pour chaque package
cat > packages/mcp-domain/package.json << EOF
{
  "name": "@mcp/domain",
  "version": "0.1.0",
  "description": "Définitions et types métier pour MCP",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist"
  },
  "dependencies": {},
  "devDependencies": {
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/mcp-services/package.json << EOF
{
  "name": "@mcp/services",
  "version": "0.1.0",
  "description": "Clients et services externes pour MCP",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@mcp/domain": "workspace:*"
  },
  "devDependencies": {
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/mcp-agents/package.json << EOF
{
  "name": "@mcp/agents",
  "version": "0.1.0",
  "description": "Agents et analyseurs pour MCP",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@mcp/domain": "workspace:*",
    "@mcp/services": "workspace:*",
    "@mcp/utils": "workspace:*"
  },
  "devDependencies": {
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/mcp-utils/package.json << EOF
{
  "name": "@mcp/utils",
  "version": "0.1.0",
  "description": "Utilitaires partagés pour MCP",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist"
  },
  "dependencies": {},
  "devDependencies": {
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/ui-remix/package.json << EOF
{
  "name": "@mcp/ui-remix",
  "version": "0.1.0",
  "description": "Composants UI et hooks Remix réutilisables",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "react": "^18.0.0",
    "remix": "^1.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

echo "Fichiers package.json créés avec succès."

# 3. Configuration des fichiers tsconfig.json pour chaque package
for pkg in mcp-domain mcp-services mcp-agents mcp-utils ui-remix; do
  cat > packages/$pkg/tsconfig.json << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF
done

echo "Configuration TypeScript créée avec succès."

# 4. Création des fichiers index.ts de base
for pkg in mcp-domain mcp-services mcp-agents mcp-utils; do
  cat > packages/$pkg/src/index.ts << EOF
// Point d'entrée principal pour @mcp/$pkg
export * from './types';
EOF
  mkdir -p packages/$pkg/src/types
  touch packages/$pkg/src/types/index.ts
done

# Création d'un index.ts spécifique pour ui-remix
cat > packages/ui-remix/src/index.ts << EOF
// Point d'entrée principal pour @mcp/ui-remix
export * from './hooks';
export * from './components';
EOF
touch packages/ui-remix/src/hooks/index.ts
touch packages/ui-remix/src/components/index.ts

echo "Fichiers index.ts créés avec succès."

# 5. Instructions pour la migration manuelle des fichiers
echo "=== INSTRUCTIONS POUR LA MIGRATION MANUELLE ==="
echo ""
echo "Pour migrer les fichiers de mcp-core vers les nouveaux packages:"
echo ""
echo "1. Migration des types et définitions métier:"
echo "   - Déplacer les types de domaine de packages/mcp-core/src/types vers packages/mcp-domain/src/types"
echo ""
echo "2. Migration des services externes:"
echo "   - Déplacer les clients API et services de packages/mcp-core/src/services vers packages/mcp-services/src"
echo ""
echo "3. Migration des agents et analyseurs:"
echo "   - Déplacer le code des agents de packages/mcp-core/src/agents vers packages/mcp-agents/src"
echo ""
echo "4. Migration des utilitaires:"
echo "   - Déplacer les fonctions utilitaires de packages/mcp-core/src/utils vers packages/mcp-utils/src"
echo ""
echo "5. Migration des hooks et composants UI Remix:"
echo "   - Déplacer les hooks de Remix vers packages/ui-remix/src/hooks"
echo "   - Déplacer les composants UI partagés vers packages/ui-remix/src/components"
echo ""
echo "6. Mettre à jour les imports dans tous les fichiers pour référencer les nouveaux chemins"
echo ""
echo "7. Exécuter 'pnpm install' pour mettre à jour les dépendances"
echo ""
echo "8. Exécuter 'pnpm run build' pour vérifier que tout compile correctement"

# Rendre le script exécutable
chmod +x "$0"

echo "Script de migration terminé."