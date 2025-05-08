import { SimpleAdapterAgent } from '../adapter-agent';

describe('SimpleAdapterAgent', () => {
    let agent: SimpleAdapterAgent;

    beforeEach(() => {
        agent = new SimpleAdapterAgent();
        // Initialiser l'agent avant chaque test
        return agent.initialize();
    });

    afterEach(async () => {
        // Nettoyer après chaque test
        await agent.shutdown();
    });

    it('should initialize correctly', () => {
        expect(agent.id).toBe('adapter-agent-001');
        expect(agent.isReady()).toBe(true);
    });

    it('should check compatibility between formats', async () => {
        // Test de formats compatibles
        expect(await agent.checkCompatibility('json', 'xml')).toBe(true);
        expect(await agent.checkCompatibility('xml', 'json')).toBe(true);
        expect(await agent.checkCompatibility('json', 'csv')).toBe(true);

        // Test de formats incompatibles
        expect(await agent.checkCompatibility('json', 'unknown')).toBe(false);
        expect(await agent.checkCompatibility('unknown', 'json')).toBe(false);
    });

    it('should adapt data from JSON to XML format', async () => {
        const jsonData = { name: 'Test', value: 42 };
        const xml = await agent.adapt(jsonData, 'json', 'xml');

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<name>Test</name>');
        expect(xml).toContain('<value>42</value>');
    });

    it('should adapt data from XML to JSON format', async () => {
        const xmlData = '<?xml version="1.0" encoding="UTF-8"?><root><name>Test</name><value>42</value></root>';
        const json = await agent.adapt(xmlData, 'xml', 'json');

        expect(json).toHaveProperty('name', 'Test');
        expect(json).toHaveProperty('value', '42');
    });

    it('should adapt data from JSON to CSV format', async () => {
        const jsonData = [
            { name: 'Item1', value: 42 },
            { name: 'Item2', value: 43 }
        ];
        const csv = await agent.adapt(jsonData, 'json', 'csv');

        expect(csv).toContain('name,value');
        expect(csv).toContain('Item1,42');
        expect(csv).toContain('Item2,43');
    });

    it('should handle coordination requests', async () => {
        const result = await agent.coordinate(
            ['source1'],
            ['target1'],
            {
                sourceFormat: 'json',
                targetFormat: 'xml',
                data: { test: 'value' }
            }
        );

        expect(result.success).toBe(true);
    });

    it('should throw error for unsupported formats', async () => {
        await expect(
            agent.adapt({ test: 'data' }, 'json', 'unsupported')
        ).rejects.toThrow('Conversion non supportée');
    });
});