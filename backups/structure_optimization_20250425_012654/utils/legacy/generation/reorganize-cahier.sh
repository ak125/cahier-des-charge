#!/bin/bash

# Script de réorganisation du cahier des charges
# Ce script corrige les problèmes de numérotation et les liens cassés

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Réorganisation du cahier des charges...${NC}"

# Vérifier l'existence du répertoire cahier-des-charges
if [ ! -d "cahier-des-charges" ]; then
  echo -e "${RED}❌ Le répertoire 'cahier-des-charges' n'existe pas.${NC}"
  exit 1
fi

# Créer un répertoire temporaire pour la réorganisation
TEMP_DIR="cahier-des-charges-temp"
mkdir -p "$TEMP_DIR"

# Copier le sommaire
cp "cahier-des-charges/00-sommaire.md" "$TEMP_DIR/00-sommaire.md"

# Créer une structure organisée par chapitres
mkdir -p "$TEMP_DIR/chapitres/I-introduction"
mkdir -p "$TEMP_DIR/chapitres/II-preparation"
mkdir -p "$TEMP_DIR/chapitres/III-infrastructure"
mkdir -p "$TEMP_DIR/chapitres/IV-planification"
mkdir -p "$TEMP_DIR/chapitres/V-qualite"
mkdir -p "$TEMP_DIR/chapitres/VI-securite"
mkdir -p "$TEMP_DIR/chapitres/VII-documentation"

# Fonction pour vérifier l'existence d'un fichier et le copier ou créer un fichier vide
copy_or_create() {
  SOURCE="cahier-des-charges/$1"
  DEST="$TEMP_DIR/chapitres/$2/$3"
  
  if [ -f "$SOURCE" ]; then
    cp "$SOURCE" "$DEST"
    echo -e "${GREEN}✅ Copié: $SOURCE -> $DEST${NC}"
  else
    # Créer un fichier vide avec un en-tête de base
    echo "# ${1%.md}" > "$DEST"
    echo -e "\nCe document fait partie du cahier des charges de migration.\n" >> "$DEST"
    echo -e "${YELLOW}⚠️ Créé fichier vide: $DEST${NC}"
  fi
}

# Mappings de fichiers selon la nouvelle structure
# Format: [fichier original] [répertoire destination] [nouveau nom de fichier]

# Chapitre I - Introduction et fondamentaux
copy_or_create "01-introduction.md" "I-introduction" "01-introduction.md"
copy_or_create "44-technologies-outils-services.md" "I-introduction" "02-technologies-outils-services.md"
copy_or_create "19-gestion-risques.md" "I-introduction" "03-gestion-risques.md"

# Chapitre II - Phase de préparation
copy_or_create "10-checklist-pre-migration.md" "II-preparation" "04-checklist-pre-migration.md"
copy_or_create "41-gel-code-legacy.md" "II-preparation" "05-gel-code-legacy.md"
copy_or_create "42-gel-structure-cible.md" "II-preparation" "06-gel-structure-cible.md"
copy_or_create "10b-verification-env-test.md" "II-preparation" "07-verification-env-test.md"
copy_or_create "45-profil-monorepo-reference.md" "II-preparation" "08-profil-monorepo-reference.md"

# Chapitre III - Infrastructure IA et automatisation
copy_or_create "43-socle-ia-analyse-migration.md" "III-infrastructure" "09-socle-ia-analyse-migration.md"
copy_or_create "39-procedure-installation-pipeline.md" "III-infrastructure" "10-procedure-installation-pipeline.md"
copy_or_create "34-command-center.md" "III-infrastructure" "11-command-center.md"

# Chapitre IV - Organisation et planification
copy_or_create "10d-backlog-par-modules.md" "IV-planification" "12-backlog-modules-fonctionnels.md"
copy_or_create "35-versionnement-intelligent.md" "IV-planification" "13-versionnement-intelligent.md"

# Chapitre V - Qualité et validation
copy_or_create "84-mismatch-tracker.md" "V-qualite" "14-mismatch-tracker.md"
copy_or_create "30-alertes-desynchronisation.md" "V-qualite" "15-alertes-desynchronisation.md"
copy_or_create "33-audit-automatique.md" "V-qualite" "16-audit-automatique.md"

