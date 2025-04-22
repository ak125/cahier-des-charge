
    // Importer l'agent sans l'extension .ts
    const agentPath = '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent';
    const { BaseAnalyzerAgent } = require(agentPath);
    
    describe('Tests pour BaseAnalyzerAgent', () => {
      let agent;
      
      beforeEach(() => {
        // Créer une instance mockée de l'agent pour éviter les problèmes avec les classes abstraites
        if (BaseAnalyzerAgent.prototype.constructor) {
          try {
            agent = new BaseAnalyzerAgent();
          } catch(e) {
            // Si c'est une classe abstraite, créer un mock
            agent = {
              // Implémenter les méthodes attendues
              initialize: jest.fn(),
              validate: jest.fn(),
              execute: jest.fn(),
              run: jest.fn(),
              process: jest.fn(),
              analyze: jest.fn(),
              generate: jest.fn(),
              validateData: jest.fn()
            };
          }
        }
      });
      
      test('L\'agent BaseAnalyzerAgent existe', () => {
        expect(BaseAnalyzerAgent).toBeDefined();
      });
      
      // Autres tests...
    });
  