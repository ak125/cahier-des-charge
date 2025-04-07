# Spécifications Techniques

## 📦 Architecture Monorepo

### Structure
```
/
├── apps/
│   ├── api/         # NestJS Backend
│   ├── web/         # Remix Frontend
│   └── admin/       # Admin Dashboard
├── libs/
│   ├── core/        # Logique métier partagée
│   ├── ui/          # Composants UI
│   └── utils/       # Utilitaires communs
└── tools/           # Scripts et outils dev
```

## 🛠️ Stack Technique

### Backend (NestJS)
- TypeScript 5+
- NestJS 10+
- Prisma ORM
- Redis pour le cache et les sessions
- Bull pour les jobs/queues

### Frontend (Remix)
- TypeScript 5+
- Remix 2+
- Tailwind CSS
- React Query pour le cache client

### DevOps
- Docker / Docker Compose
- GitHub Actions
- Déploiement CI/CD sur Coolify
