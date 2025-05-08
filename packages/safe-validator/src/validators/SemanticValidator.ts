/**
 * Validateur sémantique pour le code généré par IA
 * 
 * Ce module vérifie la sémantique du code, y compris la vérification 
 * des types TypeScript, la validation des schémas Zod, et l'analyse
 * de la cohérence du code généré.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeIssue, SemanticValidationOptions, SeverityLevel, ValidationResult, FileType } from '../types';
import * as ts from 'ts-morph';

/**
 * Classe principale pour la validation sémantique du code
 */
export class SemanticValidator {
    private project: ts.Project;
    private options: SemanticValidationOptions;

    /**
     * Crée une nouvelle instance du validateur sémantique
     * @param options Options de configuration pour le validateur
     */
    constructor(options: SemanticValidationOptions = {}) {
        this.options = {
            typeCheck: true,
            validateZodSchemas: true,
            validateDTOs: {
                requireValidation: true,
                requireTypes: true
            },
            ...options
        };

        // Initialiser le projet TypeScript
        this.project = new ts.Project({
            compilerOptions: {
                target: ts.ScriptTarget.ES2020,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                esModuleInterop: true,
                strict: true,
                noImplicitAny: true,
                strictNullChecks: true,
                strictFunctionTypes: true,
                skipLibCheck: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: true
            }
        });
    }

    /**
     * Exécute une vérification sémantique complète sur un fichier source
     * @param filePath Chemin du fichier à vérifier
     * @returns Résultat de la validation
     */
    async verifyFile(filePath: string): Promise<ValidationResult> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const fileType = path.extname(filePath).substring(1) as FileType;

