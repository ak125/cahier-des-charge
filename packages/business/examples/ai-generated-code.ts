/**
 * Exemple de fichier généré par une IA pour tester notre validateur de sécurité
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Classe d'exemple qui pourrait contenir des problèmes de sécurité
 */
export class FileProcessor {
    constructor(private basePath: string) { }

    /**
     * Méthode qui lit un fichier et exécute son contenu - potentiellement dangereuse
     */
    async processFileContent(fileName: string): Promise<string> {
        const filePath = path.join(this.basePath, fileName);

        // Lecture du fichier sans validation d'extension - risque de sécurité
        const content = await fs.promises.readFile(filePath, 'utf8');

        // Utilisation dangereuse de eval - sera détecté par le scanner de sécurité
        const result = eval(content);

        return `Processed: ${result}`;
    }

    /**
     * Méthode qui exécute une commande système - potentiellement dangereuse
     */
    executeCommand(command: string): void {
        // Exécution de commande sans validation - risque de sécurité
        const { execSync } = require('child_process');
        execSync(command);
    }

    /**
     * Méthode avec des problèmes de conformité - bloc vide
     */
    validateInput(input: any) {
        // Bloc vide intentionnel - sera détecté par le vérificateur de conformité
    }

    /**
     * Méthode avec un problème sémantique - pas de gestion d'erreur pour une opération asynchrone
     */
    async saveData(data: string): Promise<void> {
        // Opération asynchrone sans gestion d'erreur - sera détecté par le validateur sémantique
        await fs.promises.writeFile(path.join(this.basePath, 'output.txt'), data);
    }
}