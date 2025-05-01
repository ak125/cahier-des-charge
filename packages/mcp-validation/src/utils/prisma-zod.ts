/**
 * Utilitaires pour intégrer Prisma avec Zod
 */
import { z } from 'zod';

/**
 * Génère un schéma Zod à partir d'un modèle Prisma
 * @param prismaModel Le modèle Prisma (type générique)
 * @param overrides Surcharge de certains champs du modèle
 */
export function createZodSchemaFromPrisma<T>(
    prismaModel: any,
    overrides: { [key: string]: z.ZodType<any> } = {}
): z.ZodType<T> {
    // Créer un schéma vide 
    let schema: any = {};

    // Récupérer les noms des champs à partir de la réflexion sur le modèle
    // Note: Ceci est une simplification - dans la pratique, il faudrait utiliser une approche
    // plus robuste pour extraire les types de Prisma
    const fields = Object.keys(prismaModel.fields || {});

    // Construire un schéma de base pour chaque champ
    fields.forEach(field => {
        const fieldType = prismaModel.fields[field].type;
        const isRequired = !prismaModel.fields[field].isNullable;

        // Utiliser l'override s'il est défini
        if (overrides[field]) {
            schema[field] = overrides[field];
            return;
        }

        // Déterminer le type Zod en fonction du type Prisma
        switch (fieldType) {
            case 'String':
                schema[field] = isRequired ? z.string() : z.string().nullable();
                break;
            case 'Int':
                schema[field] = isRequired ? z.number().int() : z.number().int().nullable();
                break;
            case 'Float':
                schema[field] = isRequired ? z.number() : z.number().nullable();
                break;
            case 'Boolean':
                schema[field] = isRequired ? z.boolean() : z.boolean().nullable();
                break;
            case 'DateTime':
                schema[field] = isRequired
                    ? z.date().or(z.string().refine(val => !isNaN(Date.parse(val))))
                    : z.date().or(z.string().refine(val => !isNaN(Date.parse(val)))).nullable();
                break;
            case 'Json':
                schema[field] = z.any();
                break;
            default:
                // Pour les relations et autres types complexes
                schema[field] = z.any();
        }
    });

    return z.object(schema) as z.ZodType<T>;
}

/**
 * Crée un schéma Zod à partir d'une fonction Prisma
 * Exemple: createZodSchemaFromPrismaFunction(prisma.user.findMany)
 */
export function createZodSchemaFromPrismaFunction<T>(prismaFunction: Function): z.ZodType<T> {
    // Cette fonction est une simplification pour illustrer le concept
    // Dans une implémentation réelle, nous utiliserions des métadonnées ou une introspection
    // pour déterminer le type de retour de la fonction Prisma

    // Par défaut, on utilise un schéma qui accepte n'importe quoi
    // L'idéal serait de générer le schéma en fonction du modèle réellement utilisé
    return z.any() as z.ZodType<T>;
}

/**
 * Valide des données avec un schéma Zod et les convertit pour Prisma
 */
export function validateForPrisma<T>(
    data: any,
    schema: z.ZodType<T>
): { valid: boolean; data?: T; errors?: z.ZodError } {
    try {
        const validatedData = schema.parse(data);
        return { valid: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, errors: error };
        }
        throw error;
    }
}