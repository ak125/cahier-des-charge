import { useEffect, useRef } from "react";

interface SEOHistoryGraphProps {
  dates: string[];
  scores: number[];
  events: string[];
}

export function SEOHistoryGraph({ dates, scores, events }: SEOHistoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || dates.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dimensions et marges
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner le fond
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (scores.length === 0) {
      // Aucune donnée à afficher
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('Aucune donnée historique disponible', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Calculer les échelles
    const minScore = Math.min(...scores, 0);
    const maxScore = Math.max(...scores, 100);
    
    // Fonctions de conversion des données en coordonnées canvas
    const xScale = (i: number) => margin.left + (i / (dates.length - 1)) * width;
    const yScale = (score: number) => margin.top + height - ((score - minScore) / (maxScore - minScore)) * height;
    
    // Dessiner les axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    
    // Axe X
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.stroke();
    
    // Axe Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.stroke();
    
    // Graduations sur l'axe Y
    const yTicks = [0, 25, 50, 75, 100];
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';
    
    yTicks.forEach(tick => {
      const y = yScale(tick);
      
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
      
      ctx.fillText(`${tick}%`, margin.left - 10, y + 4);
      
      // Ligne de grille horizontale
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });
    
    // Étiquettes sur l'axe X (dates)
    ctx.textAlign = 'center';
    
    // Sélectionner un échantillon de dates pour éviter l'encombrement
    const maxLabels = 6;
    const step = Math.ceil(dates.length / maxLabels);
    
    for (let i = 0; i < dates.length; i += step) {
      const x = xScale(i);
      const formattedDate = new Date(dates[i]).toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      });
      
      ctx.fillText(formattedDate, x, margin.top + height + 20);
    }
    
    // Titre de l'axe Y
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Score SEO (%)', 0, 0);
    ctx.restore();
    
    // Dessiner la courbe
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(scores[0]));
    
    for (let i = 1; i < scores.length; i++) {
      ctx.lineTo(xScale(i), yScale(scores[i]));
    }
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Dessiner les points de données
    for (let i = 0; i < scores.length; i++) {
      const x = xScale(i);
      const y = yScale(scores[i]);
      
      // Cercle extérieur
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#f9fafb';
      ctx.fill();
      
      // Cercle intérieur
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = getScoreColorClass(scores[i]);
      ctx.fill();
      
      // Ajouter des événements sous forme de marqueurs
      if (events[i]) {
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y - 20);
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y - 20, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#6b7280';
        ctx.fill();
      }
    }
    
    // Dessiner la zone sous la courbe
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(scores[0]));
    
    for (let i = 1; i < scores.length; i++) {
      ctx.lineTo(xScale(i), yScale(scores[i]));
    }
    
    ctx.lineTo(xScale(scores.length - 1), yScale(0));
    ctx.lineTo(xScale(0), yScale(0));
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
  }, [dates, scores, events]);
  
  // Si pas de données, afficher un message
  if (dates.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Aucune donnée historique disponible</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <canvas 
        ref={canvasRef} 
        width={800}
        height={400}
        className="w-full h-auto"
      />
      <div className="mt-4 px-4">
        <h4 className="text-sm font-medium text-gray-700">Légende</h4>
        <div className="flex items-center mt-2 text-sm">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          <span className="text-gray-600">Score SEO</span>
          
          <span className="inline-block w-3 h-3 rounded-full bg-gray-500 ml-6 mr-2"></span>
          <span className="text-gray-600">Événements</span>
        </div>
      </div>
    </div>
  );
}

function getScoreColorClass(score: number): string {
  if (score >= 90) return '#22c55e'; // green-500
  if (score >= 70) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}