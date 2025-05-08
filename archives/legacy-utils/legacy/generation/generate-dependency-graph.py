#!/usr/bin/env python3

import os
import re
import json
from pathlib import Path
import argparse

def extract_dependencies_from_markdown(file_path):
    """Extrait les dépendances mentionnées dans un fichier markdown."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Recherche des références à d'autres modules
    module_refs = set()
    
    # Motifs à rechercher (ajuster selon la structure de vos documents)
    patterns = [
        r'dépend(?:s|ent|ance)?\s+(?:de|du|des)\s+(?:module|modules)?\s+(?:de|du|des)?\s+`?(\w+[-\w]*)`?',
        r'interdépendance(?:s)?\s+avec\s+(?:le|les|)\s+(?:module|modules)?\s+`?(\w+[-\w]*)`?',
        r'impacte?\s+(?:le|les|)\s+(?:module|modules)?\s+`?(\w+[-\w]*)`?',
        r'connexion\s+(?:avec|au|aux)\s+`?(\w+[-\w]*)`?',
    ]
    
    for pattern in patterns:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            module_refs.add(match.group(1))
    
    # Extraction du nom du module du fichier actuel
    module_name = None
    title_match = re.search(r'^# (Module|Composant|Service)?\s*(\w+[-\w]*)', content, re.MULTILINE)
    if title_match:
        module_name = title_match.group(2).strip()
    else:
        # Utiliser le nom du fichier comme fallback
        module_name = os.path.basename(file_path).replace('.md', '').split('-')[-1]
    
    return {
        "module": module_name,
        "dependencies": list(module_refs),
        "file": os.path.basename(file_path)
    }

def generate_dependency_graph(cdc_dir):
    """Génère un graphe des dépendances entre modules."""
    module_files = []
    
    # Recherche des fichiers concernant des modules
    for md_file in Path(cdc_dir).glob("*.md"):
        if re.search(r'module|composant|service|agent', md_file.name, re.IGNORECASE):
            module_files.append(md_file)
    
    # Extraction des dépendances
    dependencies = []
    for file_path in module_files:
        deps = extract_dependencies_from_markdown(file_path)
        if deps["dependencies"]:
            dependencies.append(deps)
    
    return dependencies

def generate_mermaid_diagram(dependencies):
    """Génère un diagramme Mermaid à partir des dépendances."""
    mermaid = "```mermaid\ngraph TD\n"
    
    # Ajouter les nœuds
    for dep in dependencies:
        module = dep["module"]
        mermaid += f"    {module}[{module}]\n"
    
    # Ajouter les connexions
    for dep in dependencies:
        module = dep["module"]
        for dependency in dep["dependencies"]:
            mermaid += f"    {module} --> {dependency}\n"
    
    mermaid += "```"
    return mermaid

def update_interdependence_file(cdc_dir, mermaid_diagram, dependencies):
    """Met à jour le fichier d'interdépendances avec le nouveau diagramme."""
    file_path = os.path.join(cdc_dir, "interdependances.md")
    
    if not os.path.exists(file_path):
        print(f"⚠️ Le fichier {file_path} n'existe pas. Création en cours...")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("# Matrice des interdépendances\n\n")
            f.write("## 🔄 Vue d'ensemble\n\n")
            f.write("Ce document centralise les interdépendances entre les différents composants du projet.\n\n")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Chercher la section de diagramme existante
    diagram_section = "## 📊 Diagramme des dépendances\n\n"
    
    if diagram_section in content:
        # Remplacer la section existante
        parts = content.split(diagram_section)
        before = parts[0] + diagram_section
        after_parts = parts[1].split("\n```")
        if len(after_parts) > 1:
            after = "\n```".join(after_parts[1:])
        else:
            after = ""
        
        new_content = before + mermaid_diagram + after
    else:
        # Ajouter une nouvelle section
        new_content = content + "\n\n" + diagram_section + mermaid_diagram + "\n\n"
    
    # Ajouter une section de détail des dépendances
    details_section = "## 📋 Détail des dépendances détectées\n\n"
    details_content = details_section
    
    for dep in dependencies:
        details_content += f"### {dep['module']} ({dep['file']})\n\n"
        if dep["dependencies"]:
            details_content += "Dépend de:\n\n"
            for dependency in dep["dependencies"]:
                details_content += f"- {dependency}\n"
        else:
            details_content += "Aucune dépendance détectée.\n"
        details_content += "\n"
    
    # Remplacer ou ajouter la section de détails
    if details_section in new_content:
        parts = new_content.split(details_section)
        before = parts[0] + details_section
        after_parts = parts[1].split("##")
        if len(after_parts) > 1:
            after = "##" + "##".join(after_parts[1:])
        else:
            after = ""
        
        new_content = details_content + after
    else:
        new_content += "\n\n" + details_content
    
    # Écrire les modifications
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return file_path

def main():
    parser = argparse.ArgumentParser(description='Génère un graphe des dépendances entre modules.')
    parser.add_argument('--dir', default='cahier-des-charges', help='Dossier du cahier des charges')
    args = parser.parse_args()
    
    cdc_dir = args.dir
    
    if not os.path.exists(cdc_dir):
        print(f"❌ Le dossier {cdc_dir} n'existe pas.")
        return 1
    
    print(f"🔍 Analyse des fichiers dans {cdc_dir}...")
    dependencies = generate_dependency_graph(cdc_dir)
    
    if not dependencies:
        print("⚠️ Aucune dépendance détectée.")
        return 0
    
    print(f"✅ {len(dependencies)} modules avec dépendances trouvés.")
    
    mermaid_diagram = generate_mermaid_diagram(dependencies)
    updated_file = update_interdependence_file(cdc_dir, mermaid_diagram, dependencies)
    
    print(f"✅ Diagramme des dépendances généré et ajouté à {updated_file}")
    
    # Sauvegarder les dépendances au format JSON pour utilisation par d'autres outils
    with open(os.path.join(cdc_dir, 'dependencies.json'), 'w', encoding='utf-8') as f:
        json.dump(dependencies, f, indent=2)
    
    print(f"✅ Fichier de dépendances JSON sauvegardé: {os.path.join(cdc_dir, 'dependencies.json')}")
    
    return 0

if __name__ == "__main__":
    exit(main())
