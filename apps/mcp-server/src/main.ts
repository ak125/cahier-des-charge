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