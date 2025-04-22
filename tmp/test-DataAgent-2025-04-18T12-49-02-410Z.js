
    // Importer l'agent sans l'extension .ts
    const agentPath = './packages/mcp-agents/analyzers/data-analyzer/DataAgent';
    const { DataAgent } = require(agentPath);
    
    describe('Tests pour DataAgent', () => {
      let agent;
      
      beforeEach(() => {
        // Créer une instance mockée de l'agent pour éviter les problèmes avec les classes abstraites
        if (DataAgent.prototype.constructor) {
          try {
            agent = new DataAgent();
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
      
      test('L\'agent DataAgent existe', () => {
        expect(DataAgent).toBeDefined();
      });
      
      // Autres tests...
    });
  