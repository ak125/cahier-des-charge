import { SeoPage, SeoIssue, SeoHistory, SeoAuditReport, SeoRedirect } from '../entities';

/**
 * Interface pour la couche de données SEO
 * Définit toutes les opérations de persistence pour les données SEO
 */
export interface ISeoRepository {
  // Pages SEO
  getAllPages(filters: {
    status?: string;
    score?: string;
    sort?: string;
    dir?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ pages: SeoPage[]; total: number; limit: number; offset: number }>;
  
  getPageDetails(url: string): Promise<SeoPage | null>;
  
  updatePage(pageId: number, data: Partial<SeoPage>): Promise<SeoPage>;
  
  // Statistiques SEO
  getSeoStats(): Promise<{
    total: number;
    critical: number;
    warnings: number;
    good: number;
    averageScore: number;
  }>;
  
  // Problèmes SEO
  getAllIssues(filters: {
    severity?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ issues: SeoIssue[]; total: number; limit: number; offset: number }>;
  
  createIssue(issue: Omit<SeoIssue, 'id'>): Promise<SeoIssue>;
  
  createManyIssues(issues: Array<Omit<SeoIssue, 'id'>>): Promise<{ count: number }>;
  
  deleteIssues(pageId: number, onlyUnfixed?: boolean): Promise<{ count: number }>;
  
  fixIssue(issueId: number): Promise<SeoIssue>;
  
  // Historique SEO
  addToHistory(data: Omit<SeoHistory, 'id' | 'date'>): Promise<SeoHistory>;
  
  getHistory(limit?: number): Promise<SeoHistory[]>;
  
  // Rapports d'audit
  createAuditReport(data: Omit<SeoAuditReport, 'id' | 'createdAt'>): Promise<SeoAuditReport>;
  
  // Redirections
  getRedirects(active?: boolean): Promise<SeoRedirect[]>;
  
  addRedirect(data: { source: string; destination: string; statusCode?: number }): Promise<SeoRedirect>;
  
  addManyRedirects(redirects: Array<{ source: string; destination: string; statusCode?: number }>): Promise<{ count: number }>;
  
  // Jobs MCP
  createJob(data: { jobId: string; status: string; filePath: string | null; result: any }): Promise<any>;
}