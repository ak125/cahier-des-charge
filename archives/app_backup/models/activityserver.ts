/**
 * Modèle pour les activités IA dans l'application
 */

export interface AIActivityDetails {
  input?: string;
  output?: string;
  model?: string;
  tokens?: number;
  duration?: number;
  prompt?: string;
  [key: string]: any; // Pour les propriétés additionnelles spécifiques par type
}

export interface AIActivity {
  id: string;
  type: string; // 'code-generation', 'analysis', 'audit', etc.
  status: 'completed' | 'failed' | 'processing' | 'queued';
  description: string;
  timestamp: string; // ISO date string
  userId?: string; // ID de l'utilisateur qui a initié l'activité
  moduleId?: string; // Lien vers le module concerné
  fileId?: string; // Lien vers le fichier concerné
  details?: AIActivityDetails;
}

/**
 * Récupère les activités IA récentes
 */
export async function getRecentAIActivities(_limit = 50): Promise<AIActivity[]> {
  // Dans une implémentation réelle, ceci ferait un appel à une API ou une base de données
  // Pour l'exemple, nous retournons des données statiques
  return Promise.resolve([
    {
      id: '1',
      type: 'code-generation',
      status: 'completed',
      description: 'Génération de UserController.ts',
      timestamp: new Date().toISOString(),
      fileId: 'user-controller',
      details: {
        model: 'gpt-4',
        tokens: 1250,
        input: 'UserController.php',
        output: 'UserController.ts',
      },
    },
    {
      id: '2',
      type: 'analysis',
      status: 'completed',
      description: 'Analyse de structure CartService.php',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
      fileId: 'cart-service',
      details: {
        model: 'gpt-4',
        tokens: 850,
        input: 'CartService.php',
      },
    },
    {
      id: '3',
      type: 'audit',
      status: 'failed',
      description: 'Audit de sécurité PaymentProcessor.ts',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 jour avant
      fileId: 'payment-processor',
      details: {
        model: 'gpt-4',
        tokens: 1820,
        input: 'PaymentProcessor.ts',
      },
    },
  ]);
}

/**
 * Ajoute une nouvelle activité IA
 */
export async function logAIActivity(
  activity: Omit<AIActivity, 'id' | 'timestamp'>
): Promise<AIActivity> {
  const newActivity = {
    ...activity,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  // Dans une implémentation réelle, ceci enregistrerait l'activité dans une base de données
  console.log('Nouvelle activité IA enregistrée:', newActivity);

  return newActivity;
}

// Helper pour générer un ID simple
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
