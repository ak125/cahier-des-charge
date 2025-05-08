import { jest } from '@jest/globals';
import { PhpAnalyzer } from '../index';

describe('PhpAnalyzer Agent', () => {
    let phpAnalyzer: PhpAnalyzer;

    // Mock de console.log pour éviter la pollution de sortie pendant les tests
    console.log = jest.fn();

    beforeEach(() => {
        // Créer une nouvelle instance de l'agent avant chaque test
        phpAnalyzer = new PhpAnalyzer();
    });

    test('devrait avoir les propriétés de base correctes', () => {
        expect(phpAnalyzer.name).toBe('PhpAnalyzer');
        expect(phpAnalyzer.description).toContain('PhpAnalyzer');
        expect(phpAnalyzer.version).toBeDefined();
    });

    test('devrait initialiser correctement', async () => {
        await phpAnalyzer.initialize({});
        expect(console.log).toHaveBeenCalledWith(`Initialisation de l'agent PhpAnalyzer`);
    });

    test('devrait exécuter et retourner les données en entrée', async () => {
        const inputData = { code: '<?php echo "Hello World"; ?>' };
        const result = await phpAnalyzer.execute(inputData);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.result).toEqual(inputData);
        expect(console.log).toHaveBeenCalledWith(`Exécution de l'agent PhpAnalyzer`);
    });
});