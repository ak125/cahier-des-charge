#!/bin/bash
# update-references.sh - Met à jour les références de fichiers après la réorganisation
# Date: 10 avril 2025

echo "🔄 Mise à jour des références dans les fichiers après réorganisation..."

# Fonction pour chercher et remplacer dans les fichiers
update_references() {
  local pattern="$1"
  local replacement="$2"
  local file_pattern="$3"
  
  echo "🔍 Recherche de '$pattern' à remplacer par '$replacement' dans $file_pattern"
  
  # Trouver tous les fichiers correspondant au motif
  find . -type f -name "$file_pattern" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read file; do
    # Vérifier si le motif existe dans le fichier
    if grep -q "$pattern" "$file"; then
      echo "  - Mise à jour des références dans $file"
      sed -i "s|$pattern|$replacement|g" "$file"
    fi
  done
}

# Mise à jour des références aux dossiers de documentation
update_references "/workspaces/cahier-des-charge/cahier-des-charges" "/workspaces/cahier-des-charge/docs/cahier-des-charges" "*.{ts,js,json,md,sh}"
update_references "/workspaces/cahier-des-charge/cahier-des-charges-backup-20250410-113108" "/workspaces/cahier-des-charge/docs/cahier-des-charges" "*.{ts,js,json,md,sh}"
update_references "/workspaces/cahier-des-charge/cahier/" "/workspaces/cahier-des-charge/docs/specifications/" "*.{ts,js,json,md,sh}"

# Mise à jour des références aux scripts
update_references "run-progressive-migration.sh" "scripts/migration/run-progressive-migration.sh" "*.{ts,js,json,md,sh}"
update_references "migration-orchestrator.ts" "scripts/migration/migration-orchestrator.ts" "*.{ts,js,json,md,sh}"
update_references "verify-" "scripts/verification/verify-" "*.{ts,js,json,md,sh}"
update_references "check-consistency.sh" "scripts/verification/check-consistency.sh" "*.{ts,js,json,md,sh}"
update_references "generate_" "scripts/generation/generate_" "*.{ts,js,json,md,sh}"

# Mise à jour des références aux agents
update_references "require('../../agents/BaseAgent')" "require('../../agents/core/BaseAgent')" "*.{ts,js}"
update_references "from '../../agents/BaseAgent'" "from '../../agents/core/BaseAgent'" "*.{ts,js}"
update_references "import { BaseAgent } from './BaseAgent'" "import { BaseAgent } from './core/BaseAgent'" "*.{ts,js}"
update_references "require('./BaseAgent')" "require('./core/BaseAgent')" "*.{ts,js}"

# Mise à jour des références aux agents dans les fichiers de configuration
update_references "\"agents\": \[\"structure\"" "\"agents\": \[\"analysis/structure\"" "*.json"
update_references "\"agents\": \[\"business\"" "\"agents\": \[\"migration/business\"" "*.json"
update_references "\"agents\": \[\"data\"" "\"agents\": \[\"analysis/data\"" "*.json"
update_references "\"agents\": \[\"quality\"" "\"agents\": \[\"quality/quality\"" "*.json"

echo "✅ Mise à jour des références terminée !"
echo "⚠️ Note: Certaines références peuvent nécessiter des ajustements manuels supplémentaires."