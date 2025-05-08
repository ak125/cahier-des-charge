/**
 * Exemple d'agent MCP pour l'analyse de code
 * 
 * Cet agent est conçu pour être compilé en WASM via AssemblyScript
 * Il implémente l'interface WasmAgentContract pour communiquer avec le runtime MCP
 */

// Types pour les interfaces
interface AgentMetadata {
    id: string;
    type: string;
    name: string;
    version: string;
    description?: string;
    permissions: {
        fs?: {
            read?: string[];
            write?: string[];
        };
        network?: {
            domains?: string[];
        };
    };
    wasmVersion: string;
}

interface AgentContext {
    jobId: string;
    inputs: {
        code: string;
        language: string;
        options?: {
            metrics?: string[];
            includeSnippets?: boolean;
            threshold?: number;
        };
    };
    timestamp?: number;
}

interface AgentResult {
    success: boolean;
    data?: {
        analysis: {
            complexity: {
                cyclomaticComplexity: number;
                maintainabilityIndex: number;
                halsteadVolume: number;
                linesOfCode: number;
            };
            quality: {
                score: number;
                issues: {
                    type: string;
                    severity: string;
                    line: number;
                    message: string;
                    snippet?: string;
                }[];
            };
            suggestions: string[];
        };
        stats: {
            inputLength: number;
            processingTime: number;
            issuesCount: number;
        };
    };
    error?: Error;
    metrics: {
        startTime: number;
        endTime: number;
        duration: number;
    };
}

// Métadonnées de l'agent
const metadata: AgentMetadata = {
    id: "code-analyzer",
    type: "analyzer",
    name: "Agent d'Analyse de Code",
    version: "1.0.0",
    description: "Agent qui analyse du code source pour détecter les problèmes et calculer des métriques",
    permissions: {
        fs: { read: [] },
        network: { domains: [] }
    },
    wasmVersion: "1.0"
};

/**
 * Initialise l'agent - appelé au chargement
 */
export function initialize(): void {
    // Rien à initialiser pour cet agent simple
}

/**
 * Exécute l'agent avec un contexte donné
 * @param contextJson Contexte d'entrée au format JSON
 * @returns Résultat au format JSON
 */
export function execute(contextJson: string): string {
    const startTime = Date.now();

    // Mesures pour les métriques
    let result: AgentResult = {
        success: false,
        metrics: {
            startTime: startTime,
            endTime: 0,
            duration: 0
        }
    };

    try {
        // Désérialiser le contexte
        const context: AgentContext = JSON.parse(contextJson);

        // Vérifications basiques
        if (!context.inputs || !context.inputs.code || !context.inputs.language) {
            throw new Error("Le code source et le langage sont requis");
        }

        const sourceCode = context.inputs.code;
        const language = context.inputs.language.toLowerCase();
        const options = context.inputs.options || {};

        // Simulation d'analyse de code (dans un agent réel, utiliserait des analyseurs spécifiques au langage)
        const codeAnalysis = analyzeCode(sourceCode, language, options);

        // Créer le résultat
        const endTime = Date.now();
        result = {
            success: true,
            data: {
                analysis: codeAnalysis,
                stats: {
                    inputLength: sourceCode.length,
                    processingTime: endTime - startTime,
                    issuesCount: codeAnalysis.quality.issues.length
                }
            },
            metrics: {
                startTime,
                endTime,
                duration: endTime - startTime
            }
        };

        return JSON.stringify(result);
    } catch (error) {
        const endTime = Date.now();
        result.success = false;
        result.error = error as Error;
        result.metrics.endTime = endTime;
        result.metrics.duration = endTime - startTime;

        return JSON.stringify(result);
    }
}

/**
 * Valide si l'agent peut traiter le contexte donné
 * @param contextJson Contexte à valider au format JSON
 * @returns true si le contexte est valide, sinon false
 */
