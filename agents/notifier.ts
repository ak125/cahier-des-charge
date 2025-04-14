/**
 * MCP Notifier - Système de notification pour les migrations PHP vers Remix
 * 
 * Ce module écoute les événements Redis et Supabase pour envoyer des notifications
 * via différents canaux (Slack, Email, Discord, Webhook) lors d'événements importants
 * dans le pipeline de migration.
 */

import { createClient as createRedisClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '@nestjs/common';
import { MCPManifestManager } from './mcp-manifest-manager';

// Types
export interface NotifierConfig {
  redis: {
    url: string;
    enabled: boolean;
    channels: string[];
  };
  supabase: {
    url: string;
    key: string;
    enabled: boolean;
    tables: string[];
  };
  slack: {
    token: string;
    enabled: boolean;
    defaultChannel: string;
    mentionUsers?: string[];
    events: string[];
  };
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      }
    };
    enabled: boolean;
    defaultRecipients: string[];
    events: string[];
  };
  discord: {
    webhook: string;
    enabled: boolean;
    events: string[];
  };
  webhook: {
    url: string;
    enabled: boolean;
    events: string[];
  };
  manifestPath: string;
}

export interface NotificationEvent {
  type: string;
  migrationId?: string;
  sourceFile?: string;
  targetFiles?: Record<string, string>;
  status?: string;
  qaStatus?: string;
  seoStatus?: string;
  score?: number;
  message?: string;
  error?: any;
  prUrl?: string;
  timestamp: string;
  tags?: string[];
}

/**
 * Classe principale de notification
 */
export class MCPNotifier {
  private logger = new Logger('MCPNotifier');
  private redisClient: any;
  private supabaseClient: any;
  private slackClient: any;
  private emailTransporter: any;
  private config: NotifierConfig;
  private manifest: MCPManifestManager;
  
  constructor(config: NotifierConfig) {
    this.config = config;
    this.manifest = new MCPManifestManager(config.manifestPath);
    this.initialize();
  }
  
  /**
   * Initialise les clients et connexions
   */
  private async initialize() {
    try {
      // Initialiser Redis si activé
      if (this.config.redis.enabled) {
        this.redisClient = createRedisClient({
          url: this.config.redis.url
        });
        
        await this.redisClient.connect();
        this.logger.log('🔌 Connexion à Redis établie');
        
        // S'abonner aux canaux Redis
        for (const channel of this.config.redis.channels) {
          await this.redisClient.subscribe(channel, (message: string) => {
            this.handleRedisMessage(channel, message);
          });
          this.logger.log(`📻 Abonnement au canal Redis: ${channel}`);
        }
      }
      
      // Initialiser Supabase si activé
      if (this.config.supabase.enabled) {
        this.supabaseClient = createSupabaseClient(
          this.config.supabase.url,
          this.config.supabase.key
        );
        
        // Configurer les abonnements Supabase
        for (const table of this.config.supabase.tables) {
          this.supabaseClient
            .channel('notifier-channel')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table },
              (payload: any) => this.handleSupabaseChange(table, payload)
            )
            .subscribe();
          
          this.logger.log(`📻 Abonnement à la table Supabase: ${table}`);
        }
        
        this.logger.log('🔌 Connexion à Supabase établie');
      }
      
      // Initialiser Slack si activé
      if (this.config.slack.enabled) {
        this.slackClient = new WebClient(this.config.slack.token);
        this.logger.log('🔌 Client Slack initialisé');
      }
      
      // Initialiser le transporteur d'email si activé
      if (this.config.email.enabled) {
        this.emailTransporter = nodemailer.createTransport(this.config.email.smtp);
        this.logger.log('🔌 Transporteur Email initialisé');
      }
      
