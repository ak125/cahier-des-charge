import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import { MigrationPlanResult, MigrationPlanSummary } from '../../workflows/migration-plans/generate-migration-plans.workflow';

// Types pour les paramètres d'activités
export interface FileInfo {
    path: string;
    fileName: string;
    extension: string;
}

export interface FindPhpFilesOptions {
    directory: string;
    includePatterns: string[];
    excludePatterns: string[];
}

export interface GeneratePlanOptions {
    filePath: string;
    fileName: string;
    scriptsPath: string;
    outputDir: string;
}

export interface ProcessResultOptions {
    fileName: string;
    outputPath: string;
    output: string;
    timestamp: string;
}

export interface StoreSupabaseOptions {
    results: MigrationPlanResult[];
}

export interface UploadS3Options {
    outputDir: string;
    bucketName: string;
}

export interface EmailNotificationOptions {
    summary: MigrationPlanSummary;
    toEmail: string;
}

// Configuration pour les services externes
const getConfig = () => {
    // Dans un environnement de production, ces valeurs seraient chargées à partir de variables d'environnement
    return {
        supabase: {
            url: process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co',
            key: process.env.SUPABASE_KEY || 'your-supabase-key',
        },
        s3: {
            region: process.env.AWS_REGION || 'eu-west-3',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'your-aws-access-key',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'your-aws-secret-key',
        },
        email: {
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER || 'migration-bot@fafa.com',
            pass: process.env.SMTP_PASS || 'your-smtp-password',
        },
    };
};

/**
 * Recherche les fichiers PHP dans un répertoire selon les patterns spécifiés
 * Remplace le nœud "Find PHP Files" de n8n
 */
export async function findPhpFiles(options: FindPhpFilesOptions): Promise<FileInfo[]> {
    console.log(`[findPhpFiles] Recherche de fichiers PHP dans ${options.directory}`);

    try {
        const files: FileInfo[] = [];

        // Parcourir tous les patterns d'inclusion
        for (const pattern of options.includePatterns) {
            const includePattern = path.join(options.directory, pattern);
            const matchedFiles = await glob(includePattern, {
                ignore: options.excludePatterns.map(p => path.join(options.directory, p)),
                nodir: true,
            });

            // Formater chaque fichier trouvé
            for (const filePath of matchedFiles) {
                const parsed = path.parse(filePath);
                files.push({
                    path: filePath,
                    fileName: parsed.base,
                    extension: parsed.ext.replace('.', ''),
                });
            }
        }

        console.log(`[findPhpFiles] ${files.length} fichiers PHP trouvés`);
        return files;
    } catch (error) {
        console.error('[findPhpFiles] Erreur lors de la recherche de fichiers PHP', error);
        throw error;
    }
}

/**
 * Génère un plan de migration pour un fichier PHP
 * Remplace les nœuds "Prepare Migration Commands" et "Execute Generate Commands" de n8n
 */
export async function generateMigrationPlan(options: GeneratePlanOptions): Promise<{
    outputPath: string;
    output: string;
    timestamp: string;
}> {
    console.log(`[generateMigrationPlan] Génération du plan de migration pour ${options.filePath}`);

    try {
        // S'assurer que le répertoire de sortie existe
        await fs.mkdir(options.outputDir, { recursive: true });

        // Construire le chemin de sortie pour le plan de migration
        const outputPath = path.join(
            options.outputDir,
            options.fileName.replace('.php', '.migration_plan.md')
        );

        // Construire et exécuter la commande
        const command = `cd ${options.scriptsPath} && ts-node generate-migration-plan.ts "${options.filePath}" --export-all`;
        console.log(`[generateMigrationPlan] Exécution de la commande: ${command}`);

        // Exécuter la commande et capturer la sortie
        const output = execSync(command, { encoding: 'utf-8' });

        // Écrire le résultat dans un fichier
        await fs.writeFile(outputPath, output, 'utf-8');

        return {
            outputPath,
            output,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`[generateMigrationPlan] Erreur lors de la génération du plan pour ${options.filePath}`, error);
        throw error;
    }
}

/**
 * Traite le résultat de la génération du plan de migration pour extraire les métriques
 * Remplace le nœud "Process Results" de n8n
 */
