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
REPORT_DIR="/workspaces/cahier-des-charge/reports/validation"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
REPORT_FILE="$REPORT_DIR/method-validation-$TIMESTAMP.md"

# Méthodes requises par interface
declare -A BASE_AGENT_METHODS=(
  ["initialize"]=0
  ["validate"]=0
  ["execute"]=0
  ["run"]=0
  ["cancel"]=0
  ["getStatus"]=0
  ["getLastResult"]=0
  ["getMetrics"]=0
)

declare -A BUSINESS_AGENT_METHODS=(
  ["process"]=0
  ["validateInput"]=0
  ["formatOutput"]=0
)

declare -A ORCHESTRATION_AGENT_METHODS=(
  ["orchestrate"]=0
  ["registerAgent"]=0
  ["unregisterAgent"]=0
  ["getRegisteredAgents"]=0
)

declare -A COORDINATION_AGENT_METHODS=(
  ["coordinate"]=0
  ["connect"]=0
  ["disconnect"]=0
)

declare -A ANALYZER_AGENT_METHODS=(
  ["analyze"]=0
  ["getAnalysisReport"]=0
)

declare -A GENERATOR_AGENT_METHODS=(
  ["generate"]=0
  ["getGenerationOptions"]=0
)

declare -A VALIDATOR_AGENT_METHODS=(
  ["validateData"]=0
  ["getValidationRules"]=0
)

# Statistiques pour le rapport
TOTAL_FILES=0
COMPLIANT_FILES=0
NON_COMPLIANT_FILES=0

# Créer le répertoire de rapport s'il n'existe pas
mkdir -p "$REPORT_DIR"

# Initialiser le rapport
echo "# Rapport de validation des implémentations d'interfaces - $(date)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Résumé" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Fonction pour vérifier si un fichier implémente les méthodes requises pour une interface
check_interface_methods() {
    local file="$1"
    local interface="$2"
    local class_name=$(grep -o "class [A-Za-z0-9_]\+" "$file" | head -1 | cut -d' ' -f2)
    
    echo -e "${YELLOW}Vérification de $class_name dans $file pour l'interface $interface${RESET}"
    
    # Vérifier si la classe implémente l'interface
    if ! grep -q "implements.*$interface" "$file"; then
        echo -e "  ${BLUE}La classe $class_name n'implémente pas l'interface $interface${RESET}"
        return
    fi
    
    # Compter les méthodes manquantes
    local missing_methods=()
    
    case "$interface" in
        "BaseAgent")
            for method in "${!BASE_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "BusinessAgent")
            for method in "${!BUSINESS_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "OrchestrationAgent")
            for method in "${!ORCHESTRATION_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "CoordinationAgent")
            for method in "${!COORDINATION_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "AnalyzerAgent")
            for method in "${!ANALYZER_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "GeneratorAgent")
            for method in "${!GENERATOR_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
        "ValidatorAgent")
            for method in "${!VALIDATOR_AGENT_METHODS[@]}"; do
                if ! grep -q "$method *(" "$file"; then
                    missing_methods+=("$method")
                fi
            done
            ;;
    esac
    
    # Ajouter les résultats au rapport
    echo "### $class_name ($file)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- Interface: $interface" >> "$REPORT_FILE"
    
    if [ ${#missing_methods[@]} -eq 0 ]; then
        echo -e "  ${GREEN}✓ Toutes les méthodes de l'interface $interface sont implémentées${RESET}"
        echo "- ✅ Toutes les méthodes requises sont implémentées" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        return 0
    else
        echo -e "  ${RED}✗ Méthodes manquantes pour l'interface $interface: ${missing_methods[*]}${RESET}"
        echo "- ❌ Méthodes manquantes:" >> "$REPORT_FILE"
        for method in "${missing_methods[@]}"; do
            echo "  - $method" >> "$REPORT_FILE"
        done
        echo "" >> "$REPORT_FILE"
        return 1
    fi
}

# Fonction pour analyser un fichier
analyze_file() {
    local file="$1"
    local compliant=true
    
    echo -e "\n${BLUE}Analyse du fichier $file${RESET}"
    
    # Vérifier si le fichier contient une classe
    if ! grep -q "class" "$file"; then
        echo -e "  ${YELLOW}Pas de classe trouvée dans $file${RESET}"
        return
    fi
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Vérifier les implémentations d'interfaces
    if grep -q "implements.*BaseAgent" "$file"; then
        check_interface_methods "$file" "BaseAgent" || compliant=false
    fi
    
    if grep -q "implements.*BusinessAgent" "$file"; then
        check_interface_methods "$file" "BusinessAgent" || compliant=false
    fi
    
    if grep -q "implements.*OrchestrationAgent" "$file"; then
        check_interface_methods "$file" "OrchestrationAgent" || compliant=false
    fi
    
    if grep -q "implements.*CoordinationAgent" "$file"; then
        check_interface_methods "$file" "CoordinationAgent" || compliant=false
    fi
    
    if grep -q "implements.*AnalyzerAgent" "$file"; then
        check_interface_methods "$file" "AnalyzerAgent" || compliant=false
    fi
    
    if grep -q "implements.*GeneratorAgent" "$file"; then
        check_interface_methods "$file" "GeneratorAgent" || compliant=false
    fi
    
    if grep -q "implements.*ValidatorAgent" "$file"; then
        check_interface_methods "$file" "ValidatorAgent" || compliant=false
    fi
    
    # Mettre à jour les compteurs
    if [ "$compliant" = true ]; then
        echo -e "  ${GREEN}✓ Le fichier est conforme${RESET}"
        COMPLIANT_FILES=$((COMPLIANT_FILES + 1))
    else
        echo -e "  ${RED}✗ Le fichier n'est pas conforme${RESET}"
        NON_COMPLIANT_FILES=$((NON_COMPLIANT_FILES + 1))
    fi
}

# Trouver tous les fichiers d'agents
echo -e "${BLUE}Recherche des fichiers agents...${RESET}"

# Fonction pour trouver et analyser les fichiers récursivement
find_and_analyze() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Le répertoire $dir n'existe pas${RESET}"
        return
    fi
    
    find "$dir" -name "*.ts" -not -path "*/node_modules/*" -not -name "*.test.ts" -not -name "*.spec.ts" | while read -r file; do
        # Vérifier si c'est un fichier agent (contient "Agent" ou "agent" et "implements")
        if grep -q -E "(class.*Agent|implements)" "$file"; then
            analyze_file "$file"
        fi
    done
}

