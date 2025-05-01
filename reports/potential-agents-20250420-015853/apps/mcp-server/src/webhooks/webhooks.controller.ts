import * as path from 'path';
import { Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import * as fs from 'fs-extra';
import { runPRCreator } from '../../agents/PrCreator';
import { RedisService } from '../redis/redis.service';

interface WebhookPayload {
  file: string;
  target: string;
  generatedFiles: Array<{
    path: string;
    absolutePath: string;
  }>;
  summary?: string;
  migrationId?: string;
  metadata?: Record<string, any>;
  dryRun?: boolean;
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly redisService: RedisService) {}

  @Post(DoDoDoDoDoDotgithub/create-pr')
  async createPR(@Body() payload: WebhookPayload) {
    this.logger.log(`📥 Réception d'une demande de création de PR pour: ${payload.file}`);
    
    try {
      // Validation de base
      if (!payload.file || !payload.target || !payload.generatedFiles || payload.generatedFiles.length === 0) {
        throw new HttpException('Payload incomplet: file, target et generatedFiles sont requis', HttpStatus.BAD_REQUEST);
      }

      // Vérifier que les fichiers existent
      for (const file of payload.generatedFiles) {
        if (!fs.existsSync(file.absolutePath)) {
          this.logger.warn(`⚠️ Fichier non trouvé: ${file.absolutePath}`);
        }
      }

      // Si c'est un dry run, sauvegarder le payload et retourner OK
      if (payload.dryRun) {
        const tempDir = path.join(process.cwd(), '.tmp');
        fs.ensureDirSync(tempDir);
        
        const fileName = `pr-request-${Date.now()}.json`;
        const filePath = path.join(tempDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
        
        this.logger.log(`✅ Dry run: payload sauvegardé dans ${filePath}`);
        
        return {
          success: true,
          message: 'Dry run: Payload valide, aucune PR créée',
          filePath
        };
      }

      // Créer la PR
      const prUrl = await runPRCreator(payload);
      
      // Publier un événement Redis pour notifier les autres services
      await this.redisService.publish(DoDotmcp:pr-created', JSON.stringify({
        timestamp: new Date().toISOString(),
        migrationId: payload.migrationId,
        file: payload.file,
        target: payload.target,
        prUrl
      }));
      
      this.logger.log(`✅ PR créée avec succès: ${prUrl}`);
      
      return {
        success: true,
        message: 'Pull Request créée avec succès',
        prUrl
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la création de la PR: ${error.message}`);
      throw new HttpException(
        `Échec de la création de la PR: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(DoDoDoDoDoDotgithub/notification')
  async notifyPRCreated(@Body() payload: {
    prUrl: string;
    migrationId?: string;
    file: string;
    target: string;
  }) {
    this.logger.log(`📥 Réception d'une notification de PR créée: ${payload.prUrl}`);
    
    try {
      // Publier un événement Redis
      await this.redisService.publish(DoDotmcp:pr-created', JSON.stringify({
        timestamp: new Date().toISOString(),
        ...payload
      }));
      
      this.logger.log(`✅ Notification publiée dans Redis`);
      
      return {
        success: true,
        message: 'Notification envoyée avec succès'
      };
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification: ${error.message}`);
      throw new HttpException(
        `Échec de l'envoi de la notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}