#!/usr/bin/env python3

import os
from pathlib import Path
import markdown
import re

def main():
    print("Génération de la version HTML du cahier des charges...")
    
    # Définir les chemins
    cdc_dir = Path("cahier-des-charges")
    output_file = Path("cahier-des-charges-lecture-optimisee.html")
    
    # Vérifier que le dossier existe
    if not cdc_dir.exists() or not cdc_dir.is_dir():
        print(f"❌ Erreur: Le dossier {cdc_dir} n'existe pas. Exécutez d'abord setup-cahier.sh.")
        return
    
    # Préparer l'en-tête HTML avec style
    html_content = """
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Cahier des Charges – Vue complète</title>
  <style>
    body {
      font-family: "Segoe UI", Roboto, sans-serif;
      margin: 0 auto;
      padding: 2rem;
      max-width: 1000px;
      background: #fdfdfd;
      color: #1a1a1a;
    }
    h1 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 2rem;
    }
    h2 {
      border-bottom: 2px solid #ccc;
      padding-bottom: 0.3rem;
      margin-top: 2rem;
      color: #2c3e50;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-left: 4px solid #3498db;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .file-section {
      margin-bottom: 3rem;
      background: #fff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 0 8px rgba(0,0,0,0.05);
    }
    .file-section h2 {
      font-size: 1.5rem;
    }
    .filename {
      font-size: 0.9rem;
      color: #999;
      margin-top: -1rem;
      margin-bottom: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    table, th, td {
      border: 1px solid #ccc;
    }
    th, td {
      padding: 0.5rem;
      text-align: left;
    }
    ul {
      padding-left: 1.2rem;
    }
    .content {
      line-height: 1.6;
    }
    .toc {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .toc h2 {
      margin-top: 0;
    }
    .toc ul {
      list-style-type: none;
    }
  </style>
</head>
<body>
  <h1>📘 Cahier des Charges – Vue unifiée</h1>
  
  <div class="toc">
    <h2>Table des matières</h2>
    <ul>
"""
    
    # Récupérer tous les fichiers .md et les trier
    md_files = sorted([f for f in cdc_dir.glob("*.md")])
    
    # Générer la table des matières
    for md_file in md_files:
        file_id = md_file.stem.lower().replace(" ", "-")
        html_content += f'      <li><a href="#{file_id}">{md_file.name}</a></li>\n'
    
    html_content += """    </ul>
  </div>
"""
    
    # Ajouter chaque fichier markdown
    for md_file in md_files:
        content = md_file.read_text()
        
        # Convertir les caractères spéciaux HTML
        content_safe = content.replace('<', '&lt;').replace('>', '&gt;')
        
        # Convertir le markdown en HTML
        content_html = markdown.markdown(content, extensions=['tables', 'fenced_code'])
        
        file_id = md_file.stem.lower().replace(" ", "-")
        html_content += f"""
    <div class="file-section" id="{file_id}">
      <h2>{md_file.name}</h2>
      <div class="filename">{md_file.name}</div>
      <div class="content">
        {content_html}
      </div>
    </div>
    """
    
    # Finaliser le document HTML
    html_content += "</body></html>"
    
    # Écrire le fichier HTML
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"✅ Fichier HTML généré: {output_file}")

if __name__ == "__main__":
    main()
