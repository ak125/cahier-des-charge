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
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
REPORT_FILE="$REPORT_DIR/agent-tests-adapted-report-$TIMESTAMP.md"

# Statistiques pour le rapport
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Créer le répertoire de rapport s'il n'existe pas
mkdir -p "$REPORT_DIR"

# Initialiser le rapport
echo "# Rapport des tests adaptés d'agents MCP - $(date)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Résumé" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Définir les cas spéciaux - correspondance entre classes problématiques et tests adaptés
declare -A SPECIAL_CASES
SPECIAL_CASES["abstract-analyzer-agent.ts"]="$TESTS_DIR/test-abstract-analyzer.ts"
SPECIAL_CASES["base-analyzer-agent.ts"]="$TESTS_DIR/test-base-analyzer.ts"
SPECIAL_CASES["php-analyzer-v2.ts"]="$TESTS_DIR/test-php-analyzer-v2.ts"

# Liste des classes abstraites ou exportées en tant qu'objets
ABSTRACT_CLASSES=("AbstractAnalyzerAgent" "BaseAnalyzerAgent")
EXPORTED_OBJECTS=("PHPAnalyzerV2" "DataAnalyzerAgent" "DependencyAnalyzerAgent" "StructureAnalyzerAgent" "QAAnalyzerV2")

# Fonction pour vérifier si une classe est abstraite ou exportée comme objet
is_special_case() {
    local file=$(basename "$1")
    
    for key in "${!SPECIAL_CASES[@]}"; do
        if [[ "$file" == *"$key"* ]]; then
            return 0  # Vrai - c'est un cas spécial
        fi
    done
    
    return 1  # Faux - ce n'est pas un cas spécial
}

