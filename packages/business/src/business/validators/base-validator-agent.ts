/**
 * BaseValidator Agent
 * Classe abstraite de base pour les validateurs d'entités
 */

import { ValidationError } from 'class-validator';
import { BaseEntity } from 'typeorm';

/**
 * Classe abstraite pour les validateurs d'entités
 * @template T Le type d'entité à valider, doit étendre BaseEntity
 */
export abstract class BaseValidator<T extends BaseEntity> {
    /**
     * Valide une entité
     * @param entity L'entité à valider
     * @returns Promise avec un tableau d'erreurs de validation
     */
    abstract validate(entity: T): Promise<ValidationError[]>;
}