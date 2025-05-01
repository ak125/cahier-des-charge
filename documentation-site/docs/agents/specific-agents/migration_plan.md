# Plan de Migration PostgreSQL

Généré le 12 avril 2025

## Sommaire

- [✅ users](#users) - Score: 85%
- [⏳ profiles](#profiles) - Score: 68%
- [✅ sessions](#sessions) - Score: 75%

## users

### ✅ 1.1 – Résumé fonctionnel

Nom de la table : users

Rôle métier : stocke les entités principales

Zone fonctionnelle : utilisateurs / authentification

### 🔧 1.2 – Adaptation PostgreSQL

| Élément | Recommandation |
|---------|----------------|
| Typage | is_admin: TINYINT(1) → BOOLEAN |
| ID | Utiliser @id @default(cuid()) dans Prisma |
| Timestamp | created_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |
| Timestamp | updated_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |
| Enum | status: Créer un enum Prisma UserStatus |

### ⚙️ 1.3 – Recommandations Prisma

- Ajouter @unique sur email
- Utiliser des enums Prisma pour les champs à valeurs constantes
- Ajouter @map("nom_colonne") si nécessaire pour maintenir la compatibilité
- Ajouter @@map("nom_table") à la fin du modèle pour maintenir la compatibilité

Transformer la table en :

```ts
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  status    UserStatus @default(ACTIVE)
  is_admin  Boolean    @default(false)
  created_at DateTime  @default(now()) @db.Timestamptz(6)
  updated_at DateTime? @db.Timestamptz(6)
  
  profile    Profile?
  sessions   Session[]
  
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

### 🧩 1.4 – Optimisations relationnelles

- Utiliser les transactions PostgreSQL pour les opérations critiques
- Utiliser des contraintes de validation côté base de données

### 🧨 1.5 – Instructions post-migration

⚠️ Adapter les DTOs UserDto

⚠️ Mettre à jour les services liés à User

⚠️ Vérifier les validations métier dans UserService

⚠️ Synchroniser les enums TypeScript avec les enums Prisma

⚠️ Mettre à jour les appels dans 5 fichiers liés

### 📄 Fichiers liés

- auth/login.php
- admin/users.php
- app/controllers/UserController.ts
- app/services/AuthService.ts
- app/models/user.model.ts

---

## profiles

### ✅ 1.1 – Résumé fonctionnel

Nom de la table : profiles

Rôle métier : stocke les détails associés aux entités principales

Zone fonctionnelle : profils utilisateurs

### 🔧 1.2 – Adaptation PostgreSQL

| Élément | Recommandation |
|---------|----------------|
| ID | Utiliser @id @default(cuid()) dans Prisma |
| Timestamp | created_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |
| Timestamp | updated_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |
| Auto-incrément | id: Utiliser @default(autoincrement()) dans Prisma |

### ⚙️ 1.3 – Recommandations Prisma

- Créer relation user: User pour user_id
- Définir relation 1:1 avec User
- Ajouter @unique sur user_id
- Utiliser des enums Prisma pour les champs à valeurs constantes
- Ajouter @map("nom_colonne") si nécessaire pour maintenir la compatibilité
- Ajouter @@map("nom_table") à la fin du modèle pour maintenir la compatibilité

Transformer la table en :

```ts
model Profile {
  id         Int       @id @default(autoincrement())
  user_id    String    @unique
  full_name  String?
  address    String?
  phone      String?
  avatar_url String?
  created_at DateTime  @default(now()) @db.Timestamptz(6)
  updated_at DateTime? @db.Timestamptz(6)
  
  user       User      @relation(fields: [user_id], references: [id])
  
  @@map("profiles")
}
```

### 🧩 1.4 – Optimisations relationnelles

- Foreign key déclarée explicitement dans Prisma pour user_id → users.id
- Fusionner profiles avec users si les champs ne sont pas trop nombreux
- Utiliser les transactions PostgreSQL pour les opérations critiques
- Utiliser des contraintes de validation côté base de données

### 🧨 1.5 – Instructions post-migration

⚠️ Adapter les DTOs ProfileDto

⚠️ Mettre à jour les requêtes avec jointures impliquant profiles

⚠️ Mettre à jour les appels dans 3 fichiers liés

### 🔗 Dépendances

Cette table dépend des tables suivantes :

- users

### 📄 Fichiers liés

- app/controllers/ProfileController.ts
- app/services/UserService.ts
- app/models/profile.model.ts

---

## sessions

### ✅ 1.1 – Résumé fonctionnel

Nom de la table : sessions

Rôle métier : stocke des données techniques

Zone fonctionnelle : sessions / authentification

### 🔧 1.2 – Adaptation PostgreSQL

| Élément | Recommandation |
|---------|----------------|
| ID | Utiliser @id @default(cuid()) dans Prisma |
| Timestamp | created_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |
| Timestamp | expires_at: Remplacer TIMESTAMP par TIMESTAMP WITH TIME ZONE |

### ⚙️ 1.3 – Recommandations Prisma

- Créer relation user: User pour user_id
- Définir relation n:1 avec User
- Utiliser des enums Prisma pour les champs à valeurs constantes
- Ajouter @map("nom_colonne") si nécessaire pour maintenir la compatibilité
- Ajouter @@map("nom_table") à la fin du modèle pour maintenir la compatibilité

Transformer la table en :

```ts
model Session {
  id           String    @id @default(cuid())
  user_id      String?
  token        String    @unique
  ip_address   String?   @db.VarChar(45)
  user_agent   String?
  payload      String
  last_activity Int
  created_at   DateTime  @default(now()) @db.Timestamptz(6)
  expires_at   DateTime  @db.Timestamptz(6)
  
  user         User?     @relation(fields: [user_id], references: [id])
  
  @@index([user_id])
  @@map("sessions")
}
```

### 🧩 1.4 – Optimisations relationnelles

- Ajout d'un index sur user_id dans la table sessions
- Foreign key déclarée explicitement dans Prisma pour user_id → users.id
- Utiliser les transactions PostgreSQL pour les opérations critiques
- Utiliser des contraintes de validation côté base de données

### 🧨 1.5 – Instructions post-migration

⚠️ Adapter les DTOs SessionDto

⚠️ Vérifier la compatibilité avec les outils externes

⚠️ Mettre à jour les appels dans 2 fichiers liés

### 🔗 Dépendances

Cette table dépend des tables suivantes :

- users

### 📄 Fichiers liés

- app/services/AuthService.ts
- app/middleware/sessionMiddleware.ts

---