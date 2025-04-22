
    // Test simple pour BaseAnalyzerAgent
    const agentPath = '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/base-analyzer-agent';
    
    try {
      // Importer le module sans l'extension .ts
      const module = require(agentPath);
      
      if (!module || !module.BaseAnalyzerAgent) {
        console.error('❌ ÉCHEC: Module BaseAnalyzerAgent non trouvé dans le fichier');
        process.exit(1);
      }
      
      console.log('✅ SUCCÈS: Module BaseAnalyzerAgent importé correctement');
      
      // Tester la présence de certaines méthodes selon le type d'agent
      const agent = module.BaseAnalyzerAgent;
      
      // Vérifier si c'est une classe ou un objet
      const isClass = typeof agent === 'function';
      
      if (isClass) {
        console.log('📋 BaseAnalyzerAgent est une classe');
        
        // Essayer d'instancier si c'est une classe non abstraite
        try {
          const instance = new agent();
          console.log('✅ SUCCÈS: BaseAnalyzerAgent peut être instancié');
          
          // Tester les méthodes de base communes
          ['initialize', 'validate', 'execute', 'run', 'process', 'analyze', 'generate', 'validateData'].forEach(method => {
            if (typeof instance[method] === 'function') {
              console.log(`✅ Méthode ${method} présente`);
            } else {
              console.log(`⚠️ Méthode ${method} absente`);
            }
          });
          
        } catch (e) {
          console.log('⚠️ BaseAnalyzerAgent ne peut pas être instancié directement (probablement une classe abstraite)');
        }
        
      } else {
        console.log('📋 BaseAnalyzerAgent est un objet ou une fonction');
        
        // Vérifier les propriétés/méthodes de l'objet
        ['initialize', 'validate', 'execute', 'run', 'process', 'analyze', 'generate', 'validateData'].forEach(method => {
          if (typeof agent[method] === 'function') {
            console.log(`✅ Méthode ${method} présente`);
          } else {
            console.log(`⚠️ Méthode ${method} absente`);
          }
        });
      }
      
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ ÉCHEC: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  