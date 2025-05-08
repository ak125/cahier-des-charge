#!/bin/bash

# Script pour extraire les groupes de fichiers similaires et générer un plan d'action
# Utilisation: ./generate-similar-files-plan.sh

set -e

WORKSPACE_ROOT="/workspaces/cahier-des-charge"
REPORT_PATH="$WORKSPACE_ROOT/cleanup-report/deep-deduplication-report.md"
OUTPUT_DIR="$WORKSPACE_ROOT/cleanup-scripts/deduplication-plan"
OUTPUT_FILE="$OUTPUT_DIR/similar-files-plan.json"
FILE_MAPPING="$OUTPUT_DIR/file-mapping.txt"

echo "Génération du plan d'action pour les fichiers similaires"

# Assurez-vous que le répertoire de sortie existe
mkdir -p "$OUTPUT_DIR"

# Vérifier si le rapport existe
if [ ! -f "$REPORT_PATH" ]; then
    echo "Le rapport n'existe pas: $REPORT_PATH"
    exit 1
fi

echo "Indexation des fichiers disponibles dans le workspace..."
find "$WORKSPACE_ROOT" -type f -not -path "*/node_modules/*" -not -path "*/\.*" -not -path "*/backup/*" | sort > "$FILE_MAPPING"
echo "$(wc -l < "$FILE_MAPPING") fichiers indexés"

# Afficher des informations sur le rapport
echo "Informations sur le rapport:"
echo "- Chemin: $REPORT_PATH"
echo "- Taille: $(stat -c%s "$REPORT_PATH") octets"
echo "- Date de modification: $(stat -c%y "$REPORT_PATH")"

# Extraire les premières lignes du rapport pour vérification
echo "Aperçu du contenu du rapport (20 premières lignes):"
head -n 20 "$REPORT_PATH"

# Créer un script temporaire pour éviter les problèmes d'échappement
TMP_SCRIPT=$(mktemp)
cat > "$TMP_SCRIPT" << 'EOF'
const fs = require('fs');
const path = require('path');
const util = require('util');

const reportPath = process.argv[2];
const outputFile = process.argv[3];
const fileMappingPath = process.argv[4];
const workspaceRoot = process.argv[5];

// Lire la liste des fichiers indexés
let fileList = [];
try {
    fileList = fs.readFileSync(fileMappingPath, 'utf8').split('\n').filter(Boolean);
    console.log(`Chargé ${fileList.length} fichiers indexés`);
} catch (error) {
    console.error('Erreur lors de la lecture de la liste des fichiers:', error);
    process.exit(1);
}

// Créer une fonction pour trouver le chemin complet d'un fichier
function findFullPath(fileName) {
    // D'abord, chercher le chemin exact
    const exactMatch = fileList.find(file => file.endsWith('/' + fileName));
    if (exactMatch) return exactMatch;
    
    // Sinon, chercher un fichier avec un nom similaire
    const possibleMatches = fileList.filter(file => {
        const baseName = path.basename(file);
        return baseName.includes(fileName) || fileName.includes(baseName);
    });
    
    if (possibleMatches.length > 0) {
        // Préférer les fichiers qui ne sont pas dans des dossiers d'archives ou de backup
        const preferredMatch = possibleMatches.find(file => 
            !file.includes('/archives/') && 
            !file.includes('/backup/')
        );
        
        return preferredMatch || possibleMatches[0];
    }
    
    // Si aucun match n'est trouvé
    return null;
}

// Lire le rapport
let reportContent;
try {
    reportContent = fs.readFileSync(reportPath, 'utf8');
    console.log(`Rapport lu avec succès: ${reportContent.length} caractères`);
} catch (error) {
    console.error('Erreur lors de la lecture du rapport:', error);
    process.exit(1);
}

// Analyser les groupes de fichiers similaires directement à partir du rapport complet
const groups = [];
const fileGroups = new Map(); // Pour regrouper les fichiers similaires

// Rechercher les motifs similaires aux fichiers 
const filePathRegex = /(\/workspaces\/cahier-des-charge\/[^,\s)]+)/g;
let match;
const allFiles = new Set();

