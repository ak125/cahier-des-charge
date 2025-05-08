/**
 * AlertManager - Gestionnaire d'alertes intelligent
 * 
 * Système central pour détecter les anomalies, évaluer les seuils critiques
 * et déclencher des alertes via plusieurs canaux (email, Discord, Slack)
 */
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
    Alert,
    AlertRule,
    AlertSeverity,
    AlertStatus,
    AlertRuleType,
    ComparisonOperator,
    NotificationChannel,
    NotificationConfig,
    NotificationService
} from './interfaces/alert-types';
import { EmailNotificationService } from './services/email-notification.service';
import { SlackNotificationService } from './services/slack-notification.service';
import { DiscordNotificationService } from './services/discord-notification.service';

/**
 * Fonction pour calculer la moyenne d'un tableau de valeurs
 */
function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Fonction pour calculer l'écart-type d'un tableau de valeurs
 */
function standardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    const avg = mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

/**
 * Configuration du gestionnaire d'alertes
 */
export interface AlertManagerConfig {
    /**
     * Nom du gestionnaire d'alertes
     */
    name?: string;

    /**
     * Conserver l'historique des alertes (nombre maximal à conserver)
     */
    historySize?: number;

    /**
     * Intervalles par défaut pour la vérification des métriques (ms)
     */
    defaultIntervals?: {
        check?: number;        // Intervalle de vérification des règles (par défaut 60s)
        cleanup?: number;      // Intervalle de nettoyage des alertes résolues (par défaut 24h)
        retention?: number;    // Durée de conservation des alertes résolues (par défaut 30j)
    };

    /**
     * Configuration des services de notification
     */
    notifications?: NotificationConfig;

    /**
     * Groupement des alertes similaires
     */
    groupSimilarAlerts?: boolean;

    /**
     * Auto-résolution des alertes
     */
    autoResolveAfter?: number;

    /**
     * Débouncing des alertes (anti-flapping)
     */
    debounceTimeout?: number;

    /**
     * Activer la détection d'anomalies statistiques
     */
    enableAnomalyDetection?: boolean;

    /**
     * Nombre de valeurs à conserver pour l'historique des métriques
     */
    metricHistorySize?: number;
}

/**
 * Options pour l'envoi d'une alerte
 */
export interface SendAlertOptions {
    /**
     * Canaux spécifiques à utiliser pour cette alerte
     */
    channels?: NotificationChannel[];

    /**
     * Forcer l'envoi même si en période de cooldown
     */
    force?: boolean;

    /**
     * Contexte supplémentaire à inclure dans l'alerte
     */
    context?: Record<string, any>;
}

/**
 * Résultat de l'évaluation d'une règle
 */
interface RuleEvaluationResult {
    triggered: boolean;
    value: any;
    context?: Record<string, any>;
}

/**
 * Gestionnaire d'alertes principal
 */
export class AlertManager extends EventEmitter {
    /**
     * Nom du gestionnaire
     */
    private name: string;

    /**
     * Liste des règles d'alerte configurées
     */
    private rules: Map<string, AlertRule>;

    /**
     * Alertes actives
     */
    private activeAlerts: Map<string, Alert>;

    /**
     * Historique des alertes
     */
    private alertHistory: Alert[];

    /**
     * Taille maximale de l'historique des alertes
     */
    private historySize: number;

    /**
     * Services de notification
     */
    private notificationServices: Map<NotificationChannel, NotificationService>;

    /**
     * Intervalle de vérification des règles (ms)
     */
    private checkInterval: number;

    /**
     * Intervalle de nettoyage (ms)
     */
    private cleanupInterval: number;

    /**
     * Durée de rétention des alertes résolues (ms)
     */
    private retentionPeriod: number;

    /**
     * Timer pour la vérification des règles
     */
    private checkTimer?: NodeJS.Timeout;

    /**
     * Timer pour le nettoyage des alertes
     */
    private cleanupTimer?: NodeJS.Timeout;

    /**
     * Dernières valeurs des métriques pour la détection d'anomalies
     */
    private metricHistory: Map<string, { values: number[], timestamps: number[] }>;

