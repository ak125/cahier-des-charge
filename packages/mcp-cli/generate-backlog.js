#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function generateBacklog() {
  try {
    // Lecture du discovery_map.json
    const discoveryMapPath = path.resolve(process.cwd(), 'discovery_map.json');
    const discoveryMapData = await fs.readFile(discoveryMapPath, 'utf8');
    const discoveryMap = JSON.parse(discoveryMapData);

    // Création du backlog.mcp.json avec statut par défaut
    const backlog = {};

    for (const file of discoveryMap) {
      // On extrait juste le nom de fichier sans le chemin
      const fileName = path.basename(file.path);

      backlog[fileName] = {
        priority: file.priority,
        status: 'pending', // Par défaut tous les fichiers sont en attente
        path: file.path,
        dependencies: file.dependencies,
        metadata: file.metadata,
      };
    }

    // Écriture du fichier backlog.mcp.json
    const backlogPath = path.resolve(process.cwd(), 'backlog.mcp.json');
    await fs.writeFile(backlogPath, JSON.stringify(backlog, null, 2), 'utf8');

    console.log('✅ Fichier backlog.mcp.json généré avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la génération du backlog:', error);
  }
}

generateBacklog();