find_and_analyze "$PACKAGES_DIR"
find_and_analyze "$AGENTS_DIR"

# Finaliser le rapport
echo "- Total des fichiers traités: $TOTAL_FILES" >> "$REPORT_FILE"
echo "- Fichiers conformes: $COMPLIANT_FILES" >> "$REPORT_FILE"
echo "- Fichiers non conformes: $NON_COMPLIANT_FILES" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "\n${GREEN}Validation terminée !${RESET}"
echo -e "Fichiers traités: $TOTAL_FILES"
echo -e "Fichiers conformes: $COMPLIANT_FILES"
echo -e "Fichiers non conformes: $NON_COMPLIANT_FILES"
echo -e "Rapport généré: $REPORT_FILE"

# Création d'un script d'aide pour générer les implémentations manquantes
cat > "/workspaces/cahier-des-charge/implement-missing-methods.sh" << 'EOF'
#!/bin/bash

# Ce script génère des implémentations par défaut pour les méthodes d'interface manquantes

GREEN='\033[0;32m'
RESET='\033[0m'

REPORT_DIR="/workspaces/cahier-des-charge/reports/validation"
LATEST_REPORT=$(find "$REPORT_DIR" -name "method-validation-*.md" | sort -r | head -1)

if [ -z "$LATEST_REPORT" ]; then
    echo "Aucun rapport de validation trouvé. Exécutez d'abord check-methods-implementation.sh."
    exit 1
fi

echo "Génération des implémentations manquantes basées sur $LATEST_REPORT..."