    /**
     * Taille de l'historique des métriques à conserver
     */
    private metricHistorySize: number;

    /**
     * Flag d'activation de la détection d'anomalies
     */
    private anomalyDetectionEnabled: boolean;

    /**
     * Grouper les alertes similaires
     */
    private groupSimilarAlerts: boolean;

    /**
     * Temps d'auto-résolution des alertes (ms)
     */
    private autoResolveAfter?: number;

    /**
     * Temps de débounce pour éviter le flapping (ms)
     */
    private debounceTimeout: number;

    /**
     * Alertes en attente de débounce
     */
    private pendingAlerts: Map<string, { timer: NodeJS.Timeout, data: any }>;

    /**
     * Constructeur
     */
    constructor(config: AlertManagerConfig = {}) {
        super();

        this.name = config.name || 'AlertManager';
        this.rules = new Map();
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.historySize = config.historySize || 1000;
        this.notificationServices = new Map();

        // Intervalles par défaut
        this.checkInterval = config.defaultIntervals?.check || 60 * 1000; // 60 secondes
        this.cleanupInterval = config.defaultIntervals?.cleanup || 24 * 60 * 60 * 1000; // 24 heures
        this.retentionPeriod = config.defaultIntervals?.retention || 30 * 24 * 60 * 60 * 1000; // 30 jours

        // Historique des métriques pour la détection d'anomalies
        this.metricHistory = new Map();
        this.metricHistorySize = config.metricHistorySize || 100;
        this.anomalyDetectionEnabled = config.enableAnomalyDetection || false;

        // Configuration du groupement et du débounce
        this.groupSimilarAlerts = config.groupSimilarAlerts || false;
        this.autoResolveAfter = config.autoResolveAfter;
        this.debounceTimeout = config.debounceTimeout || 0;
        this.pendingAlerts = new Map();

        // Initialiser les services de notification si configurés
        if (config.notifications) {
            this.initNotificationServices(config.notifications);
        }
    }

    /**
     * Initialise les services de notification configurés
     * @param config Configuration des notifications
     */
    private initNotificationServices(config: NotificationConfig): void {
        if (config.email) {
            this.notificationServices.set(
                NotificationChannel.EMAIL,
                new EmailNotificationService(config.email)
            );
        }

        if (config.slack) {
            this.notificationServices.set(
                NotificationChannel.SLACK,
                new SlackNotificationService(config.slack)
            );
        }

        if (config.discord) {
            this.notificationServices.set(
                NotificationChannel.DISCORD,
                new DiscordNotificationService(config.discord)
            );
        }

        // Autres services à ajouter au besoin (SMS, webhooks personnalisés, etc.)
    }

    /**
     * Démarre le gestionnaire d'alertes
     */
    public start(): void {
        this.stop(); // S'assurer que tout est arrêté avant de redémarrer

        // Démarrer la vérification périodique des règles
        if (this.checkInterval > 0) {
            this.checkTimer = setInterval(() => this.checkAllRules(), this.checkInterval);
        }

        // Démarrer le nettoyage périodique des alertes
        if (this.cleanupInterval > 0) {
            this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
        }

        console.log(`[${this.name}] Gestionnaire d'alertes démarré. Vérification toutes les ${this.checkInterval / 1000}s.`);
    }

