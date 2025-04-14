/**
 * Service d'IA locale utilisant LangChain + Ollama pour remplacer OpenAI
 * 
 * Ce service permet d'utiliser des modèles d'IA locaux (DeepSeek-Coder, Mistral, etc.)
 * via Ollama, avec cache Redis pour optimiser les performances et réduire la charge.
 */

import { ChatOllama } from 'langchain/chat_models/ollama';
import { BaseLanguageModel } from 'langchain/base_language';
import { ChainValues, SystemMessagePromptTemplate, HumanMessagePromptTemplate, ChatPromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { Logger } from '@nestjs/common';

export interface LocalAiServiceConfig {
  redisUrl: string;
  ollamaUrl: string;
  model: string;
  cacheExpiry?: number;  // Durée de validité du cache en secondes (3600 par défaut)
  useCache?: boolean;    // Activer/désactiver le cache (true par défaut)
}

export interface AiServiceOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  cacheKey?: string;     // Clé spécifique pour ce prompt (optionnel)
}

/**
 * Service d'IA locale utilisant Ollama et LangChain
 */
export class LocalAiService {
  private redis: Redis;
  private llm: BaseLanguageModel;
  private config: LocalAiServiceConfig;
  private logger = new Logger('LocalAiService');
  
  constructor(config: LocalAiServiceConfig) {
    this.config = {
      ...config,
      cacheExpiry: config.cacheExpiry || 3600,
      useCache: config.useCache !== false
    };
    
    // Initialiser Redis
    this.redis = new Redis(this.config.redisUrl);
    
    // Initialiser le modèle Ollama
    this.llm = new ChatOllama({
      baseUrl: this.config.ollamaUrl,
      model: this.config.model,
      temperature: 0.2, // Température plus basse pour les tâches de code
    });
    
    this.logger.log(`🔌 Service IA locale initialisé avec le modèle ${this.config.model}`);
  }
  
  /**
   * Génère une réponse à partir d'un prompt en utilisant le modèle d'IA locale
   */
  async generate(
    prompt: string,
    options: AiServiceOptions = {}
  ): Promise<string> {
    try {
      // Générer une clé de cache basée sur le prompt et les options
      const cacheKey = options.cacheKey || this.generateCacheKey(prompt, options);
      
      // Vérifier le cache si activé
      if (this.config.useCache) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.logger.debug(`✅ Résultat trouvé dans le cache pour la clé ${cacheKey}`);
          return JSON.parse(cached);
        }
      }
      
