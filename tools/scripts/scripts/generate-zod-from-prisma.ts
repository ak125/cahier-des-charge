#!/usr/bin/env ts-node
/**
 * Générateur de schémas Zod à partir des modèles Prisma
 * Ce script génère automatiquement les schémas Zod à partir des modèles Prisma
 * pour assurer une source unique de vérité pour les types et la validation
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { DMMF } from '@prisma/generator-helper';
import { getDMMF } from '@prisma/internals';
import * as chalk from 'chalk';

/**
 * Générateur de schémas Zod à partir des modèles Prisma
 * Ce script analyse le schéma Prisma et génère des schémas Zod correspondants
 * ainsi que des DTOs compatibles avec NestJS.
 */
class PrismaToZodGenerator {
  private dmmf: DMMF.Document | null = null;
  private outputPath: string;
  private modelsPath: string;
  private dtosPath: string;
  private validationPath: string; // Nouveau dossier pour les validateurs personnalisés

  constructor(
    private schemaPath = './prisma/schema.prisma',
    outputBasePath = './src/generated',
    private options = {
      createValidators: true,
      strictValidation: true,
      generateTypeGuards: true
    }
  ) {
    this.outputPath = join(outputBasePath, 'zod');
    this.modelsPath = join(this.outputPath, 'models');
    this.dtosPath = join(this.outputPath, 'dtos');
    this.validationPath = join(this.outputPath, 'validators');
  }

  /**
   * Initialise le générateur en chargeant le schéma Prisma
   */
  async initialize(): Promise<void> {
    try {
      const schema = readFileSync(this.schemaPath, 'utf8');
      this.dmmf = await getDMMF({ datamodel: schema });
      this.createDirectories();
      console.log(chalk.green('✓ Schéma Prisma chargé avec succès'));
    } catch (error) {
      console.error(chalk.red('✗ Erreur lors du chargement du schéma Prisma:'), error);
      throw error;
    }
  }

  /**
   * Crée les répertoires nécessaires s'ils n'existent pas
   */
  private createDirectories(): void {
    for (const path of [this.outputPath, this.modelsPath, this.dtosPath, this.validationPath]) {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }
  }

  /**
   * Convertit un type Prisma en type Zod
   */
  private prismaTypeToZod(field: DMMF.Field): string {
    const { type, isRequired, isList, name } = field;
    let zodType: string;

    switch (type) {
      case 'Int':
        zodType = 'z.number().int()';
        break;
      case 'Float':
        zodType = 'z.number()';
        break;
      case 'String':
        // Ajout de validations spécifiques pour les chaînes selon leur nom
        if (name.toLowerCase().includes('email')) {
          zodType = 'z.string().email()';
        } else if (name.toLowerCase().includes('url')) {
          zodType = 'z.string().url()';
        } else if (name.toLowerCase().includes('password')) {
          zodType = 'z.string().min(8)';
        } else {
          zodType = 'z.string()';
        }
        break;
      case 'Boolean':
        zodType = 'z.boolean()';
        break;
      case 'DateTime':
        zodType = 'z.date()';
        break;
      case 'Decimal':
        zodType = 'z.number().or(z.string())';
        break;
      case 'BigInt':
        zodType = 'z.bigint().or(z.string())';
        break;
      case 'Json':
        zodType = 'z.record(z.any())';
        break;
      default:
        // Pour les types d'enum et les références aux modèles
        if (this.dmmf?.datamodel.enums.some((e) => e.name === type)) {
          // Si c'est un enum
          zodType = `z.enum(${JSON.stringify(
            this.dmmf?.datamodel.enums.find((e) => e.name === type)?.values.map((v) => v.name) ?? []
          )})`;
        } else {
          // Si c'est une référence à un modèle
          zodType = `${type}Schema`;
        }
    }

    // Gestion des listes et des champs optionnels
    if (isList) {
      zodType = `z.array(${zodType})`;
    }
    if (!isRequired) {
      zodType = `${zodType}.optional()`;
    }

    return zodType;
  }

  /**
   * Génère des validations supplémentaires basées sur le nom et le type du champ
   */
  private generateFieldValidation(field: DMMF.Field): string | null {
    const { name, type } = field;

    // Exemples de validations spécifiques basées sur les noms courants de champs
    if (type === 'String') {
      if (name.toLowerCase().includes('name')) {
        return `z.string().min(1).max(255)`;
      }
      if (name.toLowerCase().includes('description')) {
        return `z.string().max(2000)`;
      }
      if (name.toLowerCase().includes('code')) {
        return `z.string().regex(/^[A-Z0-9_-]+$/)`;
      }
    }

    if (type === 'Int' || type === 'Float') {
      if (name.toLowerCase().includes('age')) {
        return `z.number().min(0).max(150)`;
      }
      if (name.toLowerCase().includes('quantity') || name.toLowerCase().includes('stock')) {
        return `z.number().min(0)`;
      }
      if (name.toLowerCase().includes('price') || name.toLowerCase().includes('cost')) {
        return `z.number().min(0)`;
      }
    }

    return null;
  }

