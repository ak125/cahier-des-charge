/**
 * SafeMigrationValidator
 * 
 * Validateur principal qui intègre tous les niveaux de validation pour s'assurer que
 * le code généré par IA est sécurisé, conforme, et sémantiquement correct.
 */

import { securityScanner } from '../scanners/SecurityScanner';
import { complianceVerifier } from '../verifiers/ComplianceVerifier';
import { semanticValidator } from '../validators/SemanticValidator';
import { SafeValidationOptions, ValidationResult, FileType } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Classe principale pour la validation sécurisée du code généré par IA
 */
export class SafeMigrationValidator {
    /**
     * Valide un fragment de code selon tous les critères (sécurité, conformité, sémantique)
     * 
     * @param code Code source à valider
     * @param options Options de validation
     * @returns true si la validation réussit, false sinon
     */
    async validate(code: string, options: SafeValidationOptions = {}): Promise<boolean> {
        // 1. Scanner de sécurité pour détecter les patterns dangereux
        const securityResult = securityScanner.scan(
            code,
            options.fileType,
            options.path
        );

        // Si le scan de sécurité échoue, inutile de continuer
        if (!securityResult.success) {
            console.error('Échec de la validation de sécurité:',
                securityResult.issues.map(i => `[${i.severity}] ${i.message}`).join('\n'));
            return false;
        }

        // 2. Vérificateur de conformité pour assurer le respect des standards
        const complianceResult = complianceVerifier.check(
            code,
            options.fileType,
            options.path
        );

        // Si la vérification de conformité échoue, inutile de continuer
        if (!complianceResult.success) {
            console.error('Échec de la validation de conformité:',
                complianceResult.issues.map(i => `[${i.severity}] ${i.message}`).join('\n'));
            return false;
        }

        // 3. Validation sémantique pour vérifier la cohérence du code
        const semanticResult = semanticValidator.verify(
            code,
            options.fileType,
            options.path
        );

        // Déterminer le résultat final de la validation
        const isValid = securityResult.success &&
            complianceResult.success &&
            semanticResult.success;

        return isValid;
    }

    /**
     * Valide un fichier selon tous les critères (sécurité, conformité, sémantique)
     * 
     * @param filePath Chemin du fichier à valider
     * @param options Options de validation
     * @returns true si la validation réussit, false sinon
     */
    async validateFile(filePath: string, options: SafeValidationOptions = {}): Promise<boolean> {
        if (!fs.existsSync(filePath)) {
            console.error(`Fichier non trouvé: ${filePath}`);
            return false;
        }

        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const fileType = path.extname(filePath).substring(1) as FileType;

            // Utiliser les options fournies ou le type de fichier détecté
            const validationOptions: SafeValidationOptions = {
                ...options,
                path: filePath,
                fileType: options.fileType || fileType
            };

            return this.validate(content, validationOptions);
        } catch (error) {
            console.error(`Erreur lors de la validation du fichier ${filePath}:`, error);
            return false;
        }
    }

    /**
     * Obtient un résultat détaillé de validation pour un fragment de code
     * 
     * @param code Code source à valider
     * @param options Options de validation
     * @returns Résultat détaillé de la validation
     */
    async getDetailedValidation(code: string, options: SafeValidationOptions = {}): Promise<{
        security: ValidationResult;
        compliance: ValidationResult;
        semantic: ValidationResult;
        success: boolean;
    }> {
        // Exécuter toutes les validations
        const securityResult = securityScanner.scan(code, options.fileType, options.path);
        const complianceResult = complianceVerifier.check(code, options.fileType, options.path);
        const semanticResult = semanticValidator.verify(code, options.fileType, options.path);

        // Déterminer le résultat global
        const isValid = securityResult.success &&
            complianceResult.success &&
            semanticResult.success;

        return {
            security: securityResult,
            compliance: complianceResult,
            semantic: semanticResult,
            success: isValid
        };
    }

    /**
     * Valide un fragment de code et retourne un rapport formaté des problèmes détectés
     * 
     * @param code Code source à valider
     * @param options Options de validation
     * @returns Rapport formaté de validation
     */
    async getValidationReport(code: string, options: SafeValidationOptions = {}): Promise<{
        success: boolean;
        report: string;
        codeHash: string;
        timestamp: string;
    }> {
        const results = await this.getDetailedValidation(code, options);

        // Générer un hash du code pour traçabilité
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        // Collecter tous les problèmes
        const allIssues = [
            ...results.security.issues,
            ...results.compliance.issues,
            ...results.semantic.issues
        ].sort((a, b) => {
            // Trier par gravité (du plus critique au moins critique)
            const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });

        // Construire le rapport
        let report = `# Rapport de validation de code\n\n`;
        report += `* **Timestamp**: ${new Date().toISOString()}\n`;
        report += `* **Hash du code**: ${codeHash}\n`;
        report += `* **Résultat**: ${results.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n\n`;

        report += `## Résumé\n\n`;
        report += `* Validation de sécurité: ${results.security.success ? '✅ Réussite' : '❌ Échec'} (${results.security.issues.length} problèmes)\n`;
        report += `* Validation de conformité: ${results.compliance.success ? '✅ Réussite' : '❌ Échec'} (${results.compliance.issues.length} problèmes)\n`;
        report += `* Validation sémantique: ${results.semantic.success ? '✅ Réussite' : '❌ Échec'} (${results.semantic.issues.length} problèmes)\n\n`;

        if (allIssues.length > 0) {
            report += `## Problèmes détectés\n\n`;

            report += `| Sévérité | Catégorie | Règle | Message |\n`;
            report += `| --- | --- | --- | --- |\n`;

            allIssues.forEach(issue => {
                const severitySymbol = {
                    critical: '🔴',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️'
                }[issue.severity] || '⚠️';

                report += `| ${severitySymbol} ${issue.severity} | ${issue.category} | ${issue.rule} | ${issue.message} |\n`;
            });

            report += `\n`;
        }

        return {
            success: results.success,
            report,
            codeHash,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Méthode statique pour validation rapide de code
     * 
     * @param code Code source à valider
     * @returns true si la validation réussit, false sinon
     */
    static async validate(code: string): Promise<boolean> {
        return securityScanner.scan(code).success &&
            complianceVerifier.check(code).success &&
            semanticValidator.verify(code).success;
    }
}

// Export de l'instance par défaut du validateur
export const safeMigrationValidator = new SafeMigrationValidator();