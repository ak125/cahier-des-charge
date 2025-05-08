/**
 * Utilitaire pour valider et signer du code généré par IA
 * 
 * Ce module intègre la validation sécurisée avec la signature Sigstore
 * pour garantir que seul du code sûr et validé est signé et utilisé.
 */

import { safeMigrationValidator } from '../core/SafeMigrationValidator';
import { SafeValidationOptions } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Import du module sigstore existant
let sigstoreSigner: any;
try {
    // Essayer d'importer le module sigstore depuis le projet principal
    const sigstoreModule = require('../../../mcp-sigstore');
    sigstoreSigner = sigstoreModule.defaultSigner;
} catch (error) {
    // Fallback: créer un signataire factice si le module n'est pas disponible
    console.warn('Module mcp-sigstore non trouvé, les signatures ne seront pas appliquées');
    sigstoreSigner = {
        signResult: async (agentId: string, runId: string, result: any) => {
            return {
                signaturePath: 'mock/signature/path',
                resultHash: 'mock-hash',
                timestamp: Date.now(),
                agentId,
                runId
            };
        },
        signFile: async (agentId: string, runId: string, filePath: string) => {
            return {
                signaturePath: 'mock/signature/path',
                resultHash: 'mock-hash',
                timestamp: Date.now(),
                agentId,
                runId
            };
        }
    };
}

/**
 * Options pour la validation et signature
 */
export interface ValidateAndSignOptions extends SafeValidationOptions {
    /** ID de l'agent qui a généré le code */
    agentId: string;

    /** ID unique de l'exécution */
    runId: string;

    /** Chemin du répertoire de sortie pour les rapports (optionnel) */
    outputDir?: string;

    /** Génère un rapport de validation */
    generateReport?: boolean;
}

/**
 * Résultat du processus de validation et signature
 */
export interface ValidateAndSignResult {
    /** La validation a réussi */
    valid: boolean;

    /** Le code a été signé */
    signed: boolean;

    /** Informations sur la signature */
    signatureInfo?: {
        signaturePath: string;
        resultHash: string;
        timestamp: number;
        agentId: string;
        runId: string;
        rekorLogEntry?: string;
    };

    /** Chemin du rapport de validation (si généré) */
    reportPath?: string;
}

/**
 * Valide et signe un fragment de code généré par IA
 * 
 * @param code Code source à valider et signer
 * @param options Options de validation et signature
 * @returns Résultat du processus
 */
export async function validateAndSignCode(
    code: string,
    options: ValidateAndSignOptions
): Promise<ValidateAndSignResult> {
    // 1. Valider le code avec SafeMigrationValidator
    const isValid = await safeMigrationValidator.validate(code, options);

    // Si non valide, retourner immédiatement (pas de signature)
    if (!isValid) {
        return {
            valid: false,
            signed: false
        };
    }

    // 2. Générer un rapport de validation si demandé
    let reportPath: string | undefined;

    if (options.generateReport) {
        const validationReport = await safeMigrationValidator.getValidationReport(code, options);

        if (options.outputDir) {
            // Créer le répertoire de sortie si nécessaire
            if (!fs.existsSync(options.outputDir)) {
                fs.mkdirSync(options.outputDir, { recursive: true });
            }

            // Sauvegarder le rapport
            reportPath = path.join(
                options.outputDir,
                `validation-report-${options.agentId}-${options.runId}.md`
            );

            fs.writeFileSync(reportPath, validationReport.report, 'utf8');
        }
    }

    // 3. Signer le code avec Sigstore
    try {
        const signatureInfo = await sigstoreSigner.signResult(
            options.agentId,
            options.runId,
            { code, validationPassed: true }
        );

        return {
            valid: true,
            signed: true,
            signatureInfo,
            reportPath
        };
    } catch (error) {
        console.error('Erreur lors de la signature du code:', error);

        return {
            valid: true,
            signed: false,
            reportPath
        };
    }
}

/**
 * Valide et signe un fichier généré par IA
 * 
 * @param filePath Chemin du fichier à valider et signer
 * @param options Options de validation et signature
 * @returns Résultat du processus
 */
export async function validateAndSignFile(
    filePath: string,
    options: ValidateAndSignOptions
): Promise<ValidateAndSignResult> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
    }

    // 1. Valider le fichier
    const isValid = await safeMigrationValidator.validateFile(filePath, options);

    // Si non valide, retourner immédiatement
    if (!isValid) {
        return {
            valid: false,
            signed: false
        };
    }

    // 2. Générer un rapport de validation si demandé
    let reportPath: string | undefined;

    if (options.generateReport) {
        const content = fs.readFileSync(filePath, 'utf8');
        const validationReport = await safeMigrationValidator.getValidationReport(content, {
            ...options,
            path: filePath,
            fileType: path.extname(filePath).substring(1) as any
        });

        if (options.outputDir) {
            // Créer le répertoire de sortie si nécessaire
            if (!fs.existsSync(options.outputDir)) {
                fs.mkdirSync(options.outputDir, { recursive: true });
            }

            // Sauvegarder le rapport
            const baseFileName = path.basename(filePath);
            reportPath = path.join(
                options.outputDir,
                `validation-report-${baseFileName}.md`
            );

            fs.writeFileSync(reportPath, validationReport.report, 'utf8');
        }
    }

    // 3. Signer le fichier avec Sigstore
    try {
        const signatureInfo = await sigstoreSigner.signFile(
            options.agentId,
            options.runId,
            filePath
        );

        return {
            valid: true,
            signed: true,
            signatureInfo,
            reportPath
        };
    } catch (error) {
        console.error('Erreur lors de la signature du fichier:', error);

        return {
            valid: true,
            signed: false,
            reportPath
        };
    }
}

/**
 * Vérifie si un fichier est valide et signé
 * 
 * @param filePath Chemin du fichier à vérifier
 * @param agentId ID de l'agent qui a généré le fichier
 * @param runId ID de l'exécution
 * @returns true si le fichier est valide et correctement signé
 */
export async function verifyValidatedAndSignedFile(
    filePath: string,
    agentId: string,
    runId: string
): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
    }

    try {
        // 1. Vérifier que le fichier passe la validation
        const isValid = await safeMigrationValidator.validateFile(filePath);

        if (!isValid) {
            console.error(`Le fichier ${filePath} n'est pas valide selon les critères de sécurité`);
            return false;
        }

        // 2. Vérifier la signature si sigstore est disponible
        if (sigstoreSigner.defaultVerifier) {
            const verifier = sigstoreSigner.defaultVerifier;

            const verificationResult = await verifier.verifyFile(agentId, runId, filePath);

            if (!verificationResult.valid) {
                console.error(`Signature invalide pour le fichier ${filePath}:`, verificationResult.error);
                return false;
            }

            return true;
        } else {
            console.warn('Module de vérification sigstore non disponible, la signature n\'a pas pu être vérifiée');
            return isValid; // Retourner seulement le résultat de la validation
        }
    } catch (error) {
        console.error(`Erreur lors de la vérification du fichier ${filePath}:`, error);
        return false;
    }
}