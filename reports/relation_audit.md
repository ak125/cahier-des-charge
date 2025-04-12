# 🔗 Analyse Relationnelle & Cohérence Référentielle

## 📊 Statistiques

- Tables analysées: **16**
- Relations détectées: **14**
- Relations explicites: **11**
- Relations implicites: **1**
- Relations polymorphiques: **2**
- Tables avec risques de cascade: **1**

## 🌟 Tables centrales

- **COMMANDES** - Score de centralité: 0.43 (3 entrantes, 3 sortantes)
- **PIECES** - Score de centralité: 0.29 (3 entrantes, 1 sortantes)
- **AUTO_MODELE** - Score de centralité: 0.21 (2 entrantes, 1 sortantes)
- **USERS** - Score de centralité: 0.14 (2 entrantes, 0 sortantes)

## 🔐 Relations explicites

### COMMANDES → USERS

- Colonne: `user_id` référence `USERS.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  user: USERS @relation(fields: [user_id], references: [id], onDelete: Cascade)
  ```

### COMMANDES → LIVRAISONS

- Colonne: `livraison_id` référence `LIVRAISONS.id`
- ON DELETE: `SET NULL`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  livraison: LIVRAISONS @relation(fields: [livraison_id], references: [id], onDelete: SetNull)
  ```

### COMMANDES → PAIEMENTS

- Colonne: `paiement_id` référence `PAIEMENTS.id`
- ON DELETE: `NO ACTION`
- ON UPDATE: `NO ACTION`
- ⚠️ **Avertissement**: ⚠️ FK paiement_id NOT NULL sans ON DELETE SET NULL/CASCADE
- **Suggestion Prisma**:
  ```prisma
  paiement: PAIEMENTS @relation(fields: [paiement_id], references: [id], onDelete: NoAction)
  ```

### PIECES_COMMANDES → COMMANDES

- Colonne: `commande_id` référence `COMMANDES.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  commande: COMMANDES @relation(fields: [commande_id], references: [id], onDelete: Cascade)
  ```

### PIECES_COMMANDES → PIECES

- Colonne: `piece_id` référence `PIECES.id`
- ON DELETE: `RESTRICT`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  piece: PIECES @relation(fields: [piece_id], references: [id], onDelete: Restrict)
  ```

### AUTO_MODELE → AUTO_MARQUE

- Colonne: `marque_id` référence `AUTO_MARQUE.id`
- ON DELETE: `NO ACTION`
- ON UPDATE: `NO ACTION`
- ⚠️ **Avertissement**: ⚠️ FK marque_id NOT NULL sans ON DELETE SET NULL/CASCADE
- **Suggestion Prisma**:
  ```prisma
  marque: AUTO_MARQUE @relation(fields: [marque_id], references: [id], onDelete: NoAction)
  ```

### PIECES_COMPATIBILITE → PIECES

- Colonne: `piece_id` référence `PIECES.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  piece: PIECES @relation(fields: [piece_id], references: [id], onDelete: Cascade)
  ```

### PIECES_COMPATIBILITE → AUTO_MODELE

- Colonne: `modele_id` référence `AUTO_MODELE.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  modele: AUTO_MODELE @relation(fields: [modele_id], references: [id], onDelete: Cascade)
  ```

### USERS_COMMANDES → USERS

- Colonne: `user_id` référence `USERS.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  user: USERS @relation(fields: [user_id], references: [id], onDelete: Cascade)
  ```

### USERS_COMMANDES → COMMANDES

- Colonne: `commande_id` référence `COMMANDES.id`
- ON DELETE: `CASCADE`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  commande: COMMANDES @relation(fields: [commande_id], references: [id], onDelete: Cascade)
  ```

### PIECES → PIECES_GAMME

- Colonne: `gamme_id` référence `PIECES_GAMME.id`
- ON DELETE: `SET NULL`
- ON UPDATE: `NO ACTION`
- **Suggestion Prisma**:
  ```prisma
  gamme: PIECES_GAMME @relation(fields: [gamme_id], references: [id], onDelete: SetNull)
  ```

## 🔎 Relations implicites détectées

Ces relations ne sont pas déclarées explicitement comme clés étrangères mais semblent être des relations basées sur les conventions de nommage ou la structure.

### TRACKING_STATS → COMMANDES (confiance: 0.70)

- Colonne: `commande_id` semble référencer `COMMANDES.id`
- ⚠️ **Avertissement**: Relation implicite détectée, non définié comme FK dans le schéma
- **Suggestion**: Ajouter une contrainte de clé étrangère pour renforcer l'intégrité relationnelle
  ```sql
  ALTER TABLE TRACKING_STATS ADD CONSTRAINT fk_tracking_stats_commande_id
  FOREIGN KEY (commande_id) REFERENCES COMMANDES(id);
  ```

- **Suggestion Prisma**:
  ```prisma
  commande: COMMANDES @relation(fields: [commande_id], references: [id], onDelete: SetNull)
  ```

## ⚠️ Relations polymorphiques

Les relations polymorphiques sont difficiles à modéliser en Prisma. Voici les candidats détectés et les suggestions de restructuration:

### Table MEDIA - Polymorphisme via ref_type

- ID Column: `ref_id`
- Type Column: `ref_type`
- Références probables: PIECES, AUTO_MODELE
- **Problème**: Relation polymorphique (via type_column) - limitée en Prisma
- **Suggestion**: Considérer une restructuration en relations explicites par type

#### Option 1: Relations explicites séparées

```prisma
piece: PIECES? @relation(fields: [pieceId], references: [id])
pieceId: Int?
autoModele: AUTO_MODELE? @relation(fields: [autoModeleId], references: [id])
autoModeleId: Int?
```

#### Option 2: Tables de relation séparées

Créer des tables de jonction séparées pour chaque type de relation.

## 🔥 Risques de cascade

### COMMANDES → USERS

- **Avertissement**: ⚠️ Cascade DELETE risquée: USERS a 2 tables dépendantes
- **Impact**: Supprimer des données de `USERS` pourrait entraîner la suppression en cascade de données dans plusieurs tables dépendantes
- **Suggestion**: Considérer SET NULL au lieu de CASCADE, ou mettre en place des sauvegardes avant suppression