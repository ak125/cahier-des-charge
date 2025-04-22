
    // Test simple pour AbstractAnalyzer
    const agentPath = '/workspaces/cahier-des-charge/packages/mcp-agents/analyzers/abstract-analyzer';
    
    try {
      // Importer le module sans l'extension .ts
      const module = require(agentPath);
      
      if (!module || !module.AbstractAnalyzer) {
        console.error('❌ ÉCHEC: Module AbstractAnalyzer non trouvé dans le fichier');
        process.exit(1);
      }
      
      console.log('✅ SUCCÈS: Module AbstractAnalyzer importé correctement');
      
      // Tester la présence de certaines méthodes selon le type d'agent
      const agent = module.AbstractAnalyzer;
      
      // Vérifier si c'est une classe ou un objet
      const isClass = typeof agent === 'function';
      
      if (isClass) {
        console.log('📋 AbstractAnalyzer est une classe');
        
        // Essayer d'instancier si c'est une classe non abstraite
        try {
          const instance = new agent();
          console.log('✅ SUCCÈS: AbstractAnalyzer peut être instancié');
          
          // Tester les méthodes de base communes
          ['initialize', 'validate', 'execute', 'run', 'process', 'analyze', 'generate', 'validateData'].forEach(method => {
            if (typeof instance[method] === 'function') {
              console.log(`✅ Méthode ${method} présente`);
            } else {
              console.log(`⚠️ Méthode ${method} absente`);
            }
          });
          
        } catch (e) {
          console.log('⚠️ AbstractAnalyzer ne peut pas être instancié directement (probablement une classe abstraite)');
        }
        
      } else {
        console.log('📋 AbstractAnalyzer est un objet ou une fonction');
        
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
  