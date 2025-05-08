/**
 * Point d'entrée principal pour le mapping des types entre MySQL, PostgreSQL et Prisma
 */
import * as fs from 'fs/promises';
import {
    Table,
    Column,
    TypeMappingConfig,
    TypeMappingResult,
    TableMappingResult,
    EnumType,
    TypeAnomalies,
    ColumnMappingResult,
    ForeignKeyMappingResult,
    IndexMappingResult,
    TypeMappingError,
    TypeMappingWarning,
    PrismaSchemaOptions,
    MarkdownDocOptions
} from './types';
import { TypeConverter } from './converters/type-converter';
import { MySQLSchemaAnalyzer } from './analyzers/mysql-schema-analyzer';
import { PrismaGenerator } from './generators/prisma-generator';
import { MarkdownGenerator } from './generators/markdown-generator';

/**
 * Classe principale pour le mapping de types entre MySQL, PostgreSQL et Prisma
 */
export class TypeMapper {
    private analyzer: MySQLSchemaAnalyzer;
    private converter: TypeConverter;
    private prismaGenerator: PrismaGenerator;
    private markdownGenerator: MarkdownGenerator;
    private config: TypeMappingConfig;
    private version: string = '1.0.0';

    /**
     * Constructeur
     * @param config Configuration initiale
     */
    constructor(config: TypeMappingConfig = {}) {
        this.analyzer = new MySQLSchemaAnalyzer();
        this.converter = new TypeConverter();
        this.prismaGenerator = new PrismaGenerator();
        this.markdownGenerator = new MarkdownGenerator();
        this.config = config;
    }

