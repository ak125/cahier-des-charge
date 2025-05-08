/**
 * Types pour le workflow consolidé d'audit
 * 
 * Ce fichier définit les structures de données utilisées par le workflow d'audit consolidé
 * qui intègre plusieurs fonctionnalités d'audit et de vérification de qualité.
 */

/**
 * Options d'entrée pour le workflow d'audit consolidé
 */
export interface ConsolidatedAuditInput {
    // Options de base
    projectPath: string;
    outputDir?: string;

    // Options de vérification du code
    codeQuality?: {
        enabled: boolean;
        linters?: string[];
        checkStandards?: string[];
        checkPerformance?: boolean;
        checkDuplication?: boolean;
    };

    // Options d'audit de conformité
    compliance?: {
        enabled: boolean;
        standards?: string[];
        securityChecks?: boolean;
        accessibilityChecks?: boolean;
    };

    // Options d'audit structurel
    structuralAudit?: {
        enabled: boolean;
        dependencyAnalysis?: boolean;
        architectureValidation?: boolean;
        patterns?: {
            type: string;
            pattern: string;
        }[];
    };

    // Options de métriques
    metrics?: {
        enabled: boolean;
        collectPerformance?: boolean;
        collectComplexity?: boolean;
        collectCoverage?: boolean;
        thresholds?: {
            complexity?: number;
            coverage?: number;
            duplication?: number;
        };
    };

    // Options de rapport
    reporting?: {
        format?: 'json' | 'html' | 'both';
        includeVisualizations?: boolean;
        generateDashboard?: boolean;
        notifyWebhook?: string;
        commitToRepo?: boolean;
    };
}

/**
 * Structure des résultats pour le workflow d'audit consolidé
 */
export interface ConsolidatedAuditResult {
    // Informations générales
    startTime: string;
    endTime: string;
    duration: number;

    // Résultats des vérifications de qualité de code
    codeQuality?: {
        passed: boolean;
        score: number;
        issues: {
            severity: 'info' | 'warning' | 'error';
            rule: string;
            message: string;
            file: string;
            line: number;
        }[];
        duplication?: {
            percentage: number;
            hotspots: {
                file: string;
                duplicationPercentage: number;
                lines: number;
            }[];
        };
        performance?: {
            score: number;
            issues: {
                description: string;
                impact: string;
                recommendation: string;
            }[];
        };
        summary: {
            totalIssues: number;
            byCategory: {
                [category: string]: number;
            };
            bySeverity: {
                info: number;
                warning: number;
                error: number;
            };
        };
    };

    // Résultats des vérifications de conformité
    compliance?: {
        passed: boolean;
        score: number;
        standards: {
            name: string;
            passed: boolean;
            issues: {
                rule: string;
                message: string;
                severity: string;
            }[];
        }[];
        security?: {
            vulnerabilities: number;
            criticality: 'low' | 'medium' | 'high' | 'critical';
            topIssues: {
                description: string;
                severity: string;
                recommendation: string;
            }[];
        };
        accessibility?: {
            score: number;
            issues: {
                rule: string;
                impact: string;
                element: string;
            }[];
        };
    };

    // Résultats de l'audit structurel
    structuralAudit?: {
        passed: boolean;
        architectureViolations: {
            rule: string;
            message: string;
            files: string[];
        }[];
        dependencies: {
            circular: {
                from: string;
                to: string;
                path: string[];
            }[];
            unused: string[];
            outdated: {
                name: string;
                currentVersion: string;
                latestVersion: string;
                severity: string;
            }[];
        };
        patterns: {
            name: string;
            violations: number;
            files: string[];
        }[];
    };

    // Métriques collectées
    metrics?: {
        complexity: {
            average: number;
            highest: {
                file: string;
                value: number;
            };
            distribution: {
                simple: number;
                medium: number;
                complex: number;
            };
        };
        coverage?: {
            overall: number;
            byFile: {
                file: string;
                coverage: number;
            }[];
        };
        performance?: {
            score: number;
            metrics: {
                [metric: string]: number;
            };
        };
    };

    // Chemins vers les rapports générés
    reportPaths?: {
        summary?: string;
        detailed?: string;
        dashboard?: string;
    };

    // Métadonnées du rapport
    metadata: {
        version: string;
        auditedAt: string;
        configUsed: ConsolidatedAuditInput;
    };
}

/**
 * État interne du workflow
 */
export interface WorkflowState {
    config: ConsolidatedAuditInput;
    status: 'initializing' | 'auditing' | 'analyzing' | 'reporting' | 'completed' | 'failed';
    progress: {
        startTime: string;
        currentStep: string;
        completedSteps: number;
        totalSteps: number;
        stepProgress?: {
            current: number;
            total: number;
        };
    };
    result: ConsolidatedAuditResult;
    errors?: string[];
}