#!/bin/bash

echo "🔍 Vérification de la checklist de migration IA..."

# Vérifier l'existence du tag Git
if git rev-parse --verify legacy-php-vFinal >/dev/null 2>&1; then
  echo "✅ Tag Git 'legacy-php-vFinal' trouvé"
else
  echo "❌ Tag Git 'legacy-php-vFinal' manquant"
fi

# Vérifier l'existence du dump SQL
SQL_DUMPS=$(find /workspaces/cahier-des-charge/archives -name "mysql_*.sql" 2>/dev/null)
if [ -n "$SQL_DUMPS" ]; then
  echo "✅ Dump SQL trouvé: $SQL_DUMPS"
else
  echo "❌ Aucun dump SQL trouvé dans le dossier archives"
fi

# Vérifier le fichier .htaccess archivé
if [ -f "/workspaces/cahier-des-charge/archives/legacy/.htaccess" ]; then
  echo "✅ Fichier .htaccess archivé trouvé"
else
  echo "❌ Fichier .htaccess non archivé"
fi

# Vérifier les autres éléments de la checklist
echo ""
echo "📋 Veuillez compléter manuellement le reste de la checklist dans checklist-migration-ia.md"
echo ""
echo "🚀 Pour intégrer cette vérification dans n8n, utilisez le fichier 'pre-migration-verifier.ts'"
