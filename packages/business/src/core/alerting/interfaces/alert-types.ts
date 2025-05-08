/**
 * Interfaces pour le système d'alertes intelligent
 */

/**
 * Niveaux de sévérité des alertes
 */
export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

/**
 * Statut d'une alerte
 */
export enum AlertStatus {
    ACTIVE = 'active',
    ACKNOWLEDGED = 'acknowledged',
    RESOLVED = 'resolved'
}

/**
 * Types de règles d'alerte
 */
export enum AlertRuleType {
    THRESHOLD = 'threshold',        // Seuil fixe
    ADAPTIVE = 'adaptive',          // Seuil adaptatif (basé sur l'historique)
    ANOMALY = 'anomaly',            // Détection d'anomalies statistiques
    TREND = 'trend',                // Analyse de tendance
    COMPOSITE = 'composite',        // Règle composite (multiple conditions)
    INTELLIGENCE = 'intelligence'   // Détection par intelligence artificielle
}

/**
 * Types d'analyse de tendance
 */
export enum TrendType {
    INCREASING = 'increasing',      // Tendance à la hausse
    DECREASING = 'decreasing',      // Tendance à la baisse
    STABLE = 'stable',              // Tendance stable
    VOLATILE = 'volatile'           // Tendance volatile
}

/**
 * Configuration d'une règle de tendance
 */
export interface TrendRuleConfig {
    /**
     * Type de tendance à détecter
     */
    type: TrendType;

    /**
     * Période d'analyse (en secondes)
     */
    period: number;

    /**
     * Seuil de changement significatif (pourcentage)
     */
    changeThreshold: number;

    /**
     * Nombre minimum de points de données requis
     */
    minDataPoints: number;
}

/**
 * Configuration d'un seuil adaptatif
 */
export interface AdaptiveThresholdConfig {
    /**
     * Méthode de calcul du seuil adaptatif
     */
    method: 'stddev' | 'percentile' | 'average' | 'median' | 'custom';

    /**
     * Facteur multiplicateur pour l'écart-type (si method='stddev')
     */
    deviationFactor?: number;

    /**
     * Percentile à utiliser (si method='percentile')
     */
    percentile?: number;

    /**
     * Période d'apprentissage (en secondes)
     */
    learningPeriod: number;

    /**
     * Fonction personnalisée pour le calcul du seuil (si method='custom')
     */
    customCalculation?: (values: number[]) => { upper: number, lower: number };

    /**
     * Adaptation automatique du seuil avec le temps
     */
    autoAdjust: boolean;
}

/**
 * Configuration d'une règle d'intelligence artificielle
 */
export interface AIRuleConfig {
    /**
     * Modèle d'IA à utiliser
     */
    model: 'regression' | 'classification' | 'clustering' | 'forecast';

    /**
     * Paramètres spécifiques au modèle
     */
    modelParams?: Record<string, any>;

    /**
     * Seuil de confiance pour le déclenchement de l'alerte
     */
    confidenceThreshold: number;

    /**
     * Période d'entraînement (en secondes)
     */
    trainingPeriod: number;

    /**
     * Métriques d'entrée supplémentaires à considérer
     */
    additionalMetrics?: string[];
}

/**
 * Opérateurs de comparaison pour les règles
 */
export enum ComparisonOperator {
    GREATER_THAN = '>',
    GREATER_THAN_OR_EQUAL = '>=',
    LESS_THAN = '<',
    LESS_THAN_OR_EQUAL = '<=',
    EQUAL = '==',
    NOT_EQUAL = '!=',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains',
    REGEX = 'regex'
}

/**
 * Canaux de notification disponibles
 */
export enum NotificationChannel {
    EMAIL = 'email',
    SLACK = 'slack',
    DISCORD = 'discord',
    WEBHOOK = 'webhook',
    SMS = 'sms'
}

/**
 * Structure représentant une alerte
 */
export interface Alert {
    /**
     * Identifiant unique de l'alerte
     */
    id: string;

    /**
     * Nom de l'alerte
     */
    name: string;

    /**
     * Description détaillée
     */
    description: string;

    /**
     * Source de l'alerte (service, composant)
     */
    source: string;

    /**
     * Niveau de sévérité
     */
    severity: AlertSeverity;

    /**
     * Statut actuel
     */
    status: AlertStatus;

    /**
     * Horodatage de création
     */
    createdAt: Date;

    /**
     * Horodatage de dernière mise à jour
     */
    updatedAt: Date;

    /**
     * Horodatage de résolution (si résolu)
     */
    resolvedAt?: Date;

    /**
     * Valeur qui a déclenché l'alerte
     */
    value: number | string | boolean;

    /**
     * Contexte supplémentaire (métadonnées)
     */
    context: Record<string, any>;

    /**
     * Règle ayant déclenché l'alerte
     */
    rule: AlertRule;

    /**
     * Canaux sur lesquels l'alerte a été envoyée
     */
    sentTo: NotificationChannel[];
}

/**
 * Règle définissant quand déclencher une alerte
 */
export interface AlertRule {
    /**
     * Identifiant unique de la règle
     */
    id: string;

    /**
     * Nom de la règle
     */
    name: string;

    /**
     * Description explicite
     */
    description: string;

    /**
     * Type de règle
     */
    type: AlertRuleType;

    /**
     * Métrique à surveiller
     */
    metric: string;

    /**
     * Opérateur de comparaison
     */
    operator: ComparisonOperator;

    /**
     * Valeur seuil
     */
    threshold: number | string | boolean;

    /**
     * Sévérité de l'alerte à déclencher
     */
    severity: AlertSeverity;

    /**
     * Durée pendant laquelle la condition doit être vraie avant de déclencher l'alerte (ms)
     */
    duration?: number;

    /**
     * Canaux de notification à utiliser
     */
    channels: NotificationChannel[];

    /**
     * Intervalle minimum entre deux alertes (anti-spam) en ms
     */
    cooldown?: number;

    /**
     * Dernière fois que l'alerte a été déclenchée
     */
    lastTriggered?: Date;

    /**
     * Conditions additionnelles pour les règles composites
     */
    conditions?: Array<{
        metric: string;
        operator: ComparisonOperator;
        threshold: number | string | boolean;
    }>;

    /**
     * Fonction d'évaluation personnalisée
     */
    customEvaluator?: (value: any, context: Record<string, any>) => boolean;

    /**
     * État d'activation de la règle
     */
    enabled: boolean;
}

/**
 * Configuration pour l'envoi d'email
 */
export interface EmailConfig {
    from: string;
    to: string[];
    cc?: string[];
    subject?: string;
    template?: string;
    smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
}

/**
 * Configuration pour les notifications Slack
 */
export interface SlackConfig {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
    iconUrl?: string;
    template?: string;
}

/**
 * Configuration pour les notifications Discord
 */
export interface DiscordConfig {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
    template?: string;
    embedColor?: {
        info: number;
        warning: number;
        error: number;
        critical: number;
    };
}

/**
 * Configuration pour les webhooks génériques
 */
export interface WebhookConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT';
    headers?: Record<string, string>;
    template?: string;
}

/**
 * Configuration globale des notifications
 */
export interface NotificationConfig {
    email?: EmailConfig;
    slack?: SlackConfig;
    discord?: DiscordConfig;
    webhook?: WebhookConfig;
    sms?: any; // Pour extension future
}

/**
 * Interface pour les services de notification
 */
export interface NotificationService {
    /**
     * Envoie une notification
     */
    send(alert: Alert): Promise<boolean>;

    /**
     * Vérifie si le service est configuré correctement
     */
    isConfigured(): boolean;
}