/**
 * Interface de la couche service pour les fonctionnalités SEO
 * Définit les opérations métier liées au SEO sans exposer les détails d'implémentation
 */
export interface ISeoService {
  // Opérations sur les pages
  getAllSeoPages(filters: {
    status?: string;
    score?: string;
    sort?: string;
    dir?: string;
    limit?: number;
    offset?: number;
  }): Promise<any>;

  getSeoPageDetails(url: string): Promise<any>;

  // Opérations d'audit
  runSeoAudit(): Promise<{
    message: string;
    reportId: number;
    jobId: string;
  }>;

  auditSinglePage(url: string): Promise<{
    message: string;
    pageId: number;
    jobId: string;
  }>;

  updatePageAfterAudit(
    pageId: number,
    auditData: {
      title?: string;
      description?: string;
      canonical?: string;
      score: number;
      status: string;
      issues: Array<{
        type: string;
        severity: string;
        message: string;
        details?: any;
      }>;
    }
  ): Promise<any>;

  // Opérations sur les problèmes
  getAllSeoIssues(filters: {
    severity?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any>;

  fixIssue(issueId: number): Promise<any>;

  // Statistiques et rapports
  getSeoStats(): Promise<any>;

  generateSeoReport(): Promise<any>;

  // Gestion des redirections
  getRedirects(active?: boolean): Promise<any[]>;

  addRedirect(data: { source: string; destination: string; statusCode?: number }): Promise<any>;

  importRedirectsFromHtaccess(htaccessContent: string): Promise<{ imported: number }>;

  // Historique
  getSeoHistory(limit?: number): Promise<any[]>;
}
