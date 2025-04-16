import React, { useState, useEffect } from "react";

export interface QualityAlert {
  type: 'degradation' | 'improvement';
  category: 'seo' | 'performance' | 'accessibility' | 'bestPractices' | 'file';
  message: string;
  timestamp: string;
  previousValue?: number;
  currentValue?: number;
  file?: string;
  isRead?: boolean;
}

interface QualityAlertNotificationProps {
  alerts: QualityAlert[];
  onDismiss?: (alert: QualityAlert) => void;
  onDismissAll?: () => void;
  onMarkAsRead?: (alert: QualityAlert) => void;
}

export const QualityAlertNotification: React.FC<QualityAlertNotificationProps> = ({
  alerts,
  onDismiss,
  onDismissAll,
  onMarkAsRead
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Compter les alertes non lues
    setUnreadCount(alerts.filter(alert => !alert.isRead).length);
    
    // Ouvrir automatiquement si de nouvelles alertes sont détectées
    if (alerts.filter(alert => !alert.isRead && alert.type === 'degradation').length > 0) {
      setIsOpen(true);
    }
  }, [alerts]);

  const handleDismiss = (alert: QualityAlert) => {
    if (onDismiss) {
      onDismiss(alert);
    }
  };

  const handleDismissAll = () => {
    if (onDismissAll) {
      onDismissAll();
    }
    setIsOpen(false);
  };

  const handleMarkAsRead = (alert: QualityAlert) => {
    if (onMarkAsRead) {
      onMarkAsRead(alert);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'accessibility':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'bestPractices':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'file':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Trier les alertes par date (plus récente en premier) et par type (dégradation en premier)
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.type === 'degradation' && b.type !== 'degradation') return -1;
    if (a.type !== 'degradation' && b.type === 'degradation') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="quality-alert-notification">
      <button
        className="relative p-2 rounded-full bg-white text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-10 max-h-96 overflow-y-auto">
          <div className="py-2 px-3 bg-gray-100 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Alertes de qualité</h3>
            <button
              onClick={handleDismissAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Tout fermer
            </button>
          </div>

          {sortedAlerts.length > 0 ? (
            <div>
              {sortedAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 border-b flex ${
                    alert.isRead ? 'bg-white' : alert.type === 'degradation' ? 'bg-red-50' : 'bg-green-50'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    alert.type === 'degradation' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {getCategoryIcon(alert.category)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                    {(alert.previousValue !== undefined && alert.currentValue !== undefined) && (
                      <div className="mt-1 text-xs">
                        <span className="text-gray-500">Avant: </span>
                        <span className="font-medium">{alert.previousValue}</span>
                        <span className="mx-1 text-gray-500">→</span>
                        <span className="text-gray-500">Après: </span>
                        <span className={`font-medium ${
                          alert.type === 'degradation' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {alert.currentValue}
                        </span>
                      </div>
                    )}
                    {alert.file && (
                      <p className="text-xs text-gray-500 mt-1">Fichier: {alert.file}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-start flex">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert)}
                        className="text-xs text-gray-500 hover:text-gray-700 mr-2"
                      >
                        Lu
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              Aucune alerte récente
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QualityAlertNotification;