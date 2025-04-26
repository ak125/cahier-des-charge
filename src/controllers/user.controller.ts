import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { validateBody, validateParams, validateQuery } from '../utils/validation-middleware';
import { z } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';

// Schéma pour la validation des paramètres d'URL
const UserParamsSchema = z.object({
    id: z.string().uuid()
});

// Schéma pour la recherche
const SearchQuerySchema = z.object({
    query: z.string().min(1).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10')
});

/**
 * Contrôleur pour les endpoints utilisateurs
 */
export class UserController {
    /**
     * Récupère tous les utilisateurs
     */
    static async getAll(req: Request, res: Response) {
        try {
            const users = await userService.findAll();
            return res.json({ users });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    /**
     * Récupère un utilisateur par ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            return res.json({ user });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    /**
     * Crée un nouvel utilisateur
     */
    static async create(req: Request, res: Response) {
        try {
            const user = await userService.create(req.body);
            return res.status(201).json({ user });
        } catch (error) {
            console.error(error);
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email déjà utilisé' });
            }
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    /**
     * Met à jour un utilisateur existant
     */
    static async update(req: Request, res: Response) {
        try {
            const user = await userService.update(req.params.id, req.body);
            return res.json({ user });
        } catch (error) {
            console.error(error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    /**
     * Supprime un utilisateur
     */
    static async delete(req: Request, res: Response) {
        try {
            await userService.delete(req.params.id);
            return res.status(204).send();
        } catch (error) {
            console.error(error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }

    /**
     * Recherche des utilisateurs par nom ou prénom
     */
    static async search(req: Request, res: Response) {
        try {
            const { query } = req.query;
            const users = query
                ? await userService.searchByName(query as string)
                : await userService.findAll();

            return res.json({ users });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}

// Routes avec middleware de validation
export const userRoutes = {
    getAll: [UserController.getAll],
    getById: [validateParams(UserParamsSchema), UserController.getById],
    create: [validateBody(CreateUserSchema), UserController.create],
    update: [validateParams(UserParamsSchema), validateBody(UpdateUserSchema), UserController.update],
    delete: [validateParams(UserParamsSchema), UserController.delete],
    search: [validateQuery(SearchQuerySchema), UserController.search]
};