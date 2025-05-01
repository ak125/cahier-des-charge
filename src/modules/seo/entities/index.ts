/**
 * Entités représentant les objets de domaine SEO
 */

export interface SeoPage {
  id: number;
  url: string;
  title?: string;
  description?: string;
  canonical?: string;
  score: number;
  status: 'success' | 'warning' | 'error' | 'pending';
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
  issues: SeoIssue[];
  history: SeoHistory[];
}

export interface SeoIssue {
  id: number;
  pageId: number;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: Record<string, any>;
  fixed: boolean;
  fixedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  page?: SeoPage;
}

export interface SeoHistory {
  id: number;
  pageId: number;
  score: number;
  event: string;
  details: Record<string, any>;
  date: Date;
  page?: SeoPage;
}

export interface SeoAuditReport {
  id: number;
  name: string;
  summary: Record<string, any>;
  averageScore: number;
  totalUrls: number;
  criticalIssues: number;
  warnings: number;
  successful: number;
  createdAt: Date;
}

export interface SeoRedirect {
  id: number;
  source: string;
  destination: string;
  statusCode: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