    /**
     * Arrête le gestionnaire d'alertes
     */
    public stop(): void {
        // Arrêter les timers de vérification et de nettoyage
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = undefined;
        }

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }

        console.log(`[${this.name}] Gestionnaire d'alertes arrêté.`);
    }

    /**
     * Ajoute ou met à jour une règle d'alerte
     * @param rule Règle à ajouter ou mettre à jour
     */
    public addRule(rule: AlertRule): string {
        // Si l'ID n'est pas défini, en générer un
        if (!rule.id) {
            rule.id = uuidv4();
        }

        // S'assurer que la règle a tous les champs nécessaires
        if (!rule.enabled) rule.enabled = true;
        if (!rule.channels) rule.channels = [NotificationChannel.EMAIL];

        // Enregistrer la règle
        this.rules.set(rule.id, rule);

        console.log(`[${this.name}] Règle ajoutée: ${rule.name} (${rule.id})`);
        return rule.id;
    }

    /**
     * Supprime une règle d'alerte
     * @param ruleId ID de la règle à supprimer
     */
    public removeRule(ruleId: string): boolean {
        const result = this.rules.delete(ruleId);

        if (result) {
            console.log(`[${this.name}] Règle supprimée: ${ruleId}`);
        }

        return result;
    }

    /**
     * Récupère toutes les règles configurées
     */
    public getRules(): AlertRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Récupère une règle par son ID
     * @param ruleId ID de la règle
     */
    public getRule(ruleId: string): AlertRule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Active ou désactive une règle
     * @param ruleId ID de la règle
     * @param enabled État d'activation
     */
    public setRuleEnabled(ruleId: string, enabled: boolean): boolean {
        const rule = this.rules.get(ruleId);

        if (rule) {
            rule.enabled = enabled;
            this.rules.set(ruleId, rule);
            console.log(`[${this.name}] Règle ${ruleId} ${enabled ? 'activée' : 'désactivée'}`);
            return true;
        }

        return false;
    }

    /**
     * Vérifie toutes les règles actives
     */
    public async checkAllRules(): Promise<void> {
        // Vérifier toutes les règles activées
        for (const rule of this.rules.values()) {
            if (rule.enabled) {
                try {
                    await this.checkRule(rule);
                } catch (error) {
                    console.error(`[${this.name}] Erreur lors de la vérification de la règle ${rule.id}:`, error);
                }
            }
        }
    }

    /**
     * Vérifie une règle spécifique
     * @param rule Règle à vérifier
     */
    public async checkRule(rule: AlertRule): Promise<RuleEvaluationResult> {
        // Si la règle est en période de cooldown, ne pas vérifier
        if (rule.lastTriggered && rule.cooldown) {
            const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
            if (timeSinceLastTrigger < rule.cooldown) {
                return { triggered: false, value: null };
            }
        }

        // Récupérer la valeur actuelle de la métrique (à implémenter par le consommateur)
        // Cette partie serait généralement implémentée dans une classe dérivée ou par un observateur
        const metricValue = await this.getMetricValue(rule.metric);

        // Évaluer la condition selon le type de règle
        const result = this.evaluateRule(rule, metricValue);

        // Mettre à jour l'historique des métriques pour la détection d'anomalies
        if (typeof metricValue === 'number' && this.anomalyDetectionEnabled) {
            this.updateMetricHistory(rule.metric, metricValue);
        }

        // Si la condition est vérifiée, déclencher une alerte
        if (result.triggered) {
            // Mettre à jour le timestamp de dernier déclenchement
            rule.lastTriggered = new Date();
            this.rules.set(rule.id, rule);

            // Créer et envoyer l'alerte
            this.createAlert(rule, result.value, result.context);
        }

        return result;
    }

    /**
     * Récupère la valeur actuelle d'une métrique
     * Cette méthode devrait être surchargée par l'implémentation concrète
     * @param metric Nom de la métrique à récupérer
     */
    protected async getMetricValue(metric: string): Promise<any> {
        // Cette méthode doit être implémentée par la classe dérivée ou par l'utilisateur
        // qui fournira les valeurs des métriques à surveiller

        // Par défaut, émet un événement pour demander la valeur
        return new Promise((resolve) => {
            this.emit('getMetricValue', metric, resolve);
        });
    }

    /**
     * Met à jour l'historique des métriques pour la détection d'anomalies
     * @param metric Nom de la métrique
     * @param value Nouvelle valeur
     */
    private updateMetricHistory(metric: string, value: number): void {
        if (!this.metricHistory.has(metric)) {
            this.metricHistory.set(metric, { values: [], timestamps: [] });
        }

        const history = this.metricHistory.get(metric)!;

        // Ajouter la nouvelle valeur
        history.values.push(value);
        history.timestamps.push(Date.now());

        // Limiter la taille de l'historique
        if (history.values.length > this.metricHistorySize) {
            history.values.shift();
            history.timestamps.shift();
        }

        this.metricHistory.set(metric, history);
    }

    /**
     * Évalue une règle d'alerte par rapport à une valeur
     * @param rule Règle à évaluer
     * @param value Valeur actuelle de la métrique
     */
    private evaluateRule(rule: AlertRule, value: any): RuleEvaluationResult {
        // Si une fonction d'évaluation personnalisée est définie, l'utiliser
        if (rule.customEvaluator) {
            const result = rule.customEvaluator(value, {});
            return { triggered: result, value, context: {} };
        }

        // Évaluer selon le type de règle
        switch (rule.type) {
            case AlertRuleType.THRESHOLD:
                return this.evaluateThreshold(rule, value);

            case AlertRuleType.ANOMALY:
                return this.evaluateAnomaly(rule, value);

            case AlertRuleType.TREND:
                return this.evaluateTrend(rule, value);

            case AlertRuleType.COMPOSITE:
                return this.evaluateComposite(rule, value);

            default:
                return { triggered: false, value };
        }
    }

    /**
     * Évalue une règle de seuil
     * @param rule Règle à évaluer
     * @param value Valeur à comparer
     */
    private evaluateThreshold(rule: AlertRule, value: any): RuleEvaluationResult {
        let triggered = false;

        // Comparer la valeur au seuil selon l'opérateur
        switch (rule.operator) {
            case ComparisonOperator.GREATER_THAN:
                triggered = value > rule.threshold;
                break;

            case ComparisonOperator.GREATER_THAN_OR_EQUAL:
                triggered = value >= rule.threshold;
                break;

            case ComparisonOperator.LESS_THAN:
                triggered = value < rule.threshold;
                break;

            case ComparisonOperator.LESS_THAN_OR_EQUAL:
                triggered = value <= rule.threshold;
                break;

            case ComparisonOperator.EQUAL:
                triggered = value == rule.threshold;
                break;

            case ComparisonOperator.NOT_EQUAL:
                triggered = value != rule.threshold;
                break;

            case ComparisonOperator.CONTAINS:
                if (typeof value === 'string' && typeof rule.threshold === 'string') {
                    triggered = value.includes(rule.threshold);
                }
                break;

            case ComparisonOperator.NOT_CONTAINS:
                if (typeof value === 'string' && typeof rule.threshold === 'string') {
                    triggered = !value.includes(rule.threshold);
                }
                break;

            case ComparisonOperator.REGEX:
                if (typeof value === 'string' && typeof rule.threshold === 'string') {
                    try {
                        const regex = new RegExp(rule.threshold);
                        triggered = regex.test(value);
                    } catch (e) {
                        console.error(`[${this.name}] Expression régulière invalide:`, e);
                    }
                }
                break;
        }

        return { triggered, value };
    }

    /**
     * Évalue une règle de détection d'anomalies
     * @param rule Règle à évaluer
     * @param value Valeur actuelle
     */
    private evaluateAnomaly(rule: AlertRule, value: number): RuleEvaluationResult {
        // Si la détection d'anomalies n'est pas activée ou pas assez d'historique
        if (!this.anomalyDetectionEnabled || !this.metricHistory.has(rule.metric)) {
            return { triggered: false, value };
        }

        const history = this.metricHistory.get(rule.metric)!;

        // Besoin d'au moins quelques valeurs pour détecter des anomalies
        if (history.values.length < 5) {
            return { triggered: false, value };
        }

        // Calculer la moyenne et l'écart-type
        const avg = mean(history.values);
        const stdDev = standardDeviation(history.values);

        // Nombre d'écarts-types pour considérer comme anomalie
        const threshold = typeof rule.threshold === 'number' ? rule.threshold : 3;

        // Différence par rapport à la moyenne en nombre d'écarts-types
        const zScore = Math.abs(value - avg) / (stdDev || 1); // Éviter division par zéro
        const triggered = zScore > threshold;

        const context = {
            average: avg,
            stdDev: stdDev,
            zScore: zScore,
            threshold: threshold
        };

        return { triggered, value, context };
    }

    /**
     * Évalue une règle d'analyse de tendance
     * @param rule Règle à évaluer
     * @param value Valeur actuelle
     */
    private evaluateTrend(rule: AlertRule, value: number): RuleEvaluationResult {
        // Si pas assez d'historique pour analyser une tendance
        if (!this.metricHistory.has(rule.metric)) {
            return { triggered: false, value };
        }

        const history = this.metricHistory.get(rule.metric)!;

        // Besoin d'au moins quelques valeurs pour détecter une tendance
        if (history.values.length < 5) {
            return { triggered: false, value };
        }

        // Calcule le pourcentage de changement sur les N dernières valeurs
        const numValues = Math.min(history.values.length, 10);
        const recentValues = history.values.slice(-numValues);
        const oldestValue = recentValues[0];
        const newestValue = value;

        if (oldestValue === 0) {
            return { triggered: false, value };
        }

        const percentChange = ((newestValue - oldestValue) / Math.abs(oldestValue)) * 100;

        // Pour les règles de tendance, le seuil représente le pourcentage de changement
        const threshold = typeof rule.threshold === 'number' ? rule.threshold : 20;

        // Détermine si la tendance dépasse le seuil
        let triggered = false;
        switch (rule.operator) {
            case ComparisonOperator.GREATER_THAN:
                triggered = percentChange > threshold;
                break;

            case ComparisonOperator.LESS_THAN:
                triggered = percentChange < -threshold;
                break;

            default:
                triggered = Math.abs(percentChange) > threshold;
        }

        const context = {
            percentChange,
            oldestValue,
            newestValue,
            changeThreshold: threshold
        };

        return { triggered, value, context };
    }

    /**
     * Évalue une règle composite avec plusieurs conditions
     * @param rule Règle à évaluer
     * @param value Valeur principale
     */
    private evaluateComposite(rule: AlertRule, value: any): RuleEvaluationResult {
        // Si la règle n'a pas de conditions supplémentaires
        if (!rule.conditions || rule.conditions.length === 0) {
            return this.evaluateThreshold(rule, value);
        }

        // Évaluer la condition principale
        const mainResult = this.evaluateThreshold(rule, value);

        // Si la condition principale n'est pas vérifiée, pas besoin de vérifier les autres
        if (!mainResult.triggered) {
            return mainResult;
        }

        // Vérifier toutes les conditions additionnelles (considérées comme des ET logiques)
        for (const condition of rule.conditions) {
            // Récupérer la valeur de la métrique pour cette condition
            // Note: dans un cas réel, cela pourrait être asynchrone
            const conditionValue = this.getMetricValueSync(condition.metric);

            // Créer une règle temporaire pour évaluer la condition
            const tempRule = {
                ...rule,
                metric: condition.metric,
                operator: condition.operator,
                threshold: condition.threshold
            };

            // Évaluer la condition
            const conditionResult = this.evaluateThreshold(tempRule, conditionValue);

            // Si une condition n'est pas vérifiée, la règle composite ne se déclenche pas
            if (!conditionResult.triggered) {
                return { triggered: false, value };
            }
        }

        // Toutes les conditions sont vérifiées
        return { triggered: true, value };
    }

    /**
     * Version synchrone de getMetricValue pour les règles composites
     * dans un cas réel, cette méthode pourrait accéder à un cache de métriques
     * @param metric Nom de la métrique
     */
    private getMetricValueSync(metric: string): any {
        // Cette méthode devrait être implémentée dans une classe dérivée
        // Pour l'instant, on émet un événement et on retourne une valeur par défaut
        this.emit('getMetricValueSync', metric);
        return 0;
    }

    /**
     * Crée une nouvelle alerte basée sur une règle déclenchée
     * @param rule Règle qui a déclenché l'alerte
     * @param value Valeur qui a déclenché l'alerte
     * @param context Contexte supplémentaire
     */
    private createAlert(rule: AlertRule, value: any, context?: Record<string, any>): void {
        // Créer l'alerte
        const alert: Alert = {
            id: uuidv4(),
            name: rule.name,
            description: rule.description,
            source: rule.metric,
            severity: rule.severity,
            status: AlertStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            value: value,
            context: context || {},
            rule: { ...rule }, // Copie de la règle pour référence
            sentTo: []
        };

        // Si le debounce est activé, mettre l'alerte en attente
        if (this.debounceTimeout > 0) {
            const key = `${rule.id}-${rule.metric}`;

            // Si une alerte similaire est déjà en attente, annuler le timer précédent
            if (this.pendingAlerts.has(key)) {
                clearTimeout(this.pendingAlerts.get(key)!.timer);
            }

            // Créer un nouveau timer
            const timer = setTimeout(() => {
                this.pendingAlerts.delete(key);
                this.processAlert(alert);
            }, this.debounceTimeout);

            this.pendingAlerts.set(key, { timer, data: alert });
            return;
        }

        // Sinon, traiter l'alerte immédiatement
        this.processAlert(alert);
    }

    /**
     * Traite une alerte après debouncing
     * @param alert Alerte à traiter
     */
    private processAlert(alert: Alert): void {
        // Vérifier si une alerte similaire est déjà active
        if (this.groupSimilarAlerts) {
            const existingAlert = this.findSimilarAlert(alert);

            if (existingAlert) {
                // Mettre à jour l'alerte existante
                existingAlert.updatedAt = new Date();
                existingAlert.value = alert.value;
                existingAlert.context = { ...existingAlert.context, ...alert.context };

                this.activeAlerts.set(existingAlert.id, existingAlert);

                console.log(`[${this.name}] Alerte existante mise à jour: ${existingAlert.name} (${existingAlert.id})`);

                // Émettre l'événement de mise à jour
                this.emit('alertUpdated', existingAlert);

                return;
            }
        }

        // Ajouter l'alerte à la liste des alertes actives
        this.activeAlerts.set(alert.id, alert);

        // Ajouter l'alerte à l'historique
        this.alertHistory.push(alert);

        // Limiter la taille de l'historique
        if (this.alertHistory.length > this.historySize) {
            this.alertHistory.shift();
        }

        console.log(`[${this.name}] Nouvelle alerte créée: ${alert.name} (${alert.id}), sévérité: ${alert.severity}`);

        // Envoyer la notification
        this.sendAlert(alert);

        // Émettre l'événement d'alerte
        this.emit('alertCreated', alert);

        // Configurer l'auto-résolution si nécessaire
        if (this.autoResolveAfter && this.autoResolveAfter > 0) {
            setTimeout(() => {
                this.resolveAlert(alert.id, 'Auto-résolution après délai configuré');
            }, this.autoResolveAfter);
        }
    }

    /**
     * Recherche une alerte similaire déjà active
     * @param alert Alerte à rechercher
     */
    private findSimilarAlert(alert: Alert): Alert | undefined {
        for (const existingAlert of this.activeAlerts.values()) {
            // Deux alertes sont considérées similaires si elles ont la même règle et source
            if (existingAlert.rule.id === alert.rule.id && existingAlert.source === alert.source) {
                return existingAlert;
            }
        }

        return undefined;
    }

    /**
     * Envoie une alerte via les canaux configurés
     * @param alert Alerte à envoyer
     * @param options Options d'envoi
     */
    public async sendAlert(alert: Alert, options: SendAlertOptions = {}): Promise<boolean> {
        // Déterminer les canaux à utiliser
        const channels = options.channels || alert.rule.channels;

        if (!channels || channels.length === 0) {
            console.warn(`[${this.name}] Aucun canal configuré pour l'alerte ${alert.id}`);
            return false;
        }

        // Fusionner le contexte supplémentaire si fourni
        if (options.context) {
            alert.context = { ...alert.context, ...options.context };
        }

        // Envoyer l'alerte sur chaque canal configuré
        let success = false;

        for (const channel of channels) {
            const service = this.notificationServices.get(channel);

            if (service && service.isConfigured()) {
                try {
                    const result = await service.send(alert);

                    if (result) {
                        alert.sentTo.push(channel);
                        success = true;
                    }
                } catch (error) {
                    console.error(`[${this.name}] Erreur lors de l'envoi de l'alerte ${alert.id} via ${channel}:`, error);
                }
            } else {
                console.warn(`[${this.name}] Service de notification non configuré pour le canal ${channel}`);
            }
        }

        // Mettre à jour l'alerte
        if (success) {
            alert.updatedAt = new Date();
            this.activeAlerts.set(alert.id, alert);
        }

        return success;
    }

    /**
     * Acquitte une alerte
     * @param alertId ID de l'alerte à acquitter
     * @param comment Commentaire optionnel
     */
    public acknowledgeAlert(alertId: string, comment?: string): boolean {
        const alert = this.activeAlerts.get(alertId);

        if (alert) {
            alert.status = AlertStatus.ACKNOWLEDGED;
            alert.updatedAt = new Date();

            if (comment) {
                alert.context = { ...alert.context, acknowledgementComment: comment };
            }

            this.activeAlerts.set(alertId, alert);

            console.log(`[${this.name}] Alerte acquittée: ${alertId}`);
            this.emit('alertAcknowledged', alert);

            return true;
        }

        return false;
    }

    /**
     * Résout une alerte
     * @param alertId ID de l'alerte à résoudre
     * @param reason Raison de la résolution
     */
    public resolveAlert(alertId: string, reason?: string): boolean {
        const alert = this.activeAlerts.get(alertId);

        if (alert) {
            alert.status = AlertStatus.RESOLVED;
            alert.updatedAt = new Date();
            alert.resolvedAt = new Date();

            if (reason) {
                alert.context = { ...alert.context, resolutionReason: reason };
            }

            // Retirer des alertes actives mais conserver dans l'historique
            this.activeAlerts.delete(alertId);

            // Mettre à jour l'alerte dans l'historique
            const historyIndex = this.alertHistory.findIndex(a => a.id === alertId);
            if (historyIndex >= 0) {
                this.alertHistory[historyIndex] = alert;
            } else {
                this.alertHistory.push(alert);

                // Limiter la taille de l'historique
                if (this.alertHistory.length > this.historySize) {
                    this.alertHistory.shift();
                }
            }

            console.log(`[${this.name}] Alerte résolue: ${alertId}`);
            this.emit('alertResolved', alert);

            return true;
        }

        return false;
    }

    /**
     * Récupère toutes les alertes actives
     */
    public getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    /**
     * Récupère l'historique des alertes
     */
    public getAlertHistory(): Alert[] {
        return [...this.alertHistory];
    }

    /**
     * Récupère une alerte par son ID
     * @param alertId ID de l'alerte
     */
    public getAlert(alertId: string): Alert | undefined {
        // Chercher dans les alertes actives
        const activeAlert = this.activeAlerts.get(alertId);
        if (activeAlert) {
            return activeAlert;
        }

        // Chercher dans l'historique
        return this.alertHistory.find(a => a.id === alertId);
    }

    /**
     * Effectue un nettoyage des alertes anciennes
     */
    public cleanup(): void {
        const now = Date.now();
        const cutoffTime = now - this.retentionPeriod;

        // Filtrer l'historique pour ne garder que les alertes récentes
        const newHistory = this.alertHistory.filter(alert => {
            // Garder les alertes qui ne sont pas résolues ou sont récentes
            return !alert.resolvedAt || alert.resolvedAt.getTime() > cutoffTime;
        });

        const removedCount = this.alertHistory.length - newHistory.length;

        if (removedCount > 0) {
            this.alertHistory = newHistory;
            console.log(`[${this.name}] Nettoyage: ${removedCount} alertes anciennes supprimées`);
        }
    }

    /**
     * Supprime toutes les données d'alerte
     */
    public reset(): void {
        this.activeAlerts.clear();
        this.alertHistory = [];
        this.metricHistory.clear();
        this.pendingAlerts.forEach(({ timer }) => clearTimeout(timer));
        this.pendingAlerts.clear();

        console.log(`[${this.name}] Toutes les alertes ont été supprimées`);
    }
}