            return this.verify(content, fileType, filePath);
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
     * Vérifie la sémantique d'un fragment de code source
     * @param code Code source à vérifier
     * @param fileType Type du fichier (optionnel)
     * @param filePath Chemin du fichier (optionnel)
     * @returns Résultat de la validation
     */
    verify(code: string, fileType: FileType = 'ts', filePath?: string): ValidationResult {
        // Seuls les fichiers TypeScript peuvent être validés sémantiquement
        if (fileType !== 'ts' && fileType !== 'js') {
            return {
                success: true,
                issues: [],
                fileType,
                filePath,
                metadata: {
                    verifiedAt: new Date().toISOString(),
                    message: `Le type de fichier ${fileType} ne prend pas en charge la validation sémantique`
                }
            };
        }

        const issues: CodeIssue[] = [];

        const tempFilePath = filePath || `temp-${Date.now()}.${fileType}`;
        const sourceFile = this.project.createSourceFile(tempFilePath, code, { overwrite: true });

        // Collecter les problèmes sémantiques
        this.collectTypeCheckIssues(sourceFile, issues);
        this.collectZodValidationIssues(sourceFile, issues);
        this.collectDTOValidationIssues(sourceFile, issues);
        this.collectUnusedImportsIssues(sourceFile, issues);
        this.collectMissingErrorHandlingIssues(sourceFile, issues);

        // La validation réussit s'il n'y a pas de problèmes de niveau ERROR ou CRITICAL
        const hasCriticalIssues = issues.some(issue =>
            issue.severity === SeverityLevel.ERROR || issue.severity === SeverityLevel.CRITICAL);

        // Nettoyer si c'est un fichier temporaire
        if (!filePath) {
            sourceFile.forget();
        }

        return {
            success: !hasCriticalIssues,
            issues,
            fileType,
            filePath,
            metadata: {
                verifiedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Collecte les problèmes de vérification de type TypeScript
     */
    private collectTypeCheckIssues(sourceFile: ts.SourceFile, issues: CodeIssue[]): void {
        if (!this.options.typeCheck) {
            return;
        }

        const diagnostics = sourceFile.getPreEmitDiagnostics();

        for (const diagnostic of diagnostics) {
            const message = diagnostic.getMessageText();
            const messageText = typeof message === 'string' ? message : message.getMessageText();
            const category = diagnostic.getCategory();

            let severity: SeverityLevel;
            switch (category) {
                case ts.DiagnosticCategory.Error:
                    severity = SeverityLevel.ERROR;
                    break;
                case ts.DiagnosticCategory.Warning:
                    severity = SeverityLevel.WARNING;
                    break;
                case ts.DiagnosticCategory.Suggestion:
                case ts.DiagnosticCategory.Message:
                default:
                    severity = SeverityLevel.INFO;
                    break;
            }

            const start = diagnostic.getStart();
            const position = start !== undefined ? sourceFile.getLineAndColumnAtPos(start) : undefined;

            issues.push({
                severity,
                message: messageText,
                category: 'semantic',
                rule: 'typescript-type-check',
                position: position ? {
                    line: position.line,
                    column: position.column
                } : undefined,
                code: diagnostic.getCode().toString()
            });
        }
    }

    /**
     * Collecte les problèmes dans les schémas de validation Zod
     */
    private collectZodValidationIssues(sourceFile: ts.SourceFile, issues: CodeIssue[]): void {
        if (!this.options.validateZodSchemas) {
            return;
        }

        // Chercher les importations de zod
        const hasZodImport = sourceFile.getImportDeclarations()
            .some(importDecl => importDecl.getModuleSpecifierValue() === 'zod');

        if (!hasZodImport) {
            return;
        }

        // Rechercher les déclarations de schémas Zod
        sourceFile.forEachDescendant(node => {
            if (ts.Node.isVariableDeclaration(node)) {
                const initializer = node.getInitializer();
                if (!initializer) return;

                const initializerText = initializer.getText();

                if (initializerText.includes('z.object(') || initializerText.includes('z.schema(')) {
                    // Vérification basique: s'assurer que chaque schéma a au moins une validation
                    if (!initializerText.match(/\.(min|max|email|url|uuid|regex|refine|superRefine|transform|pipe)\(/)) {
                        issues.push({
                            severity: SeverityLevel.WARNING,
                            message: 'Schéma Zod sans validation spécifique, peut accepter des données invalides',
                            category: 'semantic',
                            rule: 'zod-schema-validation',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                            },
                            code: node.getName() || 'SchemaZod',
                            suggestions: [
                                'Ajouter des validateurs comme .min(), .max(), .email(), etc.',
                                'Utiliser .refine() pour des validations personnalisées',
                                'Spécifier des contraintes plus précises pour chaque champ'
                            ]
                        });
                    }

                    // Vérification des champs nullable sans défaut
                    if (initializerText.includes('.nullable()') && !initializerText.includes('.default(')) {
                        issues.push({
                            severity: SeverityLevel.INFO,
                            message: 'Champ nullable sans valeur par défaut',
                            category: 'semantic',
                            rule: 'zod-nullable-default',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                            },
                            code: node.getName() || 'SchemaZod',
                            suggestions: [
                                'Ajouter .default(null) pour spécifier une valeur par défaut'
                            ]
                        });
                    }
                }
            }
        });
    }

    /**
     * Collecte les problèmes dans les DTOs (Data Transfer Objects)
     */
    private collectDTOValidationIssues(sourceFile: ts.SourceFile, issues: CodeIssue[]): void {
        if (!this.options.validateDTOs) {
            return;
        }

        // Vérifier si c'est un fichier de DTO (par convention)
        const filePath = sourceFile.getFilePath();
        const isDTO = filePath.includes('.dto.') || filePath.endsWith('dto.ts') ||
            filePath.includes('/dto/') || filePath.includes('/dtos/');

        if (!isDTO) {
            return;
        }

        // Rechercher des classes
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
            const className = classDecl.getName();

            if (!className || !className.includes('DTO') && !className.includes('Dto')) {
                continue;
            }

            // Vérifier la présence de décorateurs de validation (class-validator)
            let hasValidationDecorators = false;

            classDecl.getProperties().forEach(prop => {
                const decorators = prop.getDecorators();
                hasValidationDecorators = hasValidationDecorators || decorators.some(dec => {
                    const name = dec.getName();
                    return name.startsWith('Is') || name === 'ValidateNested' || name === 'Length' ||
                        name === 'Min' || name === 'Max' || name === 'IsOptional';
                });
            });

            if (this.options.validateDTOs.requireValidation && !hasValidationDecorators) {
                issues.push({
                    severity: SeverityLevel.WARNING,
                    message: `DTO ${className} sans décorateurs de validation`,
                    category: 'semantic',
                    rule: 'dto-missing-validation',
                    position: {
                        line: sourceFile.getLineAndColumnAtPos(classDecl.getStart()).line,
                        column: sourceFile.getLineAndColumnAtPos(classDecl.getStart()).column
                    },
                    code: className,
                    suggestions: [
                        'Ajouter des décorateurs de validation comme @IsString(), @IsNumber(), etc.',
                        'Utiliser @ValidateNested() pour valider les objets imbriqués',
                        'Ajouter @IsOptional() pour les champs facultatifs'
                    ]
                });
            }

            // Vérifier que les propriétés ont des types explicites
            if (this.options.validateDTOs.requireTypes) {
                classDecl.getProperties().forEach(prop => {
                    if (!prop.getTypeNode()) {
                        issues.push({
                            severity: SeverityLevel.WARNING,
                            message: `La propriété ${prop.getName()} du DTO ${className} n'a pas de type explicite`,
                            category: 'semantic',
                            rule: 'dto-missing-type',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(prop.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(prop.getStart()).column
                            },
                            code: prop.getText(),
                            suggestions: [
                                `${prop.getName()}: string;`,
                                `${prop.getName()}: number;`,
                                `${prop.getName()}: boolean;`,
                                `${prop.getName()}: Date;`
                            ]
                        });
                    }
                });
            }
        }
    }

    /**
     * Collecte les importations non utilisées
     */
    private collectUnusedImportsIssues(sourceFile: ts.SourceFile, issues: CodeIssue[]): void {
        const imports = sourceFile.getImportDeclarations();

        for (const importDecl of imports) {
            const namedImports = importDecl.getNamedImports();

            for (const namedImport of namedImports) {
                const name = namedImport.getName();
                const references = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)
                    .filter(id => id.getText() === name);

                // Si la seule référence est l'importation elle-même, alors elle n'est pas utilisée
                if (references.length <= 1) {
                    issues.push({
                        severity: SeverityLevel.INFO,
                        message: `Importation non utilisée: ${name}`,
                        category: 'semantic',
                        rule: 'unused-import',
                        position: {
                            line: sourceFile.getLineAndColumnAtPos(namedImport.getStart()).line,
                            column: sourceFile.getLineAndColumnAtPos(namedImport.getStart()).column
                        },
                        code: namedImport.getText()
                    });
                }
            }
        }
    }