  /**
   * Génère le schéma Zod pour un modèle Prisma
   */
  private generateModelSchema(model: DMMF.Model): string {
    const fields = model.fields
      .filter((field) => !field.isGenerated || field.name === 'id')
      .map((field) => {
        const zodType = this.prismaTypeToZod(field);

        // Ajouter des validations personnalisées si l'option est activée
        if (this.options.strictValidation) {
          const validatedType = this.generateFieldValidation(field);
          if (validatedType) {
            return `  ${field.name}: ${validatedType}`;
          }
        }

        return `  ${field.name}: ${zodType}`;
      })
      .join(',\n');

    return `import { z } from 'zod';
${this.generateImports(model)}

/**
 * Schéma Zod pour le modèle ${model.name}
 * Généré automatiquement à partir du modèle Prisma
 */
export const ${model.name}Schema = z.object({
${fields}
});

export type ${model.name}Type = z.infer<typeof ${model.name}Schema>;

/**
 * Schéma pour la création d'un ${model.name}
 * Exclut les champs générés automatiquement
 */
export const Create${model.name}Schema = ${model.name}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Create${model.name}Type = z.infer<typeof Create${model.name}Schema>;

/**
 * Schéma pour la mise à jour d'un ${model.name}
 * Tous les champs sont optionnels
 */
export const Update${model.name}Schema = Create${model.name}Schema.partial();

export type Update${model.name}Type = z.infer<typeof Update${model.name}Schema>;

/**
 * Schéma pour le filtrage des ${model.name}
 * Tous les champs sont optionnels
 */
export const Filter${model.name}Schema = ${model.name}Schema
  .partial()
  .extend({
    createdAtStart: z.date().optional(),
    createdAtEnd: z.date().optional(),
    updatedAtStart: z.date().optional(), 
    updatedAtEnd: z.date().optional(),
  });

export type Filter${model.name}Type = z.infer<typeof Filter${model.name}Schema>;
${this.options.generateTypeGuards ? this.generateTypeGuard(model) : ''}
`;
  }

  /**
   * Génère un garde-type pour faciliter les vérifications de type à l'exécution
   */
  private generateTypeGuard(model: DMMF.Model): string {
    return `
/**
 * Garde-type pour vérifier si un objet est un ${model.name}
 */
export function is${model.name}(obj: unknown): obj is ${model.name}Type {
  return ${model.name}Schema.safeParse(obj).success;
}
`;
  }

  /**
   * Génère les imports nécessaires pour un modèle
   */
  private generateImports(model: DMMF.Model): string {
    const imports: Set<string> = new Set();

    for (const field of model.fields) {
      // Si le champ est une référence à un autre modèle et pas un enum
      if (
        !['Int', 'Float', 'String', 'Boolean', 'DateTime', 'Decimal', 'BigInt', 'Json'].includes(
          field.type
        ) &&
        !this.dmmf?.datamodel.enums.some((e) => e.name === field.type)
      ) {
        imports.add(`import { ${field.type}Schema } from './${field.type}';`);
      }
    }

    return Array.from(imports).join('\n');
  }

  /**
   * Génère un DTO NestJS à partir d'un schéma Zod
   */
  private generateDto(model: DMMF.Model): string {
    return `import { createZodDto } from '../../../packages/nestjs-zod';
import { 
  ${model.name}Schema, 
  Create${model.name}Schema, 
  Update${model.name}Schema,
  Filter${model.name}Schema
} from '../models/${model.name}';

/**
 * DTO pour le modèle ${model.name}
 * Généré automatiquement à partir du schéma Zod
 */
export class ${model.name}Dto extends createZodDto(${model.name}Schema) {}

/**
 * DTO pour la création d'un ${model.name}
 */
export class Create${model.name}Dto extends createZodDto(Create${model.name}Schema) {}

/**
 * DTO pour la mise à jour d'un ${model.name}
 */
export class Update${model.name}Dto extends createZodDto(Update${model.name}Schema) {}

/**
 * DTO pour le filtrage des ${model.name}s
 */
export class Filter${model.name}Dto extends createZodDto(Filter${model.name}Schema) {}
`;
  }

