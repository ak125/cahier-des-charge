#!/bin/bash

# Script de réparation des agents IA
# Ce script vérifie et répare les agents IA TypeScript

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Vérification et réparation des agents IA...${NC}"

# Vérifier l'existence du répertoire agents
if [ ! -d "agents" ]; then
  echo -e "${RED}❌ Le répertoire 'agents' n'existe pas.${NC}"
  exit 1
fi

# Vérifier les dépendances Node.js
echo -e "${BLUE}📦 Vérification des dépendances Node.js...${NC}"

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}⚠️ Fichier package.json manquant, création...${NC}"
  cat > "package.json" << EOL
{
  "name": "cahier-des-charge-migration",
  "version": "1.0.0",
  "description": "Outils d'automatisation pour le cahier des charges de migration",
  "main": "index.js",
  "scripts": {
    "analyze": "ts-node agents/analyze-security-risks.ts",
    "migration-plan": "ts-node agents/generate-migration-plan.ts",
    "update-cahier": "ts-node scripts/update-cahier.ts",
    "verify": "bash verify-cahier.sh"
  },
  "keywords": [
    "migration",
    "cahier-des-charges",
    "nestjs",
    "remix"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@types/node": "^18.15.11",
    "chalk": "^4.1.2",
    "commander": "^10.0.0",
    "fs-extra": "^11.1.1",
    "glob": "^10.2.2",
    "typescript": "^5.0.4",
    "ts-node": "^10.9.1"
  }
}
EOL
  echo -e "${GREEN}✅ Fichier package.json créé${NC}"
  
  # Installer les dépendances
  echo -e "${BLUE}📦 Installation des dépendances Node.js...${NC}"
  npm install
else
  echo -e "${GREEN}✅ Fichier package.json trouvé${NC}"
  
  # Vérifier et mettre à jour les dépendances si nécessaire
  if ! grep -q "ts-node" "package.json"; then
    echo -e "${YELLOW}⚠️ ts-node manquant dans les dépendances, installation...${NC}"
    npm install --save ts-node typescript @types/node chalk commander fs-extra glob
  else
    echo -e "${GREEN}✅ Dépendance ts-node trouvée${NC}"
  fi
fi

# Vérifier le fichier tsconfig.json
if [ ! -f "tsconfig.json" ]; then
  echo -e "${YELLOW}⚠️ Fichier tsconfig.json manquant, création...${NC}"
  cat > "tsconfig.json" << EOL
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "agents/**/*",
    "scripts/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOL
  echo -e "${GREEN}✅ Fichier tsconfig.json créé${NC}"
else
  echo -e "${GREEN}✅ Fichier tsconfig.json trouvé${NC}"
fi

# Vérifier et corriger les agents TypeScript
echo -e "${BLUE}🔍 Vérification des agents TypeScript...${NC}"
TS_AGENTS=$(find "agents" -name "*.ts" | sort)
FIXED_AGENTS=0

for agent in $TS_AGENTS; do
  agent_name=$(basename "$agent")
  echo -e "${BLUE}🔍 Vérification de $agent_name...${NC}"
  
  # Vérifier si l'agent a besoin d'être modifié
  if grep -q "fs/promises" "$agent" && ! grep -q "fs-extra" "$agent"; then
    echo -e "${YELLOW}⚠️ Problème potentiel de compatibilité fs/promises dans $agent_name${NC}"
    # Remplacer fs/promises par fs-extra
    sed -i 's/import \* as fs from .fs\/promises./import * as fs from '\''fs-extra'\'';/g' "$agent"
    FIXED_AGENTS=$((FIXED_AGENTS+1))
    echo -e "${GREEN}✅ Corrigé: $agent_name${NC}"
  fi
  
  # S'assurer que l'agent a une fonction main
  if ! grep -q "function main()" "$agent" && ! grep -q "const main = " "$agent"; then
    echo -e "${YELLOW}⚠️ Pas de fonction main dans $agent_name${NC}"
  fi
  
  # Vérifier les imports manquants couramment rencontrés
  if grep -q "chalk" "$agent" && ! grep -q "import.*chalk" "$agent"; then
    echo -e "${YELLOW}⚠️ Import manquant pour chalk dans $agent_name${NC}"
    # Ajouter l'import au début du fichier
    sed -i '1s/^/import chalk from '\''chalk'\'';\n/' "$agent"
    FIXED_AGENTS=$((FIXED_AGENTS+1))
    echo -e "${GREEN}✅ Import de chalk ajouté dans $agent_name${NC}"
  fi
  
  # Vérifier l'appel à la fonction main
  if ! grep -q "if (require.main === module)" "$agent"; then
    echo -e "${YELLOW}⚠️ Pas d'appel à main dans $agent_name${NC}"
  fi
done

# Créer un script de wrapper pour faciliter l'exécution des agents
echo -e "${BLUE}📝 Création d'un script wrapper pour faciliter l'exécution des agents IA...${NC}"

cat > "run-agent.sh" << EOL
#!/bin/bash

# Script pour exécuter un agent IA spécifique
# Usage: ./run-agent.sh <nom-agent> [arguments]

