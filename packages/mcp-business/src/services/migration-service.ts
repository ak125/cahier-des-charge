import { getSupabaseClient } from '@workspaces/mcp-config';
// Service de migration pour la logique métier
import { MigrationContext, MigrationResult } from '@workspaces/mcp-types';

export class MigrationService {
  private supabase = getSupabaseClient();

  async createMigration(context: MigrationContext): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('migrations')
        .insert([{ context }])
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create migration: ${error.message}`);

      return data.id;
    } catch (error) {
      console.error('Error creating migration:', error);
      throw error;
    }
  }

  async getMigration(id: string): Promise<MigrationContext> {
    try {
      const { data, error } = await this.supabase
        .from('migrations')
        .select('context')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Failed to get migration: ${error.message}`);

      return data.context;
    } catch (error) {
      console.error(`Error getting migration ${id}:`, error);
      throw error;
    }
  }

  async updateMigrationStatus(id: string, status: MigrationContext['status']): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('migrations')
        .update({ 'context->status': status })
        .eq('id', id);

      if (error) throw new Error(`Failed to update migration status: ${error.message}`);
    } catch (error) {
      console.error(`Error updating migration ${id} status:`, error);
      throw error;
    }
  }

  async saveMigrationResult(result: MigrationResult): Promise<void> {
    try {
      const { error } = await this.supabase.from('migration_results').insert([result]);

      if (error) throw new Error(`Failed to save migration result: ${error.message}`);
    } catch (error) {
      console.error('Error saving migration result:', error);
      throw error;
    }
  }
}