# Chapitre VI - Sécurité et déploiement
copy_or_create "40-checklist-avant-lancement.md" "VI-securite" "17-checklist-avant-lancement.md"
copy_or_create "46-checklist-bonus-securite.md" "VI-securite" "18-checklist-bonus-securite.md"

# Chapitre VII - Documentation et suivi
copy_or_create "38-journal-modifications.md" "VII-documentation" "19-journal-modifications.md"

# Créer un nouveau sommaire
echo "# 📚 Sommaire du Cahier des Charges Réorganisé

## 📋 Vue d'ensemble du projet

Ce cahier des charges présente l'ensemble du processus de migration automatisée assistée par IA, organisé selon les phases logiques du projet, de la préparation au déploiement.

## 🗂️ Structure des chapitres

### I. Introduction et fondamentaux
1. [Introduction](./chapitres/I-introduction/01-introduction.md) - Présentation du projet et objectifs
2. [Technologies, outils et services](./chapitres/I-introduction/02-technologies-outils-services.md) - État actuel et perspectives d'évolution
3. [Gestion des risques](./chapitres/I-introduction/03-gestion-risques.md) - Identification et stratégies d'atténuation

### II. Phase de préparation
1. [Checklist de pré-migration](./chapitres/II-preparation/04-checklist-pre-migration.md) - Vérifications initiales
2. [Gel du code legacy PHP et SQL](./chapitres/II-preparation/05-gel-code-legacy.md) - Création de la référence immuable
3. [Gel de la structure cible](./chapitres/II-preparation/06-gel-structure-cible.md) - Définition de l'architecture NestJS/Remix
4. [Vérification de l'environnement de test](./chapitres/II-preparation/07-verification-env-test.md) - Configuration des outils
5. [Finalisation du profil monorepo](./chapitres/II-preparation/08-profil-monorepo-reference.md) - Création du profil de référence

### III. Infrastructure IA et automatisation
1. [Socle IA d'analyse et migration](./chapitres/III-infrastructure/09-socle-ia-analyse-migration.md) - Configuration du système IA
2. [Procédure d'installation du pipeline](./chapitres/III-infrastructure/10-procedure-installation-pipeline.md) - Mise en place de l'automatisation
3. [Command Center](./chapitres/III-infrastructure/11-command-center.md) - Interface de suivi de la migration

### IV. Organisation et planification du travail
1. [Backlog par modules fonctionnels](./chapitres/IV-planification/12-backlog-modules-fonctionnels.md) - Structure de migration
2. [Versionnement intelligent](./chapitres/IV-planification/13-versionnement-intelligent.md) - Gestion des versions du code

### V. Qualité et validation
1. [Mismatch Tracker](./chapitres/V-qualite/14-mismatch-tracker.md) - Détection des incohérences
2. [Alertes de désynchronisation](./chapitres/V-qualite/15-alertes-desynchronisation.md) - Système de notification
3. [Audit automatique](./chapitres/V-qualite/16-audit-automatique.md) - Vérification du code migré

### VI. Sécurité et déploiement
1. [Checklist d'avant lancement](./chapitres/VI-securite/17-checklist-avant-lancement.md) - Vérifications finales
2. [Checklist bonus sécurité](./chapitres/VI-securite/18-checklist-bonus-securite.md) - Mesures de sécurité additionnelles

### VII. Documentation et suivi
1. [Journal des modifications](./chapitres/VII-documentation/19-journal-modifications.md) - Historique des changements du CDC

## 📈 Progression du projet

\`\`\`mermaid
graph LR
    A[Préparation] --> B[Infrastructure]
    B --> C[Planification]
    C --> D[Migration]
    D --> E[Validation]
    E --> F[Déploiement]
    F --> G[Maintenance]
    
    style A fill:#d4f1f9,stroke:#05a,stroke-width:2px
    style B fill:#d4f1f9,stroke:#05a,stroke-width:2px
    style C fill:#d4f1f9,stroke:#05a,stroke-width:2px
    style D fill:#ffe6cc,stroke:#d79b00,stroke-width:2px
    style E fill:#ffe6cc,stroke:#d79b00,stroke-width:2px
    style F fill:#d5e8d4,stroke:#82b366,stroke-width:2px
    style G fill:#f8cecc,stroke:#b85450,stroke-width:2px
\`\`\`

## 🔄 Comment utiliser ce cahier des charges

1. **Pour les décideurs**: Commencez par la section I pour comprendre les fondamentaux
2. **Pour les architectes**: Concentrez-vous sur les sections II et III pour la mise en place
3. **Pour les développeurs**: Utilisez les sections IV et V pour le travail quotidien
4. **Pour les responsables qualité**: Référez-vous aux sections V et VI
5. **Pour le suivi du projet**: Consultez la section VII

Ce sommaire suit le cycle de vie du projet de migration, permettant à chaque partie prenante de se repérer facilement et d'accéder rapidement aux informations pertinentes selon son rôle.
" > "$TEMP_DIR/00-sommaire.md"

echo -e "${GREEN}✅ Nouveau sommaire créé${NC}"

# Créer un fichier index.md pour une navigation facile
echo "# Cahier des Charges - Migration PHP vers NestJS/Remix

Bienvenue dans le cahier des charges réorganisé pour la migration de l'application PHP vers NestJS/Remix.

## 📋 Navigation rapide

- [Sommaire complet](./00-sommaire.md)

## 📊 Structure des chapitres

- [I. Introduction et fondamentaux](./chapitres/I-introduction/)
- [II. Phase de préparation](./chapitres/II-preparation/)
- [III. Infrastructure IA et automatisation](./chapitres/III-infrastructure/)
- [IV. Organisation et planification](./chapitres/IV-planification/)
- [V. Qualité et validation](./chapitres/V-qualite/)
- [VI. Sécurité et déploiement](./chapitres/VI-securite/)
- [VII. Documentation et suivi](./chapitres/VII-documentation/)

## 🚀 Progression

Cliquez sur le [Sommaire](./00-sommaire.md) pour voir la progression détaillée du projet.

## 📅 Dernière mise à jour

$(date)
" > "$TEMP_DIR/index.md"

echo -e "${GREEN}✅ Fichier index.md créé${NC}"

# Sauvegarder l'ancienne structure et remplacer par la nouvelle
echo -e "${BLUE}🔄 Sauvegarde de l'ancienne structure...${NC}"
BACKUP_DIR="cahier-des-charges-backup-$(date +%Y%m%d-%H%M%S)"
mv "cahier-des-charges" "$BACKUP_DIR"
echo -e "${GREEN}✅ Sauvegarde créée: $BACKUP_DIR${NC}"

# Renommer le répertoire temporaire
mv "$TEMP_DIR" "cahier-des-charges"
echo -e "${GREEN}✅ Nouvelle structure en place${NC}"

# Mettre à jour le sommaire pour référencer les nouveaux fichiers
echo -e "${BLUE}🔄 Création des liens entre les fichiers...${NC}"

# Créer des liens entre les fichiers par chapitre
for chapter_dir in cahier-des-charges/chapitres/*; do
  chapter=$(basename "$chapter_dir")
  
  # Créer un fichier README.md dans chaque dossier de chapitre
  echo "# Chapitre $chapter

## Contenu du chapitre

" > "$chapter_dir/README.md"
  
  # Ajouter des liens vers les fichiers du chapitre
  for file in "$chapter_dir"/*.md; do
    if [ "$(basename "$file")" != "README.md" ]; then
      # Extraire le titre du fichier
      TITLE=$(head -n 1 "$file" | sed 's/^# //')
      echo "- [$(basename "$file" .md)](./$(basename "$file")) - $TITLE" >> "$chapter_dir/README.md"
    fi
  done
  
  echo -e "${GREEN}✅ Créé README.md pour le chapitre $chapter${NC}"
done

echo -e "${GREEN}✅ Réorganisation terminée avec succès${NC}"
echo -e "${BLUE}📋 La nouvelle structure du cahier des charges est disponible dans le dossier 'cahier-des-charges'${NC}"
echo -e "${YELLOW}⚠️ L'ancienne structure a été sauvegardée dans '$BACKUP_DIR'${NC}"

exit 0