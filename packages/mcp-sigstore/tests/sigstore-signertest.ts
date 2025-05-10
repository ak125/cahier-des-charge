/**
 * Tests unitaires pour le signataire SIGSTORE
 */
import { SigstoreSigner } from '../src/core/sigstore-signer';
import * as fs from 'fs';
import * as path from 'path';
import { sign } from '@sigstore/sign';
import { hashContent } from ../src@cahier-des-charge/coordination/src/utils/hash';

// Mock pour fs
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('mock content'),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
}));

// Mock pour path
jest.mock('path', () => ({
    join: jest.fn().mockImplementation((...args) => args.join('/')),
    relative: jest.fn().mockImplementation((from, to) => to.replace(from, '')),
}));

// Mock pour @sigstore/sign
jest.mock('@sigstore/sign', () => ({
    sign: jest.fn().mockResolvedValue({
        signature: 'mock-signature-value',
        bundle: {
            verificationMaterial: {
                tlogEntries: [
                    { logIndex: '12345' }
                ]
            }
        }
    }),
}));

// Mock pour le hachage
jest.mock('../src/utils/hash', () => ({
    hashContent: jest.fn().mockReturnValue('mock-hash-value'),
    hashFile: jest.fn().mockReturnValue('mock-hash-value'),
}));

describe('SigstoreSigner', () => {
    let signer: SigstoreSigner;
    const mockConfig = {
        signaturesDir: '/test/signatures',
        identityEmail: 'test@example.com',
        rekorURL: 'https://rekor.example.com',
        fulcioURL: 'https://fulcio.example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        signer = new SigstoreSigner(mockConfig);
    });

    describe('constructor', () => {
        test('devrait initialiser avec la configuration correcte', () => {
            expect(fs.existsSync).toHaveBeenCalledWith(mockConfig.signaturesDir);
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfig.signaturesDir, { recursive: true });
        });

        test('devrait créer le répertoire des signatures s\'il n\'existe pas', () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
            new SigstoreSigner(mockConfig);
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfig.signaturesDir, { recursive: true });
        });
    });

    describe('signResult', () => {
        const agentId = 'test-agent';
        const runId = 'test-run-123';
        const mockResult = {
            success: true,
            data: { processedText: 'Text processed successfully' }
        };

        test('devrait signer correctement un résultat', async () => {
            const signatureInfo = await signer.signResult(agentId, runId, mockResult);

            // Vérifier que le répertoire pour les signatures de cet agent a été créé
            expect(fs.existsSync).toHaveBeenCalledWith(path.join(mockConfig.signaturesDir, agentId));
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                path.join(mockConfig.signaturesDir, agentId),
                { recursive: true }
            );

            // Vérifier que le fichier temporaire a été créé et supprimé
            const tempFilePath = path.join(mockConfig.signaturesDir, agentId, `${runId}.json`);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                tempFilePath,
                JSON.stringify(mockResult),
                'utf-8'
            );
            expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);

            // Vérifier que la signature a été générée et enregistrée
            expect(sign).toHaveBeenCalledWith(tempFilePath, {
                rekorURL: mockConfig.rekorURL,
                fulcioURL: mockConfig.fulcioURL,
                identityToken: { email: mockConfig.identityEmail }
            });

            // Vérifier les informations de signature retournées
            expect(signatureInfo).toHaveProperty('signaturePath');
            expect(signatureInfo).toHaveProperty('resultHash', 'mock-hash-value');
            expect(signatureInfo).toHaveProperty('agentId', agentId);
            expect(signatureInfo).toHaveProperty('runId', runId);
            expect(signatureInfo).toHaveProperty('rekorLogEntry', '12345');
        });

        test('devrait gérer les erreurs lors de la signature', async () => {
            (sign as jest.Mock).mockRejectedValueOnce(new Error('Mock error during signing'));

            await expect(signer.signResult(agentId, runId, mockResult))
                .rejects.toThrow('Échec de la signature: Mock error during signing');
        });
    });

    describe('signFile', () => {
        const agentId = 'test-agent';
        const runId = 'test-run-123';
        const mockFilePath = '/test/input/file.json';

        test('devrait signer correctement un fichier existant', async () => {
            const signatureInfo = await signer.signFile(agentId, runId, mockFilePath);

            // Vérifier que le fichier existe
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);

            // Vérifier que la signature a été générée et enregistrée
            expect(sign).toHaveBeenCalledWith(mockFilePath, {
                rekorURL: mockConfig.rekorURL,
                fulcioURL: mockConfig.fulcioURL,
                identityToken: { email: mockConfig.identityEmail }
            });

            // Vérifier les informations de signature retournées
            expect(signatureInfo).toHaveProperty('signaturePath');
            expect(signatureInfo).toHaveProperty('resultHash', 'mock-hash-value');
            expect(signatureInfo).toHaveProperty('agentId', agentId);
            expect(signatureInfo).toHaveProperty('runId', runId);
        });

        test('devrait échouer si le fichier n\'existe pas', async () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

            await expect(signer.signFile(agentId, runId, mockFilePath))
                .rejects.toThrow(`Le fichier n'existe pas: ${mockFilePath}`);
        });
    });
});
