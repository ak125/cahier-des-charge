"use strict";
/**
 * Script d'exécution parallèle pour comparer n8n et Temporal
 *
 * Ce script exécute simultanément le workflow n8n "SQL Analyzer & Prisma Builder"
 * et sa version Temporal pour comparer les résultats et valider la migration.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runParallelAnalysis = runParallelAnalysis;
var fs = require("fs");
var path = require("path");
var axios_1 = require("axios");
var util_1 = require("util");
var child_process_1 = require("child_process");
var sql_analyzer_client_1 = require("../client/sql-analyzer-client");
var execPromise = (0, util_1.promisify)(child_process_1.exec);
var writeFilePromise = (0, util_1.promisify)(fs.writeFile);
var mkdirPromise = (0, util_1.promisify)(fs.mkdir);
/**
 * Exécute le workflow n8n via son API
 */
function executeN8nWorkflow(config) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, payload, response, endTime, executionTime, error_1, endTime, executionTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Exécution du workflow n8n...');
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    payload = {
                        databaseName: config.databaseName,
                        connectionString: config.connectionString,
                        includeTables: config.includeTables || [],
                        excludeTables: config.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata'],
                        schemaOnly: true,
                        generatePrismaSchema: config.generatePrisma !== false,
                        analyzePerformance: config.analyzePerformance !== false,
                        outputDir: path.join(config.outputBaseDir, 'n8n-output'),
                    };
                    return [4 /*yield*/, axios_1.default.post("".concat(config.n8nUrl, "/webhook/analyze-sql-prisma"), payload, {
                            headers: config.n8nApiKey ? {
                                'X-N8N-API-KEY': config.n8nApiKey
                            } : {}
                        })];
                case 2:
                    response = _a.sent();
                    endTime = Date.now();
                    executionTime = endTime - startTime;
                    if (response.data.status === 'success') {
                        return [2 /*return*/, {
                                success: true,
                                outputDir: response.data.summary.outputDirectory,
                                executionTime: executionTime,
                                executionId: response.data.summary.executionId || "n8n-".concat(Date.now())
                            }];
                    }
                    else {
                        console.error('Erreur lors de l\'exécution du workflow n8n:', response.data.message);
                        return [2 /*return*/, {
                                success: false,
                                outputDir: '',
                                executionTime: executionTime,
                                executionId: "n8n-error-".concat(Date.now())
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    endTime = Date.now();
                    executionTime = endTime - startTime;
                    console.error('Erreur lors de l\'appel au webhook n8n:', error_1.message);
                    return [2 /*return*/, {
                            success: false,
                            outputDir: '',
                            executionTime: executionTime,
                            executionId: "n8n-error-".concat(Date.now())
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Exécute le workflow Temporal
 */
function executeTemporalWorkflow(config) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, outputDir, sqlAnalyzer, workflowId, result, attempts, maxAttempts, endTime, executionTime, error_2, endTime, executionTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Exécution du workflow Temporal...');
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    outputDir = path.join(config.outputBaseDir, 'temporal-output');
                    return [4 /*yield*/, mkdirPromise(outputDir, { recursive: true })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, sql_analyzer_client_1.getSQLAnalyzer)()];
                case 3:
                    sqlAnalyzer = _a.sent();
                    return [4 /*yield*/, sqlAnalyzer.analyze({
                            connectionString: config.connectionString,
                            dialect: config.dialect,
                            databaseName: config.databaseName,
                            tables: config.includeTables,
                            excludeTables: config.excludeTables,
                            outputDir: outputDir,
                            schemaOnly: true,
                            generatePrisma: config.generatePrisma !== false,
                            analyzePerformance: config.analyzePerformance !== false,
                            validateSchema: config.validateSchema || false,
                            applyMigration: false,
                            commitToGit: false,
                            createArchive: true
                        })];
                case 4:
                    workflowId = _a.sent();
                    result = void 0;
                    attempts = 0;
                    maxAttempts = 60;
                    _a.label = 5;
                case 5:
                    if (!(attempts < maxAttempts)) return [3 /*break*/, 8];
                    return [4 /*yield*/, sqlAnalyzer.getStatus(workflowId)];
                case 6:
                    result = _a.sent();
                    if (result.status === 'completed' || result.status === 'error') {
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                case 7:
                    _a.sent(); // Attendre 5 secondes
                    attempts++;
                    return [3 /*break*/, 5];
                case 8:
                    endTime = Date.now();
                    executionTime = endTime - startTime;
                    if (result.status === 'completed') {
                        return [2 /*return*/, {
                                success: true,
                                outputDir: result.outputDir || outputDir,
                                executionTime: executionTime,
                                workflowId: workflowId
                            }];
                    }
                    else {
                        console.error('Erreur lors de l\'exécution du workflow Temporal:', result.message);
                        return [2 /*return*/, {
                                success: false,
                                outputDir: result.outputDir || outputDir,
                                executionTime: executionTime,
                                workflowId: workflowId
                            }];
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    endTime = Date.now();
                    executionTime = endTime - startTime;
                    console.error('Erreur lors de l\'exécution du workflow Temporal:', error_2);
                    return [2 /*return*/, {
                            success: false,
                            outputDir: '',
                            executionTime: executionTime,
                            workflowId: "temporal-error-".concat(Date.now())
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Compare les fichiers générés par n8n et Temporal
 */
function compareResults(n8nOutputDir, temporalOutputDir) {
    return __awaiter(this, void 0, void 0, function () {
        var n8nFiles, temporalFiles, onlyInN8n, onlyInTemporal, inBoth, contentDifferences, _i, inBoth_1, file, n8nFilePath, temporalFilePath, stdout, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Comparaison des fichiers générés...');
                    if (!fs.existsSync(n8nOutputDir) || !fs.existsSync(temporalOutputDir)) {
                        throw new Error('Les répertoires de sortie n\'existent pas');
                    }
                    n8nFiles = fs.readdirSync(n8nOutputDir).filter(function (file) { return !file.startsWith('.'); });
                    temporalFiles = fs.readdirSync(temporalOutputDir).filter(function (file) { return !file.startsWith('.'); });
                    onlyInN8n = n8nFiles.filter(function (file) { return !temporalFiles.includes(file); });
                    onlyInTemporal = temporalFiles.filter(function (file) { return !n8nFiles.includes(file); });
                    inBoth = n8nFiles.filter(function (file) { return temporalFiles.includes(file); });
                    contentDifferences = [];
                    _i = 0, inBoth_1 = inBoth;
                    _a.label = 1;
                case 1:
                    if (!(_i < inBoth_1.length)) return [3 /*break*/, 6];
                    file = inBoth_1[_i];
                    n8nFilePath = path.join(n8nOutputDir, file);
                    temporalFilePath = path.join(temporalOutputDir, file);
                    // Ignorer les répertoires
                    if (fs.statSync(n8nFilePath).isDirectory() || fs.statSync(temporalFilePath).isDirectory()) {
                        return [3 /*break*/, 5];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, execPromise("diff -u \"".concat(n8nFilePath, "\" \"").concat(temporalFilePath, "\""))];
                case 3:
                    stdout = (_a.sent()).stdout;
                    // S'il y a des différences, stdout ne sera pas vide
                    if (stdout) {
                        contentDifferences.push({
                            file: file,
                            differences: stdout
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    // diff renvoie un code d'erreur s'il y a des différences
                    if (error_3.stdout) {
                        contentDifferences.push({
                            file: file,
                            differences: error_3.stdout
                        });
                    }
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, {
                        onlyInN8n: onlyInN8n,
                        onlyInTemporal: onlyInTemporal,
                        inBoth: inBoth,
                        contentDifferences: contentDifferences
                    }];
            }
        });
    });
}
/**
 * Exécute les deux workflows en parallèle et compare les résultats
 */
function runParallelAnalysis(config) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, n8nResult, temporalResult, fileComparison, error_4, success, summary, comparisonResult, reportPath, reportMarkdownPath, markdownReport;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("D\u00E9but de l'ex\u00E9cution parall\u00E8le pour la base de donn\u00E9es: ".concat(config.databaseName));
                    // Créer le répertoire de base
                    return [4 /*yield*/, mkdirPromise(config.outputBaseDir, { recursive: true })];
                case 1:
                    // Créer le répertoire de base
                    _b.sent();
                    return [4 /*yield*/, Promise.all([
                            executeN8nWorkflow(config),
                            executeTemporalWorkflow(config)
                        ])];
                case 2:
                    _a = _b.sent(), n8nResult = _a[0], temporalResult = _a[1];
                    fileComparison = {
                        onlyInN8n: [],
                        onlyInTemporal: [],
                        inBoth: [],
                        contentDifferences: []
                    };
                    if (!(n8nResult.success && temporalResult.success)) return [3 /*break*/, 6];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, compareResults(n8nResult.outputDir, temporalResult.outputDir)];
                case 4:
                    fileComparison = _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _b.sent();
                    console.error('Erreur lors de la comparaison des résultats:', error_4);
                    return [3 /*break*/, 6];
                case 6:
                    success = n8nResult.success && temporalResult.success &&
                        fileComparison.contentDifferences.length === 0;
                    summary = success
                        ? 'Les deux workflows ont produit des résultats identiques'
                        : 'Des différences ont été détectées entre les résultats des workflows';
                    comparisonResult = {
                        success: success,
                        n8nExecutionTime: n8nResult.executionTime,
                        temporalExecutionTime: temporalResult.executionTime,
                        n8nOutputDir: n8nResult.outputDir,
                        temporalOutputDir: temporalResult.outputDir,
                        fileComparison: fileComparison,
                        summary: summary,
                        executedAt: new Date().toISOString()
                    };
                    reportPath = path.join(config.outputBaseDir, 'comparison-report.json');
                    return [4 /*yield*/, writeFilePromise(reportPath, JSON.stringify(comparisonResult, null, 2))];
                case 7:
                    _b.sent();
                    reportMarkdownPath = path.join(config.outputBaseDir, 'comparison-report.md');
                    markdownReport = generateComparisonMarkdown(comparisonResult);
                    return [4 /*yield*/, writeFilePromise(reportMarkdownPath, markdownReport)];
                case 8:
                    _b.sent();
                    console.log("Comparaison termin\u00E9e. Rapport sauvegard\u00E9 dans: ".concat(reportPath));
                    console.log("Rapport Markdown sauvegard\u00E9 dans: ".concat(reportMarkdownPath));
                    return [2 /*return*/, comparisonResult];
            }
        });
    });
}
/**
 * Génère un rapport de comparaison au format Markdown
 */
