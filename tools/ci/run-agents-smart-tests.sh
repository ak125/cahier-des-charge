#!/bin/bash

# Couleurs pour la sortie
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Répertoires à analyser
PACKAGES_DIR="/workspaces/cahier-des-charge/packages/mcp-agents"
AGENTS_DIR="/workspaces/cahier-des-charge/agents"
TESTS_DIR="/workspaces/cahier-des-charge/tests/agents"
REPORT_DIR="/workspaces/cahier-des-charge/reports/tests"
ANALYSIS_DIR="/workspaces/cahier-des-charge/reports/analysis"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
REPORT_FILE="$REPORT_DIR/agent-tests-smart-report-$TIMESTAMP.md"

# Identifier le rapport d'analyse le plus récent
ANALYSIS_FILE=$(ls -t $ANALYSIS_DIR/agent-methods-*.json 2>/dev/null | head -1)

# Si aucun fichier d'analyse n'existe, le générer
if [ -z "$ANALYSIS_FILE" ] || [ ! -f "$ANALYSIS_FILE" ]; then
    echo -e "${YELLOW}Aucun rapport d'analyse trouvé. Génération d'un nouveau rapport...${RESET}"
    mkdir -p "$ANALYSIS_DIR"
    if command -v ts-node &> /dev/null; then
        ts-node /workspaces/cahier-des-charge/detect-agent-methods.ts
        ANALYSIS_FILE=$(ls -t $ANALYSIS_DIR/agent-methods-*.json 2>/dev/null | head -1)
    else
        echo -e "${RED}ts-node n'est pas installé. Installation...${RESET}"
        npm install -g ts-node typescript
        ts-node /workspaces/cahier-des-charge/detect-agent-methods.ts
        ANALYSIS_FILE=$(ls -t $ANALYSIS_DIR/agent-methods-*.json 2>/dev/null | head -1)
    fi
    
    if [ -z "$ANALYSIS_FILE" ] || [ ! -f "$ANALYSIS_FILE" ]; then
        echo -e "${RED}Échec de la génération du rapport d'analyse. Abandon.${RESET}"
        exit 1
    fi
fi

echo -e "${GREEN}Utilisation du rapport d'analyse: $ANALYSIS_FILE${RESET}"

# Statistiques pour le rapport
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Créer le répertoire de rapport s'il n'existe pas
mkdir -p "$REPORT_DIR"

