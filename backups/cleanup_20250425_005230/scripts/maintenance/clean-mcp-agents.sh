#!/bin/bash
# Script pour nettoyer les doublons des agents MCP

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nettoyage des doublons d'agents MCP ===${NC}"

# Définir les chemins des répertoires
SOURCE_DIR="/workspaces/cahier-des-charge/remix-nestjs-monorepo/packages/mcp-agents"
TARGET_DIR="/workspaces/cahier-des-charge/packages/mcp-agents"

# Vérifier que les répertoires existent
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}Le répertoire source n'existe pas: $SOURCE_DIR${NC}"
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${RED}Le répertoire cible n'existe pas: $TARGET_DIR${NC}"
  exit 1
fi

# Créer les sous-répertoires nécessaires s'ils n'existent pas
mkdir -p "$TARGET_DIR/analysis"
mkdir -p "$TARGET_DIR/core"
mkdir -p "$TARGET_DIR/generators"
mkdir -p "$TARGET_DIR/types"

echo -e "${GREEN}Sous-répertoires créés dans le répertoire cible${NC}"

# Fonction pour copier un fichier et vérifier s'il est différent
copy_if_different() {
  local src="$1"
  local dest="$2"
  
  # Si le fichier de destination n'existe pas, le copier
  if [ ! -f "$dest" ]; then
    echo -e "${GREEN}Copie du fichier: $(basename "$src") -> $(dirname "$dest")/${NC}"
    cp "$src" "$dest"
    return 0
  fi
  
  # Comparer les fichiers
  if ! cmp -s "$src" "$dest"; then
    # Les fichiers sont différents, sauvegarder le fichier existant et copier le nouveau
    backup="$dest.bak-$(date +%Y%m%d%H%M%S)"
    echo -e "${YELLOW}Fichier différent trouvé: $(basename "$src")${NC}"
    echo -e "${YELLOW}Sauvegarde du fichier existant: $(basename "$dest") -> $(basename "$backup")${NC}"
    cp "$dest" "$backup"
    echo -e "${GREEN}Copie du fichier mis à jour: $(basename "$src") -> $(dirname "$dest")/${NC}"
    cp "$src" "$dest"
    return 0
  else
    echo -e "Fichier identique, ignoré: $(basename "$src")"
    return 1
  fi
}

# Copier les fichiers des sous-répertoires
echo -e "${GREEN}Copie des fichiers d'analyse...${NC}"
for f in "$SOURCE_DIR"/analysis/*.ts; do
  if [ -f "$f" ]; then
    dest="$TARGET_DIR/analysis/$(basename "$f")"
    copy_if_different "$f" "$dest"
  fi
done

echo -e "${GREEN}Copie des fichiers core...${NC}"
for f in "$SOURCE_DIR"/core/*.ts; do
  if [ -f "$f" ]; then
    dest="$TARGET_DIR/core/$(basename "$f")"
    copy_if_different "$f" "$dest"
  fi
done

echo -e "${GREEN}Copie des fichiers generators...${NC}"
for f in "$SOURCE_DIR"/generators/*.ts; do
  if [ -f "$f" ]; then
    dest="$TARGET_DIR/generators/$(basename "$f")"
    copy_if_different "$f" "$dest"
  fi
done

echo -e "${GREEN}Copie des fichiers types...${NC}"
for f in "$SOURCE_DIR"/types/*.ts; do
  if [ -f "$f" ]; then
    dest="$TARGET_DIR/types/$(basename "$f")"
    copy_if_different "$f" "$dest"
  fi
done

echo -e "${GREEN}Copie des fichiers racine...${NC}"
for f in "$SOURCE_DIR"/*.ts; do
  if [ -f "$f" ] && [ "$(basename "$f")" != "index.ts" ]; then
    dest="$TARGET_DIR/$(basename "$f")"
    copy_if_different "$f" "$dest"
  fi
done

echo -e "${GREEN}Mise à jour du registre d'agents...${NC}"

# Générer le nouveau fichier index.ts
tmp_index=$(mktemp)
cat > "$tmp_index" << 'EOL'
// Registre centralisé des agents MCP
// Généré automatiquement par le script de nettoyage des doublons

// Export des agents individuels depuis la racine
export * from './php-analyzer';
export * from './remix-generator';
export * from './nestjs-generator';
export * from './mysql-to-postgresql';
export * from './migration-validator';

// Export des agents depuis les sous-répertoires
// Analysis
export * from './analysis/php-analyzer';

// Core
export * from './core/nestjs-generator';
export * from './core/remix-generator';

// Generators
export * from './generators/nestjs-generator';
export * from './generators/remix-generator';

// Types
export * from './types/index';

// Registre d'agents pour une utilisation facilitée
export const agentRegistry = {
  // Agents racine
  "php-analyzer": require('./php-analyzer'),
  "remix-generator": require('./remix-generator'),
  "nestjs-generator": require('./nestjs-generator'),
  "mysql-to-postgresql": require('./mysql-to-postgresql'),
  "migration-validator": require('./migration-validator'),
  
  // Agents dans les sous-répertoires
  "analysis/php-analyzer": require('./analysis/php-analyzer'),
  "core/nestjs-generator": require('./core/nestjs-generator'),
  "core/remix-generator": require('./core/remix-generator'),
  "generators/nestjs-generator": require('./generators/nestjs-generator'),
  "generators/remix-generator": require('./generators/remix-generator')
};

// Fonction utilitaire pour exécuter un agent
export async function executeAgent(agentName: string, context: any) {
  const agent = agentRegistry[agentName];
  if (!agent) {
    throw new Error(`Agent "${agentName}" introuvable dans le registre MCP.`);
  }
  console.info(`Agent utilisé : @fafa/mcp-agents/${agentName}`);
  return await agent.run(context);
}
EOL

# Sauvegarder l'ancien index.ts et copier le nouveau
index_backup="$TARGET_DIR/index.ts.bak-$(date +%Y%m%d%H%M%S)"
echo -e "${YELLOW}Sauvegarde de l'index.ts existant -> $(basename "$index_backup")${NC}"
cp "$TARGET_DIR/index.ts" "$index_backup"
echo -e "${GREEN}Installation du nouvel index.ts${NC}"
cp "$tmp_index" "$TARGET_DIR/index.ts"
rm "$tmp_index"

echo -e "${GREEN}=== Nettoyage terminé avec succès ===${NC}"
echo -e "${YELLOW}Note: Le répertoire source n'a pas été supprimé. Une fois que vous avez vérifié que tout fonctionne, vous pouvez le supprimer manuellement:${NC}"
echo -e "${YELLOW}  rm -rf $SOURCE_DIR${NC}"