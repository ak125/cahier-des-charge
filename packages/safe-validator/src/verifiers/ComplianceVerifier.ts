/**
 * Vérificateur de conformité pour le code généré par IA
 * 
 * Ce module vérifie que le code généré est conforme aux standards
 * architecturaux, conventions de codage, et contraintes métier du projet.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeIssue, ComplianceOptions, SeverityLevel, ValidationResult, FileType } from '../types';
import * as ts from 'ts-morph';

/**
 * Classe principale pour vérifier la conformité du code
 */
export class ComplianceVerifier {
    private project: ts.Project;
    private options: ComplianceOptions;

    /**
     * Crée une nouvelle instance du vérificateur de conformité
     * @param options Options de configuration pour le vérificateur
     */
    constructor(options: ComplianceOptions = {}) {
        this.options = options;
        this.project = new ts.Project({
            tsConfigFilePath: this.findTsConfig(),
            skipAddingFilesFromTsConfig: true,
            compilerOptions: {
                target: ts.ScriptTarget.ES2020,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            }
        });
    }

    /**
     * Trouve le fichier tsconfig.json le plus proche
     */
    private findTsConfig(): string | undefined {
        let dir = process.cwd();
        const root = path.parse(dir).root;

        while (dir !== root) {
            const tsConfigPath = path.join(dir, 'tsconfig.json');
            if (fs.existsSync(tsConfigPath)) {
                return tsConfigPath;
            }
            dir = path.dirname(dir);
        }

        return undefined;
    }

    /**
     * Obtient les règles de vérification en fonction des standards spécifiés
     */
    private getRules(): Array<{
        id: string;
        check: (sourceFile: ts.SourceFile) => CodeIssue[];
        appliesTo: FileType[];
    }> {
        const rules: Array<{
            id: string;
            check: (sourceFile: ts.SourceFile) => CodeIssue[];
            appliesTo: FileType[];
        }> = [];

        // Règles communes à tous les standards
        rules.push({
            id: 'no-empty-blocks',
            check: (sourceFile) => {
                const issues: CodeIssue[] = [];
                sourceFile.forEachDescendant(node => {
                    if (ts.Node.isBlock(node) && node.getStatements().length === 0) {
                        // Ignorer les classes abstraites et interfaces
                        const parent = node.getParent();

                        // Vérifier si c'est une méthode ou constructeur dans une classe abstraite
                        let isAbstractClassMethod = false;

                        if (parent && (ts.Node.isMethodDeclaration(parent) || ts.Node.isConstructorDeclaration(parent))) {
                            const classDeclaration = parent.getParent();
                            if (classDeclaration && ts.Node.isClassDeclaration(classDeclaration)) {
                                // Vérifier si la classe a le modificateur abstract
                                const modifiers = classDeclaration.getModifiers();
                                if (modifiers && modifiers.some(m => m.getKind() === ts.SyntaxKind.AbstractKeyword)) {
                                    isAbstractClassMethod = true;
                                }
                            }
                        }

                        if (isAbstractClassMethod) {
                            return;
                        }

                        issues.push({
                            severity: SeverityLevel.WARNING,
                            message: 'Bloc vide, potentiellement code incomplet ou inutile',
                            category: 'compliance',
                            rule: 'no-empty-blocks',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                            },
                            code: node.getText()
                        });
                    }
                });
                return issues;
            },
            appliesTo: ['ts', 'js']
        });

        rules.push({
            id: 'explicit-return-types',
            check: (sourceFile) => {
                const issues: CodeIssue[] = [];
                sourceFile.forEachDescendant(node => {
                    if ((ts.Node.isMethodDeclaration(node) || ts.Node.isFunctionDeclaration(node)) &&
                        !node.getReturnTypeNode() &&
                        !node.isAsync()) {
                        issues.push({
                            severity: SeverityLevel.INFO,
                            message: 'Type de retour non explicite, rendant l\'intention du code moins claire',
                            category: 'compliance',
                            rule: 'explicit-return-types',
                            position: {
                                line: sourceFile.getLineAndColumnAtPos(node.getStart()).line,
                                column: sourceFile.getLineAndColumnAtPos(node.getStart()).column
                            },
                            code: node.getName() ?
                                `${node.getName()}(${node.getParameters().map(p => p.getText()).join(', ')})` :
                                node.getText().split('\n')[0] + '...'
                        });
                    }
                });
                return issues;
            },
            appliesTo: ['ts']
        });

