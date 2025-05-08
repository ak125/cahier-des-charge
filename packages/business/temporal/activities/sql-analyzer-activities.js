"use strict";
/**
 * Activités Temporal pour SQL Analyzer & Prisma Builder
 *
 * Ces activités remplacent le workflow n8n "SQL Analyzer & Prisma Builder Workflow"
 * qui était utilisé pour analyser les structures SQL et générer des modèles Prisma.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.prepareAnalysis = prepareAnalysis;
exports.analyzeSQL = analyzeSQL;
exports.generatePrismaSchema = generatePrismaSchema;
exports.validatePrismaSchema = validatePrismaSchema;
exports.applyMigration = applyMigration;
exports.verifyGeneratedFiles = verifyGeneratedFiles;
exports.commitFilesToGit = commitFilesToGit;
exports.createArchive = createArchive;
exports.generateExecutionSummary = generateExecutionSummary;
var fs = require("fs");
var path = require("path");
var child_process_1 = require("child_process");
var util_1 = require("util");
// Utilitaires
var execPromise = (0, util_1.promisify)(child_process_1.exec);
var mkdirPromise = (0, util_1.promisify)(fs.mkdir);
var writeFilePromise = (0, util_1.promisify)(fs.writeFile);
var readFilePromise = (0, util_1.promisify)(fs.readFile);
/**
 * Prépare la configuration et crée le répertoire de sortie
 */
function prepareAnalysis(input) {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = __assign(__assign({}, input), { databaseName: input.databaseName || 'application_db', outputDir: input.outputDir || "/workspaces/cahier-des-charge/reports/sql-audit-".concat(new Date().toISOString().replace(/:/g, '-').split('.')[0]), schemaOnly: input.schemaOnly !== false, generatePrisma: input.generatePrisma !== false, analyzePerformance: input.analyzePerformance !== false, excludeTables: input.excludeTables || ['migrations', 'schema_migrations', 'ar_internal_metadata'] });
                    // Vérification de la connexion
                    if (!config.connectionString) {
                        throw new Error("URL de connexion à la base de données non spécifiée");
                    }
                    if (!config.databaseName) {
                        throw new Error("Nom de la base de données non spécifié");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mkdirPromise(config.outputDir, { recursive: true })];
                case 2:
                    _a.sent();
                    console.log("R\u00E9pertoire de sortie cr\u00E9\u00E9: ".concat(config.outputDir));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    throw new Error("Erreur lors de la cr\u00E9ation du r\u00E9pertoire de sortie: ".concat(error_1.message));
                case 4: return [2 /*return*/, { config: config, outputDir: config.outputDir }];
            }
        });
    });
}
/**
 * Analyse les structures de tables SQL
 */
