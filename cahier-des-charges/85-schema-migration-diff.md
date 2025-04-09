---
title: Fichier schema_migration_diff.json
phase: migration
domain: database, schema
tags: [mysql, prisma, migration, diff, schema]
updatedAt: 2025-04-20
---

# 🧾 Fichier schema_migration_diff.json

## 🎯 Objectif

Fournir un diff structuré et versionné entre la base de données MySQL originale et le modèle Prisma cible. Il permet :

- d'automatiser la validation des migrations PHP,
- de synchroniser le code NestJS et Prisma,
- de détecter les divergences critiques (renommages, types, relations).

## 📂 Sources

- `mysql.sql` (dump exporté de la BDD legacy)
- `schema.prisma` (modèle généré ou optimisé)
- Comparé à l'aide d'un agent comme `mysql-analyzer+optimizer`

## 📄 Structure du fichier

```json
{
  "metadata": {
    "source": "mysql.sql",
    "target": "schema.prisma",
    "generatedAt": "2025-04-09T14:33:00Z",
    "agent": "mysql-analyzer+optimizer"
  },
  "tables": {
    "users": {
      "status": "modified",
      "changes": {
        "columns": {
          "email": {
            "type": "VARCHAR(255) → String",
            "mappedTo": "email"
          },
          "is_active": {
            "type": "TINYINT(1) → Boolean",
            "mappedTo": "isActive",
            "transformation": "rename"
          },
          "created_at": {
            "type": "DATETIME → DateTime",
            "note": "conversion automatique"
          }
        },
        "deletedColumns": ["legacy_password"],
        "addedColumns": {
          "email_verified": {
            "type": "Boolean",
            "default": false
          }
        }
      }
    },
    "orders": {
      "status": "new",
      "changes": {
        "addedColumns": {
          "tracking_number": {
            "type": "String"
          }
        }
      }
    }
  }
}
```

## 🧠 Fonctions clés intégrées

| Fonction | Détail |
|----------|--------|
| ✅ Tracking des renommages | Colonne A renommée en champ Prisma B avec note de mapping |
| 🔁 Diff typologique | Conversion typée (ex: TINYINT(1) → Boolean, DECIMAL → Float) |
| 💔 Champs supprimés | Liste explicite des colonnes absentes du schéma cible |
| ➕ Champs ajoutés | Champs Prisma absents de MySQL avec leurs valeurs par défaut ou règles |
| 🔗 Relations ajoutées ou refactorisées | Détail des @relation, @map, ou @@index modifiés |

## 🔄 Usage dans le Pipeline

| Étape | Utilisation |
|-------|-------------|
| `php-analyzer.ts` | Valide les noms de colonnes utilisés en PHP en fonction du diff |
| `php-sql-mapper.ts` | Génère `migration_patch.json` en se basant sur ce fichier |
| `diff-validator.ts` | Compare le comportement PHP ↔ Prisma à partir des écarts détectés |
| `qa-checklist.ts` | Vérifie si tous les champs migrés sont présents et valides |

## 📊 Exemple de rapport de migration

Voici un exemple plus complet avec davantage de détails sur les changements relationnels :