        // Ajouter des règles spécifiques à NestJS si spécifié
        if (this.options.standards?.includes('nestjs')) {
            rules.push({
                id: 'nestjs-injectable-decorator',
                check: (sourceFile) => {
                    const issues: CodeIssue[] = [];
                    sourceFile.getClasses().forEach(classDeclaration => {
                        const fileName = sourceFile.getFilePath();

                        // Vérifier que les classes des services ont le décorateur @Injectable()
                        if (fileName.includes('.service.') || fileName.includes('/services/')) {
                            const hasInjectableDecorator = classDeclaration.getDecorators()
                                .some(decorator => decorator.getName() === 'Injectable');

                            if (!hasInjectableDecorator) {
                                issues.push({
                                    severity: SeverityLevel.ERROR,
                                    message: 'Les services NestJS doivent avoir le décorateur @Injectable()',
                                    category: 'compliance',
                                    rule: 'nestjs-injectable-decorator',
                                    position: {
                                        line: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).line,
                                        column: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).column
                                    },
                                    code: `class ${classDeclaration.getName()} {`
                                });
                            }
                        }

                        // Vérifier que les classes des contrôleurs ont le décorateur @Controller()
                        if (fileName.includes('.controller.') || fileName.includes('/controllers/')) {
                            const hasControllerDecorator = classDeclaration.getDecorators()
                                .some(decorator => decorator.getName() === 'Controller');

                            if (!hasControllerDecorator) {
                                issues.push({
                                    severity: SeverityLevel.ERROR,
                                    message: 'Les contrôleurs NestJS doivent avoir le décorateur @Controller()',
                                    category: 'compliance',
                                    rule: 'nestjs-controller-decorator',
                                    position: {
                                        line: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).line,
                                        column: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).column
                                    },
                                    code: `class ${classDeclaration.getName()} {`
                                });
                            }
                        }
                    });
                    return issues;
                },
                appliesTo: ['ts']
            });

            rules.push({
                id: 'nestjs-module-structure',
                check: (sourceFile) => {
                    const issues: CodeIssue[] = [];
                    if (!sourceFile.getFilePath().includes('.module.')) {
                        return issues;
                    }

                    sourceFile.getClasses().forEach(classDeclaration => {
                        const hasModuleDecorator = classDeclaration.getDecorators()
                            .some(decorator => decorator.getName() === 'Module');

                        if (!hasModuleDecorator) {
                            issues.push({
                                severity: SeverityLevel.ERROR,
                                message: 'Les modules NestJS doivent avoir le décorateur @Module()',
                                category: 'compliance',
                                rule: 'nestjs-module-structure',
                                position: {
                                    line: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).line,
                                    column: sourceFile.getLineAndColumnAtPos(classDeclaration.getStart()).column
                                },
                                code: `class ${classDeclaration.getName()} {`
                            });
                            return;
                        }

                        // Vérifier que le décorateur @Module a les propriétés requises
                        const moduleDecorator = classDeclaration.getDecorators()
                            .find(decorator => decorator.getName() === 'Module');

                        if (moduleDecorator) {
                            const args = moduleDecorator.getArguments();
                            if (args.length === 0) {
                                issues.push({
                                    severity: SeverityLevel.ERROR,
                                    message: 'Le décorateur @Module() doit avoir un objet de configuration',
                                    category: 'compliance',
                                    rule: 'nestjs-module-structure',
                                    position: {
                                        line: sourceFile.getLineAndColumnAtPos(moduleDecorator.getStart()).line,
                                        column: sourceFile.getLineAndColumnAtPos(moduleDecorator.getStart()).column
                                    },
                                    code: moduleDecorator.getText()
                                });
                            }
                        }
                    });
                    return issues;
                },
                appliesTo: ['ts']
            });
        }

        // Ajouter des règles spécifiques à Prisma si spécifié
        if (this.options.standards?.includes('prisma')) {
            rules.push({
                id: 'prisma-schema-validation',
                check: (sourceFile) => {
                    const issues: CodeIssue[] = [];
                    // Validation simplifiée du schéma Prisma
                    const content = sourceFile.getText();

                    // Vérifier la présence de la définition du générateur
                    if (!content.includes('generator client {')) {
                        issues.push({
                            severity: SeverityLevel.ERROR,
                            message: 'Le schéma Prisma doit définir un générateur client',
                            category: 'compliance',
                            rule: 'prisma-schema-validation',
                            position: { line: 1, column: 1 }
                        });
                    }

                    // Vérifier la présence de la définition de la source de données
                    if (!content.includes('datasource db {')) {
                        issues.push({
                            severity: SeverityLevel.ERROR,
                            message: 'Le schéma Prisma doit définir une source de données',
                            category: 'compliance',
                            rule: 'prisma-schema-validation',
                            position: { line: 1, column: 1 }
                        });
                    }

                    // Vérifier qu'au moins un modèle est défini
                    if (!content.includes('model ')) {
                        issues.push({
                            severity: SeverityLevel.WARNING,
                            message: 'Le schéma Prisma ne contient aucun modèle',
                            category: 'compliance',
                            rule: 'prisma-schema-validation',
                            position: { line: 1, column: 1 }
                        });
                    }

                    // Vérifier la validité des types de champs
                    const invalidTypeMatches = content.match(/\s+\w+\s+(\w+)(?:\(.*\))?\s+(?:@|$)/g);
                    if (invalidTypeMatches) {
                        for (const match of invalidTypeMatches) {
                            const type = match.trim().split(/\s+/)[1];
                            const validTypes = [
                                'String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal',
                                'DateTime', 'Json', 'Bytes', 'Unsupported'
                            ];

                            if (!validTypes.includes(type) && !type.startsWith('Unsupported(')) {
                                const lineIndex = content.indexOf(match);
                                const lineNumber = content.substring(0, lineIndex).split('\n').length;

                                issues.push({
                                    severity: SeverityLevel.ERROR,
                                    message: `Type de champ Prisma non valide: ${type}`,
                                    category: 'compliance',
                                    rule: 'prisma-schema-validation',
                                    position: { line: lineNumber, column: 1 },
                                    code: match.trim()
                                });
                            }
                        }
                    }

                    return issues;
                },
                appliesTo: ['prisma']
            });
        }

        return rules;
    }

    /**
     * Détecte automatiquement le type de fichier à partir de son contenu
     */
    private detectFileType(content: string): FileType {
        // Détection basée sur les patterns courants
        if (content.includes('@Controller') || content.includes('@Injectable') || content.includes('@Module')) {
            return 'ts';
        }

        if (content.includes('datasource db {') && content.includes('model ')) {
            return 'prisma';
        }

        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
            try {
                JSON.parse(content);
                return 'json';
            } catch (e) {
                // Pas du JSON valide
            }
        }

        // Détecter les fichiers TypeScript par convention
        if (content.includes('import ') || content.includes('export ') || content.includes('interface ')) {
            return 'ts';
        }

        // Détecter les fichiers JavaScript par convention
        if (content.includes('function ') || content.includes('const ') || content.includes('require(')) {
            return 'js';
        }

        return 'unknown';
    }

    /**
     * Vérifie la conformité d'un fichier source
     * @param filePath Chemin du fichier à vérifier
     * @returns Résultat de la validation
     */
    async checkFile(filePath: string): Promise<ValidationResult> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const fileType = path.extname(filePath).substring(1) as FileType;

            return this.check(content, fileType, filePath);
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
     * Vérifie la conformité d'un fragment de code source
     * @param code Code source à vérifier
     * @param fileType Type du fichier (ts, js, etc.)
     * @param filePath Chemin du fichier (optionnel)
     * @returns Résultat de la validation
     */
    check(code: string, fileType: FileType = 'ts', filePath?: string): ValidationResult {
        // Si le type de fichier n'est pas spécifié, essayer de le détecter
        if (fileType === 'unknown') {
            fileType = this.detectFileType(code);
        }

        const issues: CodeIssue[] = [];

        // Pour les fichiers Prisma, utiliser une validation spécifique
        if (fileType === 'prisma') {
            const prismaRules = this.getRules().filter(rule => rule.appliesTo.includes('prisma'));

            // Créer un source file factice pour la validation Prisma
            const sourceFile = this.project.createSourceFile('temp.prisma', code, { overwrite: true });

            for (const rule of prismaRules) {
                const ruleIssues = rule.check(sourceFile);
                issues.push(...ruleIssues);
            }

            sourceFile.forget();
        }
        // Pour les fichiers TypeScript et JavaScript, utiliser ts-morph
        else if (fileType === 'ts' || fileType === 'js') {
            const tempFilePath = filePath || `temp.${fileType}`;
            const sourceFile = this.project.createSourceFile(tempFilePath, code, { overwrite: true });

            // Récupérer les règles applicables pour ce type de fichier
            const applicableRules = this.getRules().filter(rule => rule.appliesTo.includes(fileType));

            // Appliquer chaque règle
            for (const rule of applicableRules) {
                const ruleIssues = rule.check(sourceFile);
                issues.push(...ruleIssues);
            }

            // Nettoyer le fichier temporaire
            if (!filePath) {
                sourceFile.forget();
            }
        }
        // Pour les fichiers JSON, valider la structure
        else if (fileType === 'json') {
            try {
                JSON.parse(code);
            } catch (error) {
                issues.push({
                    severity: SeverityLevel.ERROR,
                    message: `JSON invalide: ${(error as Error).message}`,
                    category: 'compliance',
                    rule: 'json-syntax-validation',
                    position: { line: 1, column: 1 }
                });
            }
        }

        // La validation réussit s'il n'y a pas de problèmes de niveau ERROR ou CRITICAL
        const hasCriticalIssues = issues.some(issue =>
            issue.severity === SeverityLevel.ERROR || issue.severity === SeverityLevel.CRITICAL);

        return {
            success: !hasCriticalIssues,
            issues,
            fileType,
            filePath,
            metadata: {
                checkedAt: new Date().toISOString(),
                standards: this.options.standards || []
            }
        };
    }
}

// Export de l'instance par défaut du vérificateur de conformité
export const complianceVerifier = new ComplianceVerifier();