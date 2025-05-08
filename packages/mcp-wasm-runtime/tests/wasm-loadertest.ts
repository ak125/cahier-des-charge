/**
 * Tests unitaires pour le chargeur WASM
 */
import { WasmAgentLoader } from '../src/wasm-loader';
import * as fs from 'fs';
import * as path from 'path';
import { AgentContext } from '../src/types';

// Mock pour fs
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    existsSync: jest.fn().mockReturnValue(true),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
}));

// Mock pour WebAssembly
const mockExports = {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockImplementation((contextJson: string) => {
        const context = JSON.parse(contextJson);
        const result = {
            success: true,
            data: { processedText: `Processed: ${context.inputs.text || 'no text'}` },
            metrics: {
                startTime: Date.now(),
                endTime: Date.now() + 100,
                duration: 100,
            }
        };
        return Promise.resolve(JSON.stringify(result));
    }),
    validate: jest.fn().mockReturnValue(true),
    getMetadata: jest.fn().mockReturnValue(JSON.stringify({
        id: 'test-agent',
        type: 'processor',
        name: 'Test Agent',
        version: '1.0.0',
        description: 'A test agent for unit tests',
        permissions: { fs: { read: ['/test'] } },
        wasmVersion: '1.0',
    })),
};

const mockInstance = {
    exports: mockExports,
};

// Mock pour WebAssembly global
global.WebAssembly = {
    Module: jest.fn(),
    instantiate: jest.fn().mockResolvedValue(mockInstance),
    // Autres fonctions WebAssembly nécessaires
} as any;

// Mock pour WASI
jest.mock('@wasmer/wasi', () => ({
    WASI: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        wasiImport: {},
    })),
    defaultBindings: {},
}));

// Mock pour WasmFs
jest.mock('@wasmer/wasmfs', () => ({
    WasmFs: jest.fn().mockImplementation(() => ({
        fs: {},
    })),
}));

describe('WasmAgentLoader', () => {
    let wasmLoader: WasmAgentLoader;
    const mockWasmPath = '/path/to/agent.wasm';
    const mockWasmBinary = new Uint8Array([0, 1, 2, 3]);

    beforeEach(() => {
        jest.clearAllMocks();
        (fs.readFileSync as jest.Mock).mockReturnValue(mockWasmBinary);
        wasmLoader = new WasmAgentLoader(mockWasmPath);
    });

    test('devrait initialiser correctement un agent WASM', async () => {
        await wasmLoader.initialize();
        expect(mockExports.initialize).toHaveBeenCalled();
    });

    test('devrait exécuter un agent avec un contexte donné', async () => {
        await wasmLoader.initialize();

        const context: AgentContext = {
            jobId: 'test-job-123',
            inputs: { text: 'Test text' },
        };

        const result = await wasmLoader.execute(context);

        expect(mockExports.execute).toHaveBeenCalled();
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('data.processedText', 'Processed: Test text');
        expect(result).toHaveProperty('metrics');
    });

    test('devrait valider un contexte', async () => {
        await wasmLoader.initialize();

        const context: AgentContext = {
            jobId: 'test-job-123',
            inputs: { text: 'Test text' },
        };

        const isValid = await wasmLoader.validate(context);

        expect(mockExports.validate).toHaveBeenCalled();
        expect(isValid).toBe(true);
    });

    test('devrait récupérer les métadonnées de l\'agent', async () => {
        await wasmLoader.initialize();

        const metadata = await wasmLoader.getMetadata();

        expect(mockExports.getMetadata).toHaveBeenCalled();
        expect(metadata).toHaveProperty('id', 'test-agent');
        expect(metadata).toHaveProperty('name', 'Test Agent');
        expect(metadata).toHaveProperty('version', '1.0.0');
    });
});