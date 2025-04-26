#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   ÉLIMINATION DES DOUBLONS ET SCRIPTS OBSOLÈTES      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/workspaces/cahier-des-charge/backups/cleanup_${TIMESTAMP}"
LOG_DIR="/workspaces/cahier-des-charge/logs"
SCRIPTS_DIR="/workspaces/cahier-des-charge/scripts"
REPORT_DIR="/workspaces/cahier-des-charge/documentation/scripts"

# Création des dossiers nécessaires
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${REPORT_DIR}"

# Fichier log
LOG_FILE="${LOG_DIR}/cleanup_${TIMESTAMP}.log"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  local message="$1"
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "${LOG_FILE}"
}

# Fonction pour sauvegarder les scripts avant nettoyage
backup_scripts() {
  log "${YELLOW}Sauvegarde des scripts avant nettoyage...${NC}"
  
  # Copier les scripts
  cp -r "${SCRIPTS_DIR}" "${BACKUP_DIR}"
  
  log "${GREEN}✅ Sauvegarde des scripts terminée dans ${BACKUP_DIR}${NC}"
}

# Fonction pour identifier et traiter les doublons manifestes
process_duplicates() {
  log "${YELLOW}Traitement des doublons manifestes...${NC}"
  
  # Liste des doublons identifiés
  DUPLICATES_LOG="${REPORT_DIR}/duplicates-removed.md"
  
  {
    echo "# Scripts dupliqués supprimés"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Liste des doublons traités"
    echo ""
  } > "${DUPLICATES_LOG}"
  
  # 1. Multiples versions de verify-cahier
  log "Traitement des multiples versions de verify-cahier..."
  {
    echo "### Doublons de verify-cahier"
    echo ""
    echo "Action : Conserver uniquement la version TypeScript (.ts)"
    echo ""
    echo "Fichiers supprimés :"
    echo ""
  } >> "${DUPLICATES_LOG}"
  
  # Trouver les fichiers verify-cahier
  find "${SCRIPTS_DIR}" -name "verify-cahier.*" | while read -r file; do
    if [[ "${file}" != *".ts" ]]; then
      echo "- \`${file}\`" >> "${DUPLICATES_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    fi
  done
  
  # 2. Doublons de fix-permissions.sh
  log "Traitement des doublons de fix-permissions.sh..."
  {
    echo ""
    echo "### Doublons de fix-permissions.sh"
    echo ""
    echo "Action : Conserver uniquement la version dans le répertoire maintenance"
    echo ""
    echo "Fichiers supprimés :"
    echo ""
  } >> "${DUPLICATES_LOG}"
  
  # Garder uniquement la version dans maintenance
  find "${SCRIPTS_DIR}" -name "fix-permissions.sh" | grep -v "maintenance" | while read -r file; do
    echo "- \`${file}\`" >> "${DUPLICATES_LOG}"
    mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
  done
  
  # 3. Scripts d'agent consolidés
  log "Suppression des scripts d'agent redondants après consolidation..."
  {
    echo ""
    echo "### Scripts d'agents consolidés"
    echo ""
    echo "Action : Supprimer les scripts redondants maintenant que les agents sont consolidés"
    echo ""
    echo "Fichiers supprimés :"
    echo ""
  } >> "${DUPLICATES_LOG}"
  
  # Liste des scripts d'agent à consolider
  CONSOLIDATED_SCRIPTS=(
    "agent-status.js"
    "clean-mcp-agents.sh"
    "migrate-agent.js"
  )
  
  for script in "${CONSOLIDATED_SCRIPTS[@]}"; do
    find "${SCRIPTS_DIR}" -name "${script}" | grep -v "agents/core" | while read -r file; do
      echo "- \`${file}\`" >> "${DUPLICATES_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    done
  done
  
  # 4. Scripts de migration consolidés
  log "Suppression des scripts de migration redondants..."
  {
    echo ""
    echo "### Scripts de migration consolidés"
    echo ""
    echo "Action : Supprimer les versions redondantes des scripts de migration"
    echo ""
    echo "Fichiers supprimés :"
    echo ""
  } >> "${DUPLICATES_LOG}"
  
  # Liste des scripts de migration à consolider
  CONSOLIDATED_MIGRATION=(
    "batch-generate-migration-plans.sh"
    "generate-migration-plan.ts"
  )
  
  for script in "${CONSOLIDATED_MIGRATION[@]}"; do
    count=0
    find "${SCRIPTS_DIR}" -name "${script}" | while read -r file; do
      count=$((count + 1))
      if [ "${count}" -gt 1 ]; then
        echo "- \`${file}\`" >> "${DUPLICATES_LOG}"
        mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
      fi
    done
  done
  
  log "${GREEN}✅ Doublons manifestes traités${NC}"
}

