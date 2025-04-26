import React from reactstructure-agent';

interface ProgressBarProps {
  value: number;
  max?: number;
}

export default function ProgressBar({ value, max = 100 }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  // Détermine la couleur de la barre en fonction du pourcentage
  let colorClass = 'bg-red-500'; // Par défaut, rouge si faible
  if (percentage >= 90) {
    colorClass = 'bg-green-500';
  } else if (percentage >= 70) {
    colorClass = 'bg-blue-500';
  } else if (percentage >= 50) {
    colorClass = 'bg-yellow-500';
  } else if (percentage >= 30) {
    colorClass = 'bg-orange-500';
  }

  return (
    <div className="relative pt-1">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="flex h-2 mt-2 overflow-hidden text-xs bg-gray-200 rounded">
        <div
          style={{ width: `${percentage}%` }}
          className={`flex flex-col justify-center text-center text-white shadow-none whitespace-nowrap ${colorClass}`}
        ></div>
      </div>
    </div>
  );
}