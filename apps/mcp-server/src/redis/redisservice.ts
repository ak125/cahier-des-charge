import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Interface pour les options de Redis Stack avec RedisJSON
 */
export interface RedisStackOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  db?: number;
  enableRedisJson?: boolean;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private hasRedisJson = false;

  constructor() {
    const options: RedisStackOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      enableRedisJson: process.env.ENABLE_REDIS_JSON !== 'false',
    };

    this.client = new Redis({
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      db: options.db || 0,
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 Connexion à Redis établie');

    this.client.on('error', (err) => {
      this.logger.error(`❌ Erreur Redis: ${err.message}`);
    });

    // Vérifier la présence du module RedisJSON
    try {
      const modules = await this.client.call('MODULE', ['LIST']);
      this.hasRedisJson = Array.isArray(modules) &&
        modules.some((module: any) =>
          module[1] === 'ReJSON' || module[1] === 'rejson'
        );

      if (this.hasRedisJson) {
        this.logger.log('✅ Module RedisJSON détecté et activé');
      } else {
        this.logger.warn('⚠️ Module RedisJSON non détecté. Les opérations JSON natives ne seront pas disponibles.');
      }
    } catch (error) {
      this.logger.warn(`⚠️ Impossible de vérifier les modules Redis: ${(error as Error).message}`);
    }
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
  async lrange(key: string, start = 0, stop = -1): Promise<string[]> {
    try {
      const result = await this.client.lrange(key, start, stop);
      this.logger.debug(`🔍 Liste ${key} récupérée (${result.length} éléments)`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération de la liste ${key}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Vérifie si le module RedisJSON est disponible
   */
  isRedisJsonAvailable(): boolean {
    return this.hasRedisJson;
  }

  /**
   * Stocke une valeur JSON dans Redis (nécessite RedisJSON)
   * @param key Clé Redis
   * @param path Chemin JSON (par défaut '.')
   * @param json Object JSON à stocker
   */
  async jsonSet(key: string, path = '.', json: any): Promise<string | null> {
    try {
      if (!this.hasRedisJson) {
        this.logger.warn('⚠️ RedisJSON non disponible. La valeur sera stockée comme JSON sérialisé.');
        return this.set(key, JSON.stringify(json));
      }

      const result = await this.client.call('JSON.SET', [key, path, JSON.stringify(json)]);
      this.logger.debug(`💾 JSON stocké à la clé ${key}, chemin ${path}`);
      return result as string;
    } catch (error) {
      this.logger.error(`❌ Erreur lors du stockage JSON ${key}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Récupère une valeur JSON depuis Redis (nécessite RedisJSON)
   * @param key Clé Redis
   * @param path Chemin JSON (par défaut '.')
   */
  async jsonGet(key: string, path = '.'): Promise<any> {
    try {
      if (!this.hasRedisJson) {
        this.logger.warn('⚠️ RedisJSON non disponible. La valeur sera désérialisée depuis une chaîne JSON.');
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
      }

      const result = await this.client.call('JSON.GET', [key, path]);
      return result ? JSON.parse(result as string) : null;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la récupération JSON ${key}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Ajoute une valeur à un tableau JSON (nécessite RedisJSON)
   * @param key Clé Redis
   * @param path Chemin JSON vers le tableau
   * @param values Valeurs à ajouter
   */
  async jsonArrAppend(key: string, path: string, ...values: any[]): Promise<number | null> {
    try {
      if (!this.hasRedisJson) {
        throw new Error('RedisJSON non disponible. Cette opération nécessite RedisJSON.');
      }

      const args = [key, path];
      values.forEach(value => args.push(JSON.stringify(value)));

      const result = await this.client.call('JSON.ARRAPPEND', args);
      return result as number;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'ajout au tableau JSON ${key}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Met en œuvre le pattern Stale-While-Revalidate pour la récupération de données
   * @param key Clé Redis pour la mise en cache
   * @param fetchFn Fonction de récupération des données fraîches
   * @param ttl Durée de vie du cache en secondes
   * @param staleTime Durée pendant laquelle les données sont considérées "fraîches" en secondes
   */
  async getWithSWR<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 3600,
    staleTime = 300
  ): Promise<T> {
    try {
      // Récupérer la valeur en cache
      const cachedData = await this.get(`${key}:data`);
      const cachedTime = await this.get(`${key}:time`);

      if (cachedData) {
        // Donnée trouvée en cache
        const timestamp = cachedTime ? parseInt(cachedTime, 10) : 0;
        const now = Date.now();

        // Si les données sont encore fraîches, les retourner immédiatement
        if (now - timestamp < staleTime * 1000) {
          return JSON.parse(cachedData);
        }

        // Les données sont périmées, mais utilisables
        // Déclencher une mise à jour en arrière-plan et retourner les données périmées
        this.refreshCacheAsync(key, fetchFn, ttl).catch(err =>
          this.logger.error(`❌ Erreur lors de la mise à jour asynchrone du cache pour ${key}: ${(err as Error).message}`)
        );

        return JSON.parse(cachedData);
      }

      // Aucune donnée en cache, récupérer les données fraîches
      return this.refreshCache(key, fetchFn, ttl);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'utilisation de SWR pour ${key}: ${(error as Error).message}`);
      // En cas d'erreur, tenter de récupérer les données fraîches
      return fetchFn();
    }
  }

  /**
   * Rafraîchit le cache avec de nouvelles données
   */
  private async refreshCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    const data = await fetchFn();
    const now = Date.now();

    await this.set(`${key}:data`, JSON.stringify(data), ttl);
    await this.set(`${key}:time`, now.toString(), ttl);

    return data;
  }

  /**
   * Version asynchrone de refreshCache pour les mises à jour en arrière-plan
   */
  private async refreshCacheAsync<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<void> {
    try {
      await this.refreshCache(key, fetchFn, ttl);
      this.logger.debug(`♻️ Cache mis à jour en arrière-plan pour ${key}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la mise à jour du cache pour ${key}: ${(error as Error).message}`);
    }
  }
}
