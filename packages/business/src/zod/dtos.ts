import { z } from 'zod';
import {
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
    UserRoleEnum,
    OrderStatusEnum
} from './models';

/**
 * Utilitaires pour générer les DTOs
 */

// Fonction pour créer un schéma de création (omettant les champs auto-générés)
const createCreateSchema = <T extends z.ZodObject<any>>(schema: T) =>
    schema.omit({
        id: true,
        createdAt: true,
        updatedAt: true
    });

// Fonction pour créer un schéma de mise à jour (tous les champs sont optionnels)
const createUpdateSchema = <T extends z.ZodObject<any>>(schema: T) =>
    schema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true
    });

// Fonction pour créer un schéma de filtrage
const createFilterSchema = <T extends z.ZodObject<any>>(schema: T) =>
    schema.partial().extend({
        createdAtStart: z.date().optional(),
        createdAtEnd: z.date().optional(),
        updatedAtStart: z.date().optional(),
        updatedAtEnd: z.date().optional()
    });

/**
 * DTOs d'utilisateur
 */
export const CreateUserDto = createCreateSchema(UserSchema);
export const UpdateUserDto = createUpdateSchema(UserSchema);
export const FilterUserDto = createFilterSchema(UserSchema);

export type CreateUserType = z.infer<typeof CreateUserDto>;
export type UpdateUserType = z.infer<typeof UpdateUserDto>;
export type FilterUserType = z.infer<typeof FilterUserDto>;

/**
 * DTOs de profil utilisateur
 */
export const CreateProfileDto = createCreateSchema(ProfileSchema);
export const UpdateProfileDto = createUpdateSchema(ProfileSchema);
export const FilterProfileDto = createFilterSchema(ProfileSchema);

export type CreateProfileType = z.infer<typeof CreateProfileDto>;
export type UpdateProfileType = z.infer<typeof UpdateProfileDto>;
export type FilterProfileType = z.infer<typeof FilterProfileDto>;

/**
 * DTOs de catégorie
 */
export const CreateCategoryDto = createCreateSchema(CategorySchema);
export const UpdateCategoryDto = createUpdateSchema(CategorySchema);
export const FilterCategoryDto = createFilterSchema(CategorySchema);

export type CreateCategoryType = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryType = z.infer<typeof UpdateCategoryDto>;
export type FilterCategoryType = z.infer<typeof FilterCategoryDto>;

/**
 * DTOs de produit
 */
export const CreateProductDto = createCreateSchema(ProductSchema);
export const UpdateProductDto = createUpdateSchema(ProductSchema);
export const FilterProductDto = createFilterSchema(ProductSchema);

export type CreateProductType = z.infer<typeof CreateProductDto>;
export type UpdateProductType = z.infer<typeof UpdateProductDto>;
export type FilterProductType = z.infer<typeof FilterProductDto>;

/**
 * DTOs de commande
 */
export const CreateOrderDto = createCreateSchema(OrderSchema);
export const UpdateOrderDto = createUpdateSchema(OrderSchema);
export const FilterOrderDto = createFilterSchema(OrderSchema);

export type CreateOrderType = z.infer<typeof CreateOrderDto>;
export type UpdateOrderType = z.infer<typeof UpdateOrderDto>;
export type FilterOrderType = z.infer<typeof FilterOrderDto>;

/**
 * DTOs d'élément de commande
 */
export const CreateOrderItemDto = createCreateSchema(OrderItemSchema);
export const UpdateOrderItemDto = createUpdateSchema(OrderItemSchema);
export const FilterOrderItemDto = createFilterSchema(OrderItemSchema);

export type CreateOrderItemType = z.infer<typeof CreateOrderItemDto>;
export type UpdateOrderItemType = z.infer<typeof UpdateOrderItemDto>;
export type FilterOrderItemType = z.infer<typeof FilterOrderItemDto>;

/**
 * DTOs d'avis
 */
export const CreateReviewDto = createCreateSchema(ReviewSchema);
export const UpdateReviewDto = createUpdateSchema(ReviewSchema);
export const FilterReviewDto = createFilterSchema(ReviewSchema);

export type CreateReviewType = z.infer<typeof CreateReviewDto>;
export type UpdateReviewType = z.infer<typeof UpdateReviewDto>;
export type FilterReviewType = z.infer<typeof FilterReviewDto>;

/**
 * DTOs de McpJob
 */
export const CreateMcpJobDto = createCreateSchema(McpJobSchema);
export const UpdateMcpJobDto = createUpdateSchema(McpJobSchema);
export const FilterMcpJobDto = createFilterSchema(McpJobSchema);

export type CreateMcpJobType = z.infer<typeof CreateMcpJobDto>;
export type UpdateMcpJobType = z.infer<typeof UpdateMcpJobDto>;
export type FilterMcpJobType = z.infer<typeof FilterMcpJobDto>;

/**
 * DTOs de SeoPage
 */
export const CreateSeoPageDto = createCreateSchema(SeoPageSchema);
export const UpdateSeoPageDto = createUpdateSchema(SeoPageSchema);
export const FilterSeoPageDto = createFilterSchema(SeoPageSchema);

export type CreateSeoPageType = z.infer<typeof CreateSeoPageDto>;
export type UpdateSeoPageType = z.infer<typeof UpdateSeoPageDto>;
export type FilterSeoPageType = z.infer<typeof FilterSeoPageDto>;

/**
 * DTOs de SeoIssue
 */
export const CreateSeoIssueDto = createCreateSchema(SeoIssueSchema);
export const UpdateSeoIssueDto = createUpdateSchema(SeoIssueSchema);
export const FilterSeoIssueDto = createFilterSchema(SeoIssueSchema);

export type CreateSeoIssueType = z.infer<typeof CreateSeoIssueDto>;
export type UpdateSeoIssueType = z.infer<typeof UpdateSeoIssueDto>;
export type FilterSeoIssueType = z.infer<typeof FilterSeoIssueDto>;