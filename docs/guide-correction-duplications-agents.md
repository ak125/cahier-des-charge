# Guide de Correction des Duplications d'Agents

## Contexte

Dans notre architecture MCP (Model Context Protocol), nous avons identifié un problème structurel concernant la duplication des packages d'agents avec deux conventions de nommage différentes:

1. Format kebab-case (avec tirets): `agent-name-agent` 
2. Format concaténé: `agentnameagent`

Cette situation crée de la confusion pour les développeurs, complique la maintenance et augmente inutilement la taille de la base de code.

## Objectifs

1. **Standardiser** les noms des packages d'agents en utilisant un format cohérent (kebab-case)
2. **Réduire** la duplication dans la base de code
3. **Maintenir** la compatibilité avec le code existant pendant la période de transition
4. **Documenter** clairement les chemins dépréciés et les alternatives recommandées

## Méthodologie de Consolidation

### 1. Identification des Agents Dupliqués

Le script d'automatisation `/workspaces/cahier-des-charge/cleanup-scripts/consolidate-duplicate-agents.js` identifie automatiquement les paires d'agents qui sont des variantes l'une de l'autre:

```javascript
// Identification des agents dupliqués
function areVariants(name1, name2) {
  return kebabToConcatenated(name1) === name2 || kebabToConcatenated(name2) === name1;
}
```

### 2. Standardisation sur le Format Kebab-Case

Nous avons choisi de standardiser sur le format kebab-case (`nom-avec-tirets`) car:

- Il est plus lisible et conforme aux conventions de nommage de packages Node.js
- Il permet une meilleure distinction visuelle entre les mots
- Il est cohérent avec notre style de nommage de projet général

### 3. Stratégie de Redirection

Pour chaque paire d'agents dupliqués, nous:

1. **Conservons** la version kebab-case comme implémentation principale
2. **Créons** une redirection dans le dossier à format concaténé
3. **Ajoutons** des annotations `@deprecated` pour encourager la migration

Exemple de redirection:

```typescript
/**
 * @deprecated Ce chemin d'import est déprécié et sera supprimé dans une future version.
 * Veuillez utiliser l'import depuis le package avec tirets à la place.
 */

export * from './relatif/vers/agent-kebab-case';
```

### 4. Documentation pour les Développeurs

Dans chaque dossier concaténé, nous ajoutons un fichier README.md qui:

- Explique que le package est déprécié
- Indique l'alternative recommandée
- Fournit un exemple de migration des imports

## Comment Utiliser le Script d'Automatisation

Le script `consolidate-duplicate-agents.js` automatise tout le processus de consolidation:

```bash
# Exécution en mode simulation sans effectuer de modifications
node consolidate-duplicate-agents.js --dry-run

# Exécution avec affichage de détails supplémentaires
node consolidate-duplicate-agents.js --verbose

# Exécution standard
node consolidate-duplicate-agents.js
```

Le script:
1. Identifie tous les agents dupliqués
2. Crée les redirections nécessaires
3. Ajoute la documentation appropriée
4. Génère un rapport détaillé dans `/workspaces/cahier-des-charge/cleanup-report/duplicate-agents-report.md`

## Conseils pour les Développeurs

### Pour l'Utilisation des Agents

- Utilisez systématiquement le format kebab-case pour les imports:
  ```typescript
  // ✅ Recommandé
  import { fonctionnalité } from 'agent-name-agent';
  
  // ❌ Déprécié
  import { fonctionnalité } from 'agentnameagent';
  ```

- Si vous voyez un avertissement de dépréciation, mettez à jour vos imports dès que possible.

### Pour la Création de Nouveaux Agents

- Nommez toujours les nouveaux agents en utilisant le format kebab-case
- Suivez la convention: descriptif de la fonctionnalité + suffixe "-agent"
- Exemple: `database-migration-agent`, `performance-analyzer-agent`

## Plan de Migration

1. **Phase 1 (Mai 2025)**: Consolidation avec redirections pour compatibilité arrière ✓
2. **Phase 2 (Q3 2025)**: Migration progressive des imports dans le code client
   - Analyse des usages restants
   - Migration prioritaire dans les workflows actifs
3. **Phase 3 (Q4 2025)**: Suppression des fichiers de redirection et nettoyage final
   - Préavis de 3 mois
   - Support pour les équipes ayant besoin d'aide pour la migration

## Agents Consolidés

Agents déjà consolidés (format kebab-case conservé):

- `audit-selector-agent` et `auditselectoragent`
- `classifier-agent` et `classifieragent`
- `component-generator-agent` et `componentgeneratoragent`
- `debt-analyzer-agent` et `debtanalyzeragent`
- `php-analyzer-agent` et `phpanalyzeragent`
- `schema-agent` et `schemaagent`
- `mysql-analyzer-agent` et `mysqlanalyzeragent`
- `data-analyzer` et `dataanalyzer`
- `dependency-analyzer` et `dependencyanalyzer`
- `structure-analyzer` et `structureanalyzer`
- `relation-analyzer-agent` et `relationanalyzeragent`

## Maintien des Standards

Cette initiative de consolidation s'inscrit dans un effort plus large de standardisation et d'amélioration de la qualité du code. La convention kebab-case a été ajoutée aux standards de développement officiels de l'équipe et sera appliquée systématiquement pour les futures implémentations d'agents MCP.

## Contacts

Pour toute question concernant cette initiative de consolidation, veuillez contacter:

- Équipe d'Architecture
- Équipe MCP Core
- Équipe DevOps