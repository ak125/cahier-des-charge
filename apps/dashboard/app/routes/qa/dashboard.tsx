import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useLoaderData } from '@remix-run/react';
import type { QAResultSummary, QASummary } from "../../integration/qa-dashboard";

export const loader = async () => {
  // Importer dynamiquement pour éviter les problèmes avec SSR
  const { getQASummary } = await import("../../integration/qa-dashboard");
  const summary = await getQASummary();
  return { summary };
};

export default function QADashboard() {
  const { summary } = useLoaderData<{ summary: QASummary }>();
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord QA - Migrations PHP vers Remix</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Score Moyen" 
          value={`${Math.round(summary.averageScore)}/100`} 
          description="Score de qualité moyen des migrations"
          status={getScoreStatus(summary.averageScore)}
        />
        <StatCard 
          title="Migrations Analysées" 
          value={summary.totalFiles.toString()} 
          description="Nombre total de fichiers analysés"
        />
        <StatCard 
          title="Taux de Réussite" 
          value={`${Math.round((summary.okCount / (summary.totalFiles || 1)) * 100)}%`}
          description="Pourcentage de migrations conformes"
          status={getSuccessRateStatus(summary.okCount, summary.totalFiles)}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QAStatusOverview summary={summary} />
        <TopIssuesCard issues={summary.topIssues} />
      </div>
      
      <div className="mt-10">
        <QAResultsTable results={summary.recentResults} />
      </div>
    </div>
  );
}

function StatCard({ title, value, description, status }: { 
  title: string; 
  value: string; 
  description: string;
  status?: 'success' | 'warning' | 'error';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">{value}</p>
          {status && (
            <Badge className={getStatusColor()}>
              {status === 'success' ? 'Excellent' : status === 'warning' ? 'À améliorer' : 'Critique'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QAStatusOverview({ summary }: { summary: QASummary }) {
  const total = summary.totalFiles || 1; // Éviter la division par zéro

  return (
    <Card>
      <CardHeader>
        <CardTitle>État des Migrations</CardTitle>
        <CardDescription>Répartition des statuts de qualité</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Conformes (OK)</span>
              <span className="text-sm text-muted-foreground">{summary.okCount} / {total}</span>
            </div>
            <Progress value={(summary.okCount / total) * 100} className="h-2 bg-slate-200" indicatorClassName="bg-green-500" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Partielles</span>
              <span className="text-sm text-muted-foreground">{summary.partialCount} / {total}</span>
            </div>
            <Progress value={(summary.partialCount / total) * 100} className="h-2 bg-slate-200" indicatorClassName="bg-yellow-500" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Non conformes</span>
              <span className="text-sm text-muted-foreground">{summary.failedCount} / {total}</span>
            </div>
            <Progress value={(summary.failedCount / total) * 100} className="h-2 bg-slate-200" indicatorClassName="bg-red-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopIssuesCard({ issues }: { issues: { issueType: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Problèmes Fréquents</CardTitle>
        <CardDescription>Les problèmes de qualité les plus courants</CardDescription>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <p className="text-muted-foreground italic">Aucun problème identifié</p>
        ) : (
          <div className="space-y-4">
            {issues.map((issue, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{formatIssueType(issue.issueType)}</span>
                  <span className="text-sm text-muted-foreground">{issue.count}x</span>
                </div>
                <Progress value={calculatePercentage(issue.count, issues)} className="h-2 bg-slate-200" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QAResultsTable({ results }: { results: QAResultSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyses Récentes</CardTitle>
        <CardDescription>Les dernières migrations analysées</CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-muted-foreground italic">Aucune analyse récente</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Champs</TableHead>
                <TableHead>Problèmes</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{getFileName(result.sourceFile)}</TableCell>
                  <TableCell>{result.score}</TableCell>
                  <TableCell>
                    <StatusBadge status={result.status} />
                  </TableCell>
                  <TableCell>{result.presentFieldsCount}/{result.presentFieldsCount + result.missingFieldsCount}</TableCell>
                  <TableCell>{result.issuesCount}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(result.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: 'OK' | 'Partial' | 'Failed' }) {
  const getStatusDetails = () => {
    switch (status) {
      case 'OK':
        return { label: 'Conforme', className: 'bg-green-100 text-green-800' };
      case 'Partial':
        return { label: 'Partiel', className: 'bg-yellow-100 text-yellow-800' };
      case 'Failed':
        return { label: 'Non conforme', className: 'bg-red-100 text-red-800' };
    }
  };

  const details = getStatusDetails();
  return <Badge className={details.className}>{details.label}</Badge>;
}

// Fonctions utilitaires
function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-dDoDoDoDotgit',
    month: '2-dDoDoDoDotgit',
    year: 'numeric',
    hour: '2-dDoDoDoDotgit',
    minute: '2-dDoDoDoDotgit'
  }).format(date);
}

function getScoreStatus(score: number): 'success' | 'warning' | 'error' {
  if (score >= 85) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

function getSuccessRateStatus(okCount: number, total: number): 'success' | 'warning' | 'error' {
  if (total === 0) return 'warning';
  
  const rate = (okCount / total) * 100;
  
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'warning';
  return 'error';
}

function formatIssueType(issueType: string): string {
  // Transformer "type:severity" en texte lisible
  const [type, severity] = issueType.split(':');
  
  const typeMap: Record<string, string> = {
    'seo': 'SEO',
    'type': 'Typage',
    'validation': 'Validation',
    'behavior': 'Comportement'
  };
  
  const severityMap: Record<string, string> = {
    'error': 'critique',
    'warning': 'avertissement',
    'info': 'information'
  };
  
  return `${typeMap[type] || type} (${severityMap[severity] || severity})`;
}

function calculatePercentage(count: number, issues: { count: number }[]): number {
  const total = issues.reduce((sum, issue) => sum + issue.count, 0);
  return (count / total) * 100;
}