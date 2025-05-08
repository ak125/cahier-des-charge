"use strict";
/**
 * Workflow Temporal pour SQL Analyzer & Prisma Builder
 *
 * Ce workflow remplace le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 * qui était utilisé pour analyser les structures SQL et générer des modèles Prisma.
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
exports.sqlAnalyzerPrismaBuilderWorkflow = sqlAnalyzerPrismaBuilderWorkflow;
var workflow_1 = require("@temporalio/workflow");
// Configuration par défaut pour la génération de schéma Prisma
var defaultPrismaOptions = {
    modelNaming: 'PascalCase',
    includeComments: true,
    includeIndexes: true,
    datasourceProvider: 'postgresql',
    datasourceName: 'db',
    outputFormat: 'prisma',
    relationshipNaming: 'explicit',
};
// Configuration par défaut pour les migrations
var defaultMigrationOptions = {
    mode: 'dev',
    force: false,
    skipSeed: true,
    createOnly: false,
};
// Définition du workflow principal
function sqlAnalyzerPrismaBuilderWorkflow(input) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, prepareAnalysis, analyzeSQL, generatePrismaSchema, validatePrismaSchema, applyMigration, verifyGeneratedFiles, commitFilesToGit, createArchive, generateExecutionSummary, _b, config, outputDir, analysisResult, fileVerification, prismaSchema, validationResult, migrationResult, gitResult, archiveResult, executionSummary, error_1;
        var _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = (0, workflow_1.proxyActivities)({
                        startToCloseTimeout: '30 minutes',
                        retry: {
                            maximumAttempts: 3,
                            initialInterval: '1 second',
                        },
                    }), prepareAnalysis = _a.prepareAnalysis, analyzeSQL = _a.analyzeSQL, generatePrismaSchema = _a.generatePrismaSchema, validatePrismaSchema = _a.validatePrismaSchema, applyMigration = _a.applyMigration, verifyGeneratedFiles = _a.verifyGeneratedFiles, commitFilesToGit = _a.commitFilesToGit, createArchive = _a.createArchive, generateExecutionSummary = _a.generateExecutionSummary;
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 17, , 18]);
                    return [4 /*yield*/, prepareAnalysis({
                            connectionString: input.connectionString,
                            dialect: input.dialect,
                            databaseName: input.databaseName,
                            tables: input.tables,
                            schema: input.schema,
                            outputDir: input.outputDir,
                            schemaOnly: input.schemaOnly,
                            generatePrisma: input.generatePrisma,
                            analyzePerformance: input.analyzePerformance,
                            excludeTables: input.excludeTables
                        })];
                case 2:
                    _b = _f.sent(), config = _b.config, outputDir = _b.outputDir;
                    return [4 /*yield*/, analyzeSQL({
                            connectionString: config.connectionString,
                            dialect: config.dialect,
                            databaseName: config.databaseName,
                            tables: config.tables,
                            schema: config.schema,
                            excludeTables: config.excludeTables,
                            outputDir: outputDir,
                            schemaOnly: config.schemaOnly
                        })];
                case 3:
                    analysisResult = _f.sent();
                    return [4 /*yield*/, verifyGeneratedFiles({
                            outputDir: outputDir
                        })];
                case 4:
                    fileVerification = _f.sent();
                    if (!fileVerification.success) {
                        return [2 /*return*/, {
                                status: 'error',
                                message: "Certains fichiers attendus n'ont pas \u00E9t\u00E9 g\u00E9n\u00E9r\u00E9s: ".concat(fileVerification.missing.join(', ')),
                                outputDir: outputDir,
                                files: fileVerification.files,
                                completedAt: new Date().toISOString(),
                            }];
                    }
                    prismaSchema = void 0;
                    if (!config.generatePrisma) return [3 /*break*/, 6];
                    return [4 /*yield*/, generatePrismaSchema({
                            analysis: analysisResult,
                            options: input.prismaOptions || defaultPrismaOptions,
                            outputDir: outputDir
                        })];
                case 5:
                    prismaSchema = _f.sent();
                    return [3 /*break*/, 7];
                case 6:
                    // Si generatePrisma est false, on crée un résultat vide pour continuer le workflow
                    prismaSchema = {
                        schema: '',
                        models: 0,
                        enums: 0,
                        generatedAt: new Date().toISOString()
                    };
                    _f.label = 7;
                case 7:
                    validationResult = void 0;
                    if (!(input.validateSchema && prismaSchema.schema)) return [3 /*break*/, 9];
                    return [4 /*yield*/, validatePrismaSchema({
                            schema: prismaSchema.schema,
                            connectionString: input.connectionString,
                            outputDir: outputDir
                        })];
                case 8:
                    validationResult = _f.sent();
                    // Vérifier si la validation a échoué
                    if (!validationResult.success) {
                        return [2 /*return*/, {
                                status: 'error',
                                message: "Schema validation failed: ".concat(validationResult.error),
                                schema: prismaSchema.schema,
                                analysisDetails: analysisResult,
                                outputDir: outputDir,
                                files: fileVerification.files,
                                validationResult: validationResult,
                                completedAt: new Date().toISOString(),
                            }];
                    }
                    _f.label = 9;
                case 9:
                    migrationResult = void 0;
                    if (!(input.applyMigration && prismaSchema.schema)) return [3 /*break*/, 11];
                    return [4 /*yield*/, applyMigration({
                            schema: prismaSchema.schema,
                            connectionString: input.connectionString,
                            options: input.migrationOptions || defaultMigrationOptions,
                            outputDir: outputDir
                        })];
                case 10:
                    migrationResult = _f.sent();
                    // Vérifier si la migration a échoué
                    if (!migrationResult.success) {
                        return [2 /*return*/, {
                                status: 'error',
                                message: "Migration failed: ".concat(migrationResult.error),
                                schema: prismaSchema.schema,
                                analysisDetails: analysisResult,
                                outputDir: outputDir,
                                files: fileVerification.files,
                                validationResult: validationResult,
                                migrationResult: migrationResult,
                                completedAt: new Date().toISOString(),
                            }];
                    }
                    _f.label = 11;
                case 11:
                    gitResult = void 0;
                    if (!input.commitToGit) return [3 /*break*/, 13];
                    return [4 /*yield*/, commitFilesToGit({
                            outputDir: outputDir,
                            branchName: (_c = input.gitOptions) === null || _c === void 0 ? void 0 : _c.branchName,
                            commitMessage: (_d = input.gitOptions) === null || _d === void 0 ? void 0 : _d.commitMessage,
                            author: (_e = input.gitOptions) === null || _e === void 0 ? void 0 : _e.author
                        })];
                case 12:
                    gitResult = _f.sent();
                    _f.label = 13;
                case 13:
                    archiveResult = void 0;
                    if (!input.createArchive) return [3 /*break*/, 15];
                    return [4 /*yield*/, createArchive({
                            outputDir: outputDir
                        })];
                case 14:
                    archiveResult = _f.sent();
                    _f.label = 15;
                case 15: return [4 /*yield*/, generateExecutionSummary({
                        config: config,
                        outputDir: outputDir,
                        files: fileVerification.files,
                        branchName: gitResult === null || gitResult === void 0 ? void 0 : gitResult.branchName
                    })];
                case 16:
                    executionSummary = _f.sent();
                    // Résultat final
                    return [2 /*return*/, {
                            status: 'completed',
                            schema: prismaSchema.schema,
                            analysisDetails: analysisResult,
                            tables: Object.keys(analysisResult.tables || {}),
                            outputDir: outputDir,
                            files: fileVerification.files,
                            gitBranch: gitResult === null || gitResult === void 0 ? void 0 : gitResult.branchName,
                            archivePath: archiveResult === null || archiveResult === void 0 ? void 0 : archiveResult.archivePath,
                            validationResult: validationResult,
                            migrationResult: migrationResult,
                            executionSummary: executionSummary.summary,
                            completedAt: new Date().toISOString(),
                        }];
                case 17:
                    error_1 = _f.sent();
                    // Gestion des erreurs générales
                    return [2 /*return*/, {
                            status: 'error',
                            message: "Workflow failed with error: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)),
                            completedAt: new Date().toISOString(),
                        }];
                case 18: return [2 /*return*/];
            }
        });
    });
}
