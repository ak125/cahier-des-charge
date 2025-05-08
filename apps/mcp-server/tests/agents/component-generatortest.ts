import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import * as componentGenerator from '../../agents/component-generator';

describe('Component Generator Agent', () => {
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
    const outputFiles = [
      path.join('outputs', 'User.controller.ts'),
      path.join('outputs', 'User.tsx'),
    ];

    outputFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  test('devrait ignorer les fichiers non PHP', async () => {
    const result = await componentGenerator.run({ name: 'test.txt', content: 'Test content' });
    expect(result).toBeUndefined();
  });

  test('devrait générer des fichiers NestJS et Remix à partir de fichiers PHP', async () => {
    const result = await componentGenerator.run({ name: 'User.php', content: fixtureContent });

    // Vérifier que le résultat est un tableau avec deux éléments
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    // Vérifier le premier élément (NestJS controller)
    expect(result[0]).toHaveProperty('path');
    expect(result[0]).toHaveProperty('content');
    expect(result[0].path).toContain('User.controller.ts');
    expect(result[0].content).toContain('@Controller');
    expect(result[0].content).toContain('UserController');

    // Vérifier le deuxième élément (Remix component)
    expect(result[1]).toHaveProperty('path');
    expect(result[1]).toHaveProperty('content');
    expect(result[1].path).toContain('User.tsx');
    expect(result[1].content).toContain('UserPage');
    expect(result[1].content).toContain('export const loader');

    // Vérifier que les fichiers ont été générés
    const nestJSFile = path.join('outputs', 'User.controller.ts');
    const remixFile = path.join('outputs', 'User.tsx');

    expect(fs.existsSync(nestJSFile)).toBe(true);
    expect(fs.existsSync(remixFile)).toBe(true);

    const nestJSContent = fs.readFileSync(nestJSFile, 'utf-8');
    const remixContent = fs.readFileSync(remixFile, 'utf-8');

    expect(nestJSContent).toBe(result[0].content);
    expect(remixContent).toBe(result[1].content);
  });

  test('devrait extraire correctement le nom de classe PHP', async () => {
    const result = await componentGenerator.run({ name: 'User.php', content: fixtureContent });

    // Le nom de classe "User" devrait être utilisé dans les fichiers générés
    expect(result[0].content).toContain('UserController');
    expect(result[0].content).toContain('userService');
    expect(result[1].content).toContain('UserPage');
  });
});
