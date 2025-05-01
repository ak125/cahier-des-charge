/**
 * Générateur de schémas Zod pour MCP 2.0
 */
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options pour la génération de schémas
 */
export interface SchemaGeneratorOptions {
    /**
     * Chemin où seront enregistrés les schémas générés
     */
    outputDir: string;

    /**
     * Préfixe pour les noms de fichiers
     */
    filePrefix?: string;

    /**
     * Suffixe pour les noms de fichiers
     */
    fileSuffix?: string;

    /**
     * Si vrai, génère des fichiers TypeScript avec les types
     */
    generateTypes?: boolean;
}

/**
 * Générateur de schémas Zod
 */
export class SchemaGenerator {
    private options: SchemaGeneratorOptions;

    constructor(options: SchemaGeneratorOptions) {
        this.options = {
            filePrefix: '',
            fileSuffix: '.schema',
            generateTypes: true,
            ...options
        };

        // S'assurer que le répertoire de sortie existe
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
    }

    /**
     * Génère un fichier de schéma Zod à partir d'un schéma existant
     */
    generateSchemaFile(
        name: string,
        schema: z.ZodType<any>,
        description: string = ''
    ): string {
        const { filePrefix, fileSuffix, outputDir, generateTypes } = this.options;
        const fileName = `${filePrefix}${name}${fileSuffix}.ts`;
        const filePath = path.join(outputDir, fileName);

        // Créer le contenu du fichier
        const lines = [
            `/**`,
            ` * Schéma Zod généré pour ${name}`,
            ` * ${description}`,
            ` * Généré automatiquement par SchemaGenerator`,
            ` */`,
            ``,
            `import { z } from 'zod';`,
            ``,
            `export const ${name}Schema = ${this.zodSchemaToString(schema)};`,
            ``
        ];

        // Ajouter la génération de type si demandé
        if (generateTypes) {
            lines.push(`export type ${name} = z.infer<typeof ${name}Schema>;`, ``);
        }

        // Écrire le fichier
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

        return filePath;
    }

    /**
     * Convertit un schéma Zod en chaîne pour l'exportation
     * Note: Cette implémentation est très simplifiée et ne gère pas tous les cas
     */
    private zodSchemaToString(schema: z.ZodType<any>): string {
        // Ceci est une implémentation simplifiée pour les démonstrations
        // Une implémentation réelle nécessiterait une approche plus sophistiquée
        // pour analyser la structure du schéma Zod

        if (schema instanceof z.ZodObject) {
            return `z.object({
  // Remplacez cette structure avec votre définition de schéma réelle
})`;
        } else if (schema instanceof z.ZodArray) {
            return `z.array(/* définition de l'élément */)`;
        } else if (schema instanceof z.ZodString) {
            return `z.string()`;
        } else if (schema instanceof z.ZodNumber) {
            return `z.number()`;
        } else if (schema instanceof z.ZodBoolean) {
            return `z.boolean()`;
        } else if (schema instanceof z.ZodEnum) {
            return `z.enum([/* valeurs de l'enum */])`;
        } else if (schema instanceof z.ZodNullable) {
            return `z.nullable(/* type intérieur */)`;
        } else if (schema instanceof z.ZodOptional) {
            return `z.optional(/* type intérieur */)`;
        } else {
            return `z.any()`;
        }
    }

    /**
     * Génère un schéma d'agent MCP complet avec input et output
     */
    generateAgentSchema(
        agentName: string,
        inputSchema: z.ZodType<any>,
        outputSchema: z.ZodType<any>,
        description: string = ''
    ): { inputPath: string; outputPath: string } {
        // Générer le schéma d'entrée
        const inputPath = this.generateSchemaFile(
            `${agentName}Input`,
            inputSchema,
            `Schéma d'entrée pour l'agent ${agentName}. ${description}`
        );

        // Générer le schéma de sortie
        const outputPath = this.generateSchemaFile(
            `${agentName}Output`,
            outputSchema,
            `Schéma de sortie pour l'agent ${agentName}. ${description}`
        );

        return { inputPath, outputPath };
    }
}