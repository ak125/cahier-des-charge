#!/bin/bash
# Commandes utiles pour la suite de la migration
# Créé le 2025-04-20 00:03:31

# Synchroniser tous les agents dupliqués avec leurs versions principales
./sync-mcp-agents.sh

# Vérifier les erreurs TypeScript actuelles
npm exec tsc --noEmit

# Exécuter les tests des agents
./run-agents-smart-tests.sh

# Générer un nouveau manifeste des agents
node generate-agent-manifest.ts

# Afficher le rapport de migration
cat /workspaces/cahier-des-charge/reports/consolidated-migration-20250419-235845/unified-migration-report.md