  /**
   * Génère un validateur personnalisé pour un modèle
   */
  private generateValidator(model: DMMF.Model): string {
    return `import { z } from 'zod';
import { ${model.name}Schema, Create${model.name}Schema, Update${model.name}Schema } from '../models/${model.name}';

/**
 * Validateur pour le modèle ${model.name}
 * Étend les schémas générés automatiquement avec des validations métier supplémentaires
 */
export const ${model.name}Validator = {
  /**
   * Valide un ${model.name} complet
   */
  validate: (data: unknown) => ${model.name}Schema.parse(data),
  
  /**
   * Vérifie si un objet est un ${model.name} valide sans lever d'exception
   */
  safeParse: (data: unknown) => ${model.name}Schema.safeParse(data),
  
  /**
   * Valide un objet pour la création d'un ${model.name}
   */
  validateCreate: (data: unknown) => Create${model.name}Schema.parse(data),
  
  /**
   * Valide un objet pour la mise à jour d'un ${model.name}
   */
  validateUpdate: (data: unknown) => Update${model.name}Schema.parse(data),
};
`;
  }

  /**
   * Génère un fichier index.ts pour exporter tous les schémas et DTOs
   */
  private generateIndexFiles(): void {
    if (!this.dmmf) return;

    // Index pour les modèles
    const modelExports = this.dmmf.datamodel.models
      .map((model) => `export * from './${model.name}';`)
      .join('\n');

    writeFileSync(join(this.modelsPath, 'index.ts'), modelExports);

    // Index pour les DTOs
    const dtoExports = this.dmmf.datamodel.models
      .map((model) => `export * from './${model.name}';`)
      .join('\n');

    writeFileSync(join(this.dtosPath, 'index.ts'), dtoExports);

    // Index pour les validateurs (si l'option est activée)
    if (this.options.createValidators) {
      const validatorExports = this.dmmf.datamodel.models
        .map((model) => `export * from './${model.name}';`)
        .join('\n');

      writeFileSync(join(this.validationPath, 'index.ts'), validatorExports);
    }

    // Index principal
    const mainIndex = `export * from './models';
export * from './dtos';
${this.options.createValidators ? "export * from './validators';" : ''}
`;
    writeFileSync(join(this.outputPath, 'index.ts'), mainIndex);

    console.log(chalk.green('✓ Fichiers index générés avec succès'));
  }

  /**
   * Lance la génération des schémas Zod et des DTOs
   */
  async generate(): Promise<void> {
    if (!this.dmmf) {
      throw new Error("Le générateur n'a pas été initialisé. Appelez initialize() d'abord.");
    }

    for (const model of this.dmmf.datamodel.models) {
      // Génération du schéma Zod
      const schemaContent = this.generateModelSchema(model);
      const schemaPath = join(this.modelsPath, `${model.name}.ts`);
      writeFileSync(schemaPath, schemaContent);

      // Génération du DTO
      const dtoContent = this.generateDto(model);
      const dtoPath = join(this.dtosPath, `${model.name}.ts`);
      writeFileSync(dtoPath, dtoContent);

      // Génération du validateur personnalisé (si l'option est activée)
      if (this.options.createValidators) {
        const validatorContent = this.generateValidator(model);
        const validatorPath = join(this.validationPath, `${model.name}.ts`);
        writeFileSync(validatorPath, validatorContent);
      }

      console.log(chalk.green(`✓ Généré pour ${model.name}:`), chalk.cyan('Schéma, DTO' + (this.options.createValidators ? ', Validateur' : '')));
    }

    this.generateIndexFiles();
    console.log(chalk.green('✅ Génération terminée avec succès!'));
  }
}

/**
 * Fonction principale qui lance la génération des schémas Zod et des DTOs
 */
async function main() {
  try {
    const generator = new PrismaToZodGenerator();
    await generator.initialize();
    await generator.generate();
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération des schémas Zod:'), error);
    process.exit(1);
  }
}

// Lancer la génération seulement si le script est exécuté directement
if (require.main === module) {
  main();
}

export { PrismaToZodGenerator };

import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Définition des schémas Zod pour les énumérations Prisma
const UserRoleEnum = z.enum(['USER', 'ADMIN', 'EDITOR']);
const OrderStatusEnum = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