function generateComparisonMarkdown(comparison) {
    var markdown = "# Rapport de comparaison des workflows n8n et Temporal\n\n";
    markdown += "*Ex\u00E9cut\u00E9 le ".concat(new Date(comparison.executedAt).toLocaleDateString('fr-FR'), " \u00E0 ").concat(new Date(comparison.executedAt).toLocaleTimeString('fr-FR'), "*\n\n");
    // Résumé
    markdown += "## R\u00E9sum\u00E9\n\n";
    markdown += "- **Statut** : ".concat(comparison.success ? '✅ Succès' : '❌ Échec', "\n");
    markdown += "- **R\u00E9sultat** : ".concat(comparison.summary, "\n");
    markdown += "- **Temps d'ex\u00E9cution n8n** : ".concat((comparison.n8nExecutionTime / 1000).toFixed(2), " secondes\n");
    markdown += "- **Temps d'ex\u00E9cution Temporal** : ".concat((comparison.temporalExecutionTime / 1000).toFixed(2), " secondes\n");
    markdown += "- **Diff\u00E9rence de performance** : ".concat(((comparison.n8nExecutionTime - comparison.temporalExecutionTime) / comparison.n8nExecutionTime * 100).toFixed(2), "%\n\n");
    // Répertoires de sortie
    markdown += "## R\u00E9pertoires de sortie\n\n";
    markdown += "- **n8n** : `".concat(comparison.n8nOutputDir, "`\n");
    markdown += "- **Temporal** : `".concat(comparison.temporalOutputDir, "`\n\n");
    // Comparaison des fichiers
    markdown += "## Comparaison des fichiers\n\n";
    markdown += "### Statistiques\n\n";
    markdown += "- Fichiers uniquement dans n8n : ".concat(comparison.fileComparison.onlyInN8n.length, "\n");
    markdown += "- Fichiers uniquement dans Temporal : ".concat(comparison.fileComparison.onlyInTemporal.length, "\n");
    markdown += "- Fichiers pr\u00E9sents dans les deux : ".concat(comparison.fileComparison.inBoth.length, "\n");
    markdown += "- Fichiers avec des diff\u00E9rences de contenu : ".concat(comparison.fileComparison.contentDifferences.length, "\n\n");
    // Lister les fichiers uniques à n8n
    if (comparison.fileComparison.onlyInN8n.length > 0) {
        markdown += "### Fichiers uniquement dans n8n\n\n";
        comparison.fileComparison.onlyInN8n.forEach(function (file) {
            markdown += "- `".concat(file, "`\n");
        });
        markdown += "\n";
    }
    // Lister les fichiers uniques à Temporal
    if (comparison.fileComparison.onlyInTemporal.length > 0) {
        markdown += "### Fichiers uniquement dans Temporal\n\n";
        comparison.fileComparison.onlyInTemporal.forEach(function (file) {
            markdown += "- `".concat(file, "`\n");
        });
        markdown += "\n";
    }
    // Lister les différences de contenu
    if (comparison.fileComparison.contentDifferences.length > 0) {
        markdown += "### Diff\u00E9rences de contenu\n\n";
        comparison.fileComparison.contentDifferences.forEach(function (diff) {
            markdown += "#### `".concat(diff.file, "`\n\n");
            markdown += "```diff\n";
            markdown += diff.differences;
            markdown += "\n```\n\n";
        });
    }
    return markdown;
}
// Si le script est exécuté directement
if (require.main === module) {
    // Lire la configuration depuis les arguments ou un fichier
    var configPath = process.argv[2] || '/workspaces/cahier-des-charge/packages/business/temporal/parallel-execution/config.json';
    if (!fs.existsSync(configPath)) {
        console.error("Le fichier de configuration n'existe pas: ".concat(configPath));
        process.exit(1);
    }
    var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Exécuter l'analyse parallèle
    runParallelAnalysis(config)
        .then(function (result) {
        console.log("Ex\u00E9cution parall\u00E8le termin\u00E9e avec succ\u00E8s: ".concat(result.success));
        console.log("Diff\u00E9rence de performance: ".concat(((result.n8nExecutionTime - result.temporalExecutionTime) / result.n8nExecutionTime * 100).toFixed(2), "%"));
        process.exit(result.success ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Erreur lors de l\'exécution parallèle:', error);
        process.exit(1);
    });
}
