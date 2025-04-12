import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface Relation {
  source: string;
  target: string;
  type: string;
}

interface DependencyGraphProps {
  relationGraph: {
    relations: Relation[];
  };
  highlightedTable?: string | null;
  filteredTables: string[];
}

export default function DependencyGraph({ 
  relationGraph, 
  highlightedTable, 
  filteredTables 
}: DependencyGraphProps) {
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!graphRef.current) return;

    // Configurer Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });

    // Créer la définition du graphe Mermaid
    let graphDefinition = "graph TD\n";

    // Filtrer les relations pour n'inclure que les tables filtrées
    const filteredRelations = relationGraph.relations.filter(
      rel => filteredTables.includes(rel.source) && filteredTables.includes(rel.target)
    );

    // Ajouter les relations au graphe
    filteredRelations.forEach(rel => {
      const sourceNode = highlightedTable === rel.source 
        ? `${rel.source}[<strong style='color:orange'>${rel.source}</strong>]`
        : `${rel.source}[${rel.source}]`;
        
      const targetNode = highlightedTable === rel.target 
        ? `${rel.target}[<strong style='color:orange'>${rel.target}</strong>]`
        : `${rel.target}[${rel.target}]`;
      
      const relationType = rel.type || "hasMany";
      
      graphDefinition += `  ${sourceNode} -->|${relationType}| ${targetNode}\n`;
    });

    // Nœud isolé (si la table ne figure dans aucune relation)
    if (highlightedTable && !filteredRelations.some(
      rel => rel.source === highlightedTable || rel.target === highlightedTable
    ) && filteredTables.includes(highlightedTable)) {
      graphDefinition += `  ${highlightedTable}[<strong style='color:orange'>${highlightedTable}</strong>]\n`;
    }

    // Générer le graphe Mermaid
    try {
      graphRef.current.innerHTML = '';
      graphRef.current.setAttribute("data-processed", "false");
      graphRef.current.textContent = graphDefinition;
      mermaid.init(undefined, graphRef.current);
    } catch (error) {
      console.error("Erreur lors de la génération du graphe Mermaid:", error);
      graphRef.current.innerHTML = `<div class="error-message">
        Erreur de génération du graphe. Vérifiez la console pour plus de détails.
      </div>`;
    }
  }, [relationGraph, highlightedTable, filteredTables]);

  if (!relationGraph || !relationGraph.relations || relationGraph.relations.length === 0) {
    return <div className="empty-graph">Aucune relation à afficher</div>;
  }

  return (
    <div className="dependency-graph-container">
      <div className="mermaid-wrapper">
        <div className="mermaid" ref={graphRef}></div>
      </div>
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-line has-many"></span>
          <span>hasMany</span>
        </div>
        <div className="legend-item">
          <span className="legend-line belongs-to"></span>
          <span>belongsTo</span>
        </div>
        <div className="legend-item">
          <span className="legend-highlight"></span>
          <span>Table sélectionnée</span>
        </div>
      </div>
    </div>
  );
}