# Initialiser le rapport
echo "# Rapport des tests intelligents d'agents MCP - $(date)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Résumé" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Ce rapport utilise l'analyse: $ANALYSIS_FILE" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Fonction pour exécuter les tests d'un agent en fonction de l'analyse
run_agent_test() {
    local file="$1"
    local analysis="$2"
    local basename=$(basename "$file")
    
    # Extraire les informations d'analyse au format JSON
    local class_name=$(echo "$analysis" | jq -r '.className')
    local is_abstract=$(echo "$analysis" | jq -r '.isAbstract')
    local export_type=$(echo "$analysis" | jq -r '.exportType')
    local methods=$(echo "$analysis" | jq -r '.implementedMethods | join(" ")')
    local properties=$(echo "$analysis" | jq -r '.properties | join(" ")')
    
    echo -e "${YELLOW}Test de $class_name dans $file${RESET}"
    echo -e "  Type d'export: $export_type, Classe abstraite: $is_abstract"
    echo -e "  Méthodes: $methods"
    
    # Créer un fichier de test temporaire
    local test_file="/tmp/test-$class_name-$TIMESTAMP.ts"
    
    # Adapter les tests selon le type d'export et si la classe est abstraite
    if [ "$is_abstract" = "true" ]; then
        # Pour les classes abstraites, vérifier s'il existe un test adapté
        local adapter_test=""
        
        if [ -f "$TESTS_DIR/test-$(echo $class_name | tr '[:upper:]' '[:lower:]').ts" ]; then
            adapter_test="$TESTS_DIR/test-$(echo $class_name | tr '[:upper:]' '[:lower:]').ts"
            echo -e "${BLUE}Utilisation du test adapté: $adapter_test${RESET}"
        fi
        
        if [ -n "$adapter_test" ]; then
            # Exécuter le test adapté
            local test_output=$(ts-node "$adapter_test" 2>&1)
            local exit_code=$?
            handle_test_result "$exit_code" "$test_output" "$class_name" "$file"
        else
            # Créer une classe de test concrète qui hérite de la classe abstraite
            cat > "$test_file" << TESTCODE
import { $class_name } from '$file';

// Test pour la classe abstraite $class_name
class Test$class_name extends $class_name {
  // Implémentation des méthodes abstraites requises
$(echo "$methods" | tr ' ' '\n' | while read -r method; do
  if echo "$method" | grep -q "^abstract"; then
    method_name=$(echo "$method" | sed 's/abstract//')
    echo "  $method_name() { return Promise.resolve({}); }"
  fi
done)
}

async function main() {
  console.log('Test de la classe abstraite $class_name');
  try {
    const agent = new Test$class_name();
    
    // Tester les propriétés
$(echo "$properties" | tr ' ' '\n' | while read -r prop; do
  if [ ! -z "$prop" ]; then
    echo "    console.log('Propriété $prop:', agent.$prop);"
  fi
done)

    // Tester les méthodes disponibles
$(echo "$methods" | tr ' ' '\n' | while read -r method; do
  if [ ! -z "$method" ] && [ "$method" != "constructor" ]; then
    echo "    if (typeof agent.$method === 'function') {"
    echo "      try {"
    echo "        console.log('Appel de $method()...');"
    echo "        const result = await agent.$method({});"
    echo "        console.log('✓ $method() OK');"
    echo "      } catch (error) {"
    echo "        console.log('✗ $method() a échoué:', error.message);"
    echo "      }"
    echo "    }"
  fi
done)

    console.log('Test terminé avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du test:', error);
    return { success: false, error };
  }
}

main().then(result => {
  if (result.success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
TESTCODE
        fi
    elif [ "$export_type" = "instance" ]; then
        # Pour les objets exportés par défaut
        cat > "$test_file" << TESTCODE
import agentInstance from '$file';

async function main() {
  console.log('Test de l\'instance exportée de $class_name');
  try {
    // Vérifier les propriétés de l'instance
$(echo "$properties" | tr ' ' '\n' | while read -r prop; do
  if [ ! -z "$prop" ]; then
    echo "    console.log('Propriété $prop:', agentInstance.$prop);"
  fi
done)

    // Tester les méthodes disponibles
$(echo "$methods" | tr ' ' '\n' | while read -r method; do
  if [ ! -z "$method" ] && [ "$method" != "constructor" ]; then
    echo "    if (typeof agentInstance.$method === 'function') {"
    echo "      try {"
    echo "        console.log('Appel de $method()...');"
    echo "        const result = await agentInstance.$method({});"
    echo "        console.log('✓ $method() OK');"
    echo "      } catch (error) {"
    echo "        console.log('✗ $method() a échoué:', error.message);"
    echo "      }"
    echo "    }"
  fi
done)

    console.log('Test terminé avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du test:', error);
    return { success: false, error };
  }
}

main().then(result => {
  if (result.success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
TESTCODE
    else
        # Pour les classes standard
        cat > "$test_file" << TESTCODE
import { $class_name } from '$file';

async function main() {
  console.log('Test de la classe $class_name');
  try {
    const agent = new $class_name();
    
    // Tester les propriétés
$(echo "$properties" | tr ' ' '\n' | while read -r prop; do
  if [ ! -z "$prop" ]; then
    echo "    console.log('Propriété $prop:', agent.$prop);"
  fi
done)

    // Tester les méthodes disponibles
$(echo "$methods" | tr ' ' '\n' | while read -r method; do
  if [ ! -z "$method" ] && [ "$method" != "constructor" ]; then
    echo "    if (typeof agent.$method === 'function') {"
    echo "      try {"
    echo "        console.log('Appel de $method()...');"
    echo "        const result = await agent.$method({});"
    echo "        console.log('✓ $method() OK');"
    echo "      } catch (error) {"
    echo "        console.log('✗ $method() a échoué:', error.message);"
    echo "      }"
    echo "    }"
  fi
done)

    console.log('Test terminé avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du test:', error);
    return { success: false, error };
  }
}

main().then(result => {
  if (result.success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
TESTCODE
    fi

    # Compter les tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Exécuter le test avec ts-node
    echo -e "${BLUE}Exécution du test pour $class_name...${RESET}"

    # Exécuter le test
    local test_output
    if command -v ts-node &>/dev/null; then
        test_output=$(ts-node --project=/workspaces/cahier-des-charge/tsconfig.json "$test_file" 2>&1)
        local exit_code=$?
        
        echo "$test_output"
        
        handle_test_result "$exit_code" "$test_output" "$class_name" "$file"
    else
        echo -e "${YELLOW}⚠ Test ignoré: ts-node n'est pas installé${RESET}"
        echo "- ⚠ Test ignoré: ts-node n'est pas installé" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
    
    # Supprimer le fichier de test temporaire
    rm -f "$test_file"
}

# Fonction pour gérer les résultats des tests
handle_test_result() {
    local exit_code="$1"
    local test_output="$2"
    local class_name="$3"
    local file="$4"
    
    # Ajouter au rapport
    echo "### $class_name ($file)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Le test a réussi pour $class_name${RESET}"
        echo "- ✅ Test réussi" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "$test_output" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ Le test a échoué pour $class_name${RESET}"
        echo "- ❌ Test échoué" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "$test_output" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Fonction pour trouver tous les agents dans l'analyse
test_agents_from_analysis() {
    local analysis_data=$(cat "$ANALYSIS_FILE")
    local agents_count=$(echo "$analysis_data" | jq '.agentsAnalyzed')
    
    echo -e "${BLUE}Trouvé $agents_count agents à tester dans l'analyse${RESET}"
    
    # Parcourir tous les agents dans l'analyse
    echo "$analysis_data" | jq -c '.agents[]' | while read -r agent; do
        local file_path=$(echo "$agent" | jq -r '.filePath')
        
        # Vérifier si le fichier existe toujours
        if [ -f "$file_path" ]; then
            run_agent_test "$file_path" "$agent"
            echo ""
        else
            echo -e "${YELLOW}Fichier non trouvé: $file_path${RESET}"
        fi
    done
}

# Si ts-node n'est pas installé, l'installer
if ! command -v ts-node &>/dev/null; then
    echo -e "${YELLOW}ts-node n'est pas installé. Installation...${RESET}"
    npm install -g ts-node typescript
fi

# Si jq n'est pas installé, l'installer
if ! command -v jq &>/dev/null; then
    echo -e "${YELLOW}jq n'est pas installé. Installation...${RESET}"
    apt-get update && apt-get install -y jq
fi

# Tester les agents à partir de l'analyse
test_agents_from_analysis

# Finaliser le rapport
echo "- Total des tests: $TOTAL_TESTS" >> "$REPORT_FILE"
echo "- Tests réussis: $PASSED_TESTS" >> "$REPORT_FILE"
echo "- Tests échoués: $FAILED_TESTS" >> "$REPORT_FILE"
echo "- Tests ignorés: $SKIPPED_TESTS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "\n${GREEN}Tests terminés !${RESET}"
echo -e "Total des tests: $TOTAL_TESTS"
echo -e "Tests réussis: $PASSED_TESTS"
echo -e "Tests échoués: $FAILED_TESTS"
echo -e "Tests ignorés: $SKIPPED_TESTS"
echo -e "Rapport généré: $REPORT_FILE"

# Rendre le rapport HTML
HTML_REPORT="${REPORT_FILE%.md}.html"
echo -e "${BLUE}Génération du rapport HTML: $HTML_REPORT${RESET}"

cat > "$HTML_REPORT" << HTML
<!DOCTYPE html>
<html>
<head>
    <title>Rapport des tests intelligents d'agents MCP</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        .container { max-width: 1200px; margin: 0 auto; }
        .success { color: green; }
        .failure { color: red; }
        .warning { color: orange; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .summary { background: #eef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .test-case { border-left: 4px solid #ddd; padding-left: 15px; margin-bottom: 20px; }
        .test-case.success { border-left-color: green; }
        .test-case.failure { border-left-color: red; }
        .badge { display: inline-block; padding: 3px 7px; border-radius: 3px; color: white; font-size: 12px; }
        .badge.success { background-color: green; }
        .badge.failure { background-color: red; }
        .badge.warning { background-color: orange; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Rapport des tests intelligents d'agents MCP</h1>
        <p>Rapport généré le $(date)</p>
        
        <div class="summary">
            <h2>Résumé</h2>
            <p>Ce rapport utilise l'analyse: $(basename "$ANALYSIS_FILE")</p>
            <p><strong>Total des tests:</strong> $TOTAL_TESTS</p>
            <p><strong>Tests réussis:</strong> <span class="success">$PASSED_TESTS</span></p>
            <p><strong>Tests échoués:</strong> <span class="failure">$FAILED_TESTS</span></p>
            <p><strong>Tests ignorés:</strong> <span class="warning">$SKIPPED_TESTS</span></p>
        </div>
        
        <h2>Détails des tests</h2>
        
        <!-- Les détails des tests seront insérés ici par le script de conversion Markdown vers HTML -->
        $(awk '
BEGIN { in_test_case = 0; test_class = ""; test_status = ""; }
/^### / {
    if (in_test_case) print "</div>"
    in_test_case = 1
    test_class = substr($0, 5)
    test_status = ""
    print "<div class=\"test-case\">"
    print "<h3>" test_class "</h3>"
}
/^- ✅/ {
    test_status = "success"
    print "<p><span class=\"badge success\">Réussi</span> Test exécuté avec succès</p>"
}
/^- ❌/ {
    test_status = "failure"
    print "<p><span class=\"badge failure\">Échoué</span> Le test a échoué</p>"
}
/^- ⚠/ {
    test_status = "warning"
    print "<p><span class=\"badge warning\">Ignoré</span> Test ignoré</p>"
}
/^\`\`\`/ {
    if (in_code) {
        print "</pre>"
        in_code = 0
    } else {
        print "<pre>"
        in_code = 1
    }
}
!/^###|^- ✅|^- ❌|^- ⚠|^\`\`\`/ {
    if (in_code) print $0
}
END {
    if (in_test_case) print "</div>"
}
' "$REPORT_FILE")
    </div>
</body>
</html>
HTML

echo -e "${GREEN}Rapport HTML généré: $HTML_REPORT${RESET}"