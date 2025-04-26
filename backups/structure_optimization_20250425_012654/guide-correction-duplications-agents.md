# Guide pour la correction des duplications d'agents

## Introduction

Ce guide présente les étapes à suivre pour corriger les duplications d'agents dans différentes structures de dossiers du projet. Ce problème a été identifié dans le tableau de migration avec les tâches MIG-093 et MIG-087.

## Principes de la correction

1. **Principe de source unique** : Chaque agent doit avoir une implémentation unique dans le projet.
2. **Standardisation des chemins** : Les agents doivent suivre une convention de nommage et d'emplacement cohérente.
3. **Préservation de l'historique** : Les versions différentes sont préservées mais n'interfèrent pas avec la version principale.
4. **Mise à jour des références** : Toutes les références aux agents déplacés doivent être mises à jour.

## Structure standardisée pour les agents

La structure recommandée est la suivante :

```
project-root/
├── business/
│   ├── analyzers/
│   │   └── qa-analyzer/          # Agent qa-analyzer
│   │       ├── qa-analyzer.ts    # Implémentation principale
│   │       └── ...               # Fichiers complémentaires
│   └── validators/
│       └── seo-checker/          # Agent seo-checker
│           ├── seo-checker-agent.ts  # Implémentation principale
│           └── ...               # Fichiers complémentaires
└── ...
```

## Étapes de correction manuelle

### 1. Identification des agents à corriger

Pour MIG-093, nous devons traiter les agents suivants :
- `qa-analyzer`
- `seo-checker`

### 2. Préparation des répertoires cibles

```bash
# Créer les répertoires cibles pour les agents qa-analyzer et seo-checker
mkdir -p business/analyzers/qa-analyzer
mkdir -p business/validators/seo-checker
```

### 3. Choix de la version de référence pour chaque agent

Pour l'agent `qa-analyzer` :
1. Prioriser le fichier dans `agents/qa-analyzer.ts` s'il existe
2. Sinon, prioriser le fichier dans `packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts`
3. Puis les autres emplacements possibles

Pour l'agent `seo-checker` :
1. Prioriser le fichier dans `agents/seo-checker-agent.ts` s'il existe
2. Sinon, prioriser le fichier dans `packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts`
3. Puis les autres emplacements possibles

### 4. Migration vers les emplacements standardisés

Pour l'agent `qa-analyzer` :
```bash
# Créer une copie de sauvegarde
mkdir -p structure-backups/qa-analyzer
cp -p agents/qa-analyzer.ts structure-backups/qa-analyzer/ 2>/dev/null || true
cp -p packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts structure-backups/qa-analyzer/ 2>/dev/null || true

# Déplacer vers l'emplacement standardisé
cp -p agents/qa-analyzer.ts business/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null || \
cp -p packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts business/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null || \
cp -p src/business/analyzers/qa-analyzer/qa-analyzer.ts business/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null || \
cp -p src/business/analyzers/QaAnalyzer/qa-analyzer.ts business/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null
```

Pour l'agent `seo-checker` :
```bash
# Créer une copie de sauvegarde
mkdir -p structure-backups/seo-checker
cp -p agents/seo-checker-agent.ts structure-backups/seo-checker/ 2>/dev/null || true
cp -p packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts structure-backups/seo-checker/ 2>/dev/null || true

# Déplacer vers l'emplacement standardisé
cp -p agents/seo-checker-agent.ts business/validators/seo-checker/seo-checker-agent.ts 2>/dev/null || \
cp -p packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts business/validators/seo-checker/seo-checker-agent.ts 2>/dev/null || \
cp -p packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts business/validators/seo-checker/seo-checker-agent.ts 2>/dev/null || \
cp -p src/business/validators/seo-checker-agent/seo-checker-agent.ts business/validators/seo-checker/seo-checker-agent.ts 2>/dev/null || \
cp -p src/business/validators/SeoCheckerAgent/seo-checker-agent.ts business/validators/seo-checker/seo-checker-agent.ts 2>/dev/null
```

### 5. Suppression des versions dupliquées (optionnel et à risque)

⚠️ **ATTENTION** : Cette étape est à effectuer avec précaution, uniquement après avoir vérifié que la version principale fonctionne correctement.

