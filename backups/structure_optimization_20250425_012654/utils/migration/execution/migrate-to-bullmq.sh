#!/bin/bash
# Script pour migrer de PostgreSQL LISTEN/NOTIFY vers BullMQ
# À exécuter depuis la racine du projet

set -e
echo "🚀 Migration de PostgreSQL LISTEN/NOTIFY vers BullMQ..."

# Vérification des prérequis
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm est requis mais n'est pas installé."
  echo "   Installez-le avec: npm install -g pnpm"
  exit 1
fi

# Installation des dépendances BullMQ
echo "📦 Installation des dépendances BullMQ..."
pnpm add bullmq @nestjs/bullmq @bull-board/api @bull-board/express -w

# Création des répertoires requis
echo "📂 Création des répertoires nécessaires..."
mkdir -p apps/mcp-server/src/bullmq
mkdir -p agents/workers

# Vérification de Redis
echo "🔍 Vérification de Redis..."
if ! command -v redis-cli &> /dev/null || ! redis-cli ping &> /dev/null; then
  echo "📝 Redis n'est pas installé ou n'est pas en cours d'exécution."
  echo "   Souhaitez-vous lancer Redis avec Docker ? [O/n] "
  read -r response
  if [[ "$response" =~ ^([oO]|oui|Oui|OUI|)$ ]]; then
    echo "🐳 Démarrage de Redis avec Docker..."
    docker run --name redis-mcp -p 6379:6379 -d redis:alpine
    echo "⏳ Attente du démarrage de Redis..."
    sleep 3
  else
    echo "❌ Redis est requis pour BullMQ. Installation abandonnée."
    exit 1
  fi
fi

# Copie des fichiers depuis les exemples existants vers les bons emplacements
echo "📋 Copie des fichiers d'intégration BullMQ..."

# Fichiers de service BullMQ
cp -v examples/bullmq/bullmq.module.ts apps/mcp-server/src/bullmq/bullmq.module.ts 2>/dev/null || \
  cp -v /workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts apps/mcp-server/src/bullmq/bullmq.module.ts

cp -v examples/bullmq/bullmq.service.ts apps/mcp-server/src/bullmq/bullmq.service.ts 2>/dev/null || \
  cp -v /workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.service.ts apps/mcp-server/src/bullmq/bullmq.service.ts

cp -v examples/bullmq/bull-board.service.ts apps/mcp-server/src/bullmq/bull-board.service.ts 2>/dev/null || \
  cp -v /workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts apps/mcp-server/src/bullmq/bull-board.service.ts

# Fichiers de worker et orchestrateur
cp -v examples/bullmq/php-analyzer.worker.ts agents/workers/php-analyzer.worker.ts 2>/dev/null || \
  cp -v /workspaces/cahier-des-charge/agents/workers/php-analyzer.worker.ts agents/workers/php-analyzer.worker.ts

cp -v examples/bullmq/bullmq-orchestrator.ts agents/bullmq-orchestrator.ts 2>/dev/null || \
  cp -v /workspaces/cahier-des-charge/agents/bullmq-orchestrator.ts agents/bullmq-orchestrator.ts

# Modification du fichier app.module.ts pour inclure BullQueueModule
echo "🔧 Mise à jour du module principal de l'application..."
if [ -f "apps/mcp-server/src/app.module.ts" ]; then
  # Vérifier si BullQueueModule est déjà importé
  if ! grep -q "BullQueueModule" apps/mcp-server/src/app.module.ts; then
    # Ajouter l'import
    sed -i "s/import { Module } from '@nestjs\/common';/import { Module } from '@nestjs\/common';\nimport { BullQueueModule } from '.\/bullmq\/bullmq.module';/" apps/mcp-server/src/app.module.ts
    # Ajouter le module aux imports
    sed -i "s/imports: \[/imports: \[\n    BullQueueModule,/" apps/mcp-server/src/app.module.ts
    echo "✅ BullQueueModule ajouté à app.module.ts"
  else
    echo "⏭️ BullQueueModule est déjà importé dans app.module.ts"
  fi
