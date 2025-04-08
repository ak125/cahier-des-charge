#!/usr/bin/env node

/**
 * Script pour générer automatiquement la table des matières du cahier des charges
 */

const fs = require('fs');
const path = require('path');

// Répertoire du cahier des charges
const CDC_DIR = path.join(process.cwd(), 'cahier-des-charges');

// Génération du contenu du sommaire
function generateToc() {
  // Lire la liste des fichiers markdown dans le répertoire
  const files = fs.readdirSync(CDC_DIR)
    .filter(file => file.endsWith('.md'))
    .filter(file => file !== '00-sommaire.md') // Exclure le sommaire lui-même
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[0]);
      const numB = parseInt(b.split('-')[0]);
      return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
    });

  let content = `# 📚 Sommaire du Cahier des Charges\n\n`;
  content += `## 📋 Vue d'ensemble du projet\n\n`;
  content += `Ce cahier des charges présente l'ensemble du processus de migration automatisée assistée par IA, organisé selon les phases logiques du projet.\n\n`;

  // Organisation par sections
  const sections = {
    "I. Introduction et fondamentaux": [1, 36, 37],
    "II. Phase de préparation": [10, 41, 42, 44, 45],
    "III. Infrastructure IA et automatisation": [43, 39, 34],
    "IV. Organisation et planification du travail": [47, 35],
    "V. Qualité et validation": [20, 30, 33],
    "VI. Sécurité et déploiement": [40, 46],
    "VII. Documentation et suivi": [38]
  };

  content += `## 🗂️ Structure des chapitres\n\n`;

  // Générer les sections
  Object.entries(sections).forEach(([sectionName, fileNumbers]) => {
    content += `### ${sectionName}\n`;
    fileNumbers.forEach(num => {
      const matchedFiles = files.filter(file => {
        const fileNum = parseInt(file.split('-')[0]);
        return fileNum === num;
      });

      matchedFiles.forEach(file => {
        const filePath = path.join(CDC_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Extraire le titre du fichier (première ligne commençant par #)
        const titleMatch = fileContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
        
        content += `1. [${title}](./${file}) - `;
        
        // Extraire une brève description (première phrase après le titre)
        const descMatch = fileContent.match(/^#\s+.+\n\n(.+?)[.!?](?:\s|$)/m);
        const desc = descMatch ? descMatch[1] + '.' : 'Voir le document pour plus d\'informations.';
        
        content += `${desc}\n`;
      });
    });
    content += '\n';
  });

  // Ajouter des sections supplémentaires au sommaire
  content += `## 📈 Progression du projet\n\n`;
  content += "```mermaid\ngraph LR\n";
  content += "    A[Préparation] --> B[Infrastructure]\n";
  content += "    B --> C[Planification]\n";
  content += "    C --> D[Migration]\n";
  content += "    D --> E[Validation]\n";
  content += "    E --> F[Déploiement]\n";
  content += "    F --> G[Maintenance]\n";
  content += "    \n";
  content += "    style A fill:#d4f1f9,stroke:#05a,stroke-width:2px\n";
  content += "    style B fill:#d4f1f9,stroke:#05a,stroke-width:2px\n";
  content += "    style C fill:#d4f1f9,stroke:#05a,stroke-width:2px\n";
  content += "    style D fill:#ffe6cc,stroke:#d79b00,stroke-width:2px\n";
  content += "    style E fill:#ffe6cc,stroke:#d79b00,stroke-width:2px\n";
  content += "    style F fill:#d5e8d4,stroke:#82b366,stroke-width:2px\n";
  content += "    style G fill:#f8cecc,stroke:#b85450,stroke-width:2px\n";
  content += "```\n\n";

  content += `## 🔄 Comment utiliser ce cahier des charges\n\n`;
  content += `1. **Pour les décideurs**: Commencez par la section I pour comprendre les fondamentaux\n`;
  content += `2. **Pour les architectes**: Concentrez-vous sur les sections II et III pour la mise en place\n`;
  content += `3. **Pour les développeurs**: Utilisez les sections IV et V pour le travail quotidien\n`;
  content += `4. **Pour les responsables qualité**: Référez-vous aux sections V et VI\n`;
  content += `5. **Pour le suivi du projet**: Consultez la section VII\n\n`;
  content += `Ce sommaire suit le cycle de vie du projet de migration, permettant à chaque partie prenante de se repérer facilement et d'accéder rapidement aux informations pertinentes selon son rôle.\n`;

  return content;
}

// Afficher le contenu généré
console.log(generateToc());
