import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Service de base pour l'intégration Prisma/Zod
 * 
 * Utilise Prisma comme source unique de vérité et les schémas Zod générés
 * automatiquement pour la validation des données.
 */
export class PrismaService<
  TModel extends object,
  TCreate extends object,
  TUpdate extends object
> {
  constructor(
    protected prisma: PrismaClient,
    protected modelName: keyof PrismaClient & string,
    protected schemas: {
      create: z.ZodType<TCreate>,
      update: z.ZodType<TUpdate>
    }
  ) {}

  /**
   * Récupère une entité par son identifiant
   */
  async findById(id: string | number): Promise<TModel | null> {
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].findUnique({
      where: { id }
    });
  }

  /**
   * Récupère toutes les entités
   */
  async findAll(options: { where?: any, include?: any, orderBy?: any } = {}): Promise<TModel[]> {
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].findMany(options);
  }

  /**
   * Crée une nouvelle entité avec validation Zod
   */
  async create(data: unknown): Promise<TModel> {
    // Validation des données d'entrée avec le schéma Zod
    const validated = this.schemas.create.parse(data);
    
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].create({
      data: validated
    });
  }

  /**
   * Met à jour une entité existante avec validation Zod
   */
  async update(id: string | number, data: unknown): Promise<TModel> {
    // Validation des données d'entrée avec le schéma Zod
    const validated = this.schemas.update.parse(data);
    
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].update({
      where: { id },
      data: validated
    });
  }

  /**
   * Supprime une entité
   */
  async delete(id: string | number): Promise<TModel> {
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].delete({
      where: { id }
    });
  }

  /**
   * Compte les entités selon un critère optionnel
   */
  async count(where: any = {}): Promise<number> {
    // @ts-ignore - Accès dynamique au modèle Prisma
    return this.prisma[this.modelName].count({ where });
  }
}