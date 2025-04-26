import React from reactstructure-agent';
import type { AIActivity } from ~/models/activity.serverstructure-agent';

interface AIActivityLogProps {
  activities: AIActivity[];
}

export function AIActivityLog({ activities }: AIActivityLogProps) {
  // Grouper les activités par date
  const groupedActivities = activities.reduce((groups: Record<string, AIActivity[]>, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Trier les dates du plus récent au plus ancien
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Activité IA récente</h2>
      
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="border-b pb-4">
            <h3 className="font-medium text-lg mb-3 text-gray-700">{date}</h3>
            
            <div className="space-y-3">
              {groupedActivities[date].map((activity) => (
                <div 
                  key={activity.id} 
                  className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`}></span>
                        <span className="font-medium">{activity.type}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {activity.details && (
                    <div className="mt-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        {activity.details.input && (
                          <div>
                            <p className="font-medium text-gray-700">Input</p>
                            <p className="text-gray-600">{truncate(activity.details.input)}</p>
                          </div>
                        )}
                        
                        {activity.details.output && (
                          <div>
                            <p className="font-medium text-gray-700">Output</p>
                            <p className="text-gray-600">{truncate(activity.details.output)}</p>
                          </div>
                        )}
                        
                        {activity.details.model && (
                          <div>
                            <p className="font-medium text-gray-700">Model</p>
                            <p className="text-gray-600">{activity.details.model}</p>
                          </div>
                        )}
                        
                        {activity.details.tokens && (
                          <div>
                            <p className="font-medium text-gray-700">Tokens</p>
                            <p className="text-gray-600">{activity.details.tokens}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get color based on activity status
function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'processing':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

// Helper function to truncate long texts
function truncate(text: string, length = 50) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}
