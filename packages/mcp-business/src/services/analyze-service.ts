import { getSupabaseClient } from '@workspaces/mcp-config';
// Service d'analyse pour la logique métier
import { ModuleAnalysis } from '@workspaces/mcp-types';

export class AnalyzeService {
  private supabase = getSupabaseClient();

  async saveModuleAnalysis(moduleAnalysis: ModuleAnalysis): Promise<void> {
    try {
      const { error } = await this.supabase.from('module_analysis').insert([moduleAnalysis]);

      if (error) throw new Error(`Failed to save module analysis: ${error.message}`);
    } catch (error) {
      console.error('Error saving module analysis:', error);
      throw error;
    }
  }

  async getModuleAnalysis(name: string): Promise<ModuleAnalysis | null> {
    try {
      const { data, error } = await this.supabase
        .from('module_analysis')
        .select('*')
        .eq('name', name)
        .order('analysisDate', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // PGRST116 means no rows returned
          return null;
        }
        throw new Error(`Failed to get module analysis: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`Error getting module analysis for ${name}:`, error);
      throw error;
    }
  }

  async updateModuleAnalysis(name: string, updates: Partial<ModuleAnalysis>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('module_analysis')
        .update(updates)
        .eq('name', name);

      if (error) throw new Error(`Failed to update module analysis: ${error.message}`);
    } catch (error) {
      console.error(`Error updating module analysis for ${name}:`, error);
      throw error;
    }
  }

  async getComplexityStats(): Promise<{ min: number; max: number; avg: number }> {
    try {
      const { data, error } = await this.supabase.rpc('get_complexity_stats');

      if (error) throw new Error(`Failed to get complexity stats: ${error.message}`);

      return data;
    } catch (error) {
      console.error('Error getting complexity stats:', error);
      throw error;
    }
  }
}