// Définition des schémas Zod pour les modèles Prisma
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  password: z.string(),
  role: UserRoleEnum.default('USER'),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const ProfileSchema = z.object({
  id: z.string().cuid(),
  bio: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  userId: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const CategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
  image: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const ProductSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  stock: z.number().default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string(),
  images: z.array(z.string()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const OrderSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  status: OrderStatusEnum.default('PENDING'),
  totalAmount: z.number(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const OrderItemSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.number()
});

const ReviewSchema = z.object({
  id: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
  userId: z.string(),
  productId: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const McpJobSchema = z.object({
  id: z.number(),
  jobId: z.string(),
  status: z.string(),
  filePath: z.string().nullable().optional(),
  result: z.any().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

// Schémas SEO
const SeoPageSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  canonical: z.string().nullable().optional(),
  score: z.number().default(0),
  status: z.string().default('pending'),
  lastChecked: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date()
});

const SeoIssueSchema = z.object({
  id: z.number(),
  type: z.string(),
  severity: z.string(),
  message: z.string(),
  details: z.any().nullable().optional(),
  pageId: z.number(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
  fixedAt: z.date().nullable().optional(),
  fixed: z.boolean().default(false)
});

// Création des schémas Create et Update
const UserCreateSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });
const UserUpdateSchema = UserSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

const ProfileCreateSchema = ProfileSchema.omit({ id: true, createdAt: true, updatedAt: true });
const ProfileUpdateSchema = ProfileSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

const CategoryCreateSchema = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true });
const CategoryUpdateSchema = CategorySchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

const ProductCreateSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
const ProductUpdateSchema = ProductSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

const OrderCreateSchema = OrderSchema.omit({ id: true, createdAt: true, updatedAt: true });
const OrderUpdateSchema = OrderSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

const OrderItemCreateSchema = OrderItemSchema.omit({ id: true });
const OrderItemUpdateSchema = OrderItemSchema.partial().omit({ id: true });

const ReviewCreateSchema = ReviewSchema.omit({ id: true, createdAt: true, updatedAt: true });
const ReviewUpdateSchema = ReviewSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

// Création du répertoire de sortie s'il n'existe pas
const outputDir = path.resolve(__dirname, '../generated/zod');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour générer un fichier avec les imports et exports appropriés
function generateSchemaFile(name: string, schemas: Record<string, any>) {
  const imports = `import { z } from 'zod';\n\n`;

  let content = imports;

  // Ajouter chaque schéma
  for (const [schemaName, schema] of Object.entries(schemas)) {
    // Générer une représentation string du schéma (ceci est une simplification)
    const schemaString = schema.toString();
    content += `export const ${schemaName} = ${schemaString};\n\n`;

    // Générer les types TypeScript basés sur Zod
    content += `export type ${schemaName.replace('Schema', '')} = z.infer<typeof ${schemaName}>;\n\n`;
  }

  // Exporter tous les schémas
  content += `export default {\n`;
  for (const schemaName of Object.keys(schemas)) {
    content += `  ${schemaName},\n`;
  }
  content += `};\n`;

  // Écrire le fichier
  fs.writeFileSync(path.join(outputDir, `${name}.ts`), content);
  console.log(`✅ Fichier généré: ${name}.ts`);
}

// Générer les fichiers de schéma
const schemas = {
  // Modèles de base
  UserSchema,
  ProfileSchema,
  CategorySchema,
  ProductSchema,
  OrderSchema,
  OrderItemSchema,
  ReviewSchema,
  McpJobSchema,
  SeoPageSchema,
  SeoIssueSchema,

  // Schémas pour la création
  UserCreateSchema,
  ProfileCreateSchema,
  CategoryCreateSchema,
  ProductCreateSchema,
  OrderCreateSchema,
  OrderItemCreateSchema,
  ReviewCreateSchema,

  // Schémas pour la mise à jour
  UserUpdateSchema,
  ProfileUpdateSchema,
  CategoryUpdateSchema,
  ProductUpdateSchema,
  OrderUpdateSchema,
  OrderItemUpdateSchema,
  ReviewUpdateSchema
};

// Générer le fichier index principal
generateSchemaFile('index', schemas);

// Générer des fichiers individuels pour chaque modèle
generateSchemaFile('user', {
  UserSchema,
  UserCreateSchema,
  UserUpdateSchema
});

generateSchemaFile('profile', {
  ProfileSchema,
  ProfileCreateSchema,
  ProfileUpdateSchema
});

generateSchemaFile('category', {
  CategorySchema,
  CategoryCreateSchema,
  CategoryUpdateSchema
});

generateSchemaFile('product', {
  ProductSchema,
  ProductCreateSchema,
  ProductUpdateSchema
});

generateSchemaFile('order', {
  OrderSchema,
  OrderCreateSchema,
  OrderUpdateSchema,
  OrderItemSchema,
  OrderItemCreateSchema,
  OrderItemUpdateSchema
});

generateSchemaFile('review', {
  ReviewSchema,
  ReviewCreateSchema,
  ReviewUpdateSchema
});

generateSchemaFile('mcp-job', {
  McpJobSchema
});

generateSchemaFile('seo', {
  SeoPageSchema,
  SeoIssueSchema
});

console.log('🎉 Génération des schémas Zod terminée !');
