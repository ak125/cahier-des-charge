#!/bin/bash

echo "🔍 Vérification approfondie de la cohérence du cahier des charges..."

CDC_DIR="cahier-des-charges"

# Vérification de cohérence des référentiels techniques
echo "📊 Validation des références techniques..."
grep -r "NestJS" "$CDC_DIR" | grep -v "NestJS [0-9]\+" | while read -r line; do
  echo "⚠️ Version NestJS non spécifiée: $line"
done

# Vérification des dépendances circulaires
echo "🔄 Recherche de dépendances circulaires..."
python3 -c '
import re, os, sys
from collections import defaultdict

deps = defaultdict(list)
files = [f for f in os.listdir("'$CDC_DIR'") if f.endswith(".md")]

for file in files:
    with open(os.path.join("'$CDC_DIR'", file), "r") as f:
        content = f.read()
        module = re.search(r"^# (?:Module )?([\w\s]+)", content, re.MULTILINE)
        if module:
            module_name = module.group(1).strip()
            depends = re.findall(r"dépend\w* de [\"\']?([\w\s]+)[\"\']?", content, re.IGNORECASE)
            for dep in depends:
                deps[module_name].append(dep.strip())

# Détection des cycles
def has_cycle(graph, start, visited=None, rec_stack=None):
    if visited is None: visited = set()
    if rec_stack is None: rec_stack = set()
    
    visited.add(start)
    rec_stack.add(start)
    
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            if has_cycle(graph, neighbor, visited, rec_stack):
                print(f"⚠️ Dépendance circulaire: {start} -> {neighbor}")
                return True
        elif neighbor in rec_stack:
            print(f"⚠️ Dépendance circulaire: {start} -> {neighbor}")
            return True
    
    rec_stack.remove(start)
    return False

for module in deps:
    has_cycle(deps, module)
'

echo "✅ Vérification de cohérence terminée"