# Fonction pour éliminer les scripts obsolètes
remove_obsolete_scripts() {
  log "${YELLOW}Élimination des scripts obsolètes...${NC}"
  
  # Liste des scripts obsolètes
  OBSOLETE_LOG="${REPORT_DIR}/obsolete-removed.md"
  
  {
    echo "# Scripts obsolètes supprimés"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Liste des scripts obsolètes"
    echo ""
  } > "${OBSOLETE_LOG}"
  
  # 1. Scripts de test non maintenus
  log "Suppression des scripts de test non maintenus..."
  {
    echo "### Scripts de test non maintenus"
    echo ""
    echo "Action : Déplacer les scripts de test obsolètes vers les archives"
    echo ""
    echo "Scripts déplacés :"
    echo ""
  } >> "${OBSOLETE_LOG}"
  
  # Liste des motifs de scripts de test non maintenus
  OBSOLETE_TEST_PATTERNS=(
    "*-test-*.js"
    "*test-old*.js"
    "*test-legacy*.js"
    "*test-unused*.js"
  )
  
  for pattern in "${OBSOLETE_TEST_PATTERNS[@]}"; do
    find "${SCRIPTS_DIR}" -name "${pattern}" | while read -r file; do
      echo "- \`${file}\`" >> "${OBSOLETE_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    done
  done
  
  # 2. Scripts portant des noms vagues
  log "Suppression des scripts avec des noms vagues..."
  {
    echo ""
    echo "### Scripts avec des noms vagues"
    echo ""
    echo "Action : Déplacer les scripts mal nommés vers les archives"
    echo ""
    echo "Scripts déplacés :"
    echo ""
  } >> "${OBSOLETE_LOG}"
  
  # Liste des scripts avec des noms vagues
  VAGUE_SCRIPT_NAMES=(
    "setup.js"
    "test.js"
    "utils.js"
    "helpers.js"
    "misc.js"
    "temp.js"
    "script.js"
  )
  
  for script in "${VAGUE_SCRIPT_NAMES[@]}"; do
    find "${SCRIPTS_DIR}" -name "${script}" | while read -r file; do
      echo "- \`${file}\`" >> "${OBSOLETE_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    done
  done
  
  log "${GREEN}✅ Scripts obsolètes éliminés${NC}"
}

