
    // Test simple pour DataAgent
    const agentPath = './packages/mcp-agents/analyzers/data-analyzer/DataAgent';
    
    try {
      // Importer le module sans l'extension .ts
      const module = require(agentPath);
      
      if (!module || !module.DataAgent) {
        console.error('❌ ÉCHEC: Module DataAgent non trouvé dans le fichier');
        process.exit(1);
      }
      
      console.log('✅ SUCCÈS: Module DataAgent importé correctement');
      
      // Tester la présence de certaines méthodes selon le type d'agent
      const agent = module.DataAgent;
      
      // Vérifier si c'est une classe ou un objet
      const isClass = typeof agent === 'function';
      
      if (isClass) {
        console.log('📋 DataAgent est une classe');
        
        // Essayer d'instancier si c'est une classe non abstraite
        try {
          const instance = new agent();
          console.log('✅ SUCCÈS: DataAgent peut être instancié');
          
          // Tester les méthodes de base communes
          ['initialize', 'validate', 'execute', 'run', 'process', 'analyze', 'generate', 'validateData'].forEach(method => {
            if (typeof instance[method] === 'function') {
              console.log(`✅ Méthode ${method} présente`);
            } else {
              console.log(`⚠️ Méthode ${method} absente`);
            }
          });
          
        } catch (e) {
          console.log('⚠️ DataAgent ne peut pas être instancié directement (probablement une classe abstraite)');
        }
        
      } else {
        console.log('📋 DataAgent est un objet ou une fonction');
        
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
  