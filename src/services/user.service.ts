import { PrismaClient, User } from '@prisma/client';
import { PrismaService } from '../utils/prisma-service';
import { UserSchema, CreateUserSchema, UpdateUserSchema, UserType, CreateUserType, UpdateUserType } from '../schemas/user.schema';

// Instance Prisma partagée
const prisma = new PrismaClient();

/**
 * Service utilisateur avec validation automatique via Zod
 */
export class UserService extends PrismaService<User, CreateUserType, UpdateUserType> {
    constructor() {
        super(prisma, 'user', {
            create: CreateUserSchema,
            update: UpdateUserSchema
        });
    }

    /**
     * Recherche un utilisateur par email
     */
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    /**
     * Recherche des utilisateurs par nom ou prénom
     */
    async searchByName(query: string): Promise<User[]> {
        return prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } }
                ]
            }
        });
    }

    /**
     * Active ou désactive un utilisateur
     */
    async toggleActive(id: string, isActive: boolean): Promise<User> {
        return prisma.user.update({
            where: { id },
            data: { isActive }
        });
    }
}

// Singleton pour faciliter l'utilisation
export const userService = new UserService();



B