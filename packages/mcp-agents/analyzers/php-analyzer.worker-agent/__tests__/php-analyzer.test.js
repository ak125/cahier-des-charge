/**
 * Test unitaire simplifié pour l'agent PhpAnalyzer
 * Ne nécessite pas de configuration TypeScript complexe
 */

const PhpAnalyzer = require('../index').PhpAnalyzer;

describe('PhpAnalyzer Agent', () => {
    let phpAnalyzer;

    // Mock de console.log pour éviter la pollution de sortie pendant les tests
    const originalLog = console.log;
    let logCalls = [];
    console.log = jest.fn((...args) => {
        logCalls.push(args.join(' '));
    });

    beforeEach(() => {
        // Créer une nouvelle instance de l'agent avant chaque test
        phpAnalyzer = new PhpAnalyzer();
        logCalls = []; // Réinitialiser les appels de log
    });

    afterAll(() => {
        // Restaurer console.log après tous les tests
        console.log = originalLog;
    });

    test('devrait avoir les propriétés de base correctes', () => {
        expect(phpAnalyzer.name).toBe('PhpAnalyzer');
        expect(phpAnalyzer.description).toContain('PhpAnalyzer');
        expect(phpAnalyzer.version).toBeDefined();
    });

    test('devrait initialiser correctement', async () => {
        await phpAnalyzer.initialize({});
        expect(logCalls[0]).toContain(`Initialisation de l'agent PhpAnalyzer`);
    });

    test('devrait exécuter et retourner les données en entrée', async () => {
        const inputData = { code: '<?php echo "Hello World"; ?>' };
        const result = await phpAnalyzer.execute(inputData);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.result).toEqual(inputData);
        expect(logCalls.some(call => call.includes(`Exécution de l'agent PhpAnalyzer`))).toBe(true);
    });
});