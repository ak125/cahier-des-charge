import { useEffect, useRef } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'file' | 'agent' | 'migration';
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface DependencyGraphProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
}

export default function DependencyGraph({
  nodes,
  edges,
  width = 800,
  height = 500
}: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !nodes.length) return;

    // Dans une implémentation réelle, nous utiliserions une bibliothèque comme D3.js ou vis.js
    // pour créer un graphe interactif. Pour l'instant, nous créons une visualisation simplifiée.

    // Nettoyage préalable
    const container = containerRef.current;
    container.innerHTML = '';

    // Création de l'élément SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    container.appendChild(svg);

    // Positions des nœuds (dans un cas réel, on utiliserait un algorithme de force layout)
    const nodePositions: Record<string, { x: number, y: number }> = {};

    // Création des cercles pour les nœuds
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Calcul simple des positions (en cercle)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions[node.id] = { x, y };

      // Création du cercle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', `${x}`);
      circle.setAttribute('cy', `${y}`);
      circle.setAttribute('r', '15');

      // Couleur selon le type
      let fill = '#6366f1'; // indigo pour les migrations
      if (node.type === 'file') fill = '#10b981'; // emerald pour les fichiers
      if (node.type === 'agent') fill = '#f59e0b'; // amber pour les agents

      // Modifier la couleur selon le statut
      if (node.status === 'failed') fill = '#ef4444'; // red
      if (node.status === 'completed') fill = '#22c55e'; // green
      if (node.status === 'in_progress') fill = '#3b82f6'; // blue

      circle.setAttribute('fill', fill);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');

      // Ajouter un titre au survol
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = node.label;
      circle.appendChild(title);

      nodeGroup.appendChild(circle);

      // Ajouter le texte du label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', `${x}`);
      text.setAttribute('y', `${y + 30}`);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12px');
      text.setAttribute('fill', '#374151');
      text.textContent = node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label;
      nodeGroup.appendChild(text);
    });

    // Création des arêtes
    const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    edges.forEach(edge => {
      const source = nodePositions[edge.source];
      const target = nodePositions[edge.target];

      if (source && target) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${source.x}`);
        line.setAttribute('y1', `${source.y}`);
        line.setAttribute('x2', `${target.x}`);
        line.setAttribute('y2', `${target.y}`);
        line.setAttribute('stroke', '#94a3b8');
        line.setAttribute('stroke-width', '1.5');

        // Ajouter une flèche (marqueur)
        line.setAttribute('marker-end', 'url(#arrowhead)');

        edgeGroup.appendChild(line);

        // Ajouter un label sur l'arête si nécessaire
        if (edge.label) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', `${midX}`);
          text.setAttribute('y', `${midY}`);
          text.setAttribute('dy', '-5');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', '10px');
          text.setAttribute('fill', '#4b5563');
          text.setAttribute('background', 'white');
          text.textContent = edge.label;

          edgeGroup.appendChild(text);
        }
      }
    });

    // Définir le marqueur de flèche
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#94a3b8');
    marker.appendChild(polygon);
    defs.appendChild(marker);

    // Ajouter tous les éléments au SVG
    svg.appendChild(defs);
    svg.appendChild(edgeGroup);
    svg.appendChild(nodeGroup);

    // Dans une implémentation réelle, on ajouterait des gestionnaires d'événements
    // pour l'interaction (zoom, drag & drop, etc.)

  }, [nodes, edges, width, height]);

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Graphe de dépendances</h3>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[500px] flex justify-center items-center"
      >
        {nodes.length === 0 && (
          <p className="text-gray-500">Aucune donnée à afficher</p>
        )}
      </div>
    </div>
  );
}