    /**
     * Configure les options de mapping
     * @param config Options de configuration à mettre à jour
     */
    public configure(config: Partial<TypeMappingConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Analyse le schéma MySQL et génère les mappings
     * @param source Source du schéma (chemin de fichier ou nom de base de données)
     * @returns Résultat du mapping
     */
    public async analyze(source?: string): Promise<TypeMappingResult> {
        // Source à utiliser (paramètre ou configuration)
        const sourceToUse = source || this.config.mysqlSchemaPath;

        if (!sourceToUse && !this.config.databaseName) {
            throw new Error('Aucune source spécifiée pour l\'analyse du schéma MySQL');
        }

        let tables: Table[];
        const errors: TypeMappingError[] = [];
        const warnings: TypeMappingWarning[] = [];

        try {
            // Analyser le schéma depuis un fichier ou une base de données
            if (sourceToUse && sourceToUse.endsWith('.sql')) {
                tables = await this.analyzer.analyzeFromFile(sourceToUse);
            } else if (this.config.databaseName) {
                if (!this.config.databaseHost || !this.config.databaseUser) {
                    throw new Error('Informations de connexion à la base de données incomplètes');
                }

                tables = await this.analyzer.analyzeFromDatabase({
                    host: this.config.databaseHost,
                    port: this.config.databasePort,
                    user: this.config.databaseUser,
                    password: this.config.databasePassword || '',
                    database: this.config.databaseName
                });
            } else {
                throw new Error('Source de schéma non valide ou insuffisante');
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Erreur inconnue lors de l\'analyse du schéma MySQL';
            errors.push({ message: errorMessage });
            tables = [];
        }

        // Analyser chaque table pour générer les mappings
        const mappedTables: TableMappingResult[] = [];
        const enums: EnumType[] = [];
        const allAnomalies: TypeAnomalies[] = [];

        // Rechercher les types ENUM à traiter spécifiquement
        tables.forEach(table => {
            table.columns.forEach(column => {
                if (column.type.toUpperCase().startsWith('ENUM(')) {
                    try {
                        const typeInfo = this.converter.extractTypeSizeInfo(column.type);
                        if (typeInfo.values && typeInfo.values.length > 0) {
                            // Générer un nom pour l'enum basé sur la table et la colonne
                            const enumName = `${table.name}_${column.name}_enum`;

                            enums.push({
                                name: enumName,
                                values: typeInfo.values,
                                originalColumn: {
                                    table: table.name,
                                    column: column.name,
                                    type: column.type
                                }
                            });
                        }
                    } catch (error) {
                        warnings.push({
                            message: `Impossible d'extraire les valeurs de l'enum: ${error}`,
                            table: table.name,
                            column: column.name,
                            type: column.type
                        });
                    }
                }
            });
        });

        // Mapper chaque table
        tables.forEach(table => {
            const tableAnomalies: TypeAnomalies[] = [];

            // Mapper les colonnes
            const mappedColumns: ColumnMappingResult[] = table.columns.map(column => {
                // Détecter les potentielles anomalies
                const anomaly = this.converter.detectTypeAnomaly(column, table);
                if (anomaly) {
                    tableAnomalies.push(anomaly);
                    allAnomalies.push(anomaly);
                }

                // Mapper le type MySQL vers PostgreSQL et Prisma
                const typeMapping = this.converter.mapType(column.type);

                return {
                    mysqlName: column.name,
                    mysqlType: column.type,
                    postgresName: column.name,
                    postgresType: typeMapping.postgres,
                    prismaField: this.toCamelCase(column.name),
                    prismaType: typeMapping.prisma,
                    nullable: column.nullable,
                    defaultValue: column.defaultValue || undefined,
                    comment: column.comment
                };
            });

            // Mapper les clés étrangères si présentes
            const mappedForeignKeys = table.foreignKeys?.map(fk => {
                const mappedFK: ForeignKeyMappingResult = {
                    mysqlName: fk.name,
                    postgresName: fk.name,
                    columns: fk.columns,
                    referencedTable: fk.referencedTable,
                    referencedColumns: fk.referencedColumns,
                    onUpdate: fk.onUpdate,
                    onDelete: fk.onDelete
                };

                return mappedFK;
            });

            // Mapper les index si présents
            const mappedIndexes = table.indexes?.map(index => {
                const mappedIndex: IndexMappingResult = {
                    mysqlName: index.name,
                    postgresName: index.name,
                    columns: index.columns,
                    unique: index.unique,
                    type: index.type
                };

                return mappedIndex;
            });

            // Créer le mapping de la table complète
            const mappedTable: TableMappingResult = {
                mysqlName: table.name,
                postgresName: table.name,
                prismaModel: this.toPascalCase(table.name),
                columns: mappedColumns,
                primaryKey: table.primaryKey,
                foreignKeys: mappedForeignKeys,
                indexes: mappedIndexes,
                anomalies: tableAnomalies.length > 0 ? tableAnomalies : undefined
            };

            mappedTables.push(mappedTable);
        });

        // Créer le résultat final du mapping
        const result: TypeMappingResult = {
            tables: mappedTables,
            enums,
            errors,
            warnings,
            timestamp: new Date().toISOString(),
            version: this.version
        };

        return result;
    }

    /**
     * Génère un schéma Prisma à partir des résultats de mapping
     * @param mappingResult Résultat du mapping
     * @param options Options de génération
     * @returns Schéma Prisma sous forme de chaîne de caractères
     */
    public generatePrismaSchema(
        mappingResult: TypeMappingResult,
        options: PrismaSchemaOptions = {}
    ): string {
        return this.prismaGenerator.generateSchema(
            mappingResult.tables,
            mappingResult.enums,
            options
        );
    }

    /**
     * Génère une documentation Markdown à partir des résultats de mapping
     * @param mappingResult Résultat du mapping
     * @param options Options de génération
     * @returns Documentation Markdown sous forme de chaîne de caractères
     */
    public generateMarkdownDoc(
        mappingResult: TypeMappingResult,
        options: MarkdownDocOptions = {}
    ): string {
        // Extraire toutes les anomalies des tables
        const allAnomalies = mappingResult.tables
            .filter(t => t.anomalies && t.anomalies.length > 0)
            .flatMap(t => t.anomalies!);

        return this.markdownGenerator.generateDocumentation(
            mappingResult.tables,
            allAnomalies,
            options
        );
    }

    /**
     * Sauvegarde les résultats du mapping dans des fichiers
     * @param mappingResult Résultat du mapping
     * @param outputPaths Chemins des fichiers de sortie
     */
    public async saveResults(
        mappingResult: TypeMappingResult,
        outputPaths?: {
            jsonPath?: string;
            prismaPath?: string;
            markdownPath?: string;
        }
    ): Promise<void> {
        const {
            jsonPath = this.config.outputJsonPath,
            prismaPath = this.config.outputPrismaPath,
            markdownPath = this.config.outputMarkdownPath
        } = outputPaths || {};

        // Sauvegarder le résultat JSON si un chemin est spécifié
        if (jsonPath) {
            await fs.writeFile(
                jsonPath,
                JSON.stringify(mappingResult, null, 2),
                'utf8'
            );
        }

        // Sauvegarder le schéma Prisma si un chemin est spécifié
        if (prismaPath) {
            const prismaSchema = this.generatePrismaSchema(mappingResult);
            await fs.writeFile(prismaPath, prismaSchema, 'utf8');
        }

        // Sauvegarder la documentation Markdown si un chemin est spécifié
        if (markdownPath) {
            const markdownDoc = this.generateMarkdownDoc(mappingResult);
            await fs.writeFile(markdownPath, markdownDoc, 'utf8');
        }
    }

    /**
     * Détecte les énumérations dans les tables
     * @param tables Tables à analyser
     * @returns Liste des énumérations détectées
     */
    private detectEnums(tables: Table[]): EnumType[] {
        const enums: EnumType[] = [];

        tables.forEach(table => {
            table.columns.forEach(column => {
                if (column.type.toUpperCase().startsWith('ENUM(')) {
                    const typeInfo = this.converter.extractTypeSizeInfo(column.type);
                    if (typeInfo.values && typeInfo.values.length > 0) {
                        enums.push({
                            name: `${table.name}_${column.name}_enum`,
                            values: typeInfo.values,
                            originalColumn: {
                                table: table.name,
                                column: column.name,
                                type: column.type
                            }
                        });
                    }
                }
            });
        });

        return enums;
    }

    /**
     * Convertit une chaîne en format camelCase
     */
    private toCamelCase(str: string): string {
        return str
            .replace(/[_\s-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (_, c) => c.toLowerCase());
    }

    /**
     * Convertit une chaîne en format PascalCase
     */
    private toPascalCase(str: string): string {
        return str
            .replace(/[_\s-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (_, c) => c.toUpperCase());
    }
}