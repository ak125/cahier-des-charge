import { z } from 'zod';

// Énumérations
export const UserRoleEnum = z.enum(['USER', 'ADMIN', 'EDITOR']);
export const OrderStatusEnum = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

// Schémas de base pour chaque modèle Prisma
export const UserSchema = z.object({
    id: z.string().cuid(),
    email: z.string().email(),
    name: z.string().nullable().optional(),
    password: z.string(),
    role: UserRoleEnum.default('USER'),
    isActive: z.boolean().default(true),
    emailVerified: z.boolean().default(false),
    lastLoginAt: z.date().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const ProfileSchema = z.object({
    id: z.string().cuid(),
    bio: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const CategorySchema = z.object({
    id: z.string().cuid(),
    name: z.string(),
    slug: z.string(),
    image: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const ProductSchema = z.object({
    id: z.string().cuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.number().positive(),
    stock: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    categoryId: z.string(),
    images: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const OrderSchema = z.object({
    id: z.string().cuid(),
    userId: z.string(),
    status: OrderStatusEnum.default('PENDING'),
    totalAmount: z.number().positive(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const OrderItemSchema = z.object({
    id: z.string().cuid(),
    orderId: z.string(),
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
});

export const ReviewSchema = z.object({
    id: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable().optional(),
    userId: z.string(),
    productId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const McpJobSchema = z.object({
    id: z.number().int().positive(),
    jobId: z.string(),
    status: z.string(),
    filePath: z.string().nullable().optional(),
    result: z.any().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

// Schémas SEO
export const SeoPageSchema = z.object({
    id: z.number().int().positive(),
    url: z.string().url(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    canonical: z.string().nullable().optional(),
    score: z.number().int().min(0).max(100).default(0),
    status: z.string().default('pending'),
    lastChecked: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const SeoIssueSchema = z.object({
    id: z.number().int().positive(),
    type: z.string(),
    severity: z.string(),
    message: z.string(),
    details: z.any().optional(),
    pageId: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
    fixedAt: z.date().nullable().optional(),
    fixed: z.boolean().default(false)
});

// Types inférés à partir des schémas
export type User = z.infer<typeof UserSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type McpJob = z.infer<typeof McpJobSchema>;
export type SeoPage = z.infer<typeof SeoPageSchema>;
export type SeoIssue = z.infer<typeof SeoIssueSchema>;