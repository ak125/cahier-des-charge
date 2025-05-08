/**
 * Scanner de sécurité pour le code généré par IA
 * 
 * Ce module détecte les patterns dangereux, les injections potentielles,
 * les appels à des fonctions interdites, et d'autres problèmes de sécurité
 * dans le code généré.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeIssue, SecurityScanOptions, SeverityLevel, ValidationResult, FileType } from '../types';

/**
 * Classe principale pour le scan de sécurité du code
 */
export class SecurityScanner {
    private securityRules: Map<string, RegExp>;
    private securityRulesSeverity: Map<string, SeverityLevel>;
    private securityRulesExplanation: Map<string, string>;
    private options: SecurityScanOptions;

    /**
     * Crée une nouvelle instance du scanner de sécurité
     * @param options Options de configuration pour le scanner
     */
    constructor(options: SecurityScanOptions = {}) {
        this.options = options;
        this.securityRules = new Map();
        this.securityRulesSeverity = new Map();
        this.securityRulesExplanation = new Map();

        this.initializeDefaultRules();

        // Ajouter des règles personnalisées si elles sont fournies
        if (options.customRules) {
            options.customRules.forEach((rule, index) => {
                const ruleId = `custom-rule-${index}`;
                this.securityRules.set(ruleId, typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'im') : rule.pattern);
                this.securityRulesSeverity.set(ruleId, rule.severity);
                this.securityRulesExplanation.set(ruleId, rule.message);
            });
        }
    }

    /**
     * Initialise les règles de sécurité par défaut
     */
    private initializeDefaultRules(): void {
        // Règles interdisant les exécutions de code arbitraire
        this.addRule('no-eval', /eval\s*\(/, SeverityLevel.CRITICAL,
            "L'utilisation de eval() permet l'exécution de code arbitraire et est une grave faille de sécurité");

        this.addRule('no-function-constructor', /new\s+Function\s*\(/, SeverityLevel.CRITICAL,
            "L'utilisation du constructeur Function() permet l'exécution de code arbitraire et est une faille de sécurité");

        this.addRule('no-setTimeout-string', /setTimeout\s*\(\s*['"`]/, SeverityLevel.ERROR,
            "setTimeout() avec une chaîne de caractères permet l'exécution de code arbitraire");

        // Règles interdisant l'accès au système de fichiers ou au système d'exploitation
        this.addRule('no-fs-module', /require\s*\(\s*['"`]fs['"`]\s*\)/, SeverityLevel.ERROR,
            "L'importation directe du module fs permet l'accès au système de fichiers");

        this.addRule('no-child-process', /require\s*\(\s*['"`]child_process['"`]\s*\)/, SeverityLevel.CRITICAL,
            "L'utilisation de child_process permet l'exécution de commandes sur le système hôte");

        this.addRule('no-process-env', /process\.env/, SeverityLevel.WARNING,
            "L'accès direct à process.env peut exposer des variables d'environnement sensibles");

        // Règles pour éviter les injections SQL
        this.addRule('no-sql-injection', /`.*\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)/i, SeverityLevel.CRITICAL,
            "Possible injection SQL détectée via template strings");

        // Règles pour éviter les injections NoSQL
        this.addRule('no-nosql-injection', /\$where\s*:\s*(?:['"`]function|\{)/, SeverityLevel.CRITICAL,
            "Possible injection NoSQL détectée via une fonction $where");

        // Règles pour éviter les vulnérabilités XSS
        this.addRule('no-dangerouslySetInnerHTML', /dangerouslySetInnerHTML/, SeverityLevel.WARNING,
            "dangerouslySetInnerHTML peut permettre des attaques XSS si le contenu n'est pas correctement assaini");

        this.addRule('no-document-write', /document\.write\s*\(/, SeverityLevel.ERROR,
            "document.write() peut permettre des attaques XSS");

        // Règles pour éviter l'utilisation de jwt non sécurisé
        this.addRule('no-unsafe-jwt-verify', /jwt\.verify.*{algorithms:\s*\[.*none.*\]/, SeverityLevel.CRITICAL,
            "Vérification JWT avec l'algorithme 'none' qui contourne la sécurité");

        // Règles pour détecter les backdoors potentielles
        this.addRule('no-socket-binding', /\.listen\s*\(\s*(?!8080|3000|4000|5000)\d{1,5}\s*[,)]/, SeverityLevel.WARNING,
            "Binding de socket sur un port non standard, vérifier si intentionnel");

        this.addRule('no-hidden-network-requests', /(?:fetch|axios|http\.request|https\.request)\s*\(\s*['"`]/, SeverityLevel.WARNING,
            "Requête réseau qui pourrait envoyer des données vers un serveur externe");

        // Règles pour détecter les vulnérabilités de sécurité dans le code TypeScript/NestJS
        this.addRule('no-public-decorator-on-props', /@Public\s*\(\s*\)/, SeverityLevel.WARNING,
            "Le décorateur @Public() contourne la protection d'authentification globale");

        this.addRule('no-disable-csrf', /csrf\s*:\s*false/, SeverityLevel.ERROR,
            "Protection CSRF désactivée, ce qui expose l'application aux attaques CSRF");
    }

    /**
     * Ajoute une règle de sécurité au scanner
     */
    private addRule(id: string, pattern: RegExp, severity: SeverityLevel, explanation: string): void {
        this.securityRules.set(id, pattern);
        this.securityRulesSeverity.set(id, severity);
        this.securityRulesExplanation.set(id, explanation);
    }

    /**
     * Détermine le type de fichier à partir de son extension
     */
    private getFileType(filePath: string): FileType {
        const ext = path.extname(filePath).toLowerCase().substring(1);

        switch (ext) {
            case 'ts': return 'ts';
            case 'js': return 'js';
            case 'json': return 'json';
            case 'prisma': return 'prisma';
            case 'wasm': return 'wasm';
            case 'graphql': case 'gql': return 'graphql';
            case 'yaml': case 'yml': return 'yaml';
            default: return 'unknown';
        }
    }

    /**
     * Analyse un morceau de code pour détecter les problèmes de sécurité
     * @param code Code source à analyser
     * @param fileType Type du fichier (ts, js, etc.)
     * @returns Liste des problèmes trouvés
     */
    private analyzeCode(code: string, fileType: FileType): CodeIssue[] {
        const issues: CodeIssue[] = [];
        const minSeverity = this.options.minSeverity || SeverityLevel.WARNING;

        // Vérifier chaque règle de sécurité
        this.securityRules.forEach((pattern, ruleId) => {
            // Ignorer les règles désactivées
            if (this.options.rules?.disableRules?.includes(ruleId)) {
                return;
            }

            // Vérifier si une liste de règles activées est spécifiée, et si cette règle en fait partie
            if (this.options.rules?.enabledRules && !this.options.rules.enabledRules.includes(ruleId)) {
                return;
            }

            const severity = this.securityRulesSeverity.get(ruleId) || SeverityLevel.WARNING;

            // Ignorer les règles dont la sévérité est inférieure au minimum requis
            if (this.getSeverityValue(severity) < this.getSeverityValue(minSeverity)) {
                return;
            }

            const matches = Array.from(code.matchAll(pattern));

            for (const match of matches) {
                // Calculer la position dans le code
                const position = this.getPositionFromIndex(code, match.index || 0);

                issues.push({
                    severity,
                    message: this.securityRulesExplanation.get(ruleId) || `Violation de la règle de sécurité: ${ruleId}`,
                    rule: ruleId,
                    category: 'security',
                    position,
                    code: match[0],
                    suggestions: this.getSuggestions(ruleId)
                });
            }
        });

        return issues;
    }

    /**
     * Calcule la position (ligne, colonne) à partir d'un index dans la chaîne
     */
    private getPositionFromIndex(code: string, index: number): { line: number, column: number } {
        if (index < 0 || index >= code.length) {
            return { line: -1, column: -1 };
        }

        const lines = code.substring(0, index).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        return { line, column };
    }

    /**
     * Fournit des suggestions pour résoudre un problème de sécurité
     */
    private getSuggestions(ruleId: string): string[] {
        switch (ruleId) {
            case 'no-eval':
                return [
                    "Utilisez JSON.parse() pour les chaînes JSON",
                    "Utilisez des fonctions dédiées au lieu d'évaluer du code dynamique",
                    "Recherchez des alternatives plus sûres comme Function.prototype.bind()"
                ];
            case 'no-function-constructor':
                return [
                    "Déclarez des fonctions explicitement",
                    "Utilisez des fonctions fléchées ou des expressions de fonction"
                ];
            case 'no-setTimeout-string':
                return [
                    "Utilisez une fonction au lieu d'une chaîne de caractères: setTimeout(() => { ... }, delay)"
                ];
            case 'no-fs-module':
                return [
                    "Utilisez des méthodes d'accès aux fichiers spécifiques à l'application",
                    "Utilisez un service d'abstraction pour l'accès aux fichiers"
                ];
            case 'no-child-process':
                return [
                    "Évitez d'exécuter des commandes système",
                    "Utilisez des bibliothèques dédiées pour l'opération souhaitée"
                ];
            case 'no-sql-injection':
                return [
                    "Utilisez des requêtes paramétrées",
                    "Utilisez un ORM comme Prisma ou TypeORM",
                    "Validez et échappez les entrées utilisateur"
                ];
            default:
                return [];
        }
    }

    /**
     * Convertit un niveau de sévérité en valeur numérique pour comparaison
     */
    private getSeverityValue(severity: SeverityLevel): number {
        switch (severity) {
            case SeverityLevel.INFO: return 1;
            case SeverityLevel.WARNING: return 2;
            case SeverityLevel.ERROR: return 3;
            case SeverityLevel.CRITICAL: return 4;
            default: return 0;
        }
    }

    /**
     * Scanne un fichier pour détecter les problèmes de sécurité
     * @param filePath Chemin du fichier à analyser
     * @returns Résultat de la validation
     */
    async scanFile(filePath: string): Promise<ValidationResult> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const fileType = this.getFileType(filePath);

            return this.scan(content, fileType, filePath);
        } catch (error) {
            return {
                success: false,
                issues: [{
                    severity: SeverityLevel.ERROR,
                    message: `Erreur lors de la lecture du fichier: ${(error as Error).message}`,
                    category: 'general',
                    rule: 'file-access-error'
                }],
                fileType: 'unknown',
                filePath
            };
        }
    }

    /**
     * Scanne un fragment de code pour détecter les problèmes de sécurité
     * @param code Code source à analyser
     * @param fileType Type du fichier (optionnel)
     * @param filePath Chemin du fichier (optionnel)
     * @returns Résultat de la validation
     */
    scan(code: string, fileType: FileType = 'ts', filePath?: string): ValidationResult {
        const issues = this.analyzeCode(code, fileType);

        // La validation échoue s'il y a des problèmes critiques ou des erreurs
        const hasCriticalIssues = issues.some(issue =>
            issue.severity === SeverityLevel.CRITICAL || issue.severity === SeverityLevel.ERROR);

        return {
            success: !hasCriticalIssues,
            issues,
            fileType,
            filePath,
            metadata: {
                scannedAt: new Date().toISOString(),
                rulesApplied: [...this.securityRules.keys()]
            }
        };
    }
}

// Export de l'instance par défaut du scanner
export const securityScanner = new SecurityScanner();