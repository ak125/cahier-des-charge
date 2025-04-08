import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";
import { useState } from "react";
import { createServerClient } from "~/utils/supabase.server";
import { useSupabase } from "~/utils/supabase";
import { Tabs, TabList, Tab, TabPanel } from "~/components/Tabs";
import { AlertBadge } from "~/components/AlertBadge";
import { StatusCard } from "~/components/StatusCard";
import { LineChart, BarChart } from "~/components/Charts";
import { AuditDetail } from "~/components/AuditDetail";

// Définition des types pour les données
type AuditData = {
  id: string;
  module_id: string;
  module_name: string;
  status: "success" | "warning" | "error";
  score: number;
  details: Record<string, any>;
  created_at: string;
};

type MigrationData = {
  id: string;
  name: string;
  legacy_path: string;
  target_path: string;
  status: "pending" | "inProgress" | "completed" | "failed";
  validation_score: number;
  created_at: string;
  completed_at: string | null;
};

type ErrorData = {
  id: string;
  module_id: string;
  module_name: string;
  route: string;
  error_type: string;
  message: string;
  stacktrace: string;
  created_at: string;
  is_resolved: boolean;
};

type LoaderData = {
  audits: AuditData[];
  migrations: MigrationData[];
  errors: ErrorData[];
  stats: {
    totalModules: number;
    completedModules: number;
    pendingModules: number;
    errorModules: number;
    avgScore: number;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const supabase = createServerClient(request);
  
  // Récupérer les audits complets
  const { data: audits, error: auditsError } = await supabase
    .from("audits")
    .select(`
      id,
      module_id,
      modules (name),
      status,
      score,
      details,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(20);
  
  // Récupérer les migrations validées
  const { data: migrations, error: migrationsError } = await supabase
    .from("migrations")
    .select("*")
    .or("status.eq.completed,status.eq.failed")
    .order("created_at", { ascending: false })
    .limit(20);
  
  // Récupérer les erreurs critiques
  const { data: errors, error: errorsError } = await supabase
    .from("errors")
    .select(`
      id,
      module_id,
      modules (name),
      route,
      error_type,
      message,
      stacktrace,
      created_at,
      is_resolved
    `)
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });
  
  // Calculer les statistiques
  const { data: stats } = await supabase.rpc("get_migration_statistics");
  
  if (auditsError || migrationsError || errorsError) {
    throw new Error("Erreur lors de la récupération des données");
  }
  
  // Formater les données pour le front-end
  const formattedAudits = audits.map(audit => ({
    ...audit,
    module_name: audit.modules.name
  }));
  
  const formattedErrors = errors.map(error => ({
    ...error,
    module_name: error.modules.name
  }));
  
  return json({
    audits: formattedAudits,
    migrations,
    errors: formattedErrors,
    stats: stats || {
      totalModules: 0,
      completedModules: 0,
      pendingModules: 0,
      errorModules: 0,
      avgScore: 0
    }
  });
};

export default function Dashboard() {
  const { audits, migrations, errors, stats } = useLoaderData<LoaderData>();
  const supabase = useSupabase();
  
  // État pour stocker les données en temps réel
  const [liveAudits, setLiveAudits] = useState<AuditData[]>(audits);
  const [liveMigrations, setLiveMigrations] = useState<MigrationData[]>(migrations);
  const [liveErrors, setLiveErrors] = useState<ErrorData[]>(errors);
  
  // Configurer les abonnements en temps réel Supabase
  useState(() => {
    // Abonnement aux changements des audits
    const auditsSubscription = supabase
      .channel('audits-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'audits' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setLiveAudits(prev => [payload.new as AuditData, ...prev.slice(0, 19)]);
        } else if (payload.eventType === 'UPDATE') {
          setLiveAudits(prev => 
            prev.map(item => item.id === payload.new.id ? payload.new as AuditData : item)
          );
        }
      })
      .subscribe();
    
    // Abonnement aux changements des migrations
    const migrationsSubscription = supabase
      .channel('migrations-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'migrations' 
      }, payload => {
        if (payload.eventType === 'INSERT' && 
            (payload.new.status === 'completed' || payload.new.status === 'failed')) {
          setLiveMigrations(prev => [payload.new as MigrationData, ...prev.slice(0, 19)]);
        } else if (payload.eventType === 'UPDATE') {
          setLiveMigrations(prev => 
            prev.map(item => item.id === payload.new.id ? payload.new as MigrationData : item)
          );
        }
      })
      .subscribe();
    
    // Abonnement aux changements des erreurs
    const errorsSubscription = supabase
      .channel('errors-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'errors' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setLiveErrors(prev => [payload.new as ErrorData, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.is_resolved) {
            // Retirer les erreurs résolues
            setLiveErrors(prev => prev.filter(item => item.id !== payload.new.id));
          } else {
            // Mettre à jour les erreurs
            setLiveErrors(prev => 
              prev.map(item => item.id === payload.new.id ? payload.new as ErrorData : item)
            );
          }
        }
      })
      .subscribe();
    
    // Nettoyage des abonnements
    return () => {
      supabase.removeChannel(auditsSubscription);
      supabase.removeChannel(migrationsSubscription);
      supabase.removeChannel(errorsSubscription);
    };
  }, [supabase]);
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Migration Dashboard</h1>
        <div className="dashboard-stats">
          <StatusCard 
            title="Modules migrés" 
            value={`${stats.completedModules}/${stats.totalModules}`}
            percent={stats.totalModules ? (stats.completedModules / stats.totalModules) * 100 : 0}
            status="success"
          />
          <StatusCard 
            title="Score moyen" 
            value={`${stats.avgScore.toFixed(1)}/100`}
            percent={stats.avgScore}
            status={stats.avgScore > 80 ? "success" : "warning"}
          />
          <StatusCard 
            title="Modules en erreur" 
            value={stats.errorModules.toString()}
            percent={stats.totalModules ? (stats.errorModules / stats.totalModules) * 100 : 0}
            status={stats.errorModules > 0 ? "error" : "success"}
            inverse
          />
        </div>
      </header>
      
      <Tabs>
        <TabList>
          <Tab>Audits Complets</Tab>
          <Tab>Migrations Validées</Tab>
          <Tab>Erreurs Critiques {liveErrors.length > 0 && <AlertBadge count={liveErrors.length} />}</Tab>
        </TabList>
        
        <TabPanel>
          <h2>Derniers audits</h2>
          <div className="audits-container">
            {liveAudits.length > 0 ? (
              <div className="audits-list">
                {liveAudits.map(audit => (
                  <AuditDetail 
                    key={audit.id}
                    audit={audit}
                    onResolve={async (id) => {
                      // Logic to mark an audit as reviewed
                      await supabase
                        .from('audits')
                        .update({ reviewed: true })
                        .eq('id', id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p>Aucun audit récent</p>
            )}
            
            <div className="audit-charts">
              <div className="chart-container">
                <h3>Scores d'audit par module</h3>
                <BarChart 
                  data={liveAudits.reduce((acc, audit) => {
                    if (!acc[audit.module_name]) {
                      acc[audit.module_name] = audit.score;
                    }
                    return acc;
                  }, {} as Record<string, number>)}
                  height={300}
                />
              </div>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel>
          <h2>Migrations récemment validées</h2>
          {liveMigrations.length > 0 ? (
            <table className="migrations-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Fichier source</th>
                  <th>Fichier cible</th>
                  <th>Statut</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {liveMigrations.map(migration => (
                  <tr key={migration.id} className={migration.status === "failed" ? "status-failed" : "status-success"}>
                    <td>{migration.name}</td>
                    <td className="code-path">{migration.legacy_path}</td>
                    <td className="code-path">{migration.target_path}</td>
                    <td>
                      <span className={`status-badge status-${migration.status}`}>
                        {migration.status === "completed" ? "Complété" : "Échoué"}
                      </span>
                    </td>
                    <td>{migration.validation_score}/100</td>
                    <td>{new Date(migration.completed_at || migration.created_at).toLocaleString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/migrations/${migration.id}`} className="btn btn-small">
                          Détails
                        </Link>
                        {migration.status === "failed" && (
                          <button 
                            className="btn btn-small btn-retry"
                            onClick={async () => {
                              // Logic to retry migration
                              await fetch(`/api/migrations/${migration.id}/retry`, { method: 'POST' });
                            }}
                          >
                            Réessayer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucune migration récente</p>
          )}
          
          <div className="migration-chart">
            <h3>Progression des migrations</h3>
            <LineChart 
              data={[
                { name: "Semaine 1", Completed: 5, Failed: 2 },
                { name: "Semaine 2", Completed: 12, Failed: 3 },
                { name: "Semaine 3", Completed: 18, Failed: 1 },
                { name: "Semaine 4", Completed: 25, Failed: 4 }
              ]}
              xKey="name"
              yKeys={["Completed", "Failed"]}
              colors={["#4caf50", "#f44336"]}
              height={300}
            />
          </div>
        </TabPanel>
        
        <TabPanel>
          <h2>Erreurs critiques non résolues</h2>
          {liveErrors.length > 0 ? (
            <div className="errors-grid">
              {liveErrors.map(error => (
                <div key={error.id} className="error-card">
                  <div className="error-header">
                    <h3>{error.error_type}</h3>
                    <span className="error-date">{new Date(error.created_at).toLocaleString()}</span>
                  </div>
                  <div className="error-body">
                    <p><strong>Module:</strong> {error.module_name}</p>
                    <p><strong>Route:</strong> {error.route}</p>
                    <p><strong>Message:</strong> {error.message}</p>
                    <details>
                      <summary>Stack trace</summary>
                      <pre className="error-trace">{error.stacktrace}</pre>
                    </details>
                  </div>
                  <div className="error-footer">
                    <button 
                      className="btn btn-resolve"
                      onClick={async () => {
                        // Logic to mark error as resolved
                        await supabase
                          .from('errors')
                          .update({ is_resolved: true })
                          .eq('id', error.id);
                      }}
                    >
                      Marquer comme résolu
                    </button>
                    <Link to={`/errors/${error.id}`} className="btn">
                      Analyser
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-errors-message">
              <p>✅ Aucune erreur critique non résolue</p>
            </div>
          )}
          
          <div className="errors-by-module">
            <h3>Erreurs par module</h3>
            <BarChart 
              data={liveErrors.reduce((acc, error) => {
                acc[error.module_name] = (acc[error.module_name] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              height={300}
              color="#f44336"
            />
          </div>
        </TabPanel>
      </Tabs>
      
      <Outlet />
    </div>
  );
}
