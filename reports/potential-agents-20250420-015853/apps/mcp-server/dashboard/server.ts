import fs from 'fs';
import path from 'path';
import express from 'express';

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Chemin vers le répertoire de sortie des agents MCP
const OUTPUT_DIR = path.resolve(__dirname, '../outputs');

// Middleware pour servir les fichiers statiques du front-end
app.use(express.static(path.join(__dirname, 'public')));

// API pour récupérer les statistiques de migration
app.get('/api/stats', (req, res) => {
  try {
    // Vérifier si le répertoire de sortie existe
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.status(404).json({
        error: 'Aucune donnée de migration disponible',
      });
    }

    // Compter les différents types de fichiers
    const files = fs.readdirSync(OUTPUT_DIR);
    const auditFiles = files.filter((file) => file.endsWith('.audit.md'));
    const nestjsFiles = files.filter((file) => file.endsWith('.controller.ts'));
    const remixFiles = files.filter((file) => file.endsWith('.tsx'));

    // Calculer le pourcentage de complétion
    const totalPhpFiles = auditFiles.length;
    let completionPercentage = 0;

    if (totalPhpFiles > 0) {
      // Nous considérons que la migration est complète lorsque tous les fichiers PHP
      // ont été analysés et ont généré à la fois un fichier NestJS et un fichier Remix
      const expectedTotalGenerated = totalPhpFiles * 2; // NestJS + Remix
      const actualGenerated = nestjsFiles.length + remixFiles.length;
      completionPercentage = Math.round((actualGenerated / expectedTotalGenerated) * 100);
    }

    // Retourner les statistiques
    res.json({
      filesAnalyzed: auditFiles.length,
      nestjsFilesGenerated: nestjsFiles.length,
      remixFilesGenerated: remixFiles.length,
      completionPercentage,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API pour récupérer les détails des fichiers
app.get('/api/files', (req, res) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.json([]);
    }

    // Récupérer tous les fichiers PHP originaux (à partir des fichiers .audit.md)
    const allFiles = fs.readdirSync(OUTPUT_DIR);
    const auditFiles = allFiles.filter((file) => file.endsWith('.audit.md'));

    // Extraire les noms de fichiers PHP originaux
    const phpFileNames = auditFiles.map((file) => file.replace('.audit.md', ''));

    // Créer une liste de statuts de fichiers
    const filesData = phpFileNames.map((phpName) => {
      // Vérifier l'existence des fichiers générés correspondants
      const hasNestJS = allFiles.includes(`${phpName}.controller.ts`);
      const hasRemix = allFiles.includes(`${phpName}.tsx`);

      // Déterminer le statut du fichier
      let status: 'analyzed' | 'nestjs-generated' | 'remix-generated' | 'pending' = 'pending';

      if (hasNestJS && hasRemix) {
        status = 'remix-generated'; // Les deux sont générés, on montre le statut le plus avancé
      } else if (hasNestJS) {
        status = 'nestjs-generated';
      } else {
        status = 'analyzed'; // Seulement analysé
      }

      // Extraire les problèmes potentiels du fichier d'audit (simplification)
      let issues = 0;
      try {
        const auditContent = fs.readFileSync(path.join(OUTPUT_DIR, `${phpName}.audit.md`), 'utf-8');

        // Compter les occurrences de mots comme "problème", "warning", "error"
        const problemPatterns = [
          /problème/gi,
          /warning/gi,
          /error/gi,
          /erreur/gi,
          /injection/gi,
          /xss/gi,
          /vulnérab/gi,
        ];

        issues = problemPatterns.reduce((count, pattern) => {
          const matches = auditContent.match(pattern);
          return count + (matches ? matches.length : 0);
        }, 0);
      } catch (err) {
        console.error(`Erreur lors de la lecture du fichier d'audit pour ${phpName}:`, err);
      }

      // Déterminer la taille et la date de modification (simulées ici)
      const size = Math.floor(Math.random() * 500000) + 10000; // 10KB à 500KB
      const lastModified = new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toISOString(); // Entre maintenant et 7 jours plus tôt

      return {
        name: phpName,
        status,
        size,
        lastModified,
        issues,
      };
    });

    res.json(filesData);
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour servir le fichier HTML principal pour toutes les routes non-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur de tableau de bord démarré sur le port ${PORT}`);
  console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
});
