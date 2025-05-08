import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Service pour assurer la cohérence des types entre Prisma et Zod
 */
@Injectable()
export class TypeConsistencyService {
    private readonly logger = new Logger('TypeConsistencyService');

    constructor(
        private readonly prismaService: PrismaService,
        @Inject('PRISMA_ZOD_OPTIONS')
        private readonly options: {
            strictTypeChecking: boolean;
            enableAutomaticDTOGeneration: boolean;
            schemasPath: string;
            dtosPath: string;
        }
    ) { }

    /**
     * Vérifie la cohérence des types pour une entité
     * @param data Les données à valider
     * @param modelName Le nom du modèle Prisma
     * @returns Les données validées
     */
    async validateType<T>(data: T, modelName: string): Promise<T> {
        try {
            // Importer dynamiquement le validateur pour le modèle spécifié
            const validators = await this.loadValidators();
            const modelValidator = validators[`${modelName}Validator`];

            if (!modelValidator) {
                this.logger.warn(
                    `Aucun validateur trouvé pour le modèle ${modelName}. Vérifiez que les schémas ont été générés.`
                );
                return data;
            }

            // Utiliser le validateur pour valider les données
            const validationResult = modelValidator.safeParse(data);

            if (!validationResult.success) {
                if (this.options.strictTypeChecking) {
                    this.logger.error(
                        `Erreur de validation pour ${modelName}: ${JSON.stringify(validationResult.error)}`,
                    );
                    throw new Error(`Erreur de validation pour ${modelName}`);
                } else {
                    this.logger.warn(
                        `Incohérence de types détectée pour ${modelName}: ${JSON.stringify(validationResult.error)}`
                    );
                }
            }

            return data;
        } catch (error) {
            if (this.options.strictTypeChecking) {
                throw error;
            }
            this.logger.error(`Erreur lors de la validation des types: ${error.message}`);
            return data;
        }
    }

    /**
     * Valide les données avant insertion dans la base de données
     * @param data Les données à valider
     * @param modelName Le nom du modèle Prisma
     * @returns Les données validées
     */
    async validateCreate<T>(data: T, modelName: string): Promise<T> {
        try {
            // Importer dynamiquement le validateur pour le modèle spécifié
            const validators = await this.loadValidators();
            const modelValidator = validators[`${modelName}Validator`];

            if (!modelValidator) {
                return data;
            }

            // Utiliser le validateur pour valider les données de création
            const validationResult = modelValidator.validateCreate
                ? modelValidator.validateCreate(data)
                : modelValidator.safeParse(data);

            if (!validationResult.success) {
                if (this.options.strictTypeChecking) {
                    throw new Error(`Erreur de validation pour la création de ${modelName}`);
                }
                this.logger.warn(
                    `Incohérence de types détectée lors de la création de ${modelName}`
                );
            }

            return data;
        } catch (error) {
            if (this.options.strictTypeChecking) {
                throw error;
            }
            return data;
        }
    }

    /**
     * Valide les données avant mise à jour dans la base de données
     * @param data Les données à valider
     * @param modelName Le nom du modèle Prisma
     * @returns Les données validées
     */
    async validateUpdate<T>(data: T, modelName: string): Promise<T> {
        try {
            // Importer dynamiquement le validateur pour le modèle spécifié
            const validators = await this.loadValidators();
            const modelValidator = validators[`${modelName}Validator`];

            if (!modelValidator) {
                return data;
            }

            // Utiliser le validateur pour valider les données de mise à jour
            const validationResult = modelValidator.validateUpdate
                ? modelValidator.validateUpdate(data)
                : modelValidator.safeParse(data);

            if (!validationResult.success) {
                if (this.options.strictTypeChecking) {
                    throw new Error(`Erreur de validation pour la mise à jour de ${modelName}`);
                }
                this.logger.warn(
                    `Incohérence de types détectée lors de la mise à jour de ${modelName}`
                );
            }

            return data;
        } catch (error) {
            if (this.options.strictTypeChecking) {
                throw error;
            }
            return data;
        }
    }

    /**
     * Charge tous les validateurs générés dynamiquement
     */
    private async loadValidators(): Promise<Record<string, any>> {
        try {
            // Dynamiquement importer tous les validateurs
            const validatorsPath = `${this.options.schemasPath}/validators`;
            return await import(validatorsPath);
        } catch (error) {
            this.logger.error(`Impossible de charger les validateurs: ${error.message}`);
            return {};
        }
    }

    /**
     * Vérifie que les types correspondent au schéma Prisma pour une liste d'objets
     */
    async validateBatch<T>(data: T[], modelName: string): Promise<T[]> {
        // Pour des raisons de performance, on ne valide que le premier élément en mode non-strict
        if (!this.options.strictTypeChecking && data.length > 0) {
            await this.validateType(data[0], modelName);
            return data;
        }

        // En mode strict, on valide tous les éléments
        return Promise.all(data.map(item => this.validateType(item, modelName)));
    }
}