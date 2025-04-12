# 📊 Analyse de la Dette Technique SQL

*Rapport généré le 12 avril 2025*

## 🔍 Résumé exécutif

Notre analyse a identifié plusieurs patterns récurrents de dette technique dans le schéma de base de données. L'indice global de dette technique est de **6.2/10** (niveau moyen), avec 12 tables et 68 colonnes analysées.

Les problèmes les plus critiques concernent la présence de colonnes multi-usages sans typage strict et des tables "fourre-tout" qui mélangent différents types de données sans modélisation claire. Ces problèmes affectent la maintenabilité, les performances et la fiabilité des données.

## 🚩 Principaux patterns de dette technique identifiés

### 1. Champs redondants ou inutilisés

#### Timestamps incohérents
Nous avons détecté une utilisation incohérente des champs de timestamp à travers le schéma :

| Table | Colonnes problématiques |
|-------|-------------------------|
| users | created_on, updated_at |
| orders | date_created, last_update |
| products | created_at, updated_on |

Cette incohérence rend difficile l'écriture de requêtes et la maintenance. **Recommandation** : standardiser sur `created_at` et `updated_at` avec type TIMESTAMP.

#### Champs d'état dupliqués
Plusieurs tables maintiennent à la fois un code de statut et une description textuelle, créant des risques d'incohérence :

```sql
-- Exemple problématique
orders.status = 1
orders.status_txt = 'Processing'

-- Risque : les valeurs peuvent devenir désynchronisées
```

**Recommandation** : utiliser des ENUM ou une table de référence unique pour les statuts.

#### Identifiants redondants
Des identifiants sont parfois stockés sous plusieurs formes :

```
users.id + users.user_uuid  -- Redondance
orders.id + orders.order_number  -- Même information
```

### 2. 🧩 Colonnes multi-usages

Le schéma contient des colonnes génériques réutilisées pour différents types de données :

```sql
-- Anti-pattern : colonnes génériques
products.data1 = '{"color": "red", "size": "L"}'  -- Pour certains produits
products.data1 = '{"weight": 2.5, "width": 30}'   -- Pour d'autres
```

Ces colonnes posent plusieurs problèmes :
- Impossibilité de valider les données
- Difficulté à indexer efficacement
- Requêtes complexes et peu performantes
- Risque d'incohérence de données

**Cas critique** : la table `configs` utilise une seule colonne `value` de type TEXT pour stocker des données de différents types, sans validation de structure.

### 3. 📋 Mauvais découpage logique

#### Tables fourre-tout
Certaines tables agissent comme des "fourre-tout" stockant des données de nature différente :

| Table | Problème |
|-------|----------|
| core_param | Mélange paramètres système, préférences utilisateur et configurations d'application |
| config_all_in_one | Stocke tous types de configurations sans séparation logique |
| misc_data | Contient des données diverses sans structure claire |

**Impact** : ces tables constituent souvent des goulots d'étranglement en termes de performances et deviennent des sources de confusion pour les développeurs.

#### Relations implicites sans contraintes
De nombreuses relations entre tables existent sans contraintes de clé étrangère formelles :

```sql
-- Relation implicite sans contrainte
orders.user_id -> users.id
order_items.order_id -> orders.id
```

Cette absence de contraintes permet l'introduction d'incohérences dans les données.

### 4. 🔢 Problèmes de typage

Des types de données inappropriés sont utilisés dans plusieurs cas :

| Colonne | Type actuel | Type recommandé |
|---------|-------------|----------------|
| products.price | FLOAT | DECIMAL(10,2) |
| orders.order_date | VARCHAR | DATE |
| users.is_active | INT | BOOLEAN |

Le cas le plus problématique concerne l'utilisation de FLOAT pour les valeurs monétaires, ce qui peut mener à des erreurs d'arrondi et des incohérences financières.

## 📈 Plan d'action pour réduction de la dette

### Court terme (1-2 sprints)
1. Standardiser tous les champs temporels sur le type TIMESTAMP
2. Convertir tous les champs financiers FLOAT en DECIMAL
3. Ajouter les contraintes de clé étrangère manquantes
4. Convertir les TINYINT(1) utilisés comme booléens en BOOLEAN natif

### Moyen terme (2-3 mois)
1. Remplacer les paires status/status_txt par des ENUM ou tables de référence
2. Migrer les colonnes JSON stockées comme TEXT vers le type JSON/JSONB natif
3. Décomposer les colonnes multi-usages (data1, data2) en colonnes spécifiques
4. Standardiser les conventions de nommage des colonnes

### Long terme (6+ mois)
1. Normaliser les tables fourre-tout en tables distinctes avec relations claires
2. Migrer les identifiants vers un format cohérent (numérique ou UUID)
3. Supprimer les colonnes obsolètes après vérification d'usage
4. Implémenter un processus de revue de schéma pour prévenir l'accumulation de dette

## 📝 Bonnes pratiques à implémenter

Pour éviter l'accumulation de dette technique SQL à l'avenir, nous recommandons d'adopter les pratiques suivantes :

1. **Définir un standard de nommage** clair et cohérent pour toutes les tables et colonnes
2. **Documenter le schéma** avec des commentaires SQL 
3. **Utiliser des migrations versionnées** pour toutes les modifications de schéma
4. **Implémenter une revue de schéma** avant d'ajouter de nouvelles tables ou colonnes
5. **Mettre en place une validation automatique** du schéma pour détecter les anti-patterns

---

## 📊 Annexe : Détection de dette par table

### Table users
- ✅ Clé primaire correctement définie
- ❌ Mélange d'identifiants (id, user_uuid)
- ❌ Champ legacy_id obsolète
- ❌ Incohérence timestamp (created_on vs created_at standard)

### Table products
- ✅ Relations correctement définies
- ❌ Type FLOAT pour le prix (risque d'erreurs d'arrondi)
- ❌ Colonnes génériques (data1, data2, json_blob)
- ❌ Champ old_category obsolète

### Table orders
- ✅ Relations vers les utilisateurs
- ❌ Absence de contraintes de clé étrangère
- ❌ Duplication status / status_txt
- ❌ Incohérence timestamp (date_created, last_update)

### Table core_param
- ❌ Table fourre-tout sans structure claire
- ❌ Colonne value sans validation de type
- ❌ Absence d'indexation appropriée
- ❌ Champs redondants

### Table config_all_in_one
- ❌ Mélange de différentes configurations
- ❌ Absence de séparation par domaine
- ❌ Structure trop générique
- ❌ Risque élevé de collisions de noms