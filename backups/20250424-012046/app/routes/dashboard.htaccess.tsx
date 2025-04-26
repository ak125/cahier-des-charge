import { json, LoaderFunctionArgs } from @remix-run/nodestructure-agent";
import { useLoaderData, Link } from @remix-run/reactstructure-agent";
import { useState, useEffect } from reactstructure-agent";
import * as fs from fsstructure-agent';
import * as path from pathstructure-agent';

/**
 * Tableau de bord des redirections et routes héritées
 * Permet de visualiser et gérer les règles .htaccess
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const reportsDir = path.resolve(process.cwd(), 'reports');
    const data = {
      redirects: {},
      gone: [],
      mapping: {},
      seoRoutes: [],
      missedRoutes: { total: 0, routes: [] },
      auditFile: null,
      stats: {
        totalRedirects: 0,
        totalGone: 0,
        totalMapping: 0,
        totalSeoRoutes: 0
      }
    };
    
    // Charger les redirections
    const redirectsPath = path.join(reportsDir, 'redirects.json');
    if (fs.existsSync(redirectsPath)) {
      data.redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      data.stats.totalRedirects = Object.keys(data.redirects).length;
    }
    
    // Charger les pages supprimées
    const gonePath = path.join(reportsDir, 'deleted_routes.json');
    if (fs.existsSync(gonePath)) {
      data.gone = JSON.parse(fs.readFileSync(gonePath, 'utf8'));
      data.stats.totalGone = data.gone.length;
    }
    
    // Charger le mapping des routes
    const mappingPath = path.join(reportsDir, 'legacy_route_map.json');
    if (fs.existsSync(mappingPath)) {
      data.mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      data.stats.totalMapping = Object.keys(data.mapping).length;
    }
    
    // Charger les routes SEO
    const seoRoutesPath = path.join(reportsDir, 'seo_routes.json');
    if (fs.existsSync(seoRoutesPath)) {
      data.seoRoutes = JSON.parse(fs.readFileSync(seoRoutesPath, 'utf8'));
      data.stats.totalSeoRoutes = data.seoRoutes.length;
    }
    
    // Vérifier si le rapport d'audit SEO existe
    const auditPath = path.join(reportsDir, 'seo_routes.audit.md');
    if (fs.existsSync(auditPath)) {
      data.auditFile = auditPath;
    }
    
    // Charger les statistiques des routes manquées
    try {
      // Ce serait normalement un appel API au middleware NestJS
      // On simule ici en lisant directement le fichier de log
      const logPath = path.resolve(process.cwd(), 'logs/missed_legacy_routes.log');
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const logLines = logContent.split('\n').filter(line => line.trim());
        
        // Extraire et compter les URLs uniques
        const urlCounts = new Map<string, number>();
        
        logLines.forEach(line => {
          const parts = line.split(' | ');
          if (parts.length >= 3) {
            const url = parts[2];
            urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
          }
        });
        
        // Trier par nombre d'accès (du plus grand au plus petit)
        const sortedUrls = [...urlCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20) // Limiter à 20 pour l'affichage
          .map(([url, count]) => ({ url, count }));
        
        data.missedRoutes = {
          total: urlCounts.size,
          routes: sortedUrls
        };
      }
    } catch (error) {
      console.error("Erreur lors du chargement des routes manquées:", error);
    }
    
    return json(data);
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    return json({ 
      error: error.message,
      redirects: {},
      gone: [],
      mapping: {},
      seoRoutes: [],
      missedRoutes: { total: 0, routes: [] },
      stats: {
        totalRedirects: 0,
        totalGone: 0,
        totalMapping: 0,
        totalSeoRoutes: 0
      }
    });
  }
}

export default function HtaccessDashboard() {
  const data = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'redirects' | 'gone' | 'mapping' | 'seo' | 'missed'>('redirects');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Mettre à jour les données filtrées lorsque la recherche ou l'onglet change
  useEffect(() => {
    if (searchTerm === '') {
      switch (activeTab) {
        case 'redirects':
          setFilteredData(Object.entries(data.redirects).map(([from, details]) => ({
            from,
            to: (details as any).to,
            status: (details as any).status
          })));
          break;
        case 'gone':
          setFilteredData(data.gone.map(path => ({ path })));
          break;
        case 'mapping':
          setFilteredData(Object.entries(data.mapping).map(([from, to]) => ({ from, to })));
          break;
        case 'seo':
          setFilteredData(data.seoRoutes.map(route => ({ route })));
          break;
        case 'missed':
          setFilteredData(data.missedRoutes.routes);
          break;
      }
    } else {
      const term = searchTerm.toLowerCase();
      
      switch (activeTab) {
        case 'redirects':
          setFilteredData(
            Object.entries(data.redirects)
              .filter(([from, details]) => 
                from.toLowerCase().includes(term) || 
                (details as any).to.toLowerCase().includes(term)
              )
              .map(([from, details]) => ({
                from,
                to: (details as any).to,
                status: (details as any).status
              }))
          );
          break;
        case 'gone':
          setFilteredData(
            data.gone
              .filter(path => path.toLowerCase().includes(term))
              .map(path => ({ path }))
          );
          break;
        case 'mapping':
          setFilteredData(
            Object.entries(data.mapping)
              .filter(([from, to]) => 
                from.toLowerCase().includes(term) || 
                (to as string).toLowerCase().includes(term)
              )
              .map(([from, to]) => ({ from, to }))
          );
          break;
        case 'seo':
          setFilteredData(
            data.seoRoutes
              .filter(route => route.toLowerCase().includes(term))
              .map(route => ({ route }))
          );
          break;
        case 'missed':
          setFilteredData(
            data.missedRoutes.routes
              .filter(item => item.url.toLowerCase().includes(term))
          );
          break;
      }
    }
  }, [activeTab, searchTerm, data]);

  return (
    <div className="htaccess-dashboard">
      <h1>Tableau de bord des routes héritées</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Redirections</h3>
          <div className="stat-value">{data.stats.totalRedirects}</div>
        </div>
        <div className="stat-card">
          <h3>Pages supprimées</h3>
          <div className="stat-value">{data.stats.totalGone}</div>
        </div>
        <div className="stat-card">
          <h3>Mappings</h3>
          <div className="stat-value">{data.stats.totalMapping}</div>
        </div>
        <div className="stat-card">
          <h3>Routes SEO</h3>
          <div className="stat-value">{data.stats.totalSeoRoutes}</div>
        </div>
        <div className="stat-card">
          <h3>Routes manquées</h3>
          <div className="stat-value">{data.missedRoutes.total}</div>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <div className="tabs">
          <button 
            className={activeTab === 'redirects' ? 'active' : ''} 
            onClick={() => setActiveTab('redirects')}
          >
            Redirections
          </button>
          <button 
            className={activeTab === 'gone' ? 'active' : ''} 
            onClick={() => setActiveTab('gone')}
          >
            Pages supprimées
          </button>
          <button 
            className={activeTab === 'mapping' ? 'active' : ''} 
            onClick={() => setActiveTab('mapping')}
          >
            Mappings
          </button>
          <button 
            className={activeTab === 'seo' ? 'active' : ''} 
            onClick={() => setActiveTab('seo')}
          >
            Routes SEO
          </button>
          <button 
            className={activeTab === 'missed' ? 'active' : ''} 
            onClick={() => setActiveTab('missed')}
          >
            Routes manquées
          </button>
        </div>
        
        <div className="search">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'redirects' && (
          <div className="redirects-table">
            <h2>Redirections ({filteredData.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Origine</th>
                  <th>Destination</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td><code>{item.from}</code></td>
                    <td><code>{item.to}</code></td>
                    <td>{item.status}</td>
                    <td>
                      <button onClick={() => window.open(item.from, '_blank')}>
                        Tester
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'gone' && (
          <div className="gone-table">
            <h2>Pages supprimées ({filteredData.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Chemin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td><code>{item.path}</code></td>
                    <td>
                      <button onClick={() => window.open(item.path, '_blank')}>
                        Tester
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'mapping' && (
          <div className="mapping-table">
            <h2>Mappings ({filteredData.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Origine</th>
                  <th>Destination</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td><code>{item.from}</code></td>
                    <td><code>{item.to}</code></td>
                    <td>
                      <button onClick={() => window.open(item.from, '_blank')}>
                        Tester
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'seo' && (
          <div className="seo-table">
            <h2>Routes SEO critiques ({filteredData.length})</h2>
            {data.auditFile && (
              <div className="audit-link">
                <Link to={`/dashboard/seo-audit`}>
                  Voir le rapport d'audit SEO détaillé
                </Link>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td><code>{item.route}</code></td>
                    <td>
                      <button onClick={() => window.open(item.route, '_blank')}>
                        Tester
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'missed' && (
          <div className="missed-table">
            <h2>Routes manquées ({data.missedRoutes.total})</h2>
            <p>Ces routes ont été demandées mais ne sont pas gérées par le système.</p>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Nombre d'accès</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td><code>{item.url}</code></td>
                    <td>{item.count}</td>
                    <td>
                      <button onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify({
                          from: item.url,
                          to: item.url.replace('.php', ''),
                          type: 'redirect',
                          status: 301
                        }, null, 2));
                        alert('Configuration de redirection copiée dans le presse-papier');
                      }}>
                        Générer config
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="dashboard-help">
        <h3>Comment utiliser ce tableau de bord</h3>
        <ul>
          <li><strong>Redirections</strong> : Liste toutes les règles de redirection extraites de .htaccess</li>
          <li><strong>Pages supprimées</strong> : Pages marquées comme supprimées (HTTP 410)</li>
          <li><strong>Mappings</strong> : Correspondances entre anciennes et nouvelles URL</li>
          <li><strong>Routes SEO</strong> : URL importantes pour le référencement</li>
          <li><strong>Routes manquées</strong> : URL demandées mais non gérées par le système</li>
        </ul>
        <p>
          Utilisez la recherche pour filtrer les résultats.
          Le bouton "Tester" ouvre l'URL dans un nouvel onglet pour vérifier le comportement.
        </p>
      </div>
    </div>
  );
}