      this.logger.log('✅ MCPNotifier initialisé avec succès');
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'initialisation de MCPNotifier: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Traite les messages Redis
   */
  private async handleRedisMessage(channel: string, message: string) {
    try {
      const event = JSON.parse(message) as NotificationEvent;
      this.logger.log(`📨 Message reçu sur le canal ${channel}: ${event.type}`);
      
      // Mettre à jour le manifeste si nécessaire
      if (event.migrationId) {
        await this.updateManifest(event);
      }
      
      // Envoyer les notifications
      await this.sendNotifications(event);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du traitement du message Redis: ${error.message}`);
    }
  }
  
  /**
   * Traite les changements Supabase
   */
  private async handleSupabaseChange(table: string, payload: any) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      this.logger.log(`📨 Changement Supabase dans la table ${table}: ${eventType}`);
      
      // Convertir le changement Supabase en événement de notification
      const event: NotificationEvent = {
        type: `${table}:${eventType}`,
        timestamp: new Date().toISOString()
      };
      
      // Ajouter les données spécifiques en fonction de la table
      if (table === 'audit.migrations') {
        event.migrationId = newRecord.migration_id;
        event.sourceFile = newRecord.source_file;
        event.targetFiles = newRecord.target_files;
        event.status = newRecord.status;
        event.qaStatus = newRecord.qa_status;
        event.seoStatus = newRecord.seo_status;
        event.prUrl = newRecord.pr_url;
        event.tags = newRecord.tags;
        
        // Détecter les changements de statut
        if (oldRecord && newRecord.status !== oldRecord.status) {
          event.type = `migration:${newRecord.status}`;
        }
      } else if (table === 'audit.qa_results') {
        event.migrationId = newRecord.migration_id;
        event.sourceFile = newRecord.source_file;
        event.qaStatus = newRecord.status;
        event.score = newRecord.score;
        event.tags = newRecord.tags;
        
        event.type = `qa:${newRecord.status.toLowerCase()}`;
      }
      
      // Mettre à jour le manifeste si nécessaire
      if (event.migrationId) {
        await this.updateManifest(event);
      }
      
      // Envoyer les notifications
      await this.sendNotifications(event);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors du traitement du changement Supabase: ${error.message}`);
    }
  }
  
  /**
   * Met à jour le manifest MCPManifest.json
   */
  private async updateManifest(event: NotificationEvent) {
    try {
      if (!event.migrationId) return;
      
      await this.manifest.load();
      
      // Trouver la migration dans le manifeste
      const migration = this.manifest.getMigration(event.migrationId);
      
      if (!migration) {
        this.logger.warn(`⚠️ Migration ${event.migrationId} non trouvée dans le manifeste`);
        return;
      }
      
      // Mettre à jour les champs pertinents
      let updated = false;
      
      if (event.status && migration.status !== event.status) {
        migration.status = event.status;
        if (event.status === 'completed') {
          migration.completedAt = new Date().toISOString();
        }
        updated = true;
      }
      
      if (event.qaStatus && migration.qaStatus !== event.qaStatus) {
        migration.qaStatus = event.qaStatus;
        updated = true;
      }
      
      if (event.seoStatus && migration.seoStatus !== event.seoStatus) {
        migration.seoStatus = event.seoStatus;
        updated = true;
      }
      
      if (event.prUrl && migration.prUrl !== event.prUrl) {
        migration.prUrl = event.prUrl;
        updated = true;
      }
      
      // Mettre à jour les tags
      if (event.tags && event.tags.length > 0) {
        const currentTags = new Set(migration.tags || []);
        for (const tag of event.tags) {
          if (!currentTags.has(tag)) {
            migration.tags = migration.tags || [];
            migration.tags.push(tag);
            updated = true;
          }
        }
      }
      
      // Ajouter une étape de vérification si c'est une mise à jour de QA
      if (event.type.startsWith('qa:')) {
        const step = {
          name: 'qa-analyzer',
          status: event.qaStatus === 'OK' ? 'passed' : event.qaStatus === 'Partial' ? 'partial' : 'failed',
          score: event.score
        };
        
        migration.verificationSteps = migration.verificationSteps || [];
        
        // Remplacer l'étape existante ou ajouter une nouvelle
        const existingStepIndex = migration.verificationSteps.findIndex(s => s.name === 'qa-analyzer');
        if (existingStepIndex >= 0) {
          migration.verificationSteps[existingStepIndex] = step;
        } else {
          migration.verificationSteps.push(step);
        }
        
        updated = true;
      }
      
      // Sauvegarder le manifeste si des modifications ont été effectuées
      if (updated) {
        // Mettre à jour les métadonnées
        this.manifest.updateMetadata();
        await this.manifest.save();
        this.logger.log(`✅ Manifest mis à jour pour la migration ${event.migrationId}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la mise à jour du manifeste: ${error.message}`);
    }
  }
  
  /**
   * Envoie des notifications sur les différents canaux
   */
  private async sendNotifications(event: NotificationEvent) {
    // Vérifier si l'événement doit déclencher des notifications
    
    // Slack
    if (this.shouldNotify('slack', event.type)) {
      await this.sendSlackNotification(event);
    }
    
    // Email
    if (this.shouldNotify('email', event.type)) {
      await this.sendEmailNotification(event);
    }
    
    // Discord
    if (this.shouldNotify('discord', event.type)) {
      await this.sendDiscordNotification(event);
    }
    
    // Webhook
    if (this.shouldNotify('webhook', event.type)) {
      await this.sendWebhookNotification(event);
    }
  }
  
  /**
   * Vérifie si une notification doit être envoyée pour un canal et un type d'événement
   */
  private shouldNotify(channel: string, eventType: string): boolean {
    const config = this.config[channel as keyof NotifierConfig] as any;
    
    if (!config || !config.enabled) {
      return false;
    }
    
    // Si aucun événement n'est spécifié, notifier pour tout
    if (!config.events || config.events.length === 0) {
      return true;
    }
    
    // Vérifier si l'événement correspond à un pattern dans la liste
    return config.events.some((pattern: string) => {
      // Support des wildcards, ex: 'migration:*'
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return eventType.startsWith(prefix);
      }
      
      return pattern === eventType;
    });
  }
  
  /**
   * Envoie une notification Slack
   */
  private async sendSlackNotification(event: NotificationEvent) {
    if (!this.slackClient) return;
    
    try {
      const channel = this.config.slack.defaultChannel;
      const message = this.formatSlackMessage(event);
      
      await this.slackClient.chat.postMessage({
        channel,
        text: message.text,
        blocks: message.blocks,
        unfurl_links: false
      });
      
      this.logger.log(`✅ Notification Slack envoyée: ${event.type}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification Slack: ${error.message}`);
    }
  }
  
  /**
   * Formate un message Slack avec mise en forme riche
   */
  private formatSlackMessage(event: NotificationEvent): { text: string; blocks: any[] } {
    let icon, title;
    
    // Déterminer l'icône et le titre en fonction du type d'événement
    if (event.type.includes('completed')) {
      icon = '🚀';
      title = 'MIGRATION RÉUSSIE';
    } else if (event.type.includes('partial')) {
      icon = '⚠️';
      title = 'MIGRATION PARTIELLE';
    } else if (event.type.includes('failed')) {
      icon = '❌';
      title = 'MIGRATION ÉCHOUÉE';
    } else if (event.type.includes('qa:ok')) {
      icon = '✅';
      title = 'QA VALIDÉE';
    } else if (event.type.includes('qa:partial')) {
      icon = '⚠️';
      title = 'QA PARTIELLEMENT VALIDÉE';
    } else if (event.type.includes('qa:failed')) {
      icon = '❌';
      title = 'QA ÉCHOUÉE';
    } else {
      icon = '🔔';
      title = 'NOTIFICATION MCP';
    }
    
    // Obtenir le nom du fichier à partir du chemin complet
    const sourceFileName = event.sourceFile ? path.basename(event.sourceFile) : 'N/A';
    const targetFileNames = event.targetFiles ? Object.values(event.targetFiles).map(f => path.basename(f)) : [];
    
    // Texte de base (fallback pour les clients qui ne supportent pas les blocs)
    const text = `${icon} ${title} : ${sourceFileName} → ${targetFileNames.join(', ')}`;
    
    // Construire les blocs riches pour Slack
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${icon} ${title} : ${sourceFileName}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Source:*\n\`${sourceFileName}\``
          }
        ]
      }
    ];
    
    // Ajouter les fichiers cibles s'ils existent
    if (targetFileNames.length > 0) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Composants:*\n${targetFileNames.map(f => `\`${f}\``).join(', ')}`
          }
        ]
      });
    }
    
    // Ajouter les statuts QA et SEO s'ils existent
    const statusFields = [];
    
    if (event.qaStatus) {
      let qaIcon;
      switch (event.qaStatus) {
        case 'OK': qaIcon = '✅'; break;
        case 'Partial': qaIcon = '⚠️'; break;
        case 'Failed': qaIcon = '❌'; break;
        default: qaIcon = '❔';
      }
      statusFields.push({
        type: 'mrkdwn',
        text: `*QA:* ${qaIcon} ${event.qaStatus}`
      });
    }
    
    if (event.seoStatus) {
      let seoIcon;
      switch (event.seoStatus) {
        case 'OK': seoIcon = '✅'; break;
        case 'Partial': seoIcon = '⚠️'; break;
        case 'Failed': seoIcon = '❌'; break;
        default: seoIcon = '❔';
      }
      statusFields.push({
        type: 'mrkdwn',
        text: `*SEO:* ${seoIcon} ${event.seoStatus}`
      });
    }
    
    if (statusFields.length > 0) {
      blocks.push({
        type: 'section',
        fields: statusFields
      });
    }
    
    // Ajouter le score QA s'il existe
    if (event.score !== undefined) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Score QA:* ${event.score}/100`
          }
        ]
      });
    }
    
    // Ajouter l'URL de la PR si elle existe
    if (event.prUrl) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*PR:* <${event.prUrl}|Voir la Pull Request>`
          }
        ]
      });
    }
    
    // Ajouter l'erreur si elle existe
    if (event.error) {
      let errorMessage;
      if (typeof event.error === 'string') {
        errorMessage = event.error;
      } else if (event.error.message) {
        errorMessage = event.error.message;
      } else {
        errorMessage = JSON.stringify(event.error);
      }
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Erreur:*\n\`\`\`${errorMessage}\`\`\``
        }
      });
    }
    
    // Ajouter les tags s'ils existent
    if (event.tags && event.tags.length > 0) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Tags:* ${event.tags.join(', ')}`
          }
        ]
      });
    }
    
    // Ajouter la mention aux utilisateurs si configurée
    if (this.config.slack.mentionUsers && this.config.slack.mentionUsers.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${this.config.slack.mentionUsers.map(user => `<@${user}>`).join(' ')}`
        }
      });
    }
    
    return { text, blocks };
  }
  
  /**
   * Envoie une notification par email
   */
  private async sendEmailNotification(event: NotificationEvent) {
    if (!this.emailTransporter) return;
    
    try {
      const recipients = this.config.email.defaultRecipients;
      const subject = this.formatEmailSubject(event);
      const html = this.formatEmailBody(event);
      
      await this.emailTransporter.sendMail({
        from: this.config.email.smtp.auth.user,
        to: recipients.join(', '),
        subject,
        html
      });
      
      this.logger.log(`✅ Notification email envoyée: ${event.type}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification email: ${error.message}`);
    }
  }
  
  /**
   * Formate l'objet de l'email
   */
  private formatEmailSubject(event: NotificationEvent): string {
    let prefix;
    
    // Déterminer le préfixe en fonction du type d'événement
    if (event.type.includes('completed')) {
      prefix = '[MCP] ✅ Migration réussie';
    } else if (event.type.includes('partial')) {
      prefix = '[MCP] ⚠️ Migration partielle';
    } else if (event.type.includes('failed')) {
      prefix = '[MCP] ❌ Migration échouée';
    } else if (event.type.includes('qa:ok')) {
      prefix = '[MCP] ✅ QA validée';
    } else if (event.type.includes('qa:partial')) {
      prefix = '[MCP] ⚠️ QA partiellement validée';
    } else if (event.type.includes('qa:failed')) {
      prefix = '[MCP] ❌ QA échouée';
    } else {
      prefix = '[MCP] Notification';
    }
    
    // Obtenir le nom du fichier à partir du chemin complet
    const sourceFileName = event.sourceFile ? path.basename(event.sourceFile) : 'N/A';
    
    return `${prefix} : ${sourceFileName}`;
  }
  
  /**
   * Formate le corps de l'email en HTML
   */
  private formatEmailBody(event: NotificationEvent): string {
    // Obtenir le nom du fichier à partir du chemin complet
    const sourceFileName = event.sourceFile ? path.basename(event.sourceFile) : 'N/A';
    const targetFileNames = event.targetFiles ? Object.values(event.targetFiles).map(f => path.basename(f)) : [];
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
    `;
    
    // Déterminer l'icône et le titre en fonction du type d'événement
    if (event.type.includes('completed')) {
      html += `🚀 Migration réussie : ${sourceFileName}`;
    } else if (event.type.includes('partial')) {
      html += `⚠️ Migration partielle : ${sourceFileName}`;
    } else if (event.type.includes('failed')) {
      html += `❌ Migration échouée : ${sourceFileName}`;
    } else if (event.type.includes('qa:ok')) {
      html += `✅ QA validée : ${sourceFileName}`;
    } else if (event.type.includes('qa:partial')) {
      html += `⚠️ QA partiellement validée : ${sourceFileName}`;
    } else if (event.type.includes('qa:failed')) {
      html += `❌ QA échouée : ${sourceFileName}`;
    } else {
      html += `🔔 Notification MCP : ${sourceFileName}`;
    }
    
    html += `
        </h1>
        <div style="margin-bottom: 20px;">
          <p><strong>Source :</strong> ${sourceFileName}</p>
    `;
    
    // Ajouter les fichiers cibles s'ils existent
    if (targetFileNames.length > 0) {
      html += `
          <p><strong>Composants :</strong> ${targetFileNames.join(', ')}</p>
      `;
    }
    
    // Ajouter les statuts QA et SEO s'ils existent
    if (event.qaStatus) {
      let qaIcon;
      switch (event.qaStatus) {
        case 'OK': qaIcon = '✅'; break;
        case 'Partial': qaIcon = '⚠️'; break;
        case 'Failed': qaIcon = '❌'; break;
        default: qaIcon = '❔';
      }
      html += `
          <p><strong>QA :</strong> ${qaIcon} ${event.qaStatus}</p>
      `;
    }
    
    if (event.seoStatus) {
      let seoIcon;
      switch (event.seoStatus) {
        case 'OK': seoIcon = '✅'; break;
        case 'Partial': seoIcon = '⚠️'; break;
        case 'Failed': seoIcon = '❌'; break;
        default: seoIcon = '❔';
      }
      html += `
          <p><strong>SEO :</strong> ${seoIcon} ${event.seoStatus}</p>
      `;
    }
    
    // Ajouter le score QA s'il existe
    if (event.score !== undefined) {
      html += `
          <p><strong>Score QA :</strong> ${event.score}/100</p>
      `;
    }
    
    // Ajouter l'URL de la PR si elle existe
    if (event.prUrl) {
      html += `
          <p><strong>PR :</strong> <a href="${event.prUrl}" target="_blank">Voir la Pull Request</a></p>
      `;
    }
    
    html += `
        </div>
    `;
    
    // Ajouter l'erreur si elle existe
    if (event.error) {
      let errorMessage;
      if (typeof event.error === 'string') {
        errorMessage = event.error;
      } else if (event.error.message) {
        errorMessage = event.error.message;
      } else {
        errorMessage = JSON.stringify(event.error);
      }
      
      html += `
        <div style="margin-bottom: 20px; background-color: #f8d7da; padding: 15px; border-radius: 5px; color: #721c24;">
          <h3 style="margin-top: 0;">Erreur</h3>
          <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; white-space: pre-wrap;">${errorMessage}</pre>
        </div>
      `;
    }
    
    // Ajouter les tags s'ils existent
    if (event.tags && event.tags.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <p><strong>Tags :</strong> ${event.tags.join(', ')}</p>
        </div>
      `;
    }
    
    html += `
        <div style="margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px;">
          <p>Cet email a été envoyé automatiquement par le système MCP (Model Context Protocol).</p>
          <p>Date : ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Envoie une notification Discord
   */
  private async sendDiscordNotification(event: NotificationEvent) {
    if (!this.config.discord.enabled || !this.config.discord.webhook) return;
    
    try {
      const { embeds, content } = this.formatDiscordMessage(event);
      
      await axios.post(this.config.discord.webhook, {
        content,
        embeds,
        username: 'MCP Notifier',
        avatar_url: 'https://remix.run/img/og.1.jpg' // Logo Remix
      });
      
      this.logger.log(`✅ Notification Discord envoyée: ${event.type}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification Discord: ${error.message}`);
    }
  }
  
  /**
   * Formate un message Discord avec embeds
   */
  private formatDiscordMessage(event: NotificationEvent): { content: string; embeds: any[] } {
    let color, title, emoji;
    
    // Déterminer la couleur et le titre en fonction du type d'événement
    if (event.type.includes('completed')) {
      color = 0x4CAF50; // Vert
      title = 'MIGRATION RÉUSSIE';
      emoji = '🚀';
    } else if (event.type.includes('partial')) {
      color = 0xFFC107; // Jaune
      title = 'MIGRATION PARTIELLE';
      emoji = '⚠️';
    } else if (event.type.includes('failed')) {
      color = 0xF44336; // Rouge
      title = 'MIGRATION ÉCHOUÉE';
      emoji = '❌';
    } else if (event.type.includes('qa:ok')) {
      color = 0x4CAF50; // Vert
      title = 'QA VALIDÉE';
      emoji = '✅';
    } else if (event.type.includes('qa:partial')) {
      color = 0xFFC107; // Jaune
      title = 'QA PARTIELLEMENT VALIDÉE';
      emoji = '⚠️';
    } else if (event.type.includes('qa:failed')) {
      color = 0xF44336; // Rouge
      title = 'QA ÉCHOUÉE';
      emoji = '❌';
    } else {
      color = 0x2196F3; // Bleu
      title = 'NOTIFICATION MCP';
      emoji = '🔔';
    }
    
    // Obtenir le nom du fichier à partir du chemin complet
    const sourceFileName = event.sourceFile ? path.basename(event.sourceFile) : 'N/A';
    const targetFileNames = event.targetFiles ? Object.values(event.targetFiles).map(f => path.basename(f)) : [];
    
    // Texte de base
    const content = `${emoji} **${title}** : ${sourceFileName}`;
    
    // Construire l'embed
    const embed = {
      color,
      title: `${emoji} ${title} : ${sourceFileName}`,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: 'Source',
          value: `\`${sourceFileName}\``,
          inline: true
        }
      ],
      footer: {
        text: 'MCP Notifier'
      }
    };
    
    // Ajouter les fichiers cibles s'ils existent
    if (targetFileNames.length > 0) {
      embed.fields.push({
        name: 'Composants',
        value: targetFileNames.map(f => `\`${f}\``).join(', '),
        inline: true
      });
    }
    
    // Ajouter les statuts QA et SEO s'ils existent
    if (event.qaStatus) {
      let qaIcon;
      switch (event.qaStatus) {
        case 'OK': qaIcon = '✅'; break;
        case 'Partial': qaIcon = '⚠️'; break;
        case 'Failed': qaIcon = '❌'; break;
        default: qaIcon = '❔';
      }
      embed.fields.push({
        name: 'QA',
        value: `${qaIcon} ${event.qaStatus}`,
        inline: true
      });
    }
    
    if (event.seoStatus) {
      let seoIcon;
      switch (event.seoStatus) {
        case 'OK': seoIcon = '✅'; break;
        case 'Partial': seoIcon = '⚠️'; break;
        case 'Failed': seoIcon = '❌'; break;
        default: seoIcon = '❔';
      }
      embed.fields.push({
        name: 'SEO',
        value: `${seoIcon} ${event.seoStatus}`,
        inline: true
      });
    }
    
    // Ajouter le score QA s'il existe
    if (event.score !== undefined) {
      embed.fields.push({
        name: 'Score QA',
        value: `${event.score}/100`,
        inline: true
      });
    }
    
    // Ajouter l'URL de la PR si elle existe
    if (event.prUrl) {
      embed.fields.push({
        name: 'PR',
        value: `[Voir la Pull Request](${event.prUrl})`,
        inline: true
      });
    }
    
    // Ajouter l'erreur si elle existe
    if (event.error) {
      let errorMessage;
      if (typeof event.error === 'string') {
        errorMessage = event.error;
      } else if (event.error.message) {
        errorMessage = event.error.message;
      } else {
        errorMessage = JSON.stringify(event.error);
      }
      
      embed.fields.push({
        name: 'Erreur',
        value: `\`\`\`${errorMessage}\`\`\``,
        inline: false
      });
    }
    
    // Ajouter les tags s'ils existent
    if (event.tags && event.tags.length > 0) {
      embed.fields.push({
        name: 'Tags',
        value: event.tags.join(', '),
        inline: false
      });
    }
    
    return { content, embeds: [embed] };
  }
  
  /**
   * Envoie une notification webhook
   */
  private async sendWebhookNotification(event: NotificationEvent) {
    if (!this.config.webhook.enabled || !this.config.webhook.url) return;
    
    try {
      await axios.post(this.config.webhook.url, {
        event: event.type,
        data: event,
        timestamp: new Date().toISOString()
      });
      
      this.logger.log(`✅ Notification webhook envoyée: ${event.type}`);
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification webhook: ${error.message}`);
    }
  }
  
  /**
   * Envoie manuellement une notification
   */
  public async notify(event: NotificationEvent) {
    try {
      // Assurer que l'horodatage est défini
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }
      
      // Mettre à jour le manifeste si nécessaire
      if (event.migrationId) {
        await this.updateManifest(event);
      }
      
      // Envoyer les notifications
      await this.sendNotifications(event);
      
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'envoi manuel de notification: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Arrête proprement le notifier
   */
  public async stop() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log('🔌 Déconnexion de Redis');
      }
      
      this.logger.log('👋 MCPNotifier arrêté');
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de l'arrêt de MCPNotifier: ${error.message}`);
    }
  }
}

/**
 * Fonction d'aide pour créer une instance du notifier
 */
export function createNotifier(config: NotifierConfig): MCPNotifier {
  return new MCPNotifier(config);
}

// Exécution autonome si appelé directement
if (require.main === module) {
  const configPath = process.argv[2] || path.join(process.cwd(), 'config', 'notifier.json');
  
  console.log(`📋 Chargement de la configuration depuis ${configPath}`);
  
  try {
    const config = fs.readJsonSync(configPath);
    const notifier = createNotifier(config);
    
    // Gérer l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('🛑 Signal d\'interruption reçu');
      await notifier.stop();
      process.exit(0);
    });
    
    console.log('✅ MCPNotifier démarré');
  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}