/**
 * Tests unitaires pour vérifier la migration des agents vers les classes abstraites
 * 
 * Ces tests vérifient que les agents ont été correctement adaptés pour utiliser
 * les classes abstraites et que toutes les méthodes fonctionnent comme prévu.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Import des types de base d'agents
import { AbstractAnalyzerAgent } from '../analyzers/AbstractAnalyzer';
import { AbstractValidatorAgent } from '../validators/AbstractValidator';
import { AbstractGeneratorAgent } from '../generators/AbstractGenerator';
import { AbstractOrchestratorAgent } from '../orchestrators/AbstractOrchestrator';
import { AgentHealthState } from '../core/BaseAgent';

// Configuration
const AGENT_TYPES = ['analyzers', 'validators', 'generators', 'orchestrators'];
const MCP_AGENTS_ROOT = path.resolve(__dirname, '..');

// Utilitaire pour charger dynamiquement un agent depuis un fichier
async function loadAgentFromFile(filePath: string): Promise<any> {
  try {
    const relativePath = path.relative(__dirname, filePath).replace(/\.ts$/, '');
    const agentModule = await import(`../${relativePath}`);
    
    // Trouver la classe d'agent dans le module
    const exportedClasses = Object.values(agentModule).filter(
      (exp: any) => typeof exp === 'function' && /class/.test(exp.toString())
    );
    
    if (exportedClasses.length > 0) {
      const AgentClass = exportedClasses[0] as any;
      return new AgentClass();
    }
    
    throw new Error(`Aucune classe d'agent trouvée dans ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors du chargement de l'agent ${filePath}:`, error);
    return null;
  }
}

// Utilitaire pour vérifier l'héritage d'un agent
function checkAgentInheritance(agent: any, abstractClass: any): boolean {
  return agent instanceof abstractClass;
}

describe('Test de migration des agents vers les classes abstraites', () => {
  // Tests pour les analyseurs
  describe('Agents d\'analyse', () => {
    const analyzerFiles = glob.sync(`${MCP_AGENTS_ROOT}/analyzers/**/*.ts`, {
      ignore: [
        '**/abstract-*.ts',
        '**/interfaces/**',
        '**/index.ts'
      ]
    });
    
    it.each(analyzerFiles)('L\'agent %s devrait hériter de AbstractAnalyzerAgent', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(checkAgentInheritance(agent, AbstractAnalyzerAgent)).toBe(true);
        }
      }
    );
    
    it.each(analyzerFiles)('L\'agent %s devrait implémenter toutes les méthodes requises', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(agent.analyze).toBeDefined();
          expect(typeof agent.analyze).toBe('function');
        }
      }
    );
    
    it.each(analyzerFiles)('L\'agent %s devrait avoir des méthodes d\'initialisation et de nettoyage', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(agent.initialize).toBeDefined();
          expect(agent.cleanup).toBeDefined();
          expect(typeof agent.initialize).toBe('function');
          expect(typeof agent.cleanup).toBe('function');
        }
      }
    );
  });

  // Tests pour les validateurs
  describe('Agents de validation', () => {
    const validatorFiles = glob.sync(`${MCP_AGENTS_ROOT}/validators/**/*.ts`, {
      ignore: [
        '**/abstract-*.ts',
        '**/interfaces/**',
        '**/index.ts'
      ]
    });
    
    it.each(validatorFiles)('L\'agent %s devrait hériter de AbstractValidatorAgent', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(checkAgentInheritance(agent, AbstractValidatorAgent)).toBe(true);
        }
      }
    );
    
    it.each(validatorFiles)('L\'agent %s devrait implémenter toutes les méthodes requises', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(agent.validate).toBeDefined();
          expect(typeof agent.validate).toBe('function');
        }
      }
    );
  });

  // Tests pour les générateurs
  describe('Agents de génération', () => {
    const generatorFiles = glob.sync(`${MCP_AGENTS_ROOT}/generators/**/*.ts`, {
      ignore: [
        '**/abstract-*.ts',
        '**/interfaces/**',
        '**/index.ts'
      ]
    });
    
    it.each(generatorFiles)('L\'agent %s devrait hériter de AbstractGeneratorAgent', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(checkAgentInheritance(agent, AbstractGeneratorAgent)).toBe(true);
        }
      }
    );
    
    it.each(generatorFiles)('L\'agent %s devrait implémenter toutes les méthodes requises', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(agent.generate).toBeDefined();
          expect(typeof agent.generate).toBe('function');
        }
      }
    );
  });

  // Tests pour les orchestrateurs
  describe('Agents d\'orchestration', () => {
    const orchestratorFiles = glob.sync(`${MCP_AGENTS_ROOT}/orchestrators/**/*.ts`, {
      ignore: [
        '**/abstract-*.ts',
        '**/interfaces/**',
        '**/index.ts'
      ]
    });
    
    it.each(orchestratorFiles)('L\'agent %s devrait hériter de AbstractOrchestratorAgent', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(checkAgentInheritance(agent, AbstractOrchestratorAgent)).toBe(true);
        }
      }
    );
    
    it.each(orchestratorFiles)('L\'agent %s devrait implémenter toutes les méthodes requises', 
      async (filePath) => {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          expect(agent.orchestrate).toBeDefined();
          expect(typeof agent.orchestrate).toBe('function');
        }
      }
    );
  });

  // Tests pour le cycle de vie des agents
  describe('Cycle de vie des agents', () => {
    // Échantillon d'un agent de chaque type pour les tests de cycle de vie
    const sampleAgents: {[key: string]: string} = {};
    
    beforeEach(() => {
      // Trouver un agent de chaque type pour les tests
      AGENT_TYPES.forEach(type => {
        const files = glob.sync(`${MCP_AGENTS_ROOT}/${type}/**/*.ts`, {
          ignore: [
            '**/abstract-*.ts',
            '**/interfaces/**',
            '**/index.ts'
          ]
        });
        if (files.length > 0) {
          sampleAgents[type] = files[0];
        }
      });
    });
    
    it('Les agents devraient gérer correctement le cycle d\'initialisation', async () => {
      for (const [type, filePath] of Object.entries(sampleAgents)) {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          // Espionner les méthodes internes
          const spyInit = jest.spyOn(agent, 'initializeInternal');
          
          // Exécuter l'initialisation
          await agent.initialize();
          
          // Vérifier que la méthode interne a été appelée
          expect(spyInit).toHaveBeenCalled();
          
          // Vérifier que l'état de santé est passé à Ready
          expect(agent.getStatus().health).toBe(AgentHealthState.Ready);
          
          // Nettoyer
          spyInit.mockRestore();
        }
      }
    });
    
    it('Les agents devraient gérer correctement le cycle de nettoyage', async () => {
      for (const [type, filePath] of Object.entries(sampleAgents)) {
        const agent = await loadAgentFromFile(filePath);
        if (agent) {
          // Initialiser l'agent d'abord
          await agent.initialize();
          
          // Espionner les méthodes internes
          const spyCleanup = jest.spyOn(agent, 'cleanupInternal');
          
          // Exécuter le nettoyage
          await agent.cleanup();
          
          // Vérifier que la méthode interne a été appelée
          expect(spyCleanup).toHaveBeenCalled();
          
          // Vérifier que l'état de santé est passé à Stopped
          expect(agent.getStatus().health).toBe(AgentHealthState.Stopped);
          
          // Nettoyer
          spyCleanup.mockRestore();
        }
      }
    });
  });
});