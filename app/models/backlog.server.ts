export type BacklogItem = {
  id: string;
  name: string;
  modulePath: string;
  priority: number; // 1-5, 5 étant la plus haute
  complexity: number; // 1-5, 5 étant la plus complexe
  dependencies: string[]; // IDs des modules dont dépend celui-ci
  estimatedEffort: number; // en heures
  status: 'pending' | 'scheduled' | 'in_progress';
};

export type BacklogStatus = {
  items: BacklogItem[];
  total: number;
  completed: number;
  inProgress: number;
  scheduled: number;
  pending: number;
  estimatedRemainingTime: number; // en heures
};

export async function getBacklogStatus(): Promise<BacklogStatus> {
  // Dans une implémentation réelle, cette fonction récupérerait l'état du backlog
  // depuis une base de données ou une API
  
  const items: BacklogItem[] = [
    {
      id: "back1",
      name: "OrderProcessor",
      modulePath: "order/OrderProcessor.php",
      priority: 5,
      complexity: 4,
      dependencies: ["mod2"],
      estimatedEffort: 16,
      status: "scheduled"
    },
    {
      id: "back2",
      name: "ShippingCalculator",
      modulePath: "shipping/ShippingCalc.php",
      priority: 4,
      complexity: 3,
      dependencies: ["back1"],
      estimatedEffort: 12,
      status: "pending"
    },
    {
      id: "back3",
      name: "TaxCalculator",
      modulePath: "tax/TaxCalculator.php",
      priority: 5,
      complexity: 5,
      dependencies: ["mod2"],
      estimatedEffort: 20,
      status: "in_progress"
    },
    {
      id: "back4",
      name: "UserPreferences",
      modulePath: "user/Preferences.php",
      priority: 3,
      complexity: 2,
      dependencies: ["mod1"],
      estimatedEffort: 8,
      status: "pending"
    },
    {
      id: "back5",
      name: "ReportGenerator",
      modulePath: "reports/Generator.php",
      priority: 2,
      complexity: 4,
      dependencies: [],
      estimatedEffort: 14,
      status: "pending"
    }
  ];
  
  // Calculer les statistiques
  const total = items.length + 3; // +3 modules déjà complétés
  const completed = 3;
  const inProgress = items.filter(item => item.status === 'in_progress').length;
  const scheduled = items.filter(item => item.status === 'scheduled').length;
  const pending = items.filter(item => item.status === 'pending').length;
  
  // Calculer le temps estimé restant
  const estimatedRemainingTime = items.reduce((total, item) => total + item.estimatedEffort, 0);
  
  return {
    items,
    total,
    completed,
    inProgress,
    scheduled,
    pending,
    estimatedRemainingTime
  };
}