// Collecter tous les chemins de fichiers mentionnés dans le rapport
while ((match = filePathRegex.exec(reportContent)) !== null) {
    const filePath = match[1].replace(/^\/workspaces\/cahier-des-charge\//, '');
    allFiles.add(filePath);
}

console.log(`Trouvé ${allFiles.size} fichiers mentionnés dans le rapport`);

// Si le nombre de fichiers est important, on cherche des groupes
if (allFiles.size > 0) {
    // Rechercher des motifs de similarité 
    const similarityRegex = /([^\s]+) et ([^\s]+)[^\d]*(\d+)%/g;
    
    // Collecter toutes les relations de similarité
    const similarities = [];
    while ((match = similarityRegex.exec(reportContent)) !== null) {
        let file1 = match[1].replace(/["'`]/g, '').trim();
        let file2 = match[2].replace(/["'`]/g, '').trim();
        
        // Normaliser les chemins de fichiers
        if (file1.startsWith('/workspaces/cahier-des-charge/')) {
            file1 = file1.replace('/workspaces/cahier-des-charge/', '');
        }
        
        if (file2.startsWith('/workspaces/cahier-des-charge/')) {
            file2 = file2.replace('/workspaces/cahier-des-charge/', '');
        }
        
        const similarity = parseInt(match[3], 10) / 100;
        
        similarities.push({ file1, file2, similarity });
    }
    
    console.log(`Trouvé ${similarities.length} relations de similarité`);
    
    // Si nous avons des similarités, on les utilise pour créer des groupes
    if (similarities.length > 0) {
        // Regrouper les fichiers similaires
        for (const sim of similarities) {
            if (sim.similarity >= 0.7) { // Au moins 70% de similarité
                if (!fileGroups.has(sim.file1)) {
                    fileGroups.set(sim.file1, new Set([sim.file1]));
                }
                if (!fileGroups.has(sim.file2)) {
                    fileGroups.set(sim.file2, new Set([sim.file2]));
                }
                
                // Fusionner les deux ensembles
                const group1 = fileGroups.get(sim.file1);
                const group2 = fileGroups.get(sim.file2);
                
                const mergedGroup = new Set([...group1, ...group2]);
                for (const file of mergedGroup) {
                    fileGroups.set(file, mergedGroup);
                }
            }
        }
        
        // Consolider les groupes (éliminer les doublons)
        const uniqueGroups = new Map();
        for (const group of fileGroups.values()) {
            if (group.size >= 2) { // Au moins 2 fichiers
                const key = Array.from(group).sort().join(',');
                uniqueGroups.set(key, group);
            }
        }
        
        console.log(`${uniqueGroups.size} groupes de fichiers similaires identifiés`);
        
        // Convertir en tableau de groupes
        let index = 1;
        for (const [key, files] of uniqueGroups.entries()) {
            const filesArray = Array.from(files);
            
            // Vérifier si les fichiers existent dans le système de fichiers
            const existingFiles = [];
            for (const file of filesArray) {
                // Pour chaque fichier mentionné dans le groupe, chercher son chemin complet
                const fileName = path.basename(file);
                const fullPath = findFullPath(fileName);
                
                if (fullPath) {
                    // Normaliser le chemin pour être relatif au workspace
                    const relativePath = fullPath.replace(workspaceRoot + '/', '');
                    existingFiles.push(relativePath);
                }
            }
            
            // Ne garder que les groupes avec au moins 2 fichiers existants
            if (existingFiles.length >= 2) {
                // Trouver la similarité moyenne pour ce groupe
                let totalSimilarity = 0;
                let relationCount = 0;
                
                for (let i = 0; i < filesArray.length; i++) {
                    for (let j = i + 1; j < filesArray.length; j++) {
                        const sim = similarities.find(s => 
                            (s.file1 === filesArray[i] && s.file2 === filesArray[j]) ||
                            (s.file1 === filesArray[j] && s.file2 === filesArray[i])
                        );
                        
                        if (sim) {
                            totalSimilarity += sim.similarity;
                            relationCount++;
                        }
                    }
                }
                
                const averageSimilarity = relationCount > 0 
                    ? totalSimilarity / relationCount 
                    : 0.75; // Valeur par défaut
                
                groups.push({
                    groupName: `Groupe ${index++} (${existingFiles.length} fichiers)`,
                    files: existingFiles,
                    similarity: averageSimilarity
                });
            }
        }
    } else {
        // Approche alternative: chercher des groupes explicites dans la structure du rapport
        console.log('Recherche de groupes explicites dans le rapport...');
        
        const groupRegex = /### Groupe ['"](.*?)['"] \((\d+) fichiers\)/g;
        let currentGroup = null;
        let currentFiles = [];
        
        // Diviser le rapport en lignes
        const lines = reportContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Détecter un nouveau groupe
            const groupMatch = line.match(/^### Groupe ['"](.*?)['"] \((\d+) fichiers\)/);
            if (groupMatch) {
                // Si nous avions déjà un groupe en cours, l'ajouter à la liste
                if (currentGroup && currentFiles.length >= 2) {
                    // Vérifier si les fichiers existent dans le système de fichiers
                    const existingFiles = [];
                    for (const file of currentFiles) {
                        // Pour chaque fichier mentionné dans le groupe, chercher son chemin complet
                        const fileName = path.basename(file);
                        const fullPath = findFullPath(fileName);
                        
                        if (fullPath) {
                            // Normaliser le chemin pour être relatif au workspace
                            const relativePath = fullPath.replace(workspaceRoot + '/', '');
                            existingFiles.push(relativePath);
                        }
                    }
                    
                    // Ne garder que les groupes avec au moins 2 fichiers existants
                    if (existingFiles.length >= 2) {
                        groups.push({
                            groupName: currentGroup,
                            files: existingFiles,
                            similarity: 0.75 // Valeur par défaut
                        });
                    }
                }
                
                // Commencer un nouveau groupe
                currentGroup = groupMatch[1];
                currentFiles = [];
                continue;
            }
            
            // Détecter des fichiers dans le groupe courant
            if (currentGroup) {
                const fileMatch = line.match(/^- ['"](.*?)['"]$/) || line.match(/^- (\/\S+)$/);
                if (fileMatch) {
                    let filePath = fileMatch[1];
                    if (filePath.startsWith('/workspaces/cahier-des-charge/')) {
                        filePath = filePath.replace('/workspaces/cahier-des-charge/', '');
                    }
                    currentFiles.push(filePath);
                }
            }
        }
        
        // Ajouter le dernier groupe s'il existe
        if (currentGroup && currentFiles.length >= 2) {
            // Vérifier si les fichiers existent dans le système de fichiers
            const existingFiles = [];
            for (const file of currentFiles) {
                // Pour chaque fichier mentionné dans le groupe, chercher son chemin complet
                const fileName = path.basename(file);
                const fullPath = findFullPath(fileName);
                
                if (fullPath) {
                    // Normaliser le chemin pour être relatif au workspace
                    const relativePath = fullPath.replace(workspaceRoot + '/', '');
                    existingFiles.push(relativePath);
                }
            }
            
            // Ne garder que les groupes avec au moins 2 fichiers existants
            if (existingFiles.length >= 2) {
                groups.push({
                    groupName: currentGroup,
                    files: existingFiles,
                    similarity: 0.75 // Valeur par défaut
                });
            }
        }
        
        console.log(`${groups.length} groupes explicites identifiés`);
    }
} else {
    console.log('Aucun fichier trouvé dans le rapport.');
}

// Générer le plan d'action pour chaque groupe
const actionPlan = groups.map(group => {
    // Pour chaque groupe, identifier le fichier qui semble être la référence
    // (pour l'instant, on prend celui qui est à la racine du projet ou le premier)
    let keepFile = group.files.find(f => !f.includes('archives/') && !f.includes('backup/')) || group.files[0];
    
    return {
        groupName: group.groupName,
        strategy: group.similarity > 0.85 ? 'keep-one' : 'merge',
        keepFile: keepFile,
        filesToProcess: group.files.filter(file => file !== keepFile),
        similarity: group.similarity,
        recommendations: [
            group.similarity > 0.85 
                ? 'Les fichiers sont très similaires (>85%), nous recommandons de garder un seul fichier.' 
                : 'Les fichiers ont des parties communes et pourraient être fusionnés.'
        ]
    };
});

// Écrire le plan d'action dans un fichier JSON
try {
    fs.writeFileSync(outputFile, JSON.stringify(actionPlan, null, 2), 'utf8');
    console.log(`Plan d'action généré avec succès: ${actionPlan.length} groupes de fichiers similaires`);
} catch (error) {
    console.error('Erreur lors de l\'écriture du plan d\'action:', error);
    process.exit(1);
}
EOF

# Exécuter le script Node.js
node "$TMP_SCRIPT" "$REPORT_PATH" "$OUTPUT_FILE" "$FILE_MAPPING" "$WORKSPACE_ROOT"

# Supprimer le script temporaire
rm "$TMP_SCRIPT"

echo "Plan d'action généré dans $OUTPUT_FILE"
echo "Vérifions son contenu :"
if [ -f "$OUTPUT_FILE" ]; then
    ls -l "$OUTPUT_FILE"
    echo "Taille du fichier: $(stat -c%s "$OUTPUT_FILE") octets"
    
    # Afficher les premières lignes du plan d'action s'il n'est pas vide
    if [ "$(stat -c%s "$OUTPUT_FILE")" -gt 10 ]; then
        echo "Premières lignes du plan d'action :"
        head -n 20 "$OUTPUT_FILE"
    else
        echo "Le plan d'action est vide ou très petit."
    fi
else 
    echo "Erreur: Le fichier de plan d'action n'a pas été créé."
    exit 1
fi

echo "Terminé!"