# Fonction pour fusionner les scripts similaires
consolidate_similar_scripts() {
  log "${YELLOW}Fusion des scripts similaires...${NC}"
  
  # Liste des scripts à fusionner
  CONSOLIDATION_LOG="${REPORT_DIR}/scripts-consolidated.md"
  
  {
    echo "# Scripts similaires fusionnés"
    echo ""
    echo "Document généré le $(date)"
    echo ""
    echo "## Groupes de scripts fusionnés"
    echo ""
  } > "${CONSOLIDATION_LOG}"
  
  # 1. Fusionner les scripts de nettoyage
  log "Fusion des scripts de nettoyage..."
  {
    echo "### Scripts de nettoyage"
    echo ""
    echo "Action : Fusionner en un script unique avec options"
    echo ""
    echo "Fichier créé : \`maintenance/unified-cleanup.sh\`"
    echo ""
    echo "Scripts remplacés :"
    echo ""
  } >> "${CONSOLIDATION_LOG}"
  
  # Liste des scripts de nettoyage à fusionner
  CLEANUP_SCRIPTS=(
    "cleanup-duplicates.sh"
    "cleanup-project.sh"
    "clean-mcp-agents.sh"
    "deduplicate-files.sh"
  )
  
  # Créer le script unifié de nettoyage
  mkdir -p "${SCRIPTS_DIR}/maintenance"
  
  cat > "${SCRIPTS_DIR}/maintenance/unified-cleanup.sh" << 'EOL'
#!/bin/bash

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   SCRIPT DE NETTOYAGE UNIFIÉ DU PROJET      ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Variables
SCRIPTS_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
PROJECT_ROOT=$(dirname "${SCRIPTS_DIR}")
LOG_DIR="${PROJECT_ROOT}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/cleanup-${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"
touch "${LOG_FILE}"

# Fonction de logging
log() {
  echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "${LOG_FILE}"
}

# Fonction pour nettoyer les fichiers dupliqués
cleanup_duplicates() {
  log "${YELLOW}Nettoyage des fichiers dupliqués...${NC}"
  
  # Recherche des fichiers potentiellement dupliqués (même taille)
  find "${PROJECT_ROOT}" -type f -not -path "*/node_modules/*" -not -path "*/\.git/*" -not -path "*/backups/*" -printf "%s %p\n" | \
  sort -n | \
  awk 'BEGIN{lasthash=""; lastsize=0; lastfile=""}
  {
    if($1 == lastsize && lastsize > 100) {
      print "Vérification : " lastfile " et " $2 > "/dev/stderr"
      cmd = "md5sum \"" lastfile "\" \"" $2 "\""
      cmd | getline; md51 = $1; file1 = $2
      cmd | getline; md52 = $1; file2 = $2
      close(cmd)
      if(md51 == md52) {
        print file1 " et " file2 " sont identiques"
        print "rm \"" file2 "\""
      }
    }
    lastsize = $1
    lastfile = $2
  }' | grep "^rm" > /tmp/duplicate-removal-commands.sh
  
  # Afficher les fichiers à supprimer
  if [ -s "/tmp/duplicate-removal-commands.sh" ]; then
    log "Les fichiers dupliqués suivants vont être supprimés :"
    cat /tmp/duplicate-removal-commands.sh | sed 's/rm "/- /' | sed 's/"$//'
    
    read -p "Voulez-vous supprimer ces fichiers? (o/n): " confirm
    if [[ $confirm == "o" || $confirm == "O" ]]; then
      bash /tmp/duplicate-removal-commands.sh
      log "${GREEN}✅ Fichiers dupliqués supprimés${NC}"
    else
      log "${YELLOW}Suppression annulée${NC}"
    fi
  else
    log "${GREEN}✅ Aucun fichier dupliqué trouvé${NC}"
  fi
}

# Fonction pour nettoyer le projet
cleanup_project() {
  log "${YELLOW}Nettoyage général du projet...${NC}"
  
  # Nettoyer les dossiers temporaires
  find "${PROJECT_ROOT}" -name "tmp" -type d -exec rm -rf {} \; 2>/dev/null || true
  find "${PROJECT_ROOT}" -name "temp" -type d -exec rm -rf {} \; 2>/dev/null || true
  find "${PROJECT_ROOT}" -name ".DS_Store" -type f -delete 2>/dev/null || true
  
  # Nettoyer les fichiers de log
  find "${LOG_DIR}" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
  
  # Nettoyer les backups anciens
  find "${PROJECT_ROOT}/backups" -type d -mtime +90 -exec rm -rf {} \; 2>/dev/null || true
  
  log "${GREEN}✅ Nettoyage général terminé${NC}"
}

# Fonction pour nettoyer les agents MCP
clean_mcp_agents() {
  log "${YELLOW}Nettoyage des agents MCP...${NC}"
  
  # Supprimer les agents temporaires ou orphelins
  find "${PROJECT_ROOT}/agents" -name "*temp*.ts" -type f -delete 2>/dev/null || true
  find "${PROJECT_ROOT}/agents" -name "*backup*.ts" -type f -delete 2>/dev/null || true
  
  # Identifier les agents orphelins (non référencés)
  for agent in $(find "${PROJECT_ROOT}/agents" -name "*.ts" -type f); do
    agent_name=$(basename "${agent}" .ts)
    if ! grep -q "${agent_name}" "${PROJECT_ROOT}/agents/index.ts" 2>/dev/null; then
      echo "Agent orphelin trouvé : ${agent}"
    fi
  done
  
  log "${GREEN}✅ Nettoyage des agents MCP terminé${NC}"
}

# Fonction pour dédupliquer les fichiers
deduplicate_files() {
  log "${YELLOW}Suppression des fichiers en double...${NC}"
  
  # Utiliser fdupes pour identifier les doublons
  if command -v fdupes &> /dev/null; then
    fdupes -r "${PROJECT_ROOT}" -f | tee /tmp/duplicate-files.txt
    
    if [ -s "/tmp/duplicate-files.txt" ]; then
      log "Fichiers en double trouvés. Consultez /tmp/duplicate-files.txt pour les détails."
      log "Utilisez 'fdupes -r -d ${PROJECT_ROOT}' pour les supprimer interactivement."
    else
      log "${GREEN}✅ Aucun doublon trouvé${NC}"
    fi
  else
    log "${RED}❌ L'outil 'fdupes' n'est pas installé. Installation recommandée.${NC}"
  fi
}

# Menu principal
show_menu() {
  echo ""
  echo "Options disponibles:"
  echo "1. Nettoyer les fichiers dupliqués"
  echo "2. Nettoyage général du projet"
  echo "3. Nettoyer les agents MCP"
  echo "4. Dédupliquer les fichiers"
  echo "5. Exécuter tout"
  echo "6. Quitter"
  echo ""
  read -p "Choisissez une option (1-6): " choice
  
  case $choice in
    1) cleanup_duplicates ;;
    2) cleanup_project ;;
    3) clean_mcp_agents ;;
    4) deduplicate_files ;;
    5)
      cleanup_duplicates
      cleanup_project
      clean_mcp_agents
      deduplicate_files
      ;;
    6) exit 0 ;;
    *) echo "Option invalide" ;;
  esac
  
  show_menu
}

