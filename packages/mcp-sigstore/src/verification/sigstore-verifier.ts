/**
 * Implémentation du vérificateur SIGSTORE pour les signatures d'agents
 */
import * as fs from 'fs';
import * as path from 'path';
import { verify } from '@sigstore/verify';
import { SigstoreConfig, VerificationResult, SignatureInfo } from '../types';
import { hashContent, hashFile } from '../utils/hash';

/**
 * Vérificateur de signatures SIGSTORE pour les résultats d'agents
 */
export class SigstoreVerifier {
    private config: SigstoreConfig;

    /**
     * Initialise un nouveau vérificateur SIGSTORE
     * @param config Configuration pour le vérificateur
     */
    constructor(config: SigstoreConfig) {
        this.config = {
            rekorURL: 'https://rekor.sigstore.dev',
            ...config
        };
    }

    /**
     * Vérifie une signature SIGSTORE pour un résultat d'agent
     * @param agentId Identifiant de l'agent qui a produit le résultat
     * @param runId Identifiant unique de l'exécution
     * @param resultContent Contenu du résultat à vérifier (JSON)
     * @returns Résultat de la vérification
     */
    async verifyResult(
        agentId: string,
        runId: string,
        resultContent: string
    ): Promise<VerificationResult> {
        try {
            // Chemin du fichier de signature
            const signaturePath = path.join(
                this.config.signaturesDir,
                agentId,
                `${runId}.sig`
            );

            // Vérifier que la signature existe
            if (!fs.existsSync(signaturePath)) {
                return {
                    valid: false,
                    error: `Signature non trouvée pour l'agent ${agentId} et l'exécution ${runId}`
                };
            }

            // Fichier temporaire pour le contenu à vérifier
            const tempContentPath = path.join(
                this.config.signaturesDir,
                agentId,
                `${runId}-verify.json`
            );

            // Écrire le contenu dans un fichier temporaire
            fs.writeFileSync(tempContentPath, resultContent, 'utf-8');

            // Charger la signature
            const signatureData = JSON.parse(fs.readFileSync(signaturePath, 'utf-8'));

            try {
                // Vérifier la signature avec SIGSTORE
                await verify(tempContentPath, signatureData);

                // La vérification a réussi
                const resultHash = hashContent(resultContent);
                const timestamp = Date.now();

                // Nettoyer le fichier temporaire
                fs.unlinkSync(tempContentPath);

                return {
                    valid: true,
                    signatureInfo: {
                        signaturePath: path.relative(this.config.signaturesDir, signaturePath),
                        resultHash,
                        timestamp,
                        agentId,
                        runId,
                        rekorLogEntry: signatureData.bundle?.verificationMaterial?.tlogEntries?.[0]?.logIndex?.toString()
                    }
                };
            } catch (verifyError) {
                // La vérification a échoué
                // Nettoyer le fichier temporaire
                if (fs.existsSync(tempContentPath)) {
                    fs.unlinkSync(tempContentPath);
                }

                return {
                    valid: false,
                    error: `Échec de la vérification: ${verifyError.message}`
                };
            }
        } catch (error) {
            console.error(`Erreur lors de la vérification de la signature pour l'agent ${agentId}:`, error);
            return {
                valid: false,
                error: `Erreur lors de la vérification: ${error.message}`
            };
        }
    }

    /**
     * Vérifie une signature pour un fichier existant
     * @param agentId Identifiant de l'agent qui a produit le résultat
     * @param runId Identifiant unique de l'exécution
     * @param filePath Chemin du fichier à vérifier
     * @returns Résultat de la vérification
     */
    async verifyFile(
        agentId: string,
        runId: string,
        filePath: string
    ): Promise<VerificationResult> {
        try {
            // Vérifier que le fichier existe
            if (!fs.existsSync(filePath)) {
                return {
                    valid: false,
                    error: `Le fichier n'existe pas: ${filePath}`
                };
            }

            // Chemin du fichier de signature
            const signaturePath = path.join(
                this.config.signaturesDir,
                agentId,
                `${runId}.sig`
            );

            // Vérifier que la signature existe
            if (!fs.existsSync(signaturePath)) {
                return {
                    valid: false,
                    error: `Signature non trouvée pour l'agent ${agentId} et l'exécution ${runId}`
                };
            }

            // Charger la signature
            const signatureData = JSON.parse(fs.readFileSync(signaturePath, 'utf-8'));

            try {
                // Vérifier la signature avec SIGSTORE
                await verify(filePath, signatureData);

                // La vérification a réussi
                const resultHash = hashFile(filePath);
                const timestamp = Date.now();

                return {
                    valid: true,
                    signatureInfo: {
                        signaturePath: path.relative(this.config.signaturesDir, signaturePath),
                        resultHash,
                        timestamp,
                        agentId,
                        runId,
                        rekorLogEntry: signatureData.bundle?.verificationMaterial?.tlogEntries?.[0]?.logIndex?.toString()
                    }
                };
            } catch (verifyError) {
                // La vérification a échoué
                return {
                    valid: false,
                    error: `Échec de la vérification: ${verifyError.message}`
                };
            }
        } catch (error) {
            console.error(`Erreur lors de la vérification de la signature pour le fichier:`, error);
            return {
                valid: false,
                error: `Erreur lors de la vérification: ${error.message}`
            };
        }
    }

    /**
     * Liste toutes les signatures disponibles pour un agent
     * @param agentId Identifiant de l'agent (optionnel, liste tous les agents si non fourni)
     * @returns Liste des informations de signature
     */
    listSignatures(agentId?: string): SignatureInfo[] {
        const signatures: SignatureInfo[] = [];

        try {
            // Si agentId est fourni, lister seulement pour cet agent
            if (agentId) {
                const agentDir = path.join(this.config.signaturesDir, agentId);
                if (fs.existsSync(agentDir)) {
                    const files = fs.readdirSync(agentDir);
                    files.forEach(file => {
                        if (file.endsWith('.sig')) {
                            try {
                                const sigPath = path.join(agentDir, file);
                                const sigData = JSON.parse(fs.readFileSync(sigPath, 'utf-8'));
                                const runId = file.replace('.sig', '');

                                signatures.push({
                                    signaturePath: path.relative(this.config.signaturesDir, sigPath),
                                    resultHash: sigData.hash || 'unknown',
                                    timestamp: sigData.timestamp || Date.now(),
                                    agentId,
                                    runId,
                                    rekorLogEntry: sigData.bundle?.verificationMaterial?.tlogEntries?.[0]?.logIndex?.toString()
                                });
                            } catch (err) {
                                console.warn(`Erreur lors du chargement de la signature ${file}:`, err);
                            }
                        }
                    });
                }
            } else {
                // Lister pour tous les agents
                if (fs.existsSync(this.config.signaturesDir)) {
                    const agents = fs.readdirSync(this.config.signaturesDir);
                    agents.forEach(agent => {
                        const agentSigs = this.listSignatures(agent);
                        signatures.push(...agentSigs);
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la liste des signatures:', error);
        }

        return signatures;
    }
}