/**
 * Exemple d'utilisation de l'orchestrateur standardisé avec Temporal
 * 
 * Cet exemple montre comment implémenter un workflow complexe de migration de code
 * en utilisant l'orchestrateur standardisé et Temporal.
 */

import { standardizedOrchestrator } from '..';
import { temporal } from '../temporal';
import { z } from 'zod';

// 1. Définir un schéma de validation pour les entrées avec Zod
const codebaseMigrationInputSchema = z.object({
    repositoryUrl: z.string().url(),
    targetVersion: z.string(),
    rules: z.array(z.object({
        pattern: z.string(),
        replacement: z.string(),
        description: z.string().optional()
    })),
    options: z.object({
        dryRun: z.boolean().optional(),
        pullRequest: z.boolean().optional(),
        branchName: z.string().optional(),
        commitMessage: z.string().optional()
    }).optional(),
    notifications: z.object({
        email: z.string().email().optional(),
        slack: z.string().optional(),
        webhookUrl: z.string().url().optional()
    }).optional()
});

// Type inféré à partir du schéma Zod
type CodebaseMigrationInput = z.infer<typeof codebaseMigrationInputSchema>;

// 2. Fonction principale utilisant l'orchestrateur standardisé
export async function migrateCodebase(input: CodebaseMigrationInput): Promise<string> {
    // Valider les données d'entrée
    const validatedInput = codebaseMigrationInputSchema.parse(input);

    console.log(`Lancement de la migration pour ${validatedInput.repositoryUrl} vers la version ${validatedInput.targetVersion}`);

    // Utilisation de l'orchestrateur standardisé qui choisira automatiquement Temporal
    // car il s'agit d'un workflow complexe (isComplex: true)
    const workflowId = await standardizedOrchestrator.schedule({
        type: 'codebase-migration',
        data: validatedInput,
        isComplex: true,
        tags: ['migration', `version-${validatedInput.targetVersion}`]
    });

    console.log(`Migration planifiée avec succès, WorkflowID: ${workflowId}`);
    return workflowId;
}

// 3. Fonction utilisant directement Temporal pour plus de contrôle
export async function migrateCodebaseWithOptions(
    input: CodebaseMigrationInput,
    workflowOptions: {
        taskQueue?: string;
        workflowId?: string;
        retryAttempts?: number;
    } = {}
): Promise<string> {
    // Valider les données d'entrée
    const validatedInput = codebaseMigrationInputSchema.parse(input);

    // Utiliser directement Temporal.io pour un contrôle plus fin
    const workflowId = await temporal.scheduleWorkflow(
        'codebase-migration-workflow',
        validatedInput,
        {
            taskQueue: workflowOptions.taskQueue || 'migration-queue',
            workflowId: workflowOptions.workflowId || `migration-${Date.now()}`,
            retry: {
                maxAttempts: workflowOptions.retryAttempts || 3
            }
        }
    );

    return workflowId;
}

// 4. Exemple d'utilisation: suivre la progression d'une migration
export async function getMigrationStatus(workflowId: string): Promise<any> {
    // Récupérer le statut avec l'orchestrateur standardisé
    return standardizedOrchestrator.getTaskStatus(workflowId, 'temporal');
}

// 5. Exemple d'utilisation: annuler une migration en cours
export async function cancelMigration(workflowId: string): Promise<boolean> {
    // Annuler un workflow avec l'orchestrateur standardisé
    return standardizedOrchestrator.cancelTask(workflowId, 'temporal');
}

// 6. Exemple concret d'utilisation
async function runExample() {
    try {
        // Exemple d'entrée de migration
        const migrationInput: CodebaseMigrationInput = {
            repositoryUrl: 'https://github.com/organization/project',
            targetVersion: 'v2.0',
            rules: [
                {
                    pattern: 'import { OldComponent } from "@legacy/components"',
                    replacement: 'import { NewComponent } from "@core/components"',
                    description: 'Mise à jour des imports de composants legacy vers core'
                },
                {
                    pattern: '<OldComponent([^>]*)>',
                    replacement: '<NewComponent$1>',
                    description: 'Remplacement des balises OldComponent par NewComponent'
                }
            ],
            options: {
                dryRun: false,
                pullRequest: true,
                branchName: 'upgrade/v2-components',
                commitMessage: 'Migration automatique des composants vers v2'
            },
            notifications: {
                email: 'team@example.com',
                slack: '#project-migrations'
            }
        };

        // Lancer la migration
        const workflowId = await migrateCodebase(migrationInput);
        console.log(`Migration lancée avec ID: ${workflowId}`);

        // Simuler une attente
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Vérifier le statut
        const status = await getMigrationStatus(workflowId);
        console.log(`Statut de la migration: ${status.status}`);

        // Exemple d'utilisation de la version avec plus de contrôle
        const customWorkflowId = await migrateCodebaseWithOptions(migrationInput, {
            taskQueue: 'high-priority-migrations',
            retryAttempts: 5
        });
        console.log(`Migration personnalisée lancée avec ID: ${customWorkflowId}`);

    } catch (error) {
        console.error('Erreur lors de l\'exécution de l\'exemple:', error);
    }
}

// Lancer l'exemple si ce fichier est exécuté directement
if (require.main === module) {
    runExample().catch(console.error);
}