export async function processMigrationResult(options: ProcessResultOptions): Promise<MigrationPlanResult> {
    console.log(`[processMigrationResult] Traitement du résultat pour ${options.fileName}`);

    try {
        const output = options.output;

        // Rechercher les informations clés dans la sortie (similaire au code n8n)
        const waveMatch = output.match(/Vague (\d+)/);
        const scoreMatch = output.match(/Score global migration : ([🌟]+)/);
        const typeMatch = output.match(/Type : ([^\n]+)/);

        const wave = waveMatch ? parseInt(waveMatch[1]) : 0;
        const score = scoreMatch ? scoreMatch[1].length : 0;
        const type = typeMatch ? typeMatch[1].trim() : 'Inconnu';

        // Priorité basée sur le score
        let priority = 'Basse';
        if (score >= 5) priority = 'Critique';
        else if (score >= 4) priority = 'Élevée';
        else if (score >= 3) priority = 'Moyenne';

        return {
            fileName: options.fileName,
            wave,
            score,
            type,
            priority,
            success: true,
            timestamp: options.timestamp,
            outputPath: options.outputPath,
        };
    } catch (error) {
        console.error(`[processMigrationResult] Erreur lors du traitement du résultat pour ${options.fileName}`, error);

        // En cas d'erreur, retourner un résultat d'échec
        return {
            fileName: options.fileName,
            wave: 0,
            score: 0,
            type: 'Erreur',
            priority: 'Inconnue',
            success: false,
            timestamp: options.timestamp,
            outputPath: options.outputPath,
        };
    }
}

/**
 * Stocke les résultats des plans de migration dans Supabase
 * Remplace le nœud "Store in Supabase" de n8n
 */
export async function storeResultsInSupabase(options: StoreSupabaseOptions): Promise<void> {
    console.log(`[storeResultsInSupabase] Stockage de ${options.results.length} résultats dans Supabase`);

    try {
        const config = getConfig();
        const supabase = createClient(config.supabase.url, config.supabase.key);

        // Insérer chaque résultat dans la table migration_plans
        for (const result of options.results) {
            const { error } = await supabase
                .from('migration_plans')
                .insert({
                    fileName: result.fileName,
                    wave: result.wave,
                    score: result.score,
                    type: result.type,
                    priority: result.priority,
                    success: result.success,
                    timestamp: result.timestamp,
                    outputPath: result.outputPath,
                });

            if (error) {
                console.error(`[storeResultsInSupabase] Erreur lors du stockage de ${result.fileName}:`, error);
            }
        }

        console.log('[storeResultsInSupabase] Stockage terminé avec succès');
    } catch (error) {
        console.error('[storeResultsInSupabase] Erreur lors du stockage des résultats dans Supabase', error);
        throw error;
    }
}

/**
 * Upload les plans de migration générés vers S3
 * Remplace le nœud "Upload to S3" de n8n
 */
export async function uploadResultsToS3(options: UploadS3Options): Promise<void> {
    console.log(`[uploadResultsToS3] Upload du répertoire ${options.outputDir} vers S3 (bucket: ${options.bucketName})`);

    try {
        const config = getConfig();
        const s3Client = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.accessKeyId,
                secretAccessKey: config.s3.secretAccessKey,
            },
        });

        // Lire tous les fichiers du répertoire
        const files = await fs.readdir(options.outputDir);

        // Upload chaque fichier vers S3
        for (const file of files) {
            const filePath = path.join(options.outputDir, file);
            const fileContent = await fs.readFile(filePath);

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: options.bucketName,
                    Key: file,
                    Body: fileContent,
                    ContentType: file.endsWith('.md') ? 'text/markdown' : 'text/plain',
                    ACL: 'public-read',
                },
            });

            await upload.done();
            console.log(`[uploadResultsToS3] Fichier ${file} uploadé vers S3`);
        }

        console.log('[uploadResultsToS3] Tous les fichiers ont été uploadés vers S3');
    } catch (error) {
        console.error('[uploadResultsToS3] Erreur lors de l\'upload vers S3', error);
        throw error;
    }
}

/**
 * Envoie un email de notification avec le résumé de la génération des plans de migration
 * Remplace le nœud "Send Email" de n8n
 */
export async function sendNotificationEmail(options: EmailNotificationOptions): Promise<void> {
    console.log(`[sendNotificationEmail] Envoi d'un email de notification à ${options.toEmail}`);

    try {
        const config = getConfig();

        // Créer un transporteur SMTP
        const transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.port === 465,
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });

        // Construire le corps de l'email
        const emailText = `La génération des plans de migration est terminée.

- Nombre total de fichiers traités: ${options.summary.totalFiles}
- Succès: ${options.summary.successCount}
- Échecs: ${options.summary.errorCount}

Les plans de migration sont disponibles ici: ${options.summary.outputDir}

Merci,
Votre bot de migration PHP → NestJS/Remix`;

        // Envoyer l'email
        await transporter.sendMail({
            from: config.email.user,
            to: options.toEmail,
            subject: 'Rapport de génération des plans de migration',
            text: emailText,
        });

        console.log('[sendNotificationEmail] Email de notification envoyé avec succès');
    } catch (error) {
        console.error('[sendNotificationEmail] Erreur lors de l\'envoi de l\'email de notification', error);
        throw error;
    }
}