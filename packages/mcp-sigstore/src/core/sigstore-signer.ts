/**
 * Implémentation du signataire SIGSTORE pour les résultats d'agents
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SigstoreConfig, SignatureInfo } from '../types';
import { sign } from '@sigstore/sign';
import { hashContent } from '../utils/hash';

/**
 * Signataire pour les résultats d'agents utilisant SIGSTORE
 */
export class SigstoreSigner {
    private config: SigstoreConfig;

    /**
     * Initialise un nouveau signataire SIGSTORE
     * @param config Configuration pour le signataire
     */
    constructor(config: SigstoreConfig) {
        this.config = {
            rekorURL: 'https://rekor.sigstore.dev',
            fulcioURL: 'https://fulcio.sigstore.dev',
            ...config
        };

        // S'assurer que le répertoire des signatures existe
        if (!fs.existsSync(this.config.signaturesDir)) {
            fs.mkdirSync(this.config.signaturesDir, { recursive: true });
        }
    }

    /**
     * Signe un résultat d'agent et stocke la signature
     * @param agentId Identifiant de l'agent qui a produit le résultat
     * @param runId Identifiant unique de l'exécution
     * @param result Le résultat à signer (sera sérialisé en JSON)
     * @returns Informations sur la signature
     */
    async signResult(
        agentId: string,
        runId: string,
        result: unknown
    ): Promise<SignatureInfo> {
        try {
            // Sérialiser le résultat en JSON
            const resultJson = JSON.stringify(result);

            // Générer un hash SHA-256 du résultat
            const resultHash = hashContent(resultJson);

            // Créer le répertoire pour les signatures de cet agent si nécessaire
            const agentDir = path.join(this.config.signaturesDir, agentId);
            if (!fs.existsSync(agentDir)) {
                fs.mkdirSync(agentDir, { recursive: true });
            }

            // Chemin du fichier de signature
            const signaturePath = path.join(agentDir, `${runId}.sig`);

            // Fichier temporaire pour le contenu à signer
            const tempContentPath = path.join(agentDir, `${runId}.json`);
            fs.writeFileSync(tempContentPath, resultJson, 'utf-8');

            // Signer le contenu avec SIGSTORE
            const signOptions = {
                rekorURL: this.config.rekorURL,
                fulcioURL: this.config.fulcioURL,
                identityToken: this.config.identityEmail
                    ? { email: this.config.identityEmail }
                    : undefined
            };

            // Appeler l'API sigstore pour signer le contenu
            const signature = await sign(tempContentPath, signOptions);

            // Sauvegarder la signature
            fs.writeFileSync(signaturePath, JSON.stringify(signature, null, 2), 'utf-8');

            // Nettoyer le fichier temporaire
            fs.unlinkSync(tempContentPath);

            // Renvoyer les informations de signature
            const timestamp = Date.now();
            return {
                signaturePath: path.relative(this.config.signaturesDir, signaturePath),
                resultHash,
                timestamp,
                agentId,
                runId,
                rekorLogEntry: signature.bundle?.verificationMaterial?.tlogEntries?.[0]?.logIndex?.toString()
            };
        } catch (error) {
            console.error(`Erreur lors de la signature du résultat pour l'agent ${agentId}:`, error);
            throw new Error(`Échec de la signature: ${error.message}`);
        }
    }

    /**
     * Signe un fichier existant contenant un résultat d'agent
     * @param agentId Identifiant de l'agent qui a produit le résultat
     * @param runId Identifiant unique de l'exécution
     * @param filePath Chemin du fichier à signer
     * @returns Informations sur la signature
     */
    async signFile(
        agentId: string,
        runId: string,
        filePath: string
    ): Promise<SignatureInfo> {
        try {
            // Vérifier que le fichier existe
            if (!fs.existsSync(filePath)) {
                throw new Error(`Le fichier n'existe pas: ${filePath}`);
            }

            // Lire le contenu du fichier
            const content = fs.readFileSync(filePath, 'utf-8');

            // Générer un hash SHA-256 du contenu
            const resultHash = hashContent(content);

            // Créer le répertoire pour les signatures de cet agent si nécessaire
            const agentDir = path.join(this.config.signaturesDir, agentId);
            if (!fs.existsSync(agentDir)) {
                fs.mkdirSync(agentDir, { recursive: true });
            }

            // Chemin du fichier de signature
            const signaturePath = path.join(agentDir, `${runId}.sig`);

            // Signer le fichier avec SIGSTORE
            const signOptions = {
                rekorURL: this.config.rekorURL,
                fulcioURL: this.config.fulcioURL,
                identityToken: this.config.identityEmail
                    ? { email: this.config.identityEmail }
                    : undefined
            };

            // Appeler l'API sigstore pour signer le fichier
            const signature = await sign(filePath, signOptions);

            // Sauvegarder la signature
            fs.writeFileSync(signaturePath, JSON.stringify(signature, null, 2), 'utf-8');

            // Renvoyer les informations de signature
            const timestamp = Date.now();
            return {
                signaturePath: path.relative(this.config.signaturesDir, signaturePath),
                resultHash,
                timestamp,
                agentId,
                runId,
                rekorLogEntry: signature.bundle?.verificationMaterial?.tlogEntries?.[0]?.logIndex?.toString()
            };
        } catch (error) {
            console.error(`Erreur lors de la signature du fichier pour l'agent ${agentId}:`, error);
            throw new Error(`Échec de la signature: ${error.message}`);
        }
    }
}