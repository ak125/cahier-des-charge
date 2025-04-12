import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import * as phpAnalyzer from '../../agents/php-analyzer';

// Mock de la fonction deepseek
jest.mock('../../agents/php-analyzer', () => {
  const originalModule = jest.requireActual('../../agents/php-analyzer');
  return {
    ...originalModule,
    run: jest.fn().mockImplementation(originalModule.run),
  };
});

describe('PHP Analyzer Agent', () => {
  const fixturePath = path.join(__dirname, '../fixtures/User.php');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // S'assurer que le dossier outputs existe
    if (!fs.existsSync('outputs')) {
      fs.mkdirSync('outputs', { recursive: true });
    }
  });

  afterEach(() => {
    // Nettoyer les fichiers générés après chaque test
    const outputFile = path.join('outputs', 'User.php.audit.md');
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  test('devrait ignorer les fichiers non PHP', async () => {
    const result = await phpAnalyzer.run({ name: 'test.txt', content: 'Test content' });
    expect(result).toBeUndefined();
  });

  test('devrait analyser les fichiers PHP et générer un rapport d\'audit', async () => {
    const result = await phpAnalyzer.run({ name: 'User.php', content: fixtureContent });
    
    // Vérifier que le résultat est défini et a la structure attendue
    expect(result).toBeDefined();
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('content');
    expect(result.path).toContain('User.php.audit.md');
    
    // Vérifier que le contenu markdown contient des sections attendues
    expect(result.content).toContain('# Analyse PHP');
    expect(result.content).toContain('Résumé de la logique métier');
    expect(result.content).toContain('Requêtes SQL identifiées');
    expect(result.content).toContain('Problèmes de sécurité potentiels');
    expect(result.content).toContain('Suggestions pour la migration vers NestJS/Remix');
    
    // Vérifier que le fichier a été généré
    const outputFile = path.join('outputs', 'User.php.audit.md');
    expect(fs.existsSync(outputFile)).toBe(true);
    
    const fileContent = fs.readFileSync(outputFile, 'utf-8');
    expect(fileContent).toBe(result.content);
  });
});