import React from reactstructure-agent";

interface QualityIssue {
  category: 'seo' | 'performance' | 'accessibility' | 'bestPractices';
  message: string;
  impact: 'high' | 'medium' | 'low';
  solution?: string;
  documentation?: string;
}

interface QualityImprovementTipsProps {
  issues: QualityIssue[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const QualityImprovementTips: React.FC<QualityImprovementTipsProps> = ({ 
  issues, 
  selectedCategory = 'all',
  onSelectCategory
}) => {
  // Filtrer les problèmes par catégorie sélectionnée
  const filteredIssues = selectedCategory === 'all' 
    ? issues 
    : issues.filter(issue => issue.category === selectedCategory);
  
  // Regrouper les problèmes par catégorie pour l'affichage du compteur
  const categoryCounts = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const renderCategoryBadge = (category: string, count: number) => {
    const colors = {
      seo: 'bg-blue-100 text-blue-800',
      performance: 'bg-red-100 text-red-800',
      accessibility: 'bg-green-100 text-green-800',
      bestPractices: 'bg-yellow-100 text-yellow-800',
      all: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      seo: 'SEO',
      performance: 'Performance',
      accessibility: 'Accessibilité',
      bestPractices: 'Meilleures Pratiques',
      all: 'Tous les critères'
    };
    
    return (
      <button
        className={`px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2 ${
          selectedCategory === category ? 
          colors[category as keyof typeof colors].replace('100', '200') : 
          colors[category as keyof typeof colors]
        }`}
        onClick={() => onSelectCategory && onSelectCategory(category)}
      >
        {labels[category as keyof typeof labels]} {count && `(${count})`}
      </button>
    );
  };
  
  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return { label: 'Critique', class: 'bg-red-100 text-red-800' };
      case 'medium': return { label: 'Important', class: 'bg-yellow-100 text-yellow-800' };
      case 'low': return { label: 'Mineur', class: 'bg-green-100 text-green-800' };
      default: return { label: 'Indéfini', class: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="quality-improvement-tips">
      <div className="flex flex-wrap mb-4">
        {renderCategoryBadge('all', issues.length)}
        {Object.entries(categoryCounts).map(([category, count]) => (
          renderCategoryBadge(category, count)
        ))}
      </div>
      
      {filteredIssues.length > 0 ? (
        <ul className="space-y-4">
          {filteredIssues.map((issue, index) => {
            const impact = getImpactLabel(issue.impact);
            return (
              <li key={index} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{issue.message}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${impact.class}`}>
                    {impact.label}
                  </span>
                </div>
                
                {issue.solution && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Solution recommandée:</h4>
                    <p className="text-sm text-gray-600 mt-1">{issue.solution}</p>
                  </div>
                )}
                
                {issue.documentation && (
                  <div className="mt-2">
                    <a 
                      href={issue.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Documentation &rarr;
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Aucun problème détecté dans cette catégorie
        </div>
      )}
    </div>
  );
};

export default QualityImprovementTips;