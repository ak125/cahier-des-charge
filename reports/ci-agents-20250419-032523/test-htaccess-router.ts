import { HtaccessRouterAnalyzer } from '../packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer';
import * as fs from 'fs';

async function runTest() {
  try {
    console.log('Vérification du chemin du module...');
    const modulePath = require.resolve('../packagesDoDotmcp-agents/business/analyzers/HtaccessRouterAnalyzer');
    console.log(`Module trouvé à: ${modulePath}`);
    
    console.log('Contenu du module:');
    const moduleContent = fs.readFileSync(modulePath, 'utf-8');
    console.log(moduleContent.substring(0, 300) + '...');
    
    console.log('Création de l\'instance HtaccessRouterAnalyzer...');
    const analyzer = new HtaccessRouterAnalyzer();
    
    console.log('Propriétés disponibles:');
    console.log(Object.keys(analyzer));
    
    if (analyzer.initialize) {
      console.log('Initialisation...');
      await analyzer.initialize();
    } else {
      console.log('Méthode initialize non disponible');
    }
    
    console.log('Vérification des propriétés obligatoires...');
    console.log('- metadata:', !!analyzer.metadata);
    console.log('- events:', !!analyzer.events);
    
    if (analyzer.metadata && analyzer.events) {
      console.log('Test terminé avec succès!');
      return true;
    } else {
      throw new Error(`Propriétés manquantes: ${!analyzer.metadata ? 'metadata ' : ''}${!analyzer.events ? 'events' : ''}`);
    }
  } catch (error) {
    console.error('Erreur de test:', error);
    throw error;
  }
}

runTest()
  .then(success => {
    console.log('✅ Test réussi');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Échec du test:', error);
    process.exit(1);
  });
