import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 Connexion à Redis établie');
    
    this.client.on('error', (err) => {
      this.logger.error(`❌ Erreur Redis: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Fermeture de la connexion Redis');
    await this.client.quit();
  }

  /**
   * Publie un message sur un canal Redis
   */
  async publish(channel: string, message: string): Promise<number> {
    try {
      const result = await this.client.publish(channel, message);
      this.logger.debug(`📢 Message publié sur le canal ${channel}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la publication sur ${channel}: ${error.message}`);
      throw error;
    }
  }

  /**
   * S'abonne à un canal Redis et exécute un callback lorsqu'un message est reçu
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    
    subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        this.logger.debug(`📩 Message reçu sur le canal ${channel}`);
        callback(message);
      }
    });
    
    await subscriber.subscribe(channel);
    this.logger.log(`👂 Abonnement au canal ${channel} réussi`);
  }

  /**
   * Sauvegarde une valeur dans Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<string> {
    try {
      let result: string;
      
      if (ttl) {
        result = await this.client.set(key, value, 'EX', ttl);
      } else {
        result = await this.client.set(key, value);
      }
      
      this.logger.debug(`💾 Valeur définie pour la clé ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la définition de la clé ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère une valeur depuis Redis
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      this.logger.debug(`🔍 Valeur récupérée pour la clé ${key}`);
      return value;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération de la clé ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprime une clé de Redis
   */
  async delete(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      this.logger.debug(`🗑️ Clé ${key} supprimée`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la suppression de la clé ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ajoute une valeur à une liste
   */
  async rpush(key: string, value: string): Promise<number> {
    try {
      const result = await this.client.rpush(key, value);
      this.logger.debug(`➕ Valeur ajoutée à la liste ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'ajout à la liste ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère tous les éléments d'une liste
   */
  async lrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    try {
      const result = await this.client.lrange(key, start, stop);
      this.logger.debug(`🔍 Liste ${key} récupérée (${result.length} éléments)`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération de la liste ${key}: ${error.message}`);
      throw error;
    }
  }
}