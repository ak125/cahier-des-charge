/**
 * Utilitaires de test pour les workflows Temporal
 * Ce fichier fournit des outils pour tester les workflows plus facilement
 */

/**
 * Crée un environnement de test pour un workflow
 * @param workflow Le workflow à tester
 */
export function createWorkflowTester(workflow: any) {
    return {
        async execute(input: any) {
            console.log(`Exécution du workflow avec input: ${JSON.stringify(input)}`);
            try {
                const result = await workflow(input);
                console.log(`Workflow terminé avec succès: ${JSON.stringify(result)}`);
                return result;
            } catch (error) {
                console.error(`Workflow échoué: ${error}`);
                throw error;
            }
        },
        
        async executeWithMocks(input: any, mocks: Record<string, any>) {
            console.log(`Exécution du workflow avec mocks et input: ${JSON.stringify(input)}`);
            
            // Sauvegarder le contexte original
            const original: Record<string, any> = {};
            
            // Appliquer les mocks
            for (const [key, value] of Object.entries(mocks)) {
                const parts = key.split('.');
                let obj = global;
                
                // Naviguer jusqu'à l'objet parent
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) {
                        obj[parts[i]] = {};
                    }
                    obj = obj[parts[i]];
                }
                
                // Sauvegarder la valeur originale
                const lastPart = parts[parts.length - 1];
                original[key] = obj[lastPart];
                
                // Appliquer le mock
                obj[lastPart] = value;
            }
            
            try {
                const result = await workflow(input);
                console.log(`Workflow terminé avec succès: ${JSON.stringify(result)}`);
                return result;
            } catch (error) {
                console.error(`Workflow échoué: ${error}`);
                throw error;
            } finally {
                // Restaurer le contexte original
                for (const [key, value] of Object.entries(original)) {
                    const parts = key.split('.');
                    let obj = global;
                    
                    // Naviguer jusqu'à l'objet parent
                    for (let i = 0; i < parts.length - 1; i++) {
                        obj = obj[parts[i]];
                    }
                    
                    // Restaurer la valeur originale
                    const lastPart = parts[parts.length - 1];
                    obj[lastPart] = value;
                }
            }
        }
    };
}

/**
 * Crée un mock d'activité pour les tests
 * @param activityName Nom de l'activité à mocker
 * @param implementation Implémentation du mock
 */
export function mockActivity(activityName: string, implementation: (...args: any[]) => any) {
    return {
        activityName,
        implementation
    };
}

/**
 * Utilitaire pour simuler des délais d'attente dans les tests
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
