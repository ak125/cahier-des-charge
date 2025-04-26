import { z } from zodstructure-agent';

/**
 * Enum pour UserRole
 */
export const UserRoleSchema = z.enum([
  'USER',
  'ADMIN',
  'EDITOR',
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Enum pour OrderStatus
 */
export const OrderStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Schéma pour User
 */
export const UserCreateSchema = z.object({
  email: z.string().email({ message: "L'email est invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }).nullable().optional(),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

export const UserUpdateSchema = z.object({
  email: z.string().email({ message: "L'email est invalide" }).optional(),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }).nullable().optional(),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }).optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  lastLoginAt: z.date().nullable().optional(),
});

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  password: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type User = z.infer<typeof UserSchema>;

/**
 * Schéma de base pour un produit
 */
export const ProductBaseSchema = z.object({
  name: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom doit contenir au maximum 100 caractères"),
  description: z.string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(500, "La description doit contenir au maximum 500 caractères")
    .optional(),
  price: z.number()
    .positive("Le prix doit être positif")
    .min(0.01, "Le prix minimum est de 0.01 €"),
  stock: z.number()
    .int("Le stock doit être un nombre entier")
    .min(0, "Le stock ne peut pas être négatif")
    .default(0),
  categoryId: z.string().min(1, "La catégorie est requise"),
  images: z.string()
    .transform(str => str.split(",").map(s => s.trim()).filter(Boolean))
    .optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schéma pour la création d'un produit
 */
export const ProductCreateSchema = ProductBaseSchema;

/**
 * Schéma pour un produit complet (avec ID)
 */
export const ProductSchema = ProductBaseSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Schéma pour la mise à jour d'un produit
 */
export const ProductUpdateSchema = ProductBaseSchema.partial();

/**
 * Type pour un produit (inféré à partir du schéma)
 */
export type Product = z.infer<typeof ProductSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

/**
 * Schéma pour filtrer les produits
 */
export const ProductFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  isActive: z.boolean().optional(),
  sort: z.enum(["nameAsc", "nameDesc", "priceAsc", "priceDesc", "newest", "oldest"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type ProductFilter = z.infer<typeof ProductFilterSchema>;

/**
 * Schéma pour Category
 */
export const CategoryCreateSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  slug: z.string().regex(/^[a-z0-9-]+$/, { message: "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets" }),
  image: z.string().url({ message: "L'URL de l'image est invalide" }).nullable().optional(),
});

export const CategoryUpdateSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, { message: "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets" }).optional(),
  image: z.string().url({ message: "L'URL de l'image est invalide" }).nullable().optional(),
});

export const CategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
export type Category = z.infer<typeof CategorySchema>;

/**
 * Schéma pour Order
 */
export const OrderCreateSchema = z.object({
  userId: z.string().cuid(),
  status: OrderStatusSchema.optional(),
  totalAmount: z.number().positive({ message: "Le montant total doit être positif" }),
});

export const OrderUpdateSchema = z.object({
  userId: z.string().cuid().optional(),
  status: OrderStatusSchema.optional(),
  totalAmount: z.number().positive({ message: "Le montant total doit être positif" }).optional(),
});

export const OrderSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  status: OrderStatusSchema,
  totalAmount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type Order = z.infer<typeof OrderSchema>;

/**
 * Schéma pour OrderItem
 */
export const OrderItemCreateSchema = z.object({
  orderId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().int().positive({ message: "La quantité doit être positive" }),
  price: z.number().positive({ message: "Le prix doit être positif" }),
});

export const OrderItemUpdateSchema = z.object({
  orderId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  quantity: z.number().int().positive({ message: "La quantité doit être positive" }).optional(),
  price: z.number().positive({ message: "Le prix doit être positif" }).optional(),
});

export const OrderItemSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export type OrderItemCreate = z.infer<typeof OrderItemCreateSchema>;
export type OrderItemUpdate = z.infer<typeof OrderItemUpdateSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * Schéma pour Review
 */
export const ReviewCreateSchema = z.object({
  rating: z.number().int().min(1, { message: "La note doit être d'au moins 1" }).max(5, { message: "La note ne peut pas dépasser 5" }),
  comment: z.string().nullable().optional(),
  userId: z.string().cuid(),
  productId: z.string().cuid(),
});

export const ReviewUpdateSchema = z.object({
  rating: z.number().int().min(1, { message: "La note doit être d'au moins 1" }).max(5, { message: "La note ne peut pas dépasser 5" }).optional(),
  comment: z.string().nullable().optional(),
  userId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
});

export const ReviewSchema = z.object({
  id: z.string().cuid(),
  rating: z.number(),
  comment: z.string().nullable(),
  userId: z.string(),
  productId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;
export type ReviewUpdate = z.infer<typeof ReviewUpdateSchema>;
export type Review = z.infer<typeof ReviewSchema>;

/**
 * Schéma pour Profile
 */
export const ProfileCreateSchema = z.object({
  bio: z.string().nullable().optional(),
  avatar: z.string().url({ message: "L'URL de l'avatar est invalide" }).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  userId: z.string().cuid(),
});

export const ProfileUpdateSchema = z.object({
  bio: z.string().nullable().optional(),
  avatar: z.string().url({ message: "L'URL de l'avatar est invalide" }).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  userId: z.string().cuid().optional(),
});

export const ProfileSchema = z.object({
  id: z.string().cuid(),
  bio: z.string().nullable(),
  avatar: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  address: z.string().nullable(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileCreate = z.infer<typeof ProfileCreateSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type Profile = z.infer<typeof ProfileSchema>;