```json
{
  "metadata": {
    "source": "mysql.sql",
    "target": "schema.prisma",
    "generatedAt": "2025-04-20T09:45:12Z",
    "agent": "mysql-analyzer+optimizer",
    "sourceVersion": "5.7.35",
    "targetVersion": "Prisma 4.8.0"
  },
  "summary": {
    "tablesModified": 12,
    "tablesAdded": 3,
    "tablesRemoved": 1,
    "columnsRenamed": 28,
    "columnsTypeChanged": 17,
    "relationsModified": 9,
    "impactScore": 0.74
  },
  "tables": {
    "products": {
      "status": "modified",
      "impactScore": 0.95,
      "changes": {
        "columns": {
          "id": {
            "type": "INT → Int",
            "mappedTo": "id",
            "note": "Primary key préservée"
          },
          "nom": {
            "type": "VARCHAR(255) → String",
            "mappedTo": "name",
            "transformation": "rename",
            "reason": "Standardisation anglais"
          },
          "prix": {
            "type": "DECIMAL(10,2) → Decimal",
            "mappedTo": "price",
            "transformation": "rename",
            "reason": "Standardisation anglais"
          },
          "description": {
            "type": "TEXT → String",
            "mappedTo": "description"
          },
          "categorie_id": {
            "type": "INT → Int",
            "mappedTo": "categoryId",
            "transformation": "rename",
            "reason": "Convention camelCase"
          }
        },
        "deletedColumns": ["date_suppression"],
        "addedColumns": {
          "createdAt": {
            "type": "DateTime",
            "default": "now()"
          },
          "updatedAt": {
            "type": "DateTime",
            "default": "now()",
            "note": "Mise à jour automatique"
          }
        },
        "relations": {
          "category": {
            "type": "belongsTo",
            "source": "Table.categorie → Table.categoryId",
            "target": "Model.Category → Field.id",
            "transformation": "explicit relation",
            "note": "Relation implicite rendue explicite"
          }
        },
        "indexes": {
          "idx_categorie": {
            "transformation": "renamed",
            "target": "Products_categoryId_idx"
          },
          "idx_prix": {
            "transformation": "added",
            "fields": ["price"],
            "reason": "Optimisation des requêtes de tri par prix"
          }
        }
      }
    }
  }
}
```

## 🧠 Astuce Avancée

Ajoutez une clé "impactScore" par table pour identifier les entités les plus critiques à tester (en croisant avec logs d'accès, SEO ou nombre de relations).

```json
"products": {
  "status": "modified",
  "impactScore": 0.95,  // Score élevé basé sur logs et SEO
  "changes": {
    // ...
  }
}
```

## 🔄 Génération et maintenance automatique

Le fichier `schema_migration_diff.json` est généré automatiquement par l'agent `mysql-analyzer+optimizer`. Ce processus peut être programmé pour s'exécuter :

1. À chaque modification du schéma Prisma
2. Lors de l'exécution d'une commande `prisma migrate dev`
3. À intervalles réguliers via n8n pour détecter les dérives potentielles

L'agent utilise plusieurs techniques pour produire un diff précis :

- Analyse syntaxique du dump MySQL
- Parsing du schéma Prisma
- Heuristiques de correspondance des noms de colonnes
- Règles de conversion de types MySQL → Prisma

## 🧩 Intégration avec le dashboard Remix

Le contenu de `schema_migration_diff.json` est idéal pour alimenter un tableau de bord de migration :

```tsx
// Exemple d'intégration dans dashboard.tsx
export default function SchemaMigrationDiff() {
  const diffData = useLoaderData<typeof loader>();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Migrations de schéma</h1>
      
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard 
          title="Tables modifiées" 
          value={diffData.summary.tablesModified} 
          icon="📊" 
        />
        <StatCard 
          title="Colonnes renommées" 
          value={diffData.summary.columnsRenamed} 
          icon="🔄" 
        />
        <StatCard 
          title="Types modifiés" 
          value={diffData.summary.columnsTypeChanged} 
          icon="🔁" 
        />
        <StatCard 
          title="Score d'impact" 
          value={`${Math.round(diffData.summary.impactScore * 100)}%`} 
          icon="⚠️" 
        />
      </div>
      
      <div className="space-y-4">
        {Object.entries(diffData.tables)
          .sort(([,a], [,b]) => (b.impactScore || 0) - (a.impactScore || 0))
          .map(([tableName, tableData]) => (
            <TableDiffCard 
              key={tableName}
              tableName={tableName}
              tableData={tableData as any}
            />
          ))
        }
      </div>
    </div>
  );
}
```

## 📌 Extensions futures

- ✅ Ajout de "indexChanges" pour détecter les pertes de performance potentielles
- ✅ Génération automatique d'un patch.prisma correctif
- ✅ Intégration à un dashboard.tsx Remix de suivi des divergences
- ✅ Détection des ENUM transformés

Cette approche diffing précise et structurée est essentielle pour garantir l'intégrité de la migration et faciliter le travail des équipes de développement.
