---
title: Format enrichi de schema_migration_diff.json
phase: architecture
domain: data, migration, traceability
tags: [mysql, prisma, migration, schema, diff, json, zod, typescript]
updatedAt: 2025-04-16
---

# 📁 Format enrichi de schema_migration_diff.json

Ce fichier devient une source unique de vérité entre MySQL, Prisma et les agents de migration, servant de référentiel central pour toutes les transformations de schéma.

## 🔍 Objectifs principaux

- Documenter précisément chaque changement entre MySQL et Prisma
- Tracer l'origine et la justification de chaque modification
- Servir de base pour la génération automatique de code
- Faciliter les audits et la revue des transformations
- Permettre le rollback ciblé si nécessaire

## ✅ 1. Traçabilité des changements

- Origine du champ (MySQL)
- Évolution vers Prisma (nom, type, contraintes)
- Raison du changement (nommage, indexation, normalisation)
- Date et agent IA responsable

## ✅ 2. Versioning intégré

- Hash du schema MySQL
- Version du modèle Prisma cible
- UUID de la détection

## 🔧 Exemple JSON structuré

```json
{
  "metadata": {
    "source": {
      "type": "MySQL",
      "dump_hash": "f5a2b7e...d9c",
      "extracted_at": "2025-04-06T18:33:00Z"
    },
    "target": {
      "type": "Prisma",
      "version": "v2.0.1",
      "generated_at": "2025-04-06T18:34:22Z"
    },
    "diff_id": "schema_diff_20250406_183400",
    "detected_by": "mysql-analyzer+optimizer",
    "confirmed_by": null
  },
  "tables": [
    {
      "name": "AUTO_TYPE",
      "columns": [
        {
          "column": "marque_id",
          "change": "renamed",
          "from": "id_marque",
          "to": "marque_id",
          "reason": "Alignement avec les conventions Prisma (snake_case → camelCase)",
          "agent": "sync-mapper",
          "timestamp": "2025-04-06T18:34:12Z"
        },
        {
          "column": "description",
          "change": "type_changed",
          "from_type": "TEXT",
          "to_type": "String",
          "reason": "Prisma n'a pas de support natif pour TEXT, conversion vers String recommandée",
          "agent": "mysql-analyzer",
          "timestamp": "2025-04-06T18:34:15Z"
        },
        {
          "column": "dispo",
          "change": "dropped",
          "reason": "Champ inutilisé détecté dans tous les appels PHP",
          "agent": "php-sql-sync-mapper",
          "timestamp": "2025-04-06T18:34:18Z"
        }
      ]
    },
    {
      "name": "PIECES_GAMME",
      "columns": [
        {
          "column": "slug",
          "change": "added",
          "to_type": "String",
          "reason": "Nécessaire pour le SEO et les routes Remix canoniques",
          "agent": "slug-preserver",
          "timestamp": "2025-04-06T18:34:21Z"
        }
      ]
    }
  ]
}
```

## 🧩 Intégration dans votre pipeline

| Étape | Utilisation |
|-------|-------------|
| 🧠 php-analyzer.ts | Met à jour les .audit.md si un champ renommé n'est pas présent dans Prisma |
| 🧮 sync-mapper.ts | Génère un patch migration_patch.json basé sur ce diff |
| 📥 dev-generator.ts | Aligne les DTOs et services NestJS automatiquement |
| 📦 mcp-integrator.ts | Commit intelligent uniquement si le diff a changé |

## 📋 Validateur Zod/TypeScript

Le schéma Zod suivant permet de valider le format du fichier `schema_migration_diff.json` et de générer des types TypeScript:

```typescript
// filepath: /workspaces/cahier-des-charge/validation/schema-migration-diff.validator.ts
import { z } from 'zod';

// Types de changements possibles
const ChangeTypeEnum = z.enum([
  'added',
  'dropped',
  'renamed',
  'type_changed',
  'constraint_added',
  'constraint_removed',
  'default_changed',
  'relation_changed'
]);

// Métadonnées source (MySQL)
const SourceMetadataSchema = z.object({
  type: z.literal('MySQL'),
  dump_hash: z.string().min(8),
  extracted_at: z.string().datetime()
});

// Métadonnées cible (Prisma)
const TargetMetadataSchema = z.object({
  type: z.literal('Prisma'),
  version: z.string(),
  generated_at: z.string().datetime()
});

// Métadonnées globales du diff
const MetadataSchema = z.object({
  source: SourceMetadataSchema,
  target: TargetMetadataSchema,
  diff_id: z.string(),
  detected_by: z.string(),
  confirmed_by: z.string().nullable()
});

// Schéma pour un changement de colonne
const ColumnChangeSchema = z.object({
  column: z.string(),
  change: ChangeTypeEnum,
  reason: z.string(),
  agent: z.string(),
  timestamp: z.string().datetime()
}).and(
  // Champs conditionnels selon le type de changement
  z.discriminatedUnion('change', [
    z.object({ 
      change: z.literal('added'), 
      to_type: z.string() 
    }),
    z.object({ 
      change: z.literal('dropped')
    }),
    z.object({ 
      change: z.literal('renamed'), 
      from: z.string(), 
      to: z.string() 
    }),
    z.object({ 
      change: z.literal('type_changed'), 
      from_type: z.string(), 
      to_type: z.string() 
    }),
    z.object({ 
      change: z.literal('constraint_added'), 
      constraint: z.string() 
    }),
    z.object({ 
      change: z.literal('constraint_removed'), 
      constraint: z.string() 
    }),
    z.object({ 
      change: z.literal('default_changed'), 
      from_default: z.any(), 
      to_default: z.any() 
    }),
    z.object({ 
      change: z.literal('relation_changed'), 
      from_relation: z.string(), 
      to_relation: z.string() 
    })
  ])
);

// Schéma pour une table
const TableSchema = z.object({
  name: z.string(),
  columns: z.array(ColumnChangeSchema)
});

// Schéma complet du fichier
export const SchemaMigrationDiffSchema = z.object({
  metadata: MetadataSchema,
  tables: z.array(TableSchema)
});

// Type dérivé du schéma Zod
export type SchemaMigrationDiff = z.infer<typeof SchemaMigrationDiffSchema>;

/**
 * Valide un fichier schema_migration_diff.json
 * @param jsonContent Contenu du fichier à valider
 * @returns Résultat de la validation
 */
export function validateSchemaMigrationDiff(jsonContent: any): 
  { valid: true, data: SchemaMigrationDiff } | { valid: false, errors: z.ZodError } {
  try {
    const validated = SchemaMigrationDiffSchema.parse(jsonContent);
    return { valid: true, data: validated };
  } catch (error) {
    return { valid: false, errors: error as z.ZodError };
  }
}
```

## ✅ Validation CI/CD

Ajoutez une validation automatique dans ci-migration.yml :

```yaml
- name: Vérifier schema_migration_diff.json
  run: |
    jq 'select(.metadata != null and .tables | length > 0)' schema_migration_diff.json
```

Cette étape bloque les merges si le diff est incomplet ou corrompu.

### Version améliorée avec validation Zod

```yaml
- name: Installer les dépendances
  run: npm ci
  
- name: Vérifier schema_migration_diff.json
  run: |
    node -e "
    const { validateSchemaMigrationDiff } = require('./validation/schema-migration-diff.validator');
    const fs = require('fs');
    
    const content = JSON.parse(fs.readFileSync('./schema_migration_diff.json', 'utf8'));
    const result = validateSchemaMigrationDiff(content);
    
    if (!result.valid) {
      console.error('Validation error:', result.errors);
      process.exit(1);
    } else {
      console.log('Schema validation successful');
    }
    "
```

## 🔄 Utilisation dans l'interface de migration

```typescript
// Exemple d'utilisation dans un composant React/Remix
import { useFetcher } from '@remix-run/react';
import { SchemaMigrationDiff } from '~/validation/schema-migration-diff.validator';

export default function SchemaDiffViewer() {
  const fetcher = useFetcher<SchemaMigrationDiff>();
  
  useEffect(() => {
    fetcher.load('/api/schema-diff');
  }, []);
  
  if (!fetcher.data) return <div>Chargement du diff de schéma...</div>;
  
  return (
    <div className="schema-diff-viewer">
      <h2>Différences de schéma</h2>
      
      <div className="metadata">
        <p>Source: MySQL (extrait le {new Date(fetcher.data.metadata.source.extracted_at).toLocaleString()})</p>
        <p>Cible: Prisma {fetcher.data.metadata.target.version}</p>
        <p>Diff ID: {fetcher.data.metadata.diff_id}</p>
      </div>
      
      <div className="tables">
        {fetcher.data.tables.map(table => (
          <div key={table.name} className="table-diff">
            <h3>{table.name}</h3>
            
            <table className="changes-table">
              <thead>
                <tr>
                  <th>Colonne</th>
                  <th>Changement</th>
                  <th>Détails</th>
                  <th>Raison</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map(change => (
                  <tr key={`${table.name}-${change.column}-${change.change}`}>
                    <td>{change.column}</td>
                    <td>{change.change}</td>
                    <td>
                      {change.change === 'renamed' && `${change.from} → ${change.to}`}
                      {change.change === 'type_changed' && `${change.from_type} → ${change.to_type}`}
                      {change.change === 'added' && `Nouveau: ${change.to_type}`}
                      {change.change === 'dropped' && 'Supprimé'}
                    </td>
                    <td>{change.reason}</td>
                    <td>{change.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Ce format enrichi du fichier `schema_migration_diff.json` offre une traçabilité complète, une validation robuste et s'intègre parfaitement dans le pipeline de migration automatisée.