# Vérifier si des arguments sont fournis
if [ $# -gt 0 ]; then
  for arg in "$@"; do
    case $arg in
      --duplicates) cleanup_duplicates ;;
      --project) cleanup_project ;;
      --agents) clean_mcp_agents ;;
      --dedup) deduplicate_files ;;
      --all)
        cleanup_duplicates
        cleanup_project
        clean_mcp_agents
        deduplicate_files
        ;;
      --help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --duplicates   Nettoyer les fichiers dupliqués"
        echo "  --project      Nettoyage général du projet"
        echo "  --agents       Nettoyer les agents MCP"
        echo "  --dedup        Dédupliquer les fichiers"
        echo "  --all          Exécuter toutes les actions"
        echo "  --help         Afficher cette aide"
        exit 0
        ;;
    esac
  done
else
  # Aucun argument, afficher le menu interactif
  show_menu
fi
EOL
  
  chmod +x "${SCRIPTS_DIR}/maintenance/unified-cleanup.sh"
  
  # Lister les scripts remplacés
  for script in "${CLEANUP_SCRIPTS[@]}"; do
    find "${SCRIPTS_DIR}" -name "${script}" | while read -r file; do
      echo "- \`${file}\`" >> "${CONSOLIDATION_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    done
  done
  
  # 2. Fusionner les scripts de génération de rapports
  log "Fusion des scripts de génération de rapports..."
  {
    echo ""
    echo "### Scripts de génération de rapports"
    echo ""
    echo "Action : Fusionner en un script unique avec options"
    echo ""
    echo "Fichier créé : \`generation/unified-report-generator.sh\`"
    echo ""
    echo "Scripts remplacés :"
    echo ""
  } >> "${CONSOLIDATION_LOG}"
  
  # Liste des scripts de génération de rapports à fusionner
  REPORT_SCRIPTS=(
    "generate-reports.js"
    "generate-html-view.js"
    "generate-interactive-report.js"
    "generate-dashboard.js"
  )
  
  # Créer le script unifié de génération de rapports
  mkdir -p "${SCRIPTS_DIR}/generation"
  
  cat > "${SCRIPTS_DIR}/generation/unified-report-generator.js" << 'EOL'
#!/usr/bin/env node