```bash
# Suppression des versions dupliquées de qa-analyzer (à effectuer avec précaution)
# rm -f packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null
# rm -f src/business/analyzers/qa-analyzer/qa-analyzer.ts 2>/dev/null
# rm -f src/business/analyzers/QaAnalyzer/qa-analyzer.ts 2>/dev/null

# Suppression des versions dupliquées de seo-checker (à effectuer avec précaution)
# rm -f packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts 2>/dev/null
# rm -f packages/mcp-agents/business/validators/seo-checker-agent/seo-checker-agent.ts 2>/dev/null
# rm -f src/business/validators/seo-checker-agent/seo-checker-agent.ts 2>/dev/null
# rm -f src/business/validators/SeoCheckerAgent/seo-checker-agent.ts 2>/dev/null
```

### 6. Mise à jour des références aux agents déplacés

Créer des fichiers d'exportation aux anciens emplacements pour maintenir la compatibilité :

Pour l'agent `qa-analyzer` :
```bash
# Créer des fichiers d'exportation aux anciens emplacements
cat > agents/qa-analyzer.ts << EOF
/**
 * @deprecated Ce fichier est maintenu pour compatibilité. Utiliser business/analyzers/qa-analyzer/qa-analyzer.ts à la place.
 */
export * from '../../business/analyzers/qa-analyzer/qa-analyzer';
EOF

cat > packages/mcp-agents/analyzers/qa-analyzer/qa-analyzer.ts << EOF
/**
 * @deprecated Ce fichier est maintenu pour compatibilité. Utiliser business/analyzers/qa-analyzer/qa-analyzer.ts à la place.
 */
export * from '../../../../business/analyzers/qa-analyzer/qa-analyzer';
EOF
```

Pour l'agent `seo-checker` :
```bash
# Créer des fichiers d'exportation aux anciens emplacements
cat > agents/seo-checker-agent.ts << EOF
/**
 * @deprecated Ce fichier est maintenu pour compatibilité. Utiliser business/validators/seo-checker/seo-checker-agent.ts à la place.
 */
export * from '../../business/validators/seo-checker/seo-checker-agent';
EOF

cat > packages/mcp-agents/misc/seo-checker-agent/seo-checker-agent.ts << EOF
/**
 * @deprecated Ce fichier est maintenu pour compatibilité. Utiliser business/validators/seo-checker/seo-checker-agent.ts à la place.
 */
export * from '../../../../business/validators/seo-checker/seo-checker-agent';
EOF
```

### 7. Test et validation

1. Exécuter des tests pour vérifier que les agents fonctionnent toujours :
   ```bash
   # Si vous avez des tests existants pour ces agents
   npm test -- -t "qa-analyzer"
   npm test -- -t "seo-checker"
   ```

2. Vérifier les imports dans d'autres fichiers pour s'assurer qu'ils fonctionnent toujours correctement.

### 8. Mise à jour du statut des migrations

Après avoir effectué les corrections, mettre à jour le statut de la migration MIG-093 dans `status.json` :

```bash
# Ajouter ou mettre à jour le statut de migration MIG-093
# Cette étape peut être faite manuellement ou via jq :
# jq '.migrations += [{"id": "MIG-093", "status": "done", "lastUpdated": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"}]' status.json > status.json.new
# mv status.json.new status.json
```

## Scripts automatisés

Le script `deduplicate-agents.sh` que nous avons créé automatise ces étapes. Pour l'exécuter :

1. En mode simulation (dry-run) :
   ```bash
   ./deduplicate-agents.sh --verbose
   ```

2. Pour appliquer les modifications :
   ```bash
   ./deduplicate-agents.sh --execute
   ```

## Conclusion

En suivant ces étapes, vous devriez être en mesure de corriger les duplications d'agents et de résoudre le problème identifié dans la tâche MIG-093. Cette approche standardisée aidera également à éviter des problèmes similaires à l'avenir.

## Annexe : Concernant MIG-087

La migration MIG-087 de type "api" est en statut "planned" depuis 11 jours. La recommandation est de "Replanifier ou invalider".

Pour prendre une décision éclairée, il convient de :
1. Évaluer l'importance de cette migration par rapport aux autres priorités
2. Vérifier si les dépendances nécessaires à cette migration sont disponibles
3. Si la migration reste pertinente, la replanifier avec une nouvelle date cible
4. Sinon, l'invalider en mettant son statut à "invalid" dans status.json