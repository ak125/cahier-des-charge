import fs from 'fs';
import path from 'path';
import { supabaseClient } from '~/lib/supabase/client';

interface TaskStatus {
  status: string;
  progress: number;
  assignedTo?: string;
  lastUpdated: string;
  notes?: string;
}

export async function loadTaskStatus(): Promise<Record<string, TaskStatus>> {
  try {
    // Essayer d'abord de charger depuis Supabase si disponible
    try {
      const supabase = supabaseClient();
      const { data, error } = await supabase
        .from('migration_status')
        .select('*');
      
      if (!error && data && data.length > 0) {
        // Transformer les données de Supabase en format TaskStatus
        const taskStatus: Record<string, TaskStatus> = {};
        data.forEach(item => {
          taskStatus[item.table_name] = {
            status: item.status,
            progress: item.progress,
            assignedTo: item.assigned_to,
            lastUpdated: item.updated_at,
            notes: item.notes
          };
        });
        return taskStatus;
      }
    } catch (supabaseError) {
      console.warn('Impossible de charger les statuts depuis Supabase:', supabaseError);
    }
    
    // Si Supabase échoue ou est indisponible, essayer de charger depuis le fichier local
    const localPath = path.resolve(process.cwd(), 'reports/migration_plan.json');
    
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(content);
    }
    
    // Si aucune source n'est disponible, retourner un objet vide avec quelques exemples
    return {
      'UTILISATEURS': {
        status: 'in_progress',
        progress: 75,
        assignedTo: 'Marie',
        lastUpdated: new Date().toISOString(),
        notes: 'Migration en cours, problème avec certains champs personnalisés'
      },
      'COMMANDES': {
        status: 'pending',
        progress: 0,
        lastUpdated: new Date().toISOString()
      },
      'PRODUITS': {
        status: 'migrated',
        progress: 100,
        assignedTo: 'Thomas',
        lastUpdated: new Date().toISOString(),
        notes: 'Migration complète, à valider par l\'équipe métier'
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement des statuts de migration:', error);
    return {};
  }
}