# Fonction pour exécuter un test adapté
run_adapted_test() {
    local file=$(basename "$1")
    local test_file=""
    
    # Trouver le fichier de test correspondant
    for key in "${!SPECIAL_CASES[@]}"; do
        if [[ "$file" == *"$key"* ]]; then
            test_file="${SPECIAL_CASES[$key]}"
            break
        fi
    done
    
    if [ -z "$test_file" ]; then
        echo -e "${RED}Aucun test adapté trouvé pour $file${RESET}"
        return 1
    fi
    
    # Extraire le nom de la classe/module à partir du nom du fichier
    local class_name=$(basename "$file" .ts)
    local test_name="test-$(echo $class_name | tr '[:upper:]' '[:lower:]')"
    
    echo -e "${BLUE}Exécution du test adapté pour $class_name...${RESET}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Exécuter le test avec ts-node
    local test_output
    if command -v ts-node &>/dev/null; then
        test_output=$(ts-node "$test_file" 2>&1)
        local exit_code=$?
        
        echo "$test_output"
        
        # Ajouter au rapport
        echo "### $class_name ($1)" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        if [ $exit_code -eq 0 ]; then
            echo -e "${GREEN}✓ Le test adapté a réussi pour $class_name${RESET}"
            echo "- ✅ Test adapté réussi" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "$test_output" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ Le test adapté a échoué pour $class_name${RESET}"
            echo "- ❌ Test adapté échoué" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "$test_output" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ Test ignoré: ts-node n'est pas installé${RESET}"
        echo "- ⚠ Test ignoré: ts-node n'est pas installé" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Fonction pour exécuter les tests d'un agent standard
run_agent_test() {
    local file="$1"
    local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file" | head -1 | cut -d' ' -f2)
    
    # Vérifier si c'est une classe abstraite ou exportée comme objet
    if is_special_case "$file"; then
        run_adapted_test "$file"
        return
    fi
    
    echo -e "${YELLOW}Test de $class_name dans $file${RESET}"
    
    # Créer un fichier de test temporaire
    local test_file="/tmp/test-$class_name-$TIMESTAMP.ts"
    
    cat > "$test_file" << TESTCODE
import { $class_name } from '$file';

// Test simple des méthodes d'interface
async function test${class_name}() {
    console.log('Test de la classe $class_name dans $file');
    try {
        const agent = new $class_name();
        
        // Tester initialize
        if (typeof agent.initialize === 'function') {
            await agent.initialize();
            console.log('✓ initialize() ok');
        }
        
        // Tester validate
        if (typeof agent.validate === 'function') {
            const validationResult = await agent.validate({});
            console.log('✓ validate() ok, résultat:', validationResult);
        }
        
        // Tester execute
        if (typeof agent.execute === 'function') {
            const executionResult = await agent.execute({});
            console.log('✓ execute() ok, résultat:', executionResult);
        }
        
        // Tester run
        if (typeof agent.run === 'function') {
            const runResult = await agent.run({});
            console.log('✓ run() ok, résultat:', runResult);
        }
        
        // Tester process
        if (typeof agent.process === 'function') {
            const processResult = await agent.process({});
            console.log('✓ process() ok, résultat:', processResult);
        }
        
        // Tester analyze
        if (typeof agent.analyze === 'function') {
            const analyzeResult = await agent.analyze({});
            console.log('✓ analyze() ok, résultat:', analyzeResult);
        }
        
        // Tester generate
        if (typeof agent.generate === 'function') {
            const generateResult = await agent.generate({});
            console.log('✓ generate() ok, résultat:', generateResult);
        }
        
        // Tester validateData
        if (typeof agent.validateData === 'function') {
            const validateDataResult = await agent.validateData({});
            console.log('✓ validateData() ok, résultat:', validateDataResult);
        }
        
        console.log('Test de $class_name terminé avec succès');
        return { success: true, agent: agent };
    } catch (error) {
        console.error('Erreur lors du test de $class_name:', error);
        return { success: false, error: error };
    }
}

// Exécuter le test
test${class_name}().then(result => {
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

    # Compter les tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Exécuter le test avec ts-node
    echo -e "${BLUE}Exécution du test pour $class_name...${RESET}"
    local test_output
    if command -v ts-node &>/dev/null; then
        test_output=$(ts-node "$test_file" 2>&1)
        local exit_code=$?
        
        echo "$test_output"
        
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
    else
        echo -e "${YELLOW}⚠ Test ignoré: ts-node n'est pas installé${RESET}"
        echo "- ⚠ Test ignoré: ts-node n'est pas installé" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
    
    # Supprimer le fichier de test temporaire
    rm -f "$test_file"
}

# Fonction pour trouver et tester les fichiers d'agents récursivement
find_and_test() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Le répertoire $dir n'existe pas${RESET}"
        return
    fi
    
    find "$dir" -name "*.ts" -not -path "*/node_modules/*" -not -name "*.test.ts" -not -name "*.spec.ts" | while read -r file; do
        # Vérifier si c'est un fichier agent (contient une classe et implements)
        if grep -q "class" "$file" && grep -q "implements" "$file"; then
            run_agent_test "$file"
            echo ""
        elif is_special_case "$file"; then
            run_adapted_test "$file"
            echo ""
        fi
    done
}

# Tester les cas particuliers d'abord
echo -e "${BLUE}Test des cas particuliers...${RESET}"
for key in "${!SPECIAL_CASES[@]}"; do
    file_path=$(find "$PACKAGES_DIR" -name "*$key*" | head -1)
    if [ -n "$file_path" ]; then
        run_adapted_test "$file_path"
        echo ""
    else
        echo -e "${YELLOW}Fichier correspondant à $key non trouvé${RESET}"
    fi
done

# Ensuite, exécuter les tests réguliers
echo -e "${BLUE}Recherche des agents standard à tester...${RESET}"

# Si ts-node n'est pas installé, essayer de l'installer
if ! command -v ts-node &>/dev/null; then
    echo -e "${YELLOW}ts-node n'est pas installé. Tentative d'installation...${RESET}"
    npm install -g ts-node typescript
fi

# Exécuter les tests
find_and_test "$PACKAGES_DIR"
find_and_test "$AGENTS_DIR"

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