    /**
     * Détecte les problèmes de gestion d'erreur manquante
     */
    private collectMissingErrorHandlingIssues(sourceFile: ts.SourceFile, issues: CodeIssue[]): void {
        // Rechercher des try sans catch
        sourceFile.forEachDescendant(node => {
            if (ts.Node.isTryStatement(node) && !node.getCatchClause()) {
                issues.push({
                    severity: SeverityLevel.WARNING,
                    message: 'Bloc try sans clause catch',
                    category: 'semantic',
                    rule: 'missing-error-handling',
                    position: {
                        line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                        column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                    },
                    code: 'try { ... } // sans catch',
                    suggestions: [
                        'Ajouter un bloc catch pour gérer les exceptions',
                        'Utiliser catch(error) { /* gérer l\'erreur */ }'
                    ]
                });
            }
        });

        // Rechercher des appels async sans gestion d'erreur
        sourceFile.forEachDescendant(node => {
            if (ts.Node.isAwaitExpression(node)) {
                // Vérifier si l'expression await est dans un bloc try
                let isInTryBlock = false;
                let currentParent = node.getParent();

                while (currentParent) {
                    if (ts.Node.isTryStatement(currentParent)) {
                        isInTryBlock = true;
                        break;
                    }
                    const nextParent = currentParent.getParent();
                    if (!nextParent) {
                        break;
                    }
                    currentParent = nextParent;
                }

                if (!isInTryBlock) {
                    const expressionText = node.getExpression().getText();

                    // Ignorer certains appels courants qui sont généralement sûrs
                    const safePatterns = [
                        /findOne(?:By)?/,
                        /findAll/,
                        /getOne/,
                        /getAll/,
                        /find(?:By)?Id/
                    ];

                    const isSafeCall = safePatterns.some(pattern => pattern.test(expressionText));

                    if (!isSafeCall) {
                        issues.push({
                            severity: SeverityLevel.INFO,
                            message: 'Expression await sans gestion d\'erreur',
                            category: 'semantic',
                            rule: 'unhandled-promise',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                            },
                            code: node.getText(),
                            suggestions: [
                                'Entourer l\'expression await avec try/catch',
                                'Utiliser .catch() pour gérer les erreurs de promesse'
                            ]
                        });
                    }
                }
            }
        });
    }
}

// Export de l'instance par défaut du validateur sémantique
export const semanticValidator = new SemanticValidator();