if [ \$# -lt 1 ]; then
  echo "Usage: \$0 <nom-agent> [arguments]"
  echo ""
  echo "Agents disponibles:"
  ls -1 agents/*.ts | sed 's/agents\///' | sed 's/\.ts//'
  exit 1
fi

AGENT="\$1"
shift

if [ ! -f "agents/\${AGENT}.ts" ]; then
  echo "❌ Agent '\${AGENT}' non trouvé!"
  echo ""
  echo "Agents disponibles:"
  ls -1 agents/*.ts | sed 's/agents\///' | sed 's/\.ts//'
  exit 1
fi

echo "🚀 Exécution de l'agent \${AGENT}..."
npx ts-node "agents/\${AGENT}.ts" "\$@"
EOL

chmod +x "run-agent.sh"
echo -e "${GREEN}✅ Script run-agent.sh créé${NC}"

# Réparer spécifiquement generate-migration-plan.ts
echo -e "${BLUE}🔧 Test de l'agent generate-migration-plan.ts...${NC}"

# Créer un exemple de fichier PHP si nécessaire
if [ ! -d "cahier" ]; then
  mkdir -p "cahier"
fi

if [ ! -f "cahier/exemple.php" ]; then
  echo -e "${YELLOW}⚠️ Création d'un fichier PHP exemple pour tester l'agent...${NC}"
  cat > "cahier/exemple.php" << EOL
<?php
/**
 * Exemple de fichier PHP pour tester l'agent de migration
 */

// Connexion à la base de données
\$db = new PDO('mysql:host=localhost;dbname=test', 'user', 'password');

// Fonction pour récupérer un utilisateur par ID
function getUserById(\$id) {
    global \$db;
    \$stmt = \$db->prepare("SELECT * FROM users WHERE id = :id");
    \$stmt->bindParam(':id', \$id);
    \$stmt->execute();
    return \$stmt->fetch(PDO::FETCH_ASSOC);
}

// Affichage des données utilisateur
\$user = getUserById(1);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Profil utilisateur</title>
</head>
<body>
    <h1>Profil de <?php echo \$user['name']; ?></h1>
    <p>Email: <?php echo \$user['email']; ?></p>
</body>
</html>
EOL
  echo -e "${GREEN}✅ Fichier PHP exemple créé${NC}"
fi

# Créer un fichier audit pour l'exemple
if [ ! -f "cahier/exemple.php.audit.md" ]; then
  echo -e "${YELLOW}⚠️ Création d'un fichier d'audit exemple...${NC}"
  cat > "cahier/exemple.php.audit.md" << EOL
# Audit de exemple.php

## 1️⃣ Rôle métier principal
Gestion des utilisateurs et affichage de profil

## 2️⃣ Structure du fichier
- Connexion à la base de données
- Fonction getUserById
- Logique d'affichage

Qualité structurelle estimée: **1.5 / 3**
Type dominant: \`controller-view-mixed\`

## 3️⃣ Qualité et maintenabilité
Score de sécurité IA (0 à 10): 5.5
Qualité technique: 6.0/10
Score global: 5.8/10

## 4️⃣ Analyse des dépendances
- Utilise: PDO
- Affiche: HTML

Analyse SQL brute: **2.0 / 3**
EOL
  echo -e "${GREEN}✅ Fichier d'audit exemple créé${NC}"
  
  # Créer aussi un fichier impact_graph.json
  cat > "cahier/exemple.php.impact_graph.json" << EOL
{
  "file": "exemple.php",
  "usedBy": ["login.php", "admin.php"],
  "uses": ["functions.php", "config.php"],
  "impact_level": "moyen"
}
EOL
  echo -e "${GREEN}✅ Fichier impact_graph.json exemple créé${NC}"
fi

# Tester l'agent generate-migration-plan.ts
echo -e "${BLUE}🧪 Test d'exécution de l'agent generate-migration-plan.ts...${NC}"
npx ts-node agents/generate-migration-plan.ts "cahier/exemple.php" || {
  echo -e "${RED}❌ Erreur lors de l'exécution de l'agent${NC}"
  echo -e "${YELLOW}⚠️ Débogage de generate-migration-plan.ts...${NC}"
  
  # Vérifier les erreurs communes et les corriger
  if grep -q "this.impactGraph.usedBy" "agents/generate-migration-plan.ts" && ! grep -q "this.impactGraph && this.impactGraph.usedBy" "agents/generate-migration-plan.ts"; then
    echo -e "${YELLOW}⚠️ Correction des accès non sécurisés aux propriétés dans generate-migration-plan.ts${NC}"
    sed -i 's/this.impactGraph.usedBy/this.impactGraph \&\& this.impactGraph.usedBy/g' "agents/generate-migration-plan.ts"
    FIXED_AGENTS=$((FIXED_AGENTS+1))
    echo -e "${GREEN}✅ Sécurisation des accès aux propriétés impactGraph${NC}"
  fi
  
  # Réessayer après correction
  echo -e "${BLUE}🔄 Nouvelle tentative d'exécution...${NC}"
  npx ts-node agents/generate-migration-plan.ts "cahier/exemple.php" && {
    echo -e "${GREEN}✅ L'agent generate-migration-plan.ts fonctionne maintenant correctement!${NC}"
  } || {
    echo -e "${RED}❌ L'agent présente toujours des problèmes.${NC}"
  }
}

# Résumé
if [ $FIXED_AGENTS -gt 0 ]; then
  echo -e "${GREEN}✅ $FIXED_AGENTS agents ont été corrigés${NC}"
  echo -e "${BLUE}📋 Vous pouvez maintenant utiliser ./run-agent.sh pour exécuter vos agents:${NC}"
  echo "   ./run-agent.sh generate-migration-plan cahier/exemple.php"
else
  echo -e "${GREEN}✅ Les agents semblent en bon état${NC}"
fi

echo -e "${BLUE}🔄 Pour mettre à jour le cahier des charges, utilisez:${NC}"
echo "   npm run update-cahier"
echo "   ou"
echo "   ./update-cahier.sh"

echo -e "${BLUE}🔍 Pour vérifier le cahier des charges, utilisez:${NC}"
echo "   npm run verify"
echo "   ou"
echo "   ./verify-cahier.sh"

exit 0