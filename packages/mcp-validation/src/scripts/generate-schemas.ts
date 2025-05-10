/**
 * Script pour générer automatiquement les schémas Zod à partir des modèles Prisma
 */
import * as path from 'path';
import { SchemaGenerator } from '../generators/schema-generator';
import { PrismaClient } from '@prisma/client';
import { createZodSchemaFromPrisma } from ..@cahier-des-charge/coordination/src/utils/prisma-zod';
import { z } from 'zod';

// Chemin où seront stockés les schémas générés
const OUTPUT_DIR = path.resolve(__dirname, '../../src/schemas/generated');

async function generateSchemasFromPrisma() {
    console.log('Génération des schémas Zod à partir des modèles Prisma...');

    // Initialiser le générateur de schémas
    const generator = new SchemaGenerator({
        outputDir: OUTPUT_DIR,
        filePrefix: '',
        fileSuffix: '.schema',
        generateTypes: true,
    });

    try {
        // Initialiser le client Prisma
        const prisma = new PrismaClient();

        // Liste des modèles à traiter (à adapter selon vos besoins)
        const modelsMap: Record<string, any> = {
            // Ajouter vos modèles Prisma ici
            // Exemple: 'User': prisma.user,
            // 'Post': prisma.post,
            // etc.
        };

        // Générer un schéma pour chaque modèle
        for (const [modelName, model] of Object.entries(modelsMap)) {
            console.log(`Génération du schéma pour ${modelName}...`);

            try {
                // Créer un schéma Zod à partir du modèle Prisma
                const schema = createZodSchemaFromPrisma(model);

                // Générer le fichier de schéma
                const filePath = generator.generateSchemaFile(
                    modelName,
                    schema,
                    `Schéma généré à partir du modèle Prisma ${modelName}`
                );

                console.log(`Schéma ${modelName} généré avec succès: ${filePath}`);
            } catch (error) {
                console.error(`Erreur lors de la génération du schéma pour ${modelName}:`, error);
            }
        }

        // Fermer la connexion Prisma
        await prisma.$disconnect();

        console.log('Génération des schémas terminée avec succès!');
    } catch (error) {
        console.error('Erreur lors de la génération des schémas:', error);
        process.exit(1);
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    generateSchemasFromPrisma().catch(error => {
        console.error('Erreur non gérée:', error);
        process.exit(1);
    });
}

export { generateSchemasFromPrisma };