export function validate(contextJson: string): boolean {
    try {
        const context: AgentContext = JSON.parse(contextJson);

        // Vérifications basiques
        if (!context.jobId || !context.inputs || !context.inputs.code || !context.inputs.language) {
            return false;
        }

        // Vérifier les languages supportés
        const supportedLanguages = ["javascript", "typescript", "python", "java", "php", "go", "rust", "c", "cpp"];
        if (!supportedLanguages.includes(context.inputs.language.toLowerCase())) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Retourne les métadonnées de l'agent
 * @returns Métadonnées au format JSON
 */
export function getMetadata(): string {
    return JSON.stringify(metadata);
}

// Fonctions utilitaires pour l'analyse de code

function analyzeCode(
    code: string,
    language: string,
    options: { metrics?: string[], includeSnippets?: boolean, threshold?: number }
): {
    complexity: any,
    quality: any,
    suggestions: string[]
} {
    // Initialiser les structures d'analyse
    const complexity = computeComplexity(code, language);
    const quality = assessCodeQuality(code, language, options.includeSnippets || false);
    const suggestions = generateSuggestions(code, language, complexity, quality, options.threshold || 70);

    return {
        complexity,
        quality,
        suggestions
    };
}

function computeComplexity(code: string, language: string): {
    cyclomaticComplexity: number,
    maintainabilityIndex: number,
    halsteadVolume: number,
    linesOfCode: number
} {
    // Simulation : calcul de la complexité basé sur des heuristiques simples
    const lines = code.split('\n');
    const linesOfCode = lines.filter(line => line.trim().length > 0).length;

    // Estimation très simplifiée de la complexité cyclomatique 
    // (basée sur le nombre de structures de contrôle)
    let cyclomaticComplexity = 1;
    if (language === "javascript" || language === "typescript") {
        cyclomaticComplexity += (code.match(/if|else|for|while|switch|case|&&|\|\||catch|\\?/g) || []).length;
    } else if (language === "python") {
        cyclomaticComplexity += (code.match(/if|elif|else|for|while|try|except|and|or/g) || []).length;
    } else {
        cyclomaticComplexity += (code.match(/[{};]/g) || []).length / 10;
    }

    // Volume de Halstead (mesure basée sur le nombre d'opérateurs et d'opérandes)
    const operatorCount = (code.match(/[+\-*\/%=&|^~<>!?:;,.\[\]{}()]/g) || []).length;
    const operandCount = code.length - operatorCount - code.replace(/\w+/g, '').length;
    const halsteadVolume = operatorCount * Math.log2(operandCount);

    // Indice de maintenabilité 
    // (une valeur plus élevée indique un code plus facile à maintenir)
    const maintainabilityIndex = Math.max(0, 100 - cyclomaticComplexity * 0.5 - linesOfCode / 50);

    return {
        cyclomaticComplexity,
        maintainabilityIndex,
        halsteadVolume,
        linesOfCode
    };
}

function assessCodeQuality(code: string, language: string, includeSnippets: boolean): {
    score: number,
    issues: {
        type: string,
        severity: string,
        line: number,
        message: string,
        snippet?: string
    }[]
} {
    const issues = [];
    const lines = code.split('\n');
    let score = 100; // Score initial parfait

    // Simulation de détection de problèmes courants

    // 1. Détection de lignes très longues
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 100) {
            issues.push({
                type: 'style',
                severity: 'warning',
                line: i + 1,
                message: `Ligne trop longue (${lines[i].length} caractères > 100)`,
                snippet: includeSnippets ? lines[i].substring(0, 30) + '...' : undefined
            });
            score -= 1;
        }
    }

    // 2. Détection de variables non utilisées (simulation simplifiée)
    const variableDeclarations = [];
    const variableUsages = [];

    if (language === "javascript" || language === "typescript") {
        const varMatches = code.match(/(?:let|const|var)\s+(\w+)/g) || [];
        varMatches.forEach(match => {
            const varName = match.split(/\s+/)[1];
            variableDeclarations.push(varName);
        });

        // Analyse très simplifiée des utilisations
        for (const varName of variableDeclarations) {
            const usageRegex = new RegExp(`[^a-zA-Z0-9_]${varName}[^a-zA-Z0-9_]`, 'g');
            const usageCount = (code.match(usageRegex) || []).length;

            if (usageCount <= 1) { // Si on ne trouve que la déclaration
                const lineNumber = lines.findIndex(line => line.includes(`let ${varName}`) ||
                    line.includes(`const ${varName}`) ||
                    line.includes(`var ${varName}`)) + 1;
                issues.push({
                    type: 'maintainability',
                    severity: 'info',
                    line: lineNumber,
                    message: `La variable '${varName}' semble non utilisée`,
                    snippet: includeSnippets ? lines[lineNumber - 1] : undefined
                });
                score -= 2;
            }
        }
    }

    // 3. Détection de blocs trop complexes (simulation)
    const functionMatches = code.match(/function\s+\w+\s*\([^)]*\)\s*{([^{}]*({[^{}]*})*[^{}]*)*}/g) || [];
    for (const func of functionMatches) {
        if (func.length > 500) {
            const funcName = func.match(/function\s+(\w+)/)?.[1] || 'anonyme';
            const lineNumber = lines.findIndex(line => line.includes(`function ${funcName}`)) + 1;
            issues.push({
                type: 'complexity',
                severity: 'error',
                line: lineNumber,
                message: `La fonction '${funcName}' est trop longue et complexe (${func.length} caractères)`,
                snippet: includeSnippets ? func.substring(0, 30) + '...' : undefined
            });
            score -= 5;
        }
    }

    return {
        score: Math.max(0, Math.round(score)),
        issues
    };
}

function generateSuggestions(
    code: string,
    language: string,
    complexity: any,
    quality: any,
    threshold: number
): string[] {
    const suggestions = [];

    // Suggestions basées sur la complexité du code
    if (complexity.cyclomaticComplexity > 15) {
        suggestions.push("Réduisez la complexité cyclomatique en décomposant les fonctions complexes en fonctions plus petites");
    }

    if (complexity.maintainabilityIndex < 65) {
        suggestions.push("Améliorez la maintenabilité du code en ajoutant des commentaires et en simplifiant la logique");
    }

    if (complexity.linesOfCode > 200) {
        suggestions.push("Envisagez de diviser ce fichier en modules plus petits et plus cohérents");
    }

    // Suggestions basées sur la qualité du code
    if (quality.score < threshold) {
        suggestions.push(`Améliorez la qualité du code pour atteindre un score d'au moins ${threshold} (actuellement ${quality.score})`);
    }

    // Suggestions spécifiques au langage
    if (language === "javascript" || language === "typescript") {
        if (code.includes('var ')) {
            suggestions.push("Remplacez 'var' par 'const' ou 'let' pour une meilleure portée des variables");
        }
        if (!code.includes('strict')) {
            suggestions.push("Ajoutez 'use strict' au début de votre code pour éviter les erreurs silencieuses");
        }
    } else if (language === "python") {
        if (code.includes('global ')) {
            suggestions.push("Évitez les variables globales en utilisant des classes ou des fonctions avec paramètres");
        }
    }

    // Suggestions génériques
    if (quality.issues.filter(i => i.type === 'style').length > 5) {
        suggestions.push("Standardisez le style de votre code en utilisant un linter ou un formateur de code");
    }

    return suggestions;
}