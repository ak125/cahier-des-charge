const fs = require('fsstructure-agent');
const path = require('pathstructure-agent');

// Configuration
const PIPELINE_FILE = path.resolve(__dirname, '../../n8n.pipeline.json');
const OUTPUT_DIR = path.resolve(__dirname, '../../workflows/extracted');

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Répertoire créé: ${OUTPUT_DIR}`);
}

// Lire le fichier de pipeline
try {
  console.log(`📖 Lecture du fichier de pipeline: ${PIPELINE_FILE}`);
  const pipelineData = JSON.parse(fs.readFileSync(PIPELINE_FILE, 'utf8'));

  if (!pipelineData.workflows || !Array.isArray(pipelineData.workflows)) {
    console.error('❌ Format de fichier de pipeline invalide: "workflows" n\'est pas un tableau.');
    process.exit(1);
  }

  // Extraire chaque workflow
  console.log(`🔍 Extraction de ${pipelineData.workflows.length} workflows...`);

  let extractedCount = 0;

  pipelineData.workflows.forEach((workflow, index) => {
    const workflowName = workflow.name || `workflow_${index}`;
    const safeName = workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputFile = path.join(OUTPUT_DIR, `${safeName}.json`);

    try {
      // Ajouter des métadonnées pour faciliter l'importation
      const exportableWorkflow = {
        ...workflow,
        meta: { templateCredsSetupCompleted: true },
      };

      fs.writeFileSync(outputFile, JSON.stringify(exportableWorkflow, null, 2), 'utf8');
      console.log(`✅ Workflow "${workflowName}" extrait vers: ${outputFile}`);
      extractedCount++;
    } catch (error) {
      console.error(
        `❌ Erreur lors de l'extraction du workflow "${workflowName}": ${error.message}`
      );
    }
  });

  console.log(
    `\n✨ Extraction terminée! ${extractedCount}/${pipelineData.workflows.length} workflows extraits vers: ${OUTPUT_DIR}`
  );
  console.log('\n📝 Pour importer ces workflows dans n8n:');
  console.log('   1. Accédez à n8n: http://localhost:5678');
  console.log('   2. Connectez-vous avec les identifiants: admin / cahier-des-charges-migrator');
  console.log(`   3. Allez dans "Workflows" puis cliquez sur "+ Workflow"`);
  console.log(
    `   4. Sélectionnez "Import from 'file' et choisissez un fichier depuis: ${OUTPUT_DIR}`
  );
} catch (error) {
  console.error(`❌ Erreur lors de la lecture du fichier de pipeline: ${error.message}`);
  process.exit(1);
}
