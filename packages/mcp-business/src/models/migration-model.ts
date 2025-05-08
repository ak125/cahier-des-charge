// Modèle de données pour les migrations
import { MigrationContext, MigrationResult } from '@workspaces/mcp-types';

export class MigrationModel {
  id: string;
  context: MigrationContext;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<MigrationModel>) {
    this.id = data.id || '';
    this.context = data.context || {
      sourceId: '',
      targetId: '',
      status: 'pending',
      metadata: {},
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  isInProgress(): boolean {
    return this.context.status === 'in-progress';
  }

  isCompleted(): boolean {
    return this.context.status === 'completed';
  }

  isFailed(): boolean {
    return this.context.status === 'failed';
  }

  isPending(): boolean {
    return this.context.status === 'pending';
  }

  toResult(resultData: any): MigrationResult {
    return {
      id: this.id,
      context: this.context,
      results: resultData,
    };
  }
}