      // Construire le template de prompt
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          options.systemPrompt || 
          "Vous êtes un assistant d'IA expert en développement logiciel, spécialisé dans la migration PHP vers Remix."
        ),
        HumanMessagePromptTemplate.fromTemplate("{prompt}")
      ]);
      
      // Créer la chaîne LLM
      const chain = new LLMChain({
        llm: this.llm,
        prompt: chatPrompt,
      });
      
      // Invoquer la chaîne
      this.logger.debug(`📤 Envoi du prompt au modèle ${this.config.model}`);
      const response: ChainValues = await chain.call({
        prompt: prompt,
      });
      
      // Extraire la réponse
      const result = response.text || "";
      
      // Mettre en cache le résultat si le cache est activé
      if (this.config.useCache) {
        await this.redis.set(cacheKey, JSON.stringify(result), 'EX', this.config.cacheExpiry);
        this.logger.debug(`💾 Résultat mis en cache avec la clé ${cacheKey} (expiration: ${this.config.cacheExpiry}s)`);
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la génération de l'IA: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Génère une réponse à partir d'un template de QA
   */
  async generateQA(
    question: string,
    context?: string,
    options: AiServiceOptions = {}
  ): Promise<string> {
    // Construire un prompt de QA
    let prompt = question;
    
    if (context) {
      prompt = `Contexte:
${context}

Question:
${question}

Réponse:`;
    }
    
    // Utiliser un système prompt spécifique pour QA
    const qaOptions = {
      ...options,
      systemPrompt: options.systemPrompt || 
        "Vous êtes un assistant d'IA expert qui répond à des questions en se basant uniquement sur le contexte fourni.",
      cacheKey: options.cacheKey || this.generateCacheKey(`qa:${question}`, options)
    };
    
    return this.generate(prompt, qaOptions);
  }
  
  /**
   * Génère une analyse de code avec des suggestions
   */
  async analyzeCode(
    code: string,
    languageName: string,
    requirements?: string,
    options: AiServiceOptions = {}
  ): Promise<string> {
    const prompt = `Code à analyser (${languageName}):
\`\`\`${languageName}
${code}
\`\`\`

${requirements ? `Exigences/Contexte:
${requirements}

` : ''}Veuillez analyser ce code et fournir:
1. Un résumé de ce que fait le code
2. Les problèmes potentiels ou bugs
3. Des suggestions d'amélioration de la qualité
4. Des recommandations pour la migration vers Remix
`;
    
    // Utiliser un système prompt spécifique pour l'analyse de code
    const codeOptions = {
      ...options,
      systemPrompt: options.systemPrompt || 
        "Vous êtes un ingénieur logiciel expert spécialisé dans l'analyse de code et la migration de PHP vers Remix.",
      cacheKey: options.cacheKey || this.generateCacheKey(`code:${languageName}:${code.slice(0, 100)}`, options)
    };
    
    return this.generate(prompt, codeOptions);
  }
  
  /**
   * Génère une transformation de code PHP vers Remix
   */
  async transformPhpToRemix(
    phpCode: string,
    routeInfo?: string,
    options: AiServiceOptions = {}
  ): Promise<string> {
    const prompt = `Code PHP à transformer:
\`\`\`php
${phpCode}
\`\`\`

${routeInfo ? `Informations sur la route:
${routeInfo}

` : ''}Veuillez transformer ce code PHP en composants Remix (TypeScript/React), en fournissant:
1. Le fichier route.tsx principal
2. Le loader.ts si nécessaire
3. L'action.ts si le code contient des formulaires ou mutations
4. Les types TypeScript pour les données
5. Des explications sur les changements importants
`;
    
    // Utiliser un système prompt spécifique pour la transformation de code
    const transformOptions = {
      ...options,
      systemPrompt: options.systemPrompt || 
        "Vous êtes un expert en migration de PHP vers Remix qui génère du code TypeScript/React de haute qualité.",
      cacheKey: options.cacheKey || this.generateCacheKey(`transform:php:${phpCode.slice(0, 100)}`, options)
    };
    
    return this.generate(prompt, transformOptions);
  }
  
  /**
   * Génère une clé de cache unique pour un prompt
   */
  private generateCacheKey(prompt: string, options: AiServiceOptions = {}): string {
    // Créer une chaîne qui inclut le prompt et les options pertinentes
    const dataToHash = JSON.stringify({
      prompt,
      model: this.config.model,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    });
    
    // Générer un hash SHA-256
    const hash = createHash('sha256').update(dataToHash).digest('hex');
    
    return `ai:cache:${this.config.model}:${hash}`;
  }
  
  /**
   * Invalide une entrée spécifique du cache
   */
  async invalidateCache(cacheKey: string): Promise<boolean> {
    try {
      const result = await this.redis.del(cacheKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'invalidation du cache: ${error}`);
      return false;
    }
  }
  
  /**
   * Vide tout le cache d'IA
   */
  async clearCache(): Promise<boolean> {
    try {
      const keys = await this.redis.keys('ai:cache:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`🧹 Cache IA vidé (${keys.length} entrées supprimées)`);
      }
      return true;
    } catch (error) {
      this.logger.error(`❌ Erreur lors du vidage du cache: ${error}`);
      return false;
    }
  }
  
  /**
   * Ferme les connexions
   */
  async close(): Promise<void> {
    await this.redis.quit();
    this.logger.log('👋 Service IA locale arrêté');
  }
}

/**
 * Helper pour créer une instance du service IA locale
 */
export function createLocalAiService(config: LocalAiServiceConfig): LocalAiService {
  return new LocalAiService(config);
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const config: LocalAiServiceConfig = {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'deepseek-coder',
    cacheExpiry: parseInt(process.env.CACHE_EXPIRY || '3600'),
    useCache: process.env.USE_CACHE !== 'false'
  };
  
  const prompt = process.argv[2] || "Expliquez la différence entre React et Remix";
  
  console.log(`🚀 Test du service IA locale avec le modèle ${config.model}`);
  console.log(`📋 Prompt: ${prompt}`);
  
  const service = createLocalAiService(config);
  
  service.generate(prompt)
    .then(result => {
      console.log(`\n✅ Résultat:\n${result}`);
      return service.close();
    })
    .catch(error => {
      console.error(`❌ Erreur: ${error.message}`);
      service.close();
      process.exit(1);
    });
}