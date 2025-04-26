#!/bin/bash
# complete-reorganization.sh - Finalise la réorganisation de tous les fichiers restants
# Date: 10 avril 2025

echo "🚀 Finalisation de la réorganisation complète du projet cahier-des-charge"

# 1. Déplacer les fichiers du cahier des charges restants
echo "📚 Consolidation finale de la documentation..."

# Créer les dossiers s'ils n'existent pas déjà
mkdir -p docs/cahier-des-charges/chapitres
mkdir -p docs/specifications
mkdir -p docs/rapports
mkdir -p scripts/migration
mkdir -p scripts/verification
mkdir -p scripts/generation
mkdir -p scripts/documentation
mkdir -p config/migration

# Traiter les dossiers de documentation existants
if [ -d "cahier" ]; then
  echo "  - Déplacement de cahier/ → docs/specifications/"
  find cahier -type f -not -path "*/\.*" -exec cp {} docs/specifications/ \;
  echo "  ✅ Contenu du dossier cahier/ copié vers docs/specifications/"
fi

if [ -d "cahier-des-charges" ]; then
  echo "  - Déplacement de cahier-des-charges/ → docs/cahier-des-charges/"
  # Créer d'abord les sous-dossiers si nécessaire
  find cahier-des-charges -type d -not -path "cahier-des-charges" | while read dir; do
    rel_dir=${dir#cahier-des-charges/}
    mkdir -p "docs/cahier-des-charges/$rel_dir"
  done
  # Copier les fichiers
  find cahier-des-charges -type f -not -path "*/\.*" | while read file; do
    rel_file=${file#cahier-des-charges/}
    cp "$file" "docs/cahier-des-charges/$rel_file"
  done
  echo "  ✅ Contenu du dossier cahier-des-charges/ copié vers docs/cahier-des-charges/"
fi

if [ -d "cahier-des-charges-backup-20250410-113108" ]; then
  echo "  - Déplacement de cahier-des-charges-backup-20250410-113108/ → docs/cahier-des-charges/"
  # Copier les fichiers
  find cahier-des-charges-backup-20250410-113108 -type f -not -path "*/\.*" -exec cp {} docs/cahier-des-charges/ \;
  echo "  ✅ Contenu du dossier cahier-des-charges-backup-20250410-113108/ copié vers docs/cahier-des-charges/"
fi

# 2. Organiser les fichiers MD à la racine
echo "📋 Organisation des fichiers markdown..."
mv 48-plan-migration-detaille.md docs/cahier-des-charges/ 2>/dev/null && echo "  - 48-plan-migration-detaille.md → docs/cahier-des-charges/"
mv 50-revision-controle-qualite.md docs/cahier-des-charges/ 2>/dev/null && echo "  - 50-revision-controle-qualite.md → docs/cahier-des-charges/"
mv checklist-migration-ia.md docs/cahier-des-charges/ 2>/dev/null && echo "  - checklist-migration-ia.md → docs/cahier-des-charges/"
mv exemple-utilisation.md docs/specifications/ 2>/dev/null && echo "  - exemple-utilisation.md → docs/specifications/"

# 3. Organiser les fichiers de configuration
echo "⚙️ Organisation des fichiers de configuration..."
# Migration des fichiers de configuration
mv cahier_check.config.json config/migration/ 2>/dev/null && echo "  - cahier_check.config.json → config/migration/"
mv migration-config.json config/migration/ 2>/dev/null && echo "  - migration-config.json → config/migration/"
# Créer un lien symbolique pour migration-config.json à la racine pour maintenir la compatibilité
if [ -f "config/migration/migration-config.json" ]; then
  ln -sf config/migration/migration-config.json migration-config.json 2>/dev/null && echo "  - Lien symbolique créé: migration-config.json → config/migration/migration-config.json"
fi

# 4. Organiser les fichiers HTML et visualisations
echo "🖼️ Organisation des fichiers de visualisation..."
mkdir -p assets/visualisations
mv cahier-des-charges-lecture-optimisee.html assets/visualisations/ 2>/dev/null && echo "  - cahier-des-charges-lecture-optimisee.html → assets/visualisations/"
mv vue-complete-auto.html assets/visualisations/ 2>/dev/null && echo "  - vue-complete-auto.html → assets/visualisations/"
mv vue-complete.html assets/visualisations/ 2>/dev/null && echo "  - vue-complete.html → assets/visualisations/"

# 5. Organiser les fichiers de rapport
echo "📊 Organisation des fichiers de rapport..."
mv health-report.txt reports/ 2>/dev/null && echo "  - health-report.txt → reports/"
mv structure_graph.json reports/ 2>/dev/null && echo "  - structure_graph.json → reports/"

# 6. Organiser les scripts de réorganisation
echo "🛠️ Organisation des scripts d'organisation..."
mkdir -p scripts/reorganisation
mv organize-project.sh scripts/reorganisation/ 2>/dev/null && echo "  - organize-project.sh → scripts/reorganisation/"
mv fix-agent-imports.sh scripts/reorganisation/ 2>/dev/null && echo "  - fix-agent-imports.sh → scripts/reorganisation/"
mv verify-reorganization.sh scripts/reorganisation/ 2>/dev/null && echo "  - verify-reorganization.sh → scripts/reorganisation/"
# Créer des liens symboliques à la racine pour faciliter l'accès
for script in organize-project.sh fix-agent-imports.sh verify-reorganization.sh; do
  if [ -f "scripts/reorganisation/$script" ]; then
    ln -sf scripts/reorganisation/$script $script 2>/dev/null && echo "  - Lien symbolique créé: $script → scripts/reorganisation/$script"
  fi
done

# 7. Organiser les workflows n8n
echo "🔄 Organisation des workflows n8n..."
mkdir -p workflows/migration
mv n8n.pipeline.json workflows/migration/ 2>/dev/null && echo "  - n8n.pipeline.json → workflows/migration/"
# Créer un lien symbolique à la racine
if [ -f "workflows/migration/n8n.pipeline.json" ]; then
  ln -sf workflows/migration/n8n.pipeline.json n8n.pipeline.json 2>/dev/null && echo "  - Lien symbolique créé: n8n.pipeline.json → workflows/migration/n8n.pipeline.json"
fi

echo "✅ Finalisation de la réorganisation terminée !"
echo ""
echo "⚠️ ATTENTION: Les fichiers et dossiers originaux restent présents à la racine."
echo "   Pour les supprimer après vérification, utilisez la commande suivante:"
echo ""
echo "   rm -rf cahier/ cahier-des-charges/ cahier-des-charges-backup-20250410-113108/"
echo "   rm 48-plan-migration-detaille.md 50-revision-controle-qualite.md checklist-migration-ia.md exemple-utilisation.md (et autres fichiers déplacés)"
echo ""
echo "📌 Pour vérifier l'état de la réorganisation, utilisez: ./verify-reorganization.sh"