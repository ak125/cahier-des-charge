/**
 * Activités Temporal pour les intégrations externes
 * 
 * Ces activités remplacent les nœuds d'intégration dans n8n
 * et fournissent des fonctionnalités standardisées pour interagir
 * avec des systèmes externes.
 */

import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Configuration pour les requêtes HTTP externes
 */
interface HttpRequestConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    retryConfig?: {
        maxRetries: number;
        initialDelay: number;
        maxDelay: number;
    };
}

/**
 * Résultat d'une requête HTTP externe
 */
interface HttpRequestResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    timings: {
        started: string;
        completed: string;
        durationMs: number;
    };
}

/**
 * Activité pour effectuer des requêtes HTTP (remplace les nœuds HTTP Request de n8n)
 */
export async function httpRequest(config: HttpRequestConfig): Promise<HttpRequestResult> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    const axiosConfig: AxiosRequestConfig = {
        url: config.url,
        method: config.method,
        headers: config.headers || {},
        params: config.params,
        data: config.data,
        timeout: config.timeout || 30000, // 30 secondes par défaut
    };

    try {
        const response = await axios(axiosConfig);

        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
            data: response.data,
            timings: {
                started: startedAt,
                completed: new Date().toISOString(),
                durationMs: Date.now() - startTime
            }
        };
    } catch (error: any) {
        if (error.response) {
            // La requête a été faite et le serveur a répondu avec un code d'état en dehors de 2xx
            throw new Error(`API Error: ${error.response.status} ${error.response.statusText}, data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            throw new Error(`API Request Error: No response received, ${error.message}`);
        } else {
            // Une erreur s'est produite lors de la configuration de la demande
            throw new Error(`API Request Setup Error: ${error.message}`);
        }
    }
}

/**
 * Configuration pour l'envoi d'emails
 */
interface SendEmailConfig {
    to: string | string[];
    subject: string;
    body: string;
    isHtml?: boolean;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
    from?: string;
}

/**
 * Activité pour envoyer des emails (remplace les nœuds Send Email de n8n)
 */
export async function sendEmail(config: SendEmailConfig): Promise<{ messageId: string; success: boolean }> {
    // Dans un cas réel, cette fonction utiliserait un service d'email comme Nodemailer, SendGrid, etc.
    // Pour cet exemple, nous simulons l'envoi d'un email avec succès

    console.log(`Envoie d'email à ${Array.isArray(config.to) ? config.to.join(', ') : config.to}`);
    console.log(`Sujet: ${config.subject}`);

    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500));

    // Générer un identifiant de message unique
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return {
        messageId,
        success: true
    };
}

/**
 * Configuration pour l'accès SFTP
 */
interface SftpConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

/**
 * Activité pour télécharger un fichier via SFTP (remplace le nœud SFTP de n8n)
 */
export async function downloadFileSftp(
    connection: SftpConfig,
    remotePath: string,
    localPath: string
): Promise<{ path: string; size: number; success: boolean }> {
    // Dans un cas réel, cette fonction utiliserait une bibliothèque SFTP
    // Pour cet exemple, nous simulons le téléchargement d'un fichier

    console.log(`Téléchargement du fichier ${remotePath} depuis ${connection.host}`);

    // Simulation d'un délai de téléchargement
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Créer le répertoire local si nécessaire
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Écrire un fichier factice
    await fs.writeFile(localPath, 'Contenu du fichier téléchargé via SFTP');

    // Obtenir les statistiques du fichier
    const stats = await fs.stat(localPath);

    return {
        path: localPath,
        size: stats.size,
        success: true
    };
}

/**
 * Configuration pour l'intégration Slack
 */
interface SlackMessageConfig {
    webhookUrl: string;
    channel?: string;
    username?: string;
    text: string;
    blocks?: any[];
    attachments?: any[];
}

/**
 * Activité pour envoyer un message Slack (remplace le nœud Slack de n8n)
 */
export async function sendSlackMessage(config: SlackMessageConfig): Promise<{ success: boolean; timestamp: string }> {
    // Préparer les données pour Slack
    const slackData: any = {
        text: config.text,
    };

    if (config.channel) slackData.channel = config.channel;
    if (config.username) slackData.username = config.username;
    if (config.blocks) slackData.blocks = config.blocks;
    if (config.attachments) slackData.attachments = config.attachments;

    try {
        // Envoyer la requête à Slack
        const response = await httpRequest({
            url: config.webhookUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: slackData
        });

        return {
            success: response.status === 200,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Failed to send Slack message: ${error}`);
    }
}

/**
 * UTILISATION
 * 
 * Exemple d'utilisation dans un workflow Temporal:
 * 
 * import { proxyActivities } from '@temporalio/workflow';
 * import type * as activities from './external-integration-activities';
 * 
 * const { httpRequest, sendEmail, downloadFileSftp, sendSlackMessage } = proxyActivities<typeof activities>({
 *   startToCloseTimeout: '1 minute',
 *   retry: { maximumAttempts: 3 }
 * });
 * 
 * export async function externalIntegrationWorkflow(input: any): Promise<any> {
 *   // Appeler une API externe
 *   const apiResult = await httpRequest({
 *     url: 'https://api.example.com/data',
 *     method: 'GET',
 *     headers: { 'Authorization': `Bearer ${input.apiKey}` }
 *   });
 * 
 *   // Envoyer les résultats par email
 *   await sendEmail({
 *     to: input.recipient,
 *     subject: 'Résultats de l\'API',
 *     body: `Voici les résultats : ${JSON.stringify(apiResult.data)}`,
 *   });
 * 
 *   return { status: 'success', data: apiResult.data };
 * }
 */