function analyzeSQL(input) {
    return __awaiter(this, void 0, void 0, function () {
        var cmd, _a, stdout, stderr, schemaFilePath, schemaContent, schemaData, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Analyzing SQL structure for ".concat(input.dialect, " database: ").concat(input.databaseName));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    cmd = "cd /workspaces/cahier-des-charge && ts-node migrations/legacy/migration-2025-04-18/agents/migration/sql-analyzer+prisma-builder.ts --connection=\"".concat(input.connectionString, "\" --database=\"").concat(input.databaseName, "\" --output-dir=\"").concat(input.outputDir, "\" --schema-only=").concat(input.schemaOnly === false ? 'false' : 'true', " ").concat(input.excludeTables ? "--exclude-tables=\"".concat(input.excludeTables.join(','), "\"") : '');
                    console.log("Ex\u00E9cution de la commande: ".concat(cmd));
                    return [4 /*yield*/, execPromise(cmd, { timeout: 600000 })];
                case 2:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr) {
                        console.warn("Avertissements lors de l'analyse SQL: ".concat(stderr));
                    }
                    schemaFilePath = path.join(input.outputDir, 'mysql_schema_map.json');
                    if (!fs.existsSync(schemaFilePath)) {
                        throw new Error("L'analyse n'a pas g\u00E9n\u00E9r\u00E9 le fichier de sch\u00E9ma: ".concat(schemaFilePath));
                    }
                    return [4 /*yield*/, readFilePromise(schemaFilePath, 'utf8')];
                case 3:
                    schemaContent = _b.sent();
                    schemaData = JSON.parse(schemaContent);
                    // Construire le résultat de l'analyse
                    return [2 /*return*/, {
                            tables: schemaData.tables || [],
                            relationships: schemaData.relationships || [],
                            dialect: input.dialect,
                            metadata: {
                                analyzedAt: new Date().toISOString(),
                                databaseName: input.databaseName,
                                schemaName: input.schema,
                                totalTables: Object.keys(schemaData.tables || {}).length,
                                totalColumns: Object.values(schemaData.tables || {}).reduce(function (count, table) {
                                    return count + Object.keys(table.columns || {}).length;
                                }, 0),
                                totalRelationships: (schemaData.relationships || []).length
                            }
                        }];
                case 4:
                    error_2 = _b.sent();
                    console.error("Erreur lors de l'analyse SQL: ".concat(error_2));
                    throw new Error("Erreur lors de l'analyse SQL: ".concat(error_2.message));
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Génère un schéma Prisma à partir d'une analyse SQL
 */
function generatePrismaSchema(input) {
    return __awaiter(this, void 0, void 0, function () {
        var prismaFilePath, prismaSchema, modelCount, enumCount, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Generating Prisma schema with ".concat(input.analysis.tables.length, " tables"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    prismaFilePath = path.join(input.outputDir, 'prisma_models.suggestion.prisma');
                    if (!fs.existsSync(prismaFilePath)) {
                        throw new Error("Le fichier Prisma n'a pas \u00E9t\u00E9 g\u00E9n\u00E9r\u00E9: ".concat(prismaFilePath));
                    }
                    return [4 /*yield*/, readFilePromise(prismaFilePath, 'utf8')];
                case 2:
                    prismaSchema = _a.sent();
                    modelCount = (prismaSchema.match(/model\s+\w+\s+{/g) || []).length;
                    enumCount = (prismaSchema.match(/enum\s+\w+\s+{/g) || []).length;
                    return [2 /*return*/, {
                            schema: prismaSchema,
                            models: modelCount,
                            enums: enumCount,
                            generatedAt: new Date().toISOString()
                        }];
                case 3:
                    error_3 = _a.sent();
                    console.error("Erreur lors de la g\u00E9n\u00E9ration du sch\u00E9ma Prisma: ".concat(error_3));
                    throw new Error("Erreur lors de la g\u00E9n\u00E9ration du sch\u00E9ma Prisma: ".concat(error_3.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Valide un schéma Prisma généré
 */
function validatePrismaSchema(input) {
    return __awaiter(this, void 0, void 0, function () {
        var tempSchemaPath, cmd, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Validating Prisma schema");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    tempSchemaPath = path.join(input.outputDir, 'temp_schema_for_validation.prisma');
                    return [4 /*yield*/, writeFilePromise(tempSchemaPath, input.schema)];
                case 2:
                    _a.sent();
                    cmd = "cd ".concat(input.outputDir, " && npx prisma validate --schema=").concat(tempSchemaPath);
                    return [4 /*yield*/, execPromise(cmd)];
                case 3:
                    _a.sent();
                    // Si aucune erreur n'est lancée, la validation est réussie
                    return [2 /*return*/, {
                            success: true,
                            warnings: []
                        }];
                case 4:
                    error_4 = _a.sent();
                    // Erreur de validation du schéma
                    return [2 /*return*/, {
                            success: false,
                            error: error_4.message,
                            warnings: [error_4.stdout]
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Applique une migration Prisma
 */
function applyMigration(input) {
    return __awaiter(this, void 0, void 0, function () {
        var prismaTempDir, schemaPath, envPath, cmd, _a, stdout, stderr, warnings, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Applying Prisma migration in ".concat(input.options.mode, " mode"));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    prismaTempDir = path.join(input.outputDir, 'prisma-migration-temp');
                    return [4 /*yield*/, mkdirPromise(prismaTempDir, { recursive: true })];
                case 2:
                    _b.sent();
                    schemaPath = path.join(prismaTempDir, 'schema.prisma');
                    envPath = path.join(prismaTempDir, '.env');
                    // Écrire le schéma Prisma
                    return [4 /*yield*/, writeFilePromise(schemaPath, input.schema)];
                case 3:
                    // Écrire le schéma Prisma
                    _b.sent();
                    // Écrire le fichier .env avec la connexion à la base de données
                    return [4 /*yield*/, writeFilePromise(envPath, "DATABASE_URL=\"".concat(input.connectionString, "\""))];
                case 4:
                    // Écrire le fichier .env avec la connexion à la base de données
                    _b.sent();
                    cmd = "cd ".concat(prismaTempDir, " && npx prisma");
                    switch (input.options.mode) {
                        case 'dev':
                            cmd += " migrate dev --name migration_".concat(Date.now());
                            break;
                        case 'deploy':
                            cmd += ' migrate deploy';
                            break;
                        case 'reset':
                            cmd += ' migrate reset';
                            break;
                        case 'push':
                            cmd += ' db push';
                            break;
                        default:
                            throw new Error("Mode de migration non support\u00E9: ".concat(input.options.mode));
                    }
                    if (input.options.force) {
                        cmd += ' --force';
                    }
                    if (input.options.skipSeed) {
                        cmd += ' --skip-seed';
                    }
                    return [4 /*yield*/, execPromise(cmd)];
                case 5:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    warnings = stderr ? [stderr] : [];
                    return [2 /*return*/, {
                            success: true,
                            migrationId: "migration_".concat(Date.now()),
                            appliedSteps: 1,
                            warnings: warnings,
                            details: { stdout: stdout, stderr: stderr }
                        }];
                case 6:
                    error_5 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_5.message,
                            warnings: [error_5.stderr],
                            details: { error: error_5.toString() }
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Vérifie que tous les fichiers attendus ont été générés
 */
function verifyGeneratedFiles(input) {
    return __awaiter(this, void 0, void 0, function () {
        var expectedFiles, existingFiles, missingFiles, _i, expectedFiles_1, file, filePath, success;
        return __generator(this, function (_a) {
            console.log("V\u00E9rification des fichiers g\u00E9n\u00E9r\u00E9s dans: ".concat(input.outputDir));
            expectedFiles = input.expectedFiles || [
                'mysql_schema_map.json',
                'sql_analysis.md',
                'prisma_models.suggestion.prisma',
                'schema_migration_diff.json',
                'migration_plan.md',
                'entity_graph.json',
                'sql_index_suggestions.sql',
                'sql_backlog.json'
            ];
            existingFiles = [];
            missingFiles = [];
            for (_i = 0, expectedFiles_1 = expectedFiles; _i < expectedFiles_1.length; _i++) {
                file = expectedFiles_1[_i];
                filePath = path.join(input.outputDir, file);
                if (fs.existsSync(filePath)) {
                    existingFiles.push(file);
                }
                else {
                    missingFiles.push(file);
                }
            }
            success = missingFiles.length === 0;
            return [2 /*return*/, {
                    success: success,
                    files: existingFiles,
                    missing: missingFiles
                }];
        });
    });
}
/**
 * Commit les fichiers générés dans Git
 */
function commitFilesToGit(input) {
    return __awaiter(this, void 0, void 0, function () {
        var timestamp, branchName, commitMessage, commands, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Commit des fichiers g\u00E9n\u00E9r\u00E9s dans Git");
                    timestamp = new Date().toISOString().slice(0, 10);
                    branchName = input.branchName || "audit-sql-".concat(timestamp);
                    commitMessage = input.commitMessage || 'Audit SQL et génération de modèles Prisma automatisés';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    commands = [
                        "cd /workspaces/cahier-des-charge",
                        "git checkout -b ".concat(branchName),
                        "git add ".concat(input.outputDir, "/*"),
                        "git commit -m \"".concat(commitMessage, "\"")
                    ];
                    // Exécuter les commandes
                    return [4 /*yield*/, execPromise(commands.join(' && '))];
                case 2:
                    // Exécuter les commandes
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            branchName: branchName
                        }];
                case 3:
                    error_6 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            branchName: branchName,
                            message: error_6.message
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Créer une archive des fichiers générés
 */
function createArchive(input) {
    return __awaiter(this, void 0, void 0, function () {
        var archivePath, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Cr\u00E9ation d'une archive des fichiers g\u00E9n\u00E9r\u00E9s");
                    archivePath = "".concat(input.outputDir, ".zip");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Créer l'archive
                    return [4 /*yield*/, execPromise("cd /workspaces/cahier-des-charge && zip -r ".concat(archivePath, " ").concat(input.outputDir, "/*"))];
                case 2:
                    // Créer l'archive
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            archivePath: archivePath
                        }];
                case 3:
                    error_7 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            archivePath: archivePath,
                            error: error_7.message
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Créer un résumé de l'exécution
 */
function generateExecutionSummary(input) {
    return __awaiter(this, void 0, void 0, function () {
        var summary, summaryPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("G\u00E9n\u00E9ration du r\u00E9sum\u00E9 d'ex\u00E9cution");
                    summary = {
                        success: true,
                        timestamp: new Date().toISOString(),
                        database: input.config.databaseName,
                        outputDirectory: input.outputDir,
                        filesGenerated: input.files,
                        gitBranch: input.branchName
                    };
                    summaryPath = path.join(input.outputDir, 'execution_summary.json');
                    // Sauvegarder le résumé
                    return [4 /*yield*/, writeFilePromise(summaryPath, JSON.stringify(summary, null, 2))];
                case 1:
                    // Sauvegarder le résumé
                    _a.sent();
                    return [2 /*return*/, {
                            summary: summary,
                            summaryPath: summaryPath
                        }];
            }
        });
    });
}
