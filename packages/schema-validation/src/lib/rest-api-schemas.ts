import { Type, TSchema, TObject } from '@sinclair/typebox';
import { StandardSchemas } from './standard-schemas';

/**
 * Générateur de schémas standardisés pour APIs REST
 * Permet de créer rapidement des endpoints avec une structure cohérente
 */
export class RestApiSchemas {
    /**
     * Crée un schéma de requête pour la création d'une ressource
     */
    static createRequest<T extends TObject>(dataSchema: T): TSchema {
        // Retirer les champs qui ne doivent pas être présents lors de la création
        const { id, createdAt, updatedAt, ...restSchema } = dataSchema.properties as any;

        // Créer un nouveau schéma sans les champs système
        return Type.Object(restSchema, {
            additionalProperties: false,
            $id: `Create${dataSchema.$id || 'Resource'}Request`,
        });
    }

    /**
     * Crée un schéma de requête pour la mise à jour d'une ressource
     */
    static updateRequest<T extends TObject>(dataSchema: T): TSchema {
        // Retirer les champs qui ne doivent pas être présents lors de la mise à jour
        const { id, createdAt, updatedAt, ...restSchema } = dataSchema.properties as any;

        // Rendre tous les champs optionnels pour la mise à jour partielle
        const partialSchema: Record<string, any> = {};
        for (const [key, value] of Object.entries(restSchema)) {
            partialSchema[key] = Type.Optional(value as TSchema);
        }

        return Type.Object(partialSchema, {
            additionalProperties: false,
            $id: `Update${dataSchema.$id || 'Resource'}Request`,
        });
    }

    /**
     * Crée un schéma pour la recherche filtrée d'une ressource
     */
    static searchRequest<T extends TObject>(
        filterSchema: T,
        includesPagination: boolean = true,
        includesSorting: boolean = true
    ): TSchema {
        const schemas = [filterSchema];

        if (includesPagination) {
            schemas.push(StandardSchemas.Common.Pagination);
        }

        if (includesSorting) {
            schemas.push(StandardSchemas.Common.Sorting);
        }

        return Type.Intersect(schemas, {
            $id: `Search${filterSchema.$id || 'Resource'}Request`,
        });
    }

    /**
     * Crée un schéma de réponse pour une unique ressource
     */
    static resourceResponse<T extends TSchema>(schema: T): TSchema {
        return StandardSchemas.Common.ApiResponse(schema);
    }

    /**
     * Crée un schéma de réponse pour une collection de ressources
     */
    static collectionResponse<T extends TSchema>(schema: T): TSchema {
        return StandardSchemas.Common.ApiResponse(
            StandardSchemas.Common.PaginatedResponse(schema)
        );
    }

    /**
     * Crée un ensemble complet de schémas pour un CRUD d'API REST
     */
    static createCrudSchemas<T extends TObject>(resourceSchema: T, resourceName: string): {
        resource: TSchema;
        createRequest: TSchema;
        updateRequest: TSchema;
        searchRequest: TSchema;
        resourceResponse: TSchema;
        collectionResponse: TSchema;
    } {
        // Ajouter un ID si non défini
        const resourceSchemaWithId = Type.Intersect([
            resourceSchema,
            StandardSchemas.Common.Identifier,
            StandardSchemas.Common.Timestamps,
        ], {
            $id: resourceName,
        });

        return {
            resource: resourceSchemaWithId,
            createRequest: this.createRequest(resourceSchema),
            updateRequest: this.updateRequest(resourceSchema),
            searchRequest: this.searchRequest(Type.Partial(resourceSchema)),
            resourceResponse: this.resourceResponse(resourceSchemaWithId),
            collectionResponse: this.collectionResponse(resourceSchemaWithId),
        };
    }
}