import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { getMigrationStats, getAgentStatus } from './api/migration-service';
import { parseMd } from './utils/md-parser';

/**
 * Composant pour afficher l'architecture et la progression de migration
 */
export function ArchitectureDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<any[]>([]);
  const [architectureDoc, setArchitectureDoc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les statistiques de migration
        const migrationStats = await getMigrationStats();
        setStats(migrationStats);
        
        // Charger l'état des agents
        const agents = await getAgentStatus();
        setAgentStatus(agents);
        
        // Charger le contenu du document ARCHITECTURE.md
        const response = await fetch('/api/architecture-doc');
        const text = await response.text();
        setArchitectureDoc(text);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculer la progression globale
  const globalProgress = stats ? 
    Math.round((stats.completedMigrations / stats.totalPlannedMigrations) * 100) : 0;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <InfoCircledIcon className="h-5 w-5 text-primary" />
            Architecture Pipeline MCP &amp; Application Cible
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline MCP</TabsTrigger>
              <TabsTrigger value="application">Application Cible</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium">Progression de la migration</h3>
                  <p className="text-muted-foreground">Avancement global du projet</p>
                </div>
                <Badge variant={globalProgress > 75 ? "success" : globalProgress > 25 ? "warning" : "secondary"}>
                  {globalProgress}% complété
                </Badge>
              </div>
              
              <Progress value={globalProgress} className="h-2" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <StatCard 
                  title="Migrations terminées" 
                  value={stats?.completedMigrations || 0} 
                  total={stats?.totalPlannedMigrations || 0} 
                  icon={<CheckCircledIcon className="text-green-500" />} 
                />
                <StatCard 
                  title="En cours" 
                  value={stats?.inProgressMigrations || 0} 
                  total={stats?.totalPlannedMigrations || 0} 
                  icon={<InfoCircledIcon className="text-amber-500" />} 
                />
                <StatCard 
                  title="Échecs" 
                  value={stats?.failedMigrations || 0} 
                  total={stats?.totalPlannedMigrations || 0} 
                  icon={<CrossCircledIcon className="text-red-500" />} 
                />
              </div>
              
              <Alert className="mt-4">
                <AlertTitle>Architecture en couches</AlertTitle>
                <AlertDescription>
                  Ce tableau de bord suit la migration du site PHP legacy vers l'architecture
                  moderne à trois couches (Coordination, Business, Adapters). Utilisez les onglets 
                  pour explorer les différentes parties de l'architecture.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="pipeline" className="space-y-4">
              <h3 className="text-lg font-medium">Agents du Pipeline MCP</h3>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Couche</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">État</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center">Chargement...</td>
                      </tr>
                    ) : agentStatus.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center">Aucun agent trouvé</td>
                      </tr>
                    ) : (
                      agentStatus.map((agent, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4">{agent.name}</td>
                          <td className="px-4 py-4">{agent.type}</td>
                          <td className="px-4 py-4">
                            <Badge variant={
                              agent.layer === 'Coordination' ? 'default' :
                              agent.layer === 'Business' ? 'secondary' : 'outline'
                            }>
                              {agent.layer}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={
                              agent.status === 'active' ? 'success' :
                              agent.status === 'idle' ? 'secondary' : 'destructive'
                            }>
                              {agent.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Button variant="outline" size="sm" onClick={() => console.log(`Lancer ${agent.name}`)}>
                              Lancer
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-lg font-medium mt-6">Relations entre agents</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <pre className="text-xs overflow-auto p-2">
                  {`
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ PhpAnalyzer ├─────►│RemixGenerator├─────►│ QaAnalyzer  │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ docs-updater │      │prisma-analyzer│      │ SeoChecker  │
└──────────────┘      └──────────────┘      └──────────────┘
                  `}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="application" className="space-y-4">
              <h3 className="text-lg font-medium">Structure de l'Application Cible</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="bg-muted/30 py-2">
                    <CardTitle className="text-sm">Frontend (Remix)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>React 19 + Tailwind CSS</li>
                      <li>BetterAuth pour l'authentification</li>
                      <li>Routes générées automatiquement</li>
                      <li>Formulaires avec Zod + @conform-to/react</li>
                      <li>SEO optimisé automatiquement</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="bg-muted/30 py-2">
                    <CardTitle className="text-sm">Backend (NestJS)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>API RESTful</li>
                      <li>Intégration Prisma + PostgreSQL</li>
                      <li>Redis pour cache et pub/sub</li>
                      <li>Supabase pour storage et auth</li>
                      <li>DTOs générés automatiquement</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <Alert variant="warning" className="mt-4">
                <AlertTitle>Rappel important</AlertTitle>
                <AlertDescription>
                  L'application cible ne doit JAMAIS être modifiée directement. Toute modification
                  doit passer par le pipeline MCP pour garantir l'intégrité du système.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="documentation" className="space-y-4">
              <h3 className="text-lg font-medium">Documentation d'Architecture</h3>
              
              <div className="border rounded-lg p-4 bg-white dark:bg-slate-900 prose dark:prose-invert max-w-none">
                {loading ? (
                  <p>Chargement de la documentation...</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: parseMd(architectureDoc) }} />
                )}
              </div>
              
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm" onClick={() => window.open('/docs/ARCHITECTURE.md', '_blank')}>
                  Voir le document complet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Composant pour afficher une statistique avec titre et valeur
 */
function StatCard({ title, value, total, icon }: { title: string; value: number; total: number; icon: React.ReactNode }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">sur {total} total</span>
          <div className="flex items-center">
            {icon}
            <span className="ml-1 text-xs">{percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ArchitectureDashboard;