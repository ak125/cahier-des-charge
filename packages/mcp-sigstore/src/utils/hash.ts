/**
 * Utilitaires de hachage pour les signatures SIGSTORE
 */
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Calcule le hash SHA-256 d'une chaîne de caractères
 * @param content La chaîne à hacher
 * @returns Le hash au format hexadécimal
 */
export function hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calcule le hash SHA-256 d'un fichier
 * @param filePath Chemin du fichier à hacher
 * @returns Le hash au format hexadécimal
 */
export function hashFile(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calcule le hash SHA-256 d'un objet (après sérialisation en JSON)
 * @param obj L'objet à hacher
 * @returns Le hash au format hexadécimal
 */
export function hashObject(obj: any): string {
    const content = JSON.stringify(obj);
    return hashContent(content);
}