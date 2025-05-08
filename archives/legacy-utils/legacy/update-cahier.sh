#!/bin/bash

# Script de mise à jour du cahier des charges
# Remplace update-cahier.ts

set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Charger la configuration
CONFIG_FILE="cahier_check.config.json"
CAHIER_PATH="./cahier"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}📂 Chargement de la configuration...${NC}"
    CAHIER_PATH=$(grep -o '"cahier"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
fi

echo -e "${BLUE}🔄 Démarrage de la mise à jour du cahier des charges...${NC}"
echo -e "📂 Répertoire: $CAHIER_PATH"

# Créer le répertoire s'il n'existe pas
if [ ! -d "$CAHIER_PATH" ]; then
    echo -e "${YELLOW}⚠️ Répertoire $CAHIER_PATH non trouvé, création...${NC}"
    mkdir -p "$CAHIER_PATH"
fi

# Vérifier les fichiers essentiels et les créer si nécessaire
echo -e "${BLUE}📄 Vérification des fichiers essentiels...${NC}"

# Fichier de sommaire
SUMMARY_FILE="$CAHIER_PATH/README.md"
if [ ! -f "$SUMMARY_FILE" ]; then
    echo -e "${YELLOW}⚠️ Fichier de sommaire non trouvé, création...${NC}"
    
    # Créer un fichier de sommaire par défaut
    cat > "$SUMMARY_FILE" << EOL
# Cahier des Charges - Migration PHP vers NestJS/Remix

Ce document présente l'ensemble du processus de migration automatisée assistée par IA, de l'analyse initiale à la mise en production.

## Vue d'ensemble du projet

Ce cahier des charges couvre la migration d'une application PHP legacy vers une architecture moderne basée sur NestJS (backend) et Remix (frontend).

## Structure des chapitres

Consultez les différentes sections pour comprendre chaque aspect du processus de migration.

## Progression du projet

La migration est organisée en phases successives, avec des étapes de validation à chaque niveau.
EOL
    
    echo -e "${GREEN}✅ Fichier de sommaire créé: README.md${NC}"
fi

# Vérifier si discovery_map.json existe et le créer si nécessaire
DISCOVERY_MAP="$CAHIER_PATH/discovery_map.json"
if [ ! -f "$DISCOVERY_MAP" ]; then
    echo -e "${YELLOW}⚠️ Fichier discovery_map.json non trouvé, création...${NC}"
    
    # Créer un fichier discovery_map.json par défaut
    cat > "$DISCOVERY_MAP" << EOL
[
  {
    "id": "exemple.php",
    "path": "/path/to/exemple.php",
    "priority": 5,
    "type": "page",
    "status": "discovered"
  }
]
EOL
    
    echo -e "${GREEN}✅ Fichier discovery_map.json créé${NC}"
fi

# Synchroniser les fichiers d'audit
echo -e "${BLUE}🔄 Synchronisation des fichiers d'audit...${NC}"

# Vérifier s'il existe au moins un fichier d'audit
AUDIT_FILES=$(find "$CAHIER_PATH" -name "*.audit.md" 2>/dev/null || echo "")
AUDIT_COUNT=0
if [ ! -z "$AUDIT_FILES" ]; then
    AUDIT_COUNT=$(echo "$AUDIT_FILES" | wc -l)
fi

if [ "$AUDIT_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Aucun fichier d'audit trouvé, création d'un exemple...${NC}"
    
    # Créer un fichier d'audit d'exemple
    cat > "$CAHIER_PATH/exemple.php.audit.md" << EOL
# Audit IA - exemple.php

## 1️⃣ Rôle métier principal

Ce fichier sert d'exemple pour illustrer la structure d'un audit.

## 2️⃣ Points d'entrée / déclenchement

Page accessible via une requête GET directe.

## 3️⃣ Zone fonctionnelle détectée

Documentation / Exemples

## 4️⃣ Structure du code

Structure procédurale simple avec quelques fonctions.

## 5️⃣ Fonctions et classes

- \`display_example()\`: Affichage du contenu
- \`format_data()\`: Mise en forme des données

## 6️⃣ Fragments HTML/JS

Présence de blocs HTML générés via echo.

## 7️⃣ Variables globales utilisées

- \`\$_GET['page']\`: Paramètre de pagination
- \`\$_SESSION['user']\`: Informations utilisateur

## 8️⃣ Appels SQL détectés

\`\`\`sql
SELECT * FROM examples WHERE active = 1
\`\`\`

## 9️⃣ Structure de données en sortie

Liste d'exemples avec ID, titre et description.

## 🔟 Fichiers inclus / requis

- header.php
- footer.php
- functions.php

## 1️⃣6️⃣ Route Remix cible

/routes/examples/\$page.tsx

## 1️⃣7️⃣ Module NestJS cible

ExamplesModule, ExamplesController, ExamplesService

## 1️⃣8️⃣ DTO / Zod Schema suggéré

\`\`\`typescript
interface ExampleDto {
  id: number;
  title: string;
  description: string;
  active: boolean;
}
\`\`\`

## 1️⃣9️⃣ Modèle Prisma associé

\`\`\`prisma
model Example {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  active      Boolean  @default(true)
}
\`\`\`
EOL
    
    echo -e "${GREEN}✅ Fichier d'audit exemple créé: exemple.php.audit.md${NC}"
    
    # Créer le fichier backlog correspondant
    cat > "$CAHIER_PATH/exemple.php.backlog.json" << EOL
{
  "file": "exemple.php",
  "priority": 5,
  "status": "audited",
  "tasks": [
    {
      "type": "generate.dto",
      "target": "backend",
      "status": "pending",
      "description": "Créer le DTO pour l'entité Example"
    },
    {
      "type": "generate.controller",
      "target": "backend",
      "status": "pending",
      "description": "Créer le contrôleur Examples"
    },
    {
      "type": "generate.service",
      "target": "backend",
      "status": "pending",
      "description": "Créer le service Examples"
    },
    {
      "type": "generate.route",
      "target": "frontend",
      "status": "pending",
      "description": "Créer la route Remix pour les exemples"
    }
  ]
}
EOL
    
    echo -e "${GREEN}✅ Fichier backlog exemple créé: exemple.php.backlog.json${NC}"
    
    # Créer le fichier impact_graph correspondant
    cat > "$CAHIER_PATH/exemple.php.impact_graph.json" << EOL
{
  "nodes": [
    "exemple.php",
    "header.php",
    "footer.php",
    "functions.php"
  ],
  "edges": [
    ["exemple.php", "header.php"],
    ["exemple.php", "footer.php"],
    ["exemple.php", "functions.php"]
  ]
}
EOL
    
    echo -e "${GREEN}✅ Fichier impact_graph exemple créé: exemple.php.impact_graph.json${NC}"
fi

echo -e "${GREEN}✅ Mise à jour du cahier des charges terminée!${NC}"