# Extraire les fichiers non conformes avec leurs méthodes manquantes
grep -A 10 "❌ Méthodes manquantes:" "$LATEST_REPORT" | while read -r line; do
    if [[ $line == "### "* ]]; then
        # Extraire le nom de la classe et le chemin du fichier
        class_info=${line#"### "}
        class_name=$(echo "$class_info" | cut -d' ' -f1)
        file_path=$(echo "$class_info" | sed -e 's/.*(\(.*\))/\1/')
        
        # Vérifier si le fichier existe
        if [ -f "$file_path" ]; then
            echo -e "${GREEN}Traitement de $class_name dans $file_path${RESET}"
            
            # Lire les méthodes manquantes
            methods=()
            while read -r method_line; do
                if [[ $method_line == "  - "* ]]; then
                    method=${method_line#"  - "}
                    methods+=("$method")
                elif [[ $method_line == "" ]]; then
                    break
                fi
            done
            
            # Générer les implémentations manquantes
            implementations=""
            for method in "${methods[@]}"; do
                case "$method" in
                    "initialize")
                        implementations+="\n/**\n * Initialise l'agent\n */\nasync initialize(): Promise<void> {\n  console.log('Initialisation de l\\'agent');\n  return Promise.resolve();\n}\n"
                        ;;
                    "validate")
                        implementations+="\n/**\n * Valide le contexte d'exécution\n * @param context Contexte d'exécution\n */\nasync validate(context: any): Promise<boolean> {\n  console.log('Validation du contexte', context);\n  return Promise.resolve(true);\n}\n"
                        ;;
                    "execute")
                        implementations+="\n/**\n * Exécute l'agent\n * @param context Contexte d'exécution\n */\nasync execute(context: any): Promise<any> {\n  console.log('Exécution de l\\'agent', context);\n  return Promise.resolve({ success: true });\n}\n"
                        ;;
                    "run")
                        implementations+="\n/**\n * Lance l'exécution de l'agent\n * @param context Contexte d'exécution\n */\nasync run(context: any): Promise<any> {\n  console.log('Lancement de l\\'agent', context);\n  return this.execute(context);\n}\n"
                        ;;
                    "cancel")
                        implementations+="\n/**\n * Annule l'exécution en cours\n */\ncancel(): void {\n  console.log('Annulation de l\\'exécution');\n}\n"
                        ;;
                    "getStatus")
                        implementations+="\n/**\n * Retourne l'état actuel de l'agent\n */\ngetStatus(): string {\n  return 'IDLE';\n}\n"
                        ;;
                    "getLastResult")
                        implementations+="\n/**\n * Retourne le dernier résultat d'exécution\n */\ngetLastResult(): any {\n  return undefined;\n}\n"
                        ;;
                    "getMetrics")
                        implementations+="\n/**\n * Retourne les métriques d'exécution\n */\ngetMetrics(): any {\n  return { executions: 0 };\n}\n"
                        ;;
                    "process")
                        implementations+="\n/**\n * Traite les données d'entrée\n * @param input Données d'entrée\n */\nasync process(input: any): Promise<any> {\n  console.log('Traitement des données', input);\n  return Promise.resolve(input);\n}\n"
                        ;;
                    "validateInput")
                        implementations+="\n/**\n * Valide les données d'entrée\n * @param input Données d'entrée\n */\nvalidateInput(input: any): boolean {\n  console.log('Validation des données', input);\n  return true;\n}\n"
                        ;;
                    "formatOutput")
                        implementations+="\n/**\n * Formate les données de sortie\n * @param output Données de sortie\n */\nformatOutput(output: any): any {\n  console.log('Formatage des données', output);\n  return output;\n}\n"
                        ;;
                    "orchestrate")
                        implementations+="\n/**\n * Orchestration des agents\n * @param config Configuration d'orchestration\n */\nasync orchestrate(config: any): Promise<any> {\n  console.log('Orchestration des agents', config);\n  return Promise.resolve({ orchestrationId: 'ORCH-' + Date.now() });\n}\n"
                        ;;
                    "registerAgent")
                        implementations+="\n/**\n * Enregistre un agent dans l'orchestrateur\n * @param agent Agent à enregistrer\n */\nregisterAgent(agent: any): string {\n  console.log('Enregistrement de l\\'agent', agent);\n  return 'AGENT-' + Date.now();\n}\n"
                        ;;
                    "unregisterAgent")
                        implementations+="\n/**\n * Désenregistre un agent de l'orchestrateur\n * @param agentId Identifiant de l'agent\n */\nunregisterAgent(agentId: string): boolean {\n  console.log('Désenregistrement de l\\'agent', agentId);\n  return true;\n}\n"
                        ;;
                    "getRegisteredAgents")
                        implementations+="\n/**\n * Récupère la liste des agents enregistrés\n */\ngetRegisteredAgents(): any[] {\n  return [];\n}\n"
                        ;;
                    "coordinate")
                        implementations+="\n/**\n * Coordination des agents\n * @param agents Agents à coordonner\n */\nasync coordinate(agents: any[]): Promise<any> {\n  console.log('Coordination des agents', agents);\n  return Promise.resolve({ coordinationId: 'COORD-' + Date.now() });\n}\n"
                        ;;
                    "connect")
                        implementations+="\n/**\n * Connexion à l'infrastructure de coordination\n */\nasync connect(): Promise<boolean> {\n  console.log('Connexion à l\\'infrastructure de coordination');\n  return Promise.resolve(true);\n}\n"
                        ;;
                    "disconnect")
                        implementations+="\n/**\n * Déconnexion de l'infrastructure de coordination\n */\nasync disconnect(): Promise<boolean> {\n  console.log('Déconnexion de l\\'infrastructure de coordination');\n  return Promise.resolve(true);\n}\n"
                        ;;
                    "analyze")
                        implementations+="\n/**\n * Analyse les données\n * @param data Données à analyser\n */\nasync analyze(data: any): Promise<any> {\n  console.log('Analyse des données', data);\n  return Promise.resolve({ results: [] });\n}\n"
                        ;;
                    "getAnalysisReport")
                        implementations+="\n/**\n * Récupère le rapport d'analyse\n */\ngetAnalysisReport(): any {\n  return { summary: 'Rapport d\\'analyse' };\n}\n"
                        ;;
                    "generate")
                        implementations+="\n/**\n * Génère du contenu\n * @param input Données d'entrée\n */\nasync generate(input: any): Promise<any> {\n  console.log('Génération de contenu', input);\n  return Promise.resolve({ generated: true });\n}\n"
                        ;;
                    "getGenerationOptions")
                        implementations+="\n/**\n * Récupère les options de génération\n */\ngetGenerationOptions(): any {\n  return { options: [] };\n}\n"
                        ;;
                    "validateData")
                        implementations+="\n/**\n * Valide les données selon les règles\n * @param data Données à valider\n */\nasync validateData(data: any): Promise<boolean> {\n  console.log('Validation des données', data);\n  return Promise.resolve(true);\n}\n"
                        ;;
                    "getValidationRules")
                        implementations+="\n/**\n * Récupère les règles de validation\n */\ngetValidationRules(): any {\n  return { rules: [] };\n}\n"
                        ;;
                    *)
                        implementations+="\n/**\n * Implémentation de $method\n */\n$method(...args: any[]): any {\n  console.log('Appel de $method', args);\n  return undefined;\n}\n"
                        ;;
                esac
            done
            
            if [ -n "$implementations" ]; then
                # Trouver où insérer les implémentations (avant la dernière accolade fermante)
                last_line=$(wc -l < "$file_path")
                closing_brace_line=$(grep -n "}" "$file_path" | tail -1 | cut -d':' -f1)
                
                if [ -n "$closing_brace_line" ] && [ "$closing_brace_line" -gt 0 ]; then
                    # Insérer les implémentations avant la dernière accolade
                    sed -i "${closing_brace_line}i\\${implementations}" "$file_path"
                    echo "  Méthodes ajoutées: ${methods[*]}"
                else
                    echo "  Impossible de trouver où insérer les implémentations dans $file_path"
                fi
            fi
        else
            echo "  Fichier non trouvé: $file_path"
        fi
    fi
done

echo -e "\n${GREEN}Terminé ! Vérifiez les implémentations générées et adaptez-les selon vos besoins.${RESET}"
EOF

chmod +x "/workspaces/cahier-des-charge/implement-missing-methods.sh"
echo -e "\n${BLUE}Un script d'aide a été créé: /workspaces/cahier-des-charge/implement-missing-methods.sh${RESET}"
echo -e "Vous pouvez l'exécuter pour générer automatiquement les méthodes manquantes."