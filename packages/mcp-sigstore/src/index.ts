/**
 * Module de signature et vérification SIGSTORE pour les résultats d'agents MCP
 */

// Exporter les types
export * from './types';

// Exporter les classes principales
export { SigstoreSigner } from './core/sigstore-signer';
export { SigstoreVerifier } from './verification/sigstore-verifier';

// Exporter les utilitaires
export { hashContent, hashFile, hashObject } from './utils/hash';

// Créer une instance par défaut du signataire et du vérificateur
import { SigstoreSigner } from './core/sigstore-signer';
import { SigstoreVerifier } from './verification/sigstore-verifier';
import * as path from 'path';

// Répertoire par défaut pour les signatures
const DEFAULT_SIGNATURES_DIR = path.join(process.cwd(), 'signatures');

// Exporter des instances par défaut configurées
export const defaultSigner = new SigstoreSigner({ signaturesDir: DEFAULT_SIGNATURES_DIR });
export const defaultVerifier = new SigstoreVerifier({ signaturesDir: DEFAULT_SIGNATURES_DIR });