/**
 * Types pour le module de signature SIGSTORE
 */

/**
 * Configuration pour le signataire SIGSTORE
 */
export interface SigstoreConfig {
    /** 
     * Le chemin où stocker les signatures 
     */
    signaturesDir: string;

    /**
     * Identifiant de l'autorité de signature
     */
    identityEmail?: string;

    /**
     * URL de l'API Rekor (registre public d'attestation)
     */
    rekorURL?: string;

    /**
     * URL de l'API Fulcio (autorité de certification)
     */
    fulcioURL?: string;
}

/**
 * Informations sur une signature
 */
export interface SignatureInfo {
    /**
     * Chemin relatif du fichier de signature
     */
    signaturePath: string;

    /**
     * Hash SHA-256 du résultat original
     */
    resultHash: string;

    /**
     * Timestamp de la signature
     */
    timestamp: number;

    /**
     * Identifiant de l'agent qui a produit le résultat
     */
    agentId: string;

    /**
     * Identifiant de l'exécution
     */
    runId: string;

    /**
     * Entrée SIGSTORE dans Rekor (si disponible)
     */
    rekorLogEntry?: string;
}

/**
 * Résultat d'une opération de vérification
 */
export interface VerificationResult {
    /**
     * Si la vérification a réussi
     */
    valid: boolean;

    /**
     * Informations sur la signature
     */
    signatureInfo?: SignatureInfo;

    /**
     * Message d'erreur en cas d'échec
     */
    error?: string;
}