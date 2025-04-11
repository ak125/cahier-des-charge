#!/bin/bash

# Script pour créer une nouvelle section dans le cahier des charges
# en suivant les conventions établies et en évitant les doublons

echo "🌟 Assistant de création de section pour le Cahier des Charges"

CDC_DIR="cahier-des-charges"

# Vérification du dossier
if [ ! -d "$CDC_DIR" ]; then
  echo "❌ Dossier '$CDC_DIR' introuvable. Lancez d'abord ./setup-cahier.sh."
  exit 1
fi

# Déterminer le prochain numéro disponible
LAST_NUM=$(find "$CDC_DIR" -name "[0-9][0-9]*-*.md" | sort -r | head -n 1 | sed 's/.*\/\([0-9][0-9]\).*/\1/')
NEXT_NUM=$((LAST_NUM + 1))
NEXT_NUM_PADDED=$(printf "%02d" $NEXT_NUM)

echo "📝 Création d'une nouvelle section (numéro $NEXT_NUM_PADDED)"

# Demander le titre
read -p "Titre de la section: " SECTION_TITLE

# Générer un slug à partir du titre
SECTION_SLUG=$(echo "$SECTION_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

# Vérifier si un contenu similaire existe déjà
echo "🔍 Vérification des sections existantes pour éviter les duplications..."
SIMILAR_FILES=$(grep -l -i "$SECTION_TITLE" "$CDC_DIR"/*.md || echo "")

if [ -n "$SIMILAR_FILES" ]; then
  echo "⚠️ Des sections potentiellement similaires ont été trouvées:"
  echo "$SIMILAR_FILES"
  read -p "Voulez-vous continuer quand même? (o/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[oO]$ ]]; then
    echo "❌ Création de section annulée."
    exit 1
  fi
fi

# Nom du fichier
SECTION_FILENAME="${NEXT_NUM_PADDED}-${SECTION_SLUG}.md"
SECTION_PATH="$CDC_DIR/$SECTION_FILENAME"

# Vérifier si le fichier existe déjà
if [ -f "$SECTION_PATH" ]; then
  echo "❌ Un fichier avec ce nom existe déjà: $SECTION_FILENAME"
  exit 1
fi

# Créer le fichier avec un template
echo "📄 Création du fichier $SECTION_FILENAME..."

cat > "$SECTION_PATH" << EOL
# $SECTION_TITLE

## 🎯 Objectif

[Décrire l'objectif principal de cette section]

## 📋 Contenu principal

[Détailler le contenu principal]

## ⚙️ Implémentation technique

\`\`\`typescript
// Exemple de code ou de configuration
interface ExampleInterface {
  property: string;
  method(): void;
}
\`\`\`

## 📊 Métriques associées

| Métrique | Description | Valeur cible |
|----------|-------------|--------------|
| Métrique 1 | Description de la métrique | Valeur |
| Métrique 2 | Description de la métrique | Valeur |

## 🔄 Intégration avec d'autres sections

- Lien avec [Section A](./XX-section-a.md)
- Lien avec [Section B](./XX-section-b.md)
EOL

echo "✅ Section créée: $SECTION_PATH"
echo "Pensez à exécuter ./update-cahier.sh pour mettre à jour le sommaire."

# Proposer de mettre à jour le sommaire immédiatement
read -p "Voulez-vous mettre à jour le sommaire maintenant? (O/n): " UPDATE_TOC
if [[ ! "$UPDATE_TOC" =~ ^[nN]$ ]]; then
  ./update-cahier.sh
fi