else
  echo "⚠️ Le fichier app.module.ts n'existe pas, création du fichier..."
  mkdir -p apps/mcp-server/src
  cat > apps/mcp-server/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { BullQueueModule } from './bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
EOF
  echo "✅ app.module.ts créé avec BullQueueModule"
fi

# Modification du fichier main.ts pour inclure Bull Board
echo "🔧 Mise à jour du fichier principal du serveur..."
if [ -f "apps/mcp-server/src/main.ts" ]; then
  # Vérifier si Bull Board est déjà configuré
  if ! grep -q "BullBoardService" apps/mcp-server/src/main.ts; then
    # Ajouter l'import
    sed -i "s/import { NestFactory } from '@nestjs\/core';/import { NestFactory } from '@nestjs\/core';\nimport { NestExpressApplication } from '@nestjs\/platform-express';\nimport { BullBoardService } from '.\/bullmq\/bull-board.service';/" apps/mcp-server/src/main.ts
    # Ajouter la configuration
    sed -i "s/const app = await NestFactory.create(/const app = await NestFactory.create<NestExpressApplication>(/" apps/mcp-server/src/main.ts
    # Ajouter le code de configuration de Bull Board avant le démarrage du serveur
    sed -i "/await app.listen(/i\ \ // Configuration de Bull Board\n  const bullBoardService = app.get(BullBoardService);\n  bullBoardService.setup(app);\n" apps/mcp-server/src/main.ts
    echo "✅ BullBoardService configuré dans main.ts"
  else
    echo "⏭️ BullBoardService est déjà configuré dans main.ts"
  fi
else
  echo "⚠️ Le fichier main.ts n'existe pas, création du fichier..."
  mkdir -p apps/mcp-server/src
  cat > apps/mcp-server/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { BullBoardService } from './bullmq/bull-board.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Démarrage du serveur MCP...');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configuration de CORS
  app.enableCors();
  
  // Configuration du préfixe global pour les routes API
  app.setGlobalPrefix('api');
  
  // Configuration de Bull Board
  const bullBoardService = app.get(BullBoardService);
  bullBoardService.setup(app);
  
  // Démarrage du serveur
  const port = process.env.PORT || 3030;
  await app.listen(port);
  
  logger.log(`✅ Serveur MCP démarré sur le port: ${port}`);
  logger.log(`🌐 Interface Bull Board disponible à l'adresse: http://localhost:${port}/queues`);
}

bootstrap().catch(err => {
  console.error('❌ Erreur lors du démarrage du serveur:', err);
  process.exit(1);
});
EOF
  echo "✅ main.ts créé avec BullBoardService"
fi

# Création d'un fichier .env avec la configuration par défaut
echo "📝 Création du fichier .env..."
if [ ! -f "apps/mcp-server/.env" ]; then
  cat > apps/mcp-server/.env << 'EOF'
# Configuration Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Configuration du serveur
PORT=3030

# Configuration des workers
PHP_WORKER_CONCURRENCY=2
JS_WORKER_CONCURRENCY=2

# Sécurité Bull Board
BULL_BOARD_TOKEN=mcp-secret-token
EOF
  echo "✅ Fichier .env créé"
else
  echo "⏭️ Le fichier .env existe déjà"
fi

# Rendre les scripts exécutables
echo "🔧 Rendons les scripts exécutables..."
chmod +x scripts/start-bullmq-ecosystem.sh

echo "🎉 Migration vers BullMQ terminée avec succès!"
echo "---------------------------------------------"
echo "📋 Prochaines étapes:"
echo "   1. Démarrer l'écosystème BullMQ: ./scripts/start-bullmq-ecosystem.sh"
echo "   2. Essayer l'exemple de workflow: pnpm ts-node examples/php-to-remix-migration-workflow.ts"
echo "   3. Explorer l'interface Bull Board: http://localhost:3030/queues"
echo "   4. Consulter le tableau de bord Remix: http://localhost:3000/dashboard/bullmq"
echo "---------------------------------------------"
echo "📚 Documentation: ./docs/bullmq-integration.md"
echo "---------------------------------------------"