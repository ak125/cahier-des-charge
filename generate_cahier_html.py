#!/usr/bin/env python3

from pathlib import Path
import os
import re
import sys
import datetime

def main():
    # Définir les chemins
    cdc_dir = Path("cahier-des-charges")
    output_dir = Path("docs")
    output_file = output_dir / "cahier-des-charges.html"
    
    # Vérifier que le dossier cahier-des-charges existe
    if not cdc_dir.exists() or not cdc_dir.is_dir():
        print(f"❌ Erreur: Le dossier {cdc_dir} n'existe pas. Exécutez d'abord setup-cahier.sh.")
        return 1
    
    # Créer le dossier de sortie si nécessaire
    output_dir.mkdir(exist_ok=True)
    
    # Préparer les entrées du sommaire et le contenu des sections
    toc_entries = []
    sections_html = ""
    
    # Récupérer les fichiers .md et les trier
    md_files = sorted([f for f in cdc_dir.glob("*.md")])
    
    # Générer le contenu dynamique
    for md_file in md_files:
        section_id = md_file.stem.replace(" ", "-").lower()
        title = md_file.name
        
        try:
            content = md_file.read_text(encoding='utf-8')
            # Extraire le titre du fichier s'il existe (première ligne commençant par #)
            title_match = re.search(r'^# (.+)$', content, re.MULTILINE)
            display_title = title_match.group(1) if title_match else title
            
            # Convertir le markdown en HTML (version simple)
            content_html = convert_markdown_to_html(content)
        except Exception as e:
            print(f"⚠️ Erreur lors de la lecture de {md_file}: {e}")
            content_html = f"<p>Erreur de lecture du fichier: {e}</p>"
            display_title = title
        
        # Ajouter une entrée au sommaire
        toc_entries.append(f'<li><a href="#{section_id}">{display_title}</a></li>')
        
        # Créer la section HTML
        sections_html += f"""
    <section class="file-section" id="{section_id}">
      <h2>{display_title}</h2>
      <div class="filename">{md_file.name}</div>
      <div class="content">{content_html}</div>
    </section>
    """
    
    # Assembler le HTML complet avec table des matières dynamique
    html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cahier des Charges Complet</title>
  <style>
    :root {{
      --primary-color: #3498db;
      --secondary-color: #2c3e50;
      --bg-color: #fdfdfd;
      --text-color: #333;
      --light-gray: #f5f5f5;
      --border-color: #ddd;
    }}
    body {{
      font-family: "Segoe UI", Roboto, sans-serif;
      margin: 0 auto;
      padding: 0;
      background: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
    }}
    .container {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }}
    header {{
      background: var(--secondary-color);
      color: white;
      padding: 1rem 0;
      text-align: center;
    }}
    header h1 {{
      margin: 0;
    }}
    h1, h2, h3, h4, h5, h6 {{
      color: var(--secondary-color);
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }}
    h1 {{ font-size: 2.5rem; }}
    h2 {{ 
      font-size: 2rem;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 0.5rem;
    }}
    h3 {{ font-size: 1.5rem; }}
    
    nav.toc {{
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }}
    nav.toc h2 {{
      margin-top: 0;
      border-bottom: 1px solid var(--border-color);
    }}
    nav.toc ul {{
      list-style-type: none;
      padding: 0;
    }}
    nav.toc ul ul {{
      padding-left: 1.5rem;
    }}
    nav.toc li {{
      margin: 0.5rem 0;
    }}
    nav.toc a {{
      text-decoration: none;
      color: var(--primary-color);
    }}
    nav.toc a:hover {{
      text-decoration: underline;
    }}
    
    .file-section {{
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }}
    .file-section h2 {{
      margin-top: 0;
    }}
    .filename {{
      font-size: 0.9rem;
      color: #777;
      margin-bottom: 1.5rem;
      padding: 0.3rem 0.5rem;
      background: var(--light-gray);
      border-radius: 4px;
      display: inline-block;
    }}
    .content {{
      line-height: 1.7;
    }}
    
    /* Style pour les codes */
    code {{
      font-family: "Fira Code", Consolas, Monaco, monospace;
      background: var(--light-gray);
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9em;
    }}
    pre {{
      background: var(--light-gray);
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
      border-left: 4px solid var(--primary-color);
    }}
    pre code {{
      background: none;
      padding: 0;
    }}
    
    /* Style des tableaux */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }}
    table, th, td {{
      border: 1px solid var(--border-color);
    }}
    th, td {{
      padding: 0.75rem;
      text-align: left;
    }}
    th {{
      background-color: var(--light-gray);
    }}
    
    /* Style des listes */
    ul, ol {{
      padding-left: 1.5rem;
    }}
    
    /* Style des citations */
    blockquote {{
      margin: 1.5rem 0;
      padding: 1rem;
      border-left: 4px solid var(--primary-color);
      background: var(--light-gray);
      font-style: italic;
    }}
    
    /* Footer */
    footer {{
      text-align: center;
      margin-top: 2rem;
      padding: 1rem 0;
      color: #777;
      font-size: 0.9rem;
      border-top: 1px solid var(--border-color);
    }}
    
    /* Pour la responsivité */
    @media (max-width: 768px) {{
      .container {{
        padding: 1rem;
      }}
      .file-section, nav.toc {{
        padding: 1rem;
      }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>Cahier des Charges Complet</h1>
    <p>Projet NestJS + Remix - Monorepo</p>
  </header>

  <div class="container">
    <nav class="toc">
      <h2>📑 Table des matières</h2>
      <ul>
        {''.join(toc_entries)}
      </ul>
    </nav>

    {sections_html}

    <footer>
      Document généré le {datetime.datetime.now().strftime('%d/%m/%Y à %H:%M')}
    </footer>
  </div>
</body>
</html>
"""
    
    # Écrire le fichier HTML
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"✅ Fichier HTML généré avec succès: {output_file}")
    except Exception as e:
        print(f"❌ Erreur lors de l'écriture du fichier HTML: {e}")
        return 1
    
    return 0

def convert_markdown_to_html(markdown_text):
    """
    Convertit un texte Markdown en HTML basique.
    Cette fonction est très simplifiée - dans un projet réel, utilisez 
    une bibliothèque comme python-markdown ou mistletoe.
    """
    # Remplacer les caractères spéciaux
    html = markdown_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Convertir les titres
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    
    # Gérer les blocs de code
    html = re.sub(r'```(.+?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
    
    # Convertir les listes
    html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    # Envelopper les listes
    html = re.sub(r'(<li>.+</li>\n)+', r'<ul>\g<0></ul>', html, flags=re.MULTILINE)
    
    # Convertir les paragraphes - pour une version simple
    html = re.sub(r'(?<!\n)\n(?!\n)', ' ', html)
    html = re.sub(r'\n\n(.+?)(?=\n\n|\Z)', r'<p>\1</p>', html, flags=re.DOTALL)
    
    return html

if __name__ == "__main__":
    sys.exit(main())
