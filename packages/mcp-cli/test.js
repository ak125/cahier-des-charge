#!/usr/bin/env node

// Import des fonctions nécessaires pour les tests
const { describe, test, expect } = require('@jest/globals');

// Log pour la vérification manuelle
console.log("Test d'affichage");
console.log("Si vous voyez ce message, l'affichage fonctionne correctement.");

// Test simple pour satisfaire Jest
describe('Vérification de base', () => {
    test('1 + 1 devrait être égal à 2', () => {
        expect(1 + 1).toBe(2);
    });
});
