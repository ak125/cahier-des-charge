# Module Authentification et Autorisation

## 🔐 Objectifs du module

Ce module gère l'authentification, les autorisations et les sessions utilisateurs au sein de l'application.

## Architecture

### NestJS (API)

```typescript
// Structure du module Auth dans NestJS
/api/src/auth/
├── auth.module.ts          // Module principal
├── auth.controller.ts      // Points d'entrée API
├── auth.service.ts         // Logique métier
├── strategies/             // Stratégies d'authentification
│   ├── jwt.strategy.ts     // Implémentation JWT 
│   ├── local.strategy.ts   // Login/Password classique
│   └── oauth.strategy.ts   // Authentification externe
├── guards/                 // Gardes d'accès
│   ├── jwt-auth.guard.ts   // Protection par JWT
│   └── roles.guard.ts      // Protection par rôles
└── dto/                    // Objets de transfert
    ├── login.dto.ts        // Données de connexion
    └── register.dto.ts     // Données d'inscription
```

### Remix (Frontend)

```typescript
// Structure du module Auth dans Remix
/web/app/routes/auth/
├── login.tsx               // Page de connexion
├── register.tsx            // Page d'inscription
├── forgot-password.tsx     // Récupération mot de passe
├── reset-password.tsx      // Réinitialisation mot de passe
└── logout.tsx              // Déconnexion

/web/app/utils/auth.server.ts  // Logique d'auth côté serveur Remix
/web/app/hooks/useAuth.ts      // Hook React pour le contexte d'auth
```

## 🔄 Flux d'authentification

1. L'utilisateur accède à `/login`
2. Saisie des identifiants via un formulaire Remix
3. Soumission au backend via l'API `/auth/login`
4. Vérification des credentials par `auth.service.ts`
5. Génération d'un JWT avec la payload contenant:
   - ID utilisateur
   - Rôles
   - Permissions
   - Date d'expiration
6. Stockage du token dans un cookie httpOnly
7. Redirection vers la page d'accueil ou la page demandée

## 🔒 Sécurité et bonnes pratiques

- Utilisation de cookies httpOnly pour le stockage des tokens
- CSRF protection avec tokens dédiés
- Rotation des JWT secrets via GitHub secrets et CI/CD
- Rate limiting avec Redis pour prévenir le brute force
- Validation des entrées via class-validator

## 📊 Métriques de surveillance

- Nombre de tentatives de connexion échouées
- Temps moyen de création de compte
- Taux de réussite des réinitialisations de mots de passe
- Nombre d'utilisateurs bloqués (après X tentatives)