/**
 * Script unifié pour la génération de rapports
 * Combine les fonctionnalités de plusieurs générateurs de rapports précédents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const projectRoot = path.resolve(__dirname, '../..');
const reportDir = path.join(projectRoot, 'reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(projectRoot, 'logs', `report-generator-${timestamp}.log`);

// Assurer que les répertoires existent
fs.mkdirSync(path.join(projectRoot, 'logs'), { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

// Logger
function log(message) {
  const logEntry = `[${new Date().toISOString()}] ${message}`;
  console.log(logEntry);
  fs.appendFileSync(logFile, logEntry + '\n');
}

// Générer un rapport simple
function generateSimpleReport(target, options = {}) {
  log(`Génération d'un rapport simple pour ${target}...`);
  
  const reportFile = path.join(reportDir, `${target}-report-${timestamp}.md`);
  
  let content = `# Rapport sur ${target}\n\n`;
  content += `Date: ${new Date().toLocaleString()}\n\n`;
  
  if (target === 'agents') {
    // Liste des agents
    content += '## Liste des agents\n\n';
    const agentsDir = path.join(projectRoot, 'agents');
    
    if (fs.existsSync(agentsDir)) {
      const agents = fs.readdirSync(agentsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      agents.forEach(agent => {
        content += `- ${agent}\n`;
      });
    } else {
      content += '*Aucun agent trouvé*\n';
    }
  } else if (target === 'workflows') {
    // Liste des workflows
    content += '## Liste des workflows\n\n';
    const workflowsDir = path.join(projectRoot, 'workflows');
    
    if (fs.existsSync(workflowsDir)) {
      const workflows = fs.readdirSync(workflowsDir)
        .filter(file => file.endsWith('.json'));
      
      workflows.forEach(workflow => {
        content += `- ${workflow}\n`;
      });
    } else {
      content += '*Aucun workflow trouvé*\n';
    }
  } else if (target === 'scripts') {
    // Liste des scripts
    content += '## Liste des scripts\n\n';
    const scriptsDir = path.join(projectRoot, 'scripts');
    
    if (fs.existsSync(scriptsDir)) {
      const categories = fs.readdirSync(scriptsDir)
        .filter(item => fs.statSync(path.join(scriptsDir, item)).isDirectory());
      
      categories.forEach(category => {
        content += `### ${category}\n\n`;
        
        const categoryDir = path.join(scriptsDir, category);
        const scripts = fs.readdirSync(categoryDir)
          .filter(file => file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.ts'));
        
        scripts.forEach(script => {
          content += `- ${script}\n`;
        });
        
        content += '\n';
      });
    } else {
      content += '*Aucun script trouvé*\n';
    }
  }
  
  fs.writeFileSync(reportFile, content);
  log(`✅ Rapport généré : ${reportFile}`);
  
  return reportFile;
}

// Générer un rapport HTML
function generateHTMLReport(target, options = {}) {
  log(`Génération d'un rapport HTML pour ${target}...`);
  
  // Générer d'abord le rapport markdown
  const mdReportFile = generateSimpleReport(target, options);
  const htmlReportFile = mdReportFile.replace('.md', '.html');
  
  // Conversion en HTML
  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport sur ${target}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    li { margin: 5px 0; }
    .timestamp { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Rapport sur ${target}</h1>
  <p class="timestamp">Date: ${new Date().toLocaleString()}</p>
`;

  // Convertir le contenu Markdown en HTML basique
  const mdContent = fs.readFileSync(mdReportFile, 'utf8');
  const lines = mdContent.split('\n');
  
  // Ignorer les deux premières lignes (titre et date)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('## ')) {
      htmlContent += `  <h2>${line.substring(3)}</h2>\n`;
    } else if (line.startsWith('### ')) {
      htmlContent += `  <h3>${line.substring(4)}</h3>\n`;
    } else if (line.startsWith('- ')) {
      htmlContent += `  <ul>\n    <li>${line.substring(2)}</li>\n  </ul>\n`;
    } else if (line !== '') {
      htmlContent += `  <p>${line}</p>\n`;
    }
  }
  
  htmlContent += `</body>
</html>`;

  fs.writeFileSync(htmlReportFile, htmlContent);
  log(`✅ Rapport HTML généré : ${htmlReportFile}`);
  
  return htmlReportFile;
}

// Générer un rapport interactif
function generateInteractiveReport(target, options = {}) {
  log(`Génération d'un rapport interactif pour ${target}...`);
  
  const interactiveReportFile = path.join(reportDir, `${target}-interactive-${timestamp}.html`);
  
  // Contenu de base
  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport interactif - ${target}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .filters input, .filters select { padding: 8px; margin-right: 10px; }
    .filters button { padding: 8px 15px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .filters button:hover { background: #0052a3; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .hidden { display: none; }
    .timestamp { color: #666; font-style: italic; }
    .expandable { cursor: pointer; }
    .details { display: none; padding: 10px; background: #f9f9f9; border-left: 3px solid #0066cc; margin: 5px 0 5px 20px; }
  </style>
</head>
<body>
  <h1>Rapport interactif - ${target}</h1>
  <p class="timestamp">Date: ${new Date().toLocaleString()}</p>
  
  <div class="filters">
    <input type="text" id="searchInput" placeholder="Rechercher...">
    <select id="categoryFilter">
      <option value="">Toutes les catégories</option>
    </select>
    <button onclick="applyFilters()">Filtrer</button>
    <button onclick="resetFilters()">Réinitialiser</button>
  </div>
  
  <table id="dataTable">
    <thead>
      <tr>
        <th>Nom</th>
        <th>Catégorie</th>
        <th>Taille</th>
        <th>Dernière modification</th>
      </tr>
    </thead>
    <tbody>
`;

  // Générer les données en fonction de la cible
  let dataDir = projectRoot;
  if (target === 'agents') {
    dataDir = path.join(projectRoot, 'agents');
  } else if (target === 'scripts') {
    dataDir = path.join(projectRoot, 'scripts');
  } else if (target === 'workflows') {
    dataDir = path.join(projectRoot, 'workflows');
  }
  
  // Fonction récursive pour lister les fichiers
  function listFiles(dir, targetType) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively add files from subdirectory
        files = files.concat(listFiles(fullPath, targetType));
      } else {
        // Only include relevant files based on target
        let shouldInclude = false;
        let category = path.relative(dataDir, path.dirname(fullPath)) || 'Root';
        
        if (targetType === 'agents' && (item.endsWith('.ts') || item.endsWith('.js'))) {
          shouldInclude = true;
        } else if (targetType === 'scripts' && (item.endsWith('.sh') || item.endsWith('.js') || item.endsWith('.ts'))) {
          shouldInclude = true;
        } else if (targetType === 'workflows' && item.endsWith('.json')) {
          shouldInclude = true;
        } else if (targetType === 'all') {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          files.push({
            name: item,
            path: fullPath,
            category: category,
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }
    }
    
    return files;
  }
  
  const files = listFiles(dataDir, target);
  
  // Ajouter chaque fichier au tableau
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file.path);
    const sizeKb = (file.size / 1024).toFixed(2);
    const mtime = file.mtime.toLocaleString();
    
    htmlContent += `      <tr class="expandable" data-path="${relativePath}">
        <td>${file.name}</td>
        <td>${file.category}</td>
        <td>${sizeKb} KB</td>
        <td>${mtime}</td>
      </tr>
      <tr>
        <td colspan="4" class="details" id="${relativePath.replace(/[^a-zA-Z0-9]/g, '_')}">
          <p>Chargement...</p>
        </td>
      </tr>
`;
  }
  
  // Terminer le HTML avec le JavaScript pour l'interactivité
  htmlContent += `    </tbody>
  </table>

  <script>
    // Collecte des catégories uniques
    document.addEventListener('DOMContentLoaded', () => {
      const categories = new Set();
      const rows = document.querySelectorAll('#dataTable tbody tr.expandable');
      
      rows.forEach(row => {
        const category = row.cells[1].textContent;
        categories.add(category);
        
        // Ajouter les événements de clic
        row.addEventListener('click', function() {
          const path = this.getAttribute('data-path');
          const detailsId = path.replace(/[^a-zA-Z0-9]/g, '_');
          const detailsRow = document.getElementById(detailsId);
          
          if (detailsRow.style.display === 'block') {
            detailsRow.style.display = 'none';
          } else {
            detailsRow.style.display = 'block';
            
            // Charger les détails si ce n'est pas déjà fait
            if (detailsRow.querySelector('p').textContent === 'Chargement...') {
              fetchFileDetails(path, detailsId);
            }
          }
        });
      });
      
      // Remplir le sélecteur de catégories
      const categoryFilter = document.getElementById('categoryFilter');
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
    });
    
    // Fonction pour chercher les détails du fichier
    function fetchFileDetails(path, detailsId) {
      const detailsElement = document.getElementById(detailsId);
      
      // Simuler un chargement asynchrone (dans un vrai environnement, il faudrait un appel serveur)
      setTimeout(() => {
        let content = '<h4>Détails pour ' + path + '</h4>';
        
        // Selon l'extension, afficher différentes informations
        if (path.endsWith('.ts') || path.endsWith('.js')) {
          content += '<p>Script JavaScript/TypeScript</p>';
          content += '<p>Voir le code source pour plus de détails.</p>';
        } else if (path.endsWith('.sh')) {
          content += '<p>Script Shell</p>';
          content += '<p>Voir le code source pour plus de détails.</p>';
        } else if (path.endsWith('.json')) {
          content += '<p>Fichier de configuration ou workflow</p>';
          content += '<p>Contient des paramètres structurés au format JSON.</p>';
        }
        
        detailsElement.innerHTML = content;
      }, 500);
    }
    
    // Filtrage
    function applyFilters() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      const categoryFilter = document.getElementById('categoryFilter').value;
      const rows = document.querySelectorAll('#dataTable tbody tr.expandable');
      
      rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const category = row.cells[1].textContent;
        const path = row.getAttribute('data-path');
        const detailsId = path.replace(/[^a-zA-Z0-9]/g, '_');
        const detailsRow = document.getElementById(detailsId);
        
        const nameMatch = name.includes(searchTerm);
        const categoryMatch = categoryFilter === '' || category === categoryFilter;
        
        if (nameMatch && categoryMatch) {
          row.classList.remove('hidden');
          if (detailsRow.style.display === 'block') {
            detailsRow.classList.remove('hidden');
          } else {
            detailsRow.classList.add('hidden');
          }
        } else {
          row.classList.add('hidden');
          detailsRow.classList.add('hidden');
        }
      });
    }
    
    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('categoryFilter').value = '';
      
      const rows = document.querySelectorAll('#dataTable tbody tr');
      rows.forEach(row => {
        if (row.classList.contains('details')) {
          row.style.display = 'none';
        }
        row.classList.remove('hidden');
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(interactiveReportFile, htmlContent);
  log(`✅ Rapport interactif généré : ${interactiveReportFile}`);
  
  return interactiveReportFile;
}

// Générer un rapport de tableau de bord
function generateDashboardReport(options = {}) {
  log(`Génération d'un tableau de bord...`);
  
  const dashboardFile = path.join(reportDir, `dashboard-${timestamp}.html`);
  
  // Générer des données pour le tableau de bord
  const dashboardData = {
    scripts: {
      total: 0,
      byCategory: {}
    },
    agents: {
      total: 0,
      byType: {}
    },
    workflows: {
      total: 0
    }
  };
  
  // Compter les scripts par catégorie
  const scriptsDir = path.join(projectRoot, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const categories = fs.readdirSync(scriptsDir)
      .filter(item => fs.statSync(path.join(scriptsDir, item)).isDirectory());
    
    categories.forEach(category => {
      const categoryDir = path.join(scriptsDir, category);
      const scripts = fs.readdirSync(categoryDir)
        .filter(file => file.endsWith('.sh') || file.endsWith('.js') || file.endsWith('.ts'));
      
      dashboardData.scripts.byCategory[category] = scripts.length;
      dashboardData.scripts.total += scripts.length;
    });
  }
  
  // Compter les agents
  const agentsDir = path.join(projectRoot, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    
    dashboardData.agents.total = agents.length;
    
    // Catégoriser les agents par nom
    agents.forEach(agent => {
      let type = 'Autre';
      
      if (agent.includes('audit')) {
        type = 'Audit';
      } else if (agent.includes('validator') || agent.includes('verifier')) {
        type = 'Validation';
      } else if (agent.includes('orchestrator')) {
        type = 'Orchestration';
      } else if (agent.includes('monitor')) {
        type = 'Monitoring';
      }
      
      dashboardData.agents.byType[type] = (dashboardData.agents.byType[type] || 0) + 1;
    });
  }
  
  // Compter les workflows
  const workflowsDir = path.join(projectRoot, 'workflows');
  if (fs.existsSync(workflowsDir)) {
    const workflows = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.json'));
    
    dashboardData.workflows.total = workflows.length;
  }
  
  // Générer le HTML du tableau de bord
  let dashboardHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau de Bord du Projet</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #333; color: white; padding: 20px; }
    .header h1 { margin: 0; }
    .header p { margin: 5px 0 0 0; opacity: 0.8; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: white; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px; }
    .card h2 { margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .stat-box { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .stat-label { font-weight: bold; }
    .chart-container { height: 250px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tableau de Bord du Projet</h1>
    <p>Généré le ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="container">
    <div class="dashboard-grid">
      <div class="card">
        <h2>Scripts</h2>
        <div class="stat-box">
          <span class="stat-label">Total des scripts:</span>
          <span class="stat-value">${dashboardData.scripts.total}</span>
        </div>
        <div class="chart-container">
          <canvas id="scriptsChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>Agents</h2>
        <div class="stat-box">
          <span class="stat-label">Total des agents:</span>
          <span class="stat-value">${dashboardData.agents.total}</span>
        </div>
        <div class="chart-container">
          <canvas id="agentsChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>Workflows</h2>
        <div class="stat-box">
          <span class="stat-label">Total des workflows:</span>
          <span class="stat-value">${dashboardData.workflows.total}</span>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Données pour les graphiques
    const scriptsData = {
      labels: ${JSON.stringify(Object.keys(dashboardData.scripts.byCategory))},
      values: ${JSON.stringify(Object.values(dashboardData.scripts.byCategory))}
    };
    
    const agentsData = {
      labels: ${JSON.stringify(Object.keys(dashboardData.agents.byType))},
      values: ${JSON.stringify(Object.values(dashboardData.agents.byType))}
    };
    
    // Créer les graphiques
    document.addEventListener('DOMContentLoaded', () => {
      // Graphique des scripts
      const scriptsCtx = document.getElementById('scriptsChart').getContext('2d');
      new Chart(scriptsCtx, {
        type: 'bar',
        data: {
          labels: scriptsData.labels,
          datasets: [{
            label: 'Nombre de scripts',
            data: scriptsData.values,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
      
      // Graphique des agents
      const agentsCtx = document.getElementById('agentsChart').getContext('2d');
      new Chart(agentsCtx, {
        type: 'pie',
        data: {
          labels: agentsData.labels,
          datasets: [{
            data: agentsData.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(dashboardFile, dashboardHtml);
  log(`✅ Tableau de bord généré : ${dashboardFile}`);
  
  return dashboardFile;
}

// Fonction d'aide : afficher l'aide
function showHelp() {
  console.log(`
Générateur de rapports unifié
-----------------------------

Usage: node unified-report-generator.js [command] [target] [options]

Commands:
  simple    Générer un rapport simple au format Markdown
  html      Générer un rapport HTML
  interactive  Générer un rapport interactif HTML avec filtres
  dashboard    Générer un tableau de bord général

Targets:
  agents    Générer un rapport sur les agents
  scripts   Générer un rapport sur les scripts
  workflows Générer un rapport sur les workflows
  all       Générer un rapport sur tous les éléments

Options:
  --open    Ouvrir le rapport généré dans un navigateur
  --help    Afficher cette aide

Examples:
  node unified-report-generator.js simple agents
  node unified-report-generator.js html scripts --open
  node unified-report-generator.js interactive workflows
  node unified-report-generator.js dashboard --open
  `);
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }
  
  const command = args[0];
  const target = args[1] || 'all';
  const options = {
    open: args.includes('--open')
  };
  
  let reportFile;
  
  switch (command) {
    case 'simple':
      reportFile = generateSimpleReport(target, options);
      break;
    case 'html':
      reportFile = generateHTMLReport(target, options);
      break;
    case 'interactive':
      reportFile = generateInteractiveReport(target, options);
      break;
    case 'dashboard':
      reportFile = generateDashboardReport(options);
      break;
    default:
      console.error(`Commande inconnue: ${command}`);
      showHelp();
      return;
  }
  
  // Ouvrir le rapport si demandé
  if (options.open && reportFile) {
    const command = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    try {
      execSync(`${command} "${reportFile}"`);
      log(`Rapport ouvert dans le navigateur par défaut`);
    } catch (error) {
      log(`Erreur lors de l'ouverture du rapport: ${error.message}`);
    }
  }
  
  log(`Exécution terminée.`);
}

main();
EOL
  
  chmod +x "${SCRIPTS_DIR}/generation/unified-report-generator.js"
  
  # Lister les scripts remplacés
  for script in "${REPORT_SCRIPTS[@]}"; do
    find "${SCRIPTS_DIR}" -name "${script}" | while read -r file; do
      echo "- \`${file}\`" >> "${CONSOLIDATION_LOG}"
      mv "${file}" "${BACKUP_DIR}/$(basename "${file}")"
    done
  done
  
  log "${GREEN}✅ Scripts similaires fusionnés${NC}"
}

# Menu principal
main() {
  echo -e "${YELLOW}Ce script va éliminer les doublons et les scripts obsolètes.${NC}"
  echo -e "${RED}ATTENTION: Une sauvegarde sera créée avant toute suppression.${NC}"
  read -p "Voulez-vous continuer? (o/n): " confirm
  
  if [[ $confirm != "o" && $confirm != "O" ]]; then
    log "${RED}Opération annulée par l'utilisateur.${NC}"
    exit 1
  fi
  
  # Étape 1: Créer une sauvegarde
  backup_scripts
  
  # Étape 2: Traiter les doublons manifestes
  process_duplicates
  
  # Étape 3: Éliminer les scripts obsolètes
  remove_obsolete_scripts
  
  # Étape 4: Fusionner les scripts similaires
  consolidate_similar_scripts
  
  log "${GREEN}======================================================${NC}"
  log "${GREEN}✅ Nettoyage des scripts terminé!${NC}"
  log "${GREEN}   - Sauvegarde : ${BACKUP_DIR}${NC}"
  log "${GREEN}   - Rapport des doublons : ${REPORT_DIR}/duplicates-removed.md${NC}"
  log "${GREEN}   - Rapport des obsolètes : ${REPORT_DIR}/obsolete-removed.md${NC}"
  log "${GREEN}   - Rapport de consolidation : ${REPORT_DIR}/scripts-consolidated.md${NC}"
  log "${GREEN}   - Log : ${LOG_FILE}${NC}"
  log "${GREEN}======================================================${NC}"
  
  echo ""
  echo "Opération terminée. Les scripts suivants ont été fusionnés :"
  echo "1. Scripts de nettoyage -> maintenance/unified-cleanup.sh"
  echo "2. Scripts de rapport -> generation/unified-report-generator.js"
  echo ""
  echo "Vous pouvez consulter les rapports pour plus de détails."
}

# Exécuter le script
main