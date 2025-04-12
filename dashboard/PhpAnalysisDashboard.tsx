import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Flex, Select, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Input, InputGroup, InputLeftElement, Spinner, Alert, AlertIcon,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow, StatGroup,
  Tab, Tabs, TabList, TabPanel, TabPanels, Button, ButtonGroup, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, useDisclosure, Code,
  Tag, TagLabel, TagLeftIcon, SimpleGrid, Switch, FormControl, 
  FormLabel, Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, Card, CardBody, CardHeader } from '@chakra-ui/react';
import { SearchIcon, WarningIcon, CheckCircleIcon, TimeIcon, DownloadIcon, InfoIcon, 
  LockIcon, StarIcon, ExternalLinkIcon, RepeatIcon, ArrowUpIcon, ArrowDownIcon,
  QuestionIcon, CalendarIcon, ViewIcon, ChatIcon } from '@chakra-ui/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Treemap, ComposedChart } from 'recharts';
import { supabaseClient } from '../utils/supabaseClient';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733'];
const COMPLEXITY_COLORS = {
  low: '#4CAF50',    // Vert
  medium: '#FFC107', // Jaune
  high: '#F44336'    // Rouge
};

const PhpAnalysisDashboard = () => {
  // État pour stocker les données
  const [phpFiles, setPhpFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'complexity', direction: 'desc' });
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7days');
  const [aggregatedStats, setAggregatedStats] = useState({
    totalFiles: 0,
    avgComplexity: 0,
    avgMaintainability: 0,
    totalIssues: 0,
    complexityDistribution: []
  });
  const [trends, setTrends] = useState([]);
  const [topComplexFunctions, setTopComplexFunctions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileMetrics, setFileMetrics] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [anonymousMetrics, setAnonymousMetrics] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [categorizedMetrics, setCategorizedMetrics] = useState({
    complexity: [],
    quality: [],
    performance: [],
    security: []
  });
  
  // Nouvelles variables d'état pour Supabase
  const [supabaseAlerts, setSupabaseAlerts] = useState([]);
  const [supabaseComplexityStats, setSupabaseComplexityStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [directoryAnalysis, setDirectoryAnalysis] = useState([]);
  const [userRole, setUserRole] = useState('dashboard_viewer'); // Par défaut
  const [canViewAlerts, setCanViewAlerts] = useState(true);
  const [showFilteredView, setShowFilteredView] = useState(false);
  const [supabaseAnalysis, setSupabaseAnalysis] = useState({
    loaded: false,
    trendData: [],
    securityIssues: [],
    qualityMetrics: {}
  });

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Déterminer la date limite en fonction de la plage de temps sélectionnée
        let timeFilter = new Date();
        switch(timeRange) {
          case '1day':
            timeFilter.setDate(timeFilter.getDate() - 1);
            break;
          case '7days':
            timeFilter.setDate(timeFilter.getDate() - 7);
            break;
          case '30days':
            timeFilter.setDate(timeFilter.getDate() - 30);
            break;
          case '90days':
            timeFilter.setDate(timeFilter.getDate() - 90);
            break;
          default:
            timeFilter.setDate(timeFilter.getDate() - 7);
        }
        
        // Convertir en format ISO pour la requête SQL
        const timeFilterISO = timeFilter.toISOString();
        
        // Récupérer les fichiers PHP analysés récemment
        const { data: fileData, error: fileError } = await supabaseClient
          .from('php_audit_results')
          .select('*')
          .gte('analyzed_at', timeFilterISO)
          .order('complexity', { ascending: false });
          
        if (fileError) throw fileError;
        
        // Récupérer les statistiques agrégées
        const { data: statsData, error: statsError } = await supabaseClient
          .rpc('get_php_analysis_stats', { time_range_days: parseInt(timeRange) });
          
        if (statsError) throw statsError;
        
        // Récupérer les données de tendance
        const { data: trendData, error: trendError } = await supabaseClient
          .rpc('get_php_analysis_trends', { time_range_days: parseInt(timeRange) });
          
        if (trendError) throw trendError;
        
        // Récupérer les fonctions les plus complexes
        const { data: functionsData, error: functionsError } = await supabaseClient
          .from('php_function_complexity')
          .select('*')
          .gte('analyzed_at', timeFilterISO)
          .order('complexity', { ascending: false })
          .limit(20);
          
        if (functionsError) throw functionsError;
        
        // Définir les données
        setPhpFiles(fileData || []);
        setFilteredFiles(fileData || []);
        
        // Définir les statistiques agrégées
        if (statsData && statsData.length > 0) {
          setAggregatedStats({
            totalFiles: statsData[0].total_files || 0,
            avgComplexity: statsData[0].avg_complexity || 0,
            avgMaintainability: statsData[0].avg_maintainability || 0,
            totalIssues: statsData[0].total_issues || 0,
            complexityDistribution: [
              { name: 'Faible', value: statsData[0].low_complexity_files || 0 },
              { name: 'Moyenne', value: statsData[0].medium_complexity_files || 0 },
              { name: 'Élevée', value: statsData[0].high_complexity_files || 0 }
            ]
          });
        }
        
        // Définir les données de tendance
        setTrends(trendData || []);
        
        // Définir les fonctions les plus complexes
        setTopComplexFunctions(functionsData || []);
        
        // Récupérer les métriques anonymisées (accessibles à tous grâce à notre fonction RLS)
        const { data: anonymousData, error: anonymousError } = await supabaseClient
          .rpc('get_anonymous_metrics');
          
        if (anonymousError) throw anonymousError;
        setAnonymousMetrics(anonymousData || []);
        
        // Catégoriser les métriques pour l'affichage sur le radar chart
        if (anonymousData) {
          const complexityMetrics = anonymousData.filter(m => 
            ['cyclomatic_complexity', 'nested_complexity', 'method_complexity'].includes(m.metric_name));
            
          const qualityMetrics = anonymousData.filter(m => 
            ['code_duplication', 'comment_ratio', 'maintainability_index'].includes(m.metric_name));
            
          const performanceMetrics = anonymousData.filter(m => 
            ['memory_usage', 'execution_time', 'query_count'].includes(m.metric_name));
            
          const securityMetrics = anonymousData.filter(m => 
            ['security_issues', 'vulnerable_patterns', 'input_validation'].includes(m.metric_name));
            
          setCategorizedMetrics({
            complexity: complexityMetrics,
            quality: qualityMetrics,
            performance: performanceMetrics,
            security: securityMetrics
          });
        }
        
        // Nouvelles requêtes pour les données de Supabase avec RLS
        try {
          // Vérifier les droits d'accès de l'utilisateur
          const { data: user } = await supabaseClient.auth.getUser();
          if (user) {
            // Récupérer les alertes si l'utilisateur a le rôle approprié
            const { data: alertsData, error: alertsError } = await supabaseClient
              .from('php_analysis.alerts')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);
              
            if (!alertsError) {
              setSupabaseAlerts(alertsData || []);
              setCanViewAlerts(true);
            } else {
              // L'erreur pourrait indiquer un problème de RLS (accès refusé)
              console.warn("Impossible de récupérer les alertes:", alertsError);
              setCanViewAlerts(false);
            }
            
            // Récupérer les statistiques de complexité par dossier
            const { data: directoryData, error: directoryError } = await supabaseClient
              .from('php_analysis.files')
              .select(`
                id,
                file_path,
                complexity_score,
                maintainability_index,
                loc
              `)
              .order('complexity_score', { ascending: false })
              .limit(100);
              
            if (!directoryError) {
              // Traiter les données par répertoire
              const directoryMap = new Map();
              
              (directoryData || []).forEach(file => {
                const parts = file.file_path.split('/');
                // Obtenir le répertoire de premier niveau
                const topDir = parts.length > 1 ? parts[0] : 'root';
                
                if (!directoryMap.has(topDir)) {
                  directoryMap.set(topDir, {
                    name: topDir,
                    totalFiles: 0,
                    avgComplexity: 0,
                    totalComplexity: 0,
                    files: []
                  });
                }
                
                const dirStats = directoryMap.get(topDir);
                dirStats.totalFiles++;
                dirStats.totalComplexity += file.complexity_score;
                dirStats.files.push(file);
              });
              
              // Calculer les moyennes
              const directoryStats = Array.from(directoryMap.values()).map(dir => {
                dir.avgComplexity = dir.totalComplexity / dir.totalFiles;
                return dir;
              }).sort((a, b) => b.avgComplexity - a.avgComplexity);
              
              setDirectoryAnalysis(directoryStats);
            }
            
            // Calculer les statistiques de complexité
            const complexityCount = {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0
            };
            
            (directoryData || []).forEach(file => {
              if (file.complexity_score >= 25) {
                complexityCount.critical++;
              } else if (file.complexity_score >= 15) {
                complexityCount.high++;
              } else if (file.complexity_score >= 10) {
                complexityCount.medium++;
              } else {
                complexityCount.low++;
              }
            });
            
            setSupabaseComplexityStats(complexityCount);
            
            // Récupérer les données d'analyse détaillées
            const { data: trendingSupabase, error: trendingError } = await supabaseClient
              .rpc('get_php_analysis_trends', { time_range_days: 90 });
              
            // Récupérer les problèmes de sécurité
            const { data: securityData, error: securityError } = await supabaseClient
              .from('php_analysis.alerts')
              .select('*')
              .eq('alert_type', 'security')
              .order('created_at', { ascending: false })
              .limit(20);
            
            // Récupérer les métriques de qualité
            const { data: qualityData, error: qualityError } = await supabaseClient
              .rpc('get_anonymous_metrics');
              
            setSupabaseAnalysis({
              loaded: true,
              trendData: trendingSupabase || [],
              securityIssues: securityData || [],
              qualityMetrics: qualityData || []
            });
          }
        } catch (supabaseError) {
          console.error("Erreur lors de la récupération des données Supabase:", supabaseError);
        }
        
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);
  
  // Filtrer les fichiers en fonction de la recherche et du filtre de complexité
  useEffect(() => {
    let result = phpFiles;
    
    // Appliquer le filtre de recherche
    if (searchTerm) {
      result = result.filter(file => 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Appliquer le filtre de complexité
    if (complexityFilter !== 'all') {
      switch(complexityFilter) {
        case 'low':
          result = result.filter(file => file.complexity < 10);
          break;
        case 'medium':
          result = result.filter(file => file.complexity >= 10 && file.complexity < 20);
          break;
        case 'high':
          result = result.filter(file => file.complexity >= 20);
          break;
      }
    }
    
    // Appliquer le tri
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredFiles(result);
  }, [phpFiles, searchTerm, complexityFilter, sortConfig]);
  
  // Fonction pour changer le tri
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Fonction pour obtenir la classe de couleur en fonction de la complexité
  const getComplexityColor = (complexity) => {
    if (complexity < 10) return 'green';
    if (complexity < 20) return 'yellow';
    return 'red';
  };
  
  // Fonction pour obtenir la classe de couleur en fonction de la maintenabilité
  const getMaintainabilityColor = (maintainability) => {
    if (maintainability >= 70) return 'green';
    if (maintainability >= 50) return 'yellow';
    return 'red';
  };

  // Fonction pour charger les métriques détaillées d'un fichier
  const loadFileMetrics = async (fileId) => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('php_analysis.metrics')
        .select('*')
        .eq('file_id', fileId);
        
      if (error) throw error;
      setFileMetrics(data || []);
      onOpen();
    } catch (err) {
      setError(`Erreur lors du chargement des métriques: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour exporter les données en CSV
  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      // Préparation des données
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Fichier,Chemin,Complexité,Maintenabilité,Problèmes,Lignes,Date d'analyse\n";
      
      filteredFiles.forEach(file => {
        csvContent += `"${file.filename}","${file.path}",${file.complexity},${file.maintainability},${file.issues_count},${file.lines_of_code},"${new Date(file.analyzed_at).toLocaleString('fr-FR')}"\n`;
      });
      
      // Création d'un lien de téléchargement
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analyse_php_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Déclenchement du téléchargement
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      setError(`Erreur lors de l'exportation: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Nouvelle fonction pour formatter la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour calculer le niveau de sévérité
  const getSeverityLevel = (severity) => {
    switch(severity) {
      case 'critical':
        return { color: 'red', text: 'Critique' };
      case 'high':
        return { color: 'orange', text: 'Élevée' };
      case 'medium':
        return { color: 'yellow', text: 'Moyenne' };
      case 'low':
        return { color: 'green', text: 'Faible' };
      default:
        return { color: 'blue', text: severity };
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" />
        <Text ml={4} fontSize="xl">Chargement des données d'analyse PHP...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>Erreur lors du chargement des données: {error}</Text>
      </Alert>
    );
  }

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={6}>Tableau de bord d'analyse PHP</Heading>
      
      {/* Filtres et options avec bouton d'exportation */}
      <Flex mb={6} wrap="wrap" gap={4} justify="space-between">
        <Flex gap={4} wrap="wrap">
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Rechercher un fichier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Select maxW="200px" value={complexityFilter} onChange={(e) => setComplexityFilter(e.target.value)}>
            <option value="all">Toutes les complexités</option>
            <option value="low">Faible complexité</option>
            <option value="medium">Complexité moyenne</option>
            <option value="high">Haute complexité</option>
          </Select>
          
          <Select maxW="200px" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1day">Dernières 24h</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </Select>
        </Flex>
        
        <Button 
          leftIcon={<DownloadIcon />} 
          colorScheme="blue" 
          onClick={exportToCSV}
          isLoading={isExporting}
          loadingText="Exportation..."
        >
          Exporter CSV
        </Button>
      </Flex>
      
      {/* Statistiques principales */}
      <StatGroup mb={8} gap={4} flexWrap="wrap">
        <Stat 
          p={4} 
          borderRadius="lg" 
          boxShadow="md" 
          bg="white"
          flex="1"
          minW="200px"
        >
          <StatLabel>Total fichiers PHP</StatLabel>
          <StatNumber>{aggregatedStats.totalFiles}</StatNumber>
          <StatHelpText>Analysés récemment</StatHelpText>
        </Stat>
        
        <Stat 
          p={4} 
          borderRadius="lg" 
          boxShadow="md" 
          bg="white"
          flex="1"
          minW="200px"
        >
          <StatLabel>Complexité moyenne</StatLabel>
          <StatNumber>{aggregatedStats.avgComplexity.toFixed(2)}</StatNumber>
          <StatHelpText>
            {trends.length > 1 && (
              <>
                <StatArrow 
                  type={trends[0].avg_complexity > trends[1].avg_complexity ? 'increase' : 'decrease'} 
                />
                {Math.abs(trends[0].avg_complexity - trends[1].avg_complexity).toFixed(2)} depuis la période précédente
              </>
            )}
          </StatHelpText>
        </Stat>
        
        <Stat 
          p={4} 
          borderRadius="lg" 
          boxShadow="md" 
          bg="white"
          flex="1"
          minW="200px"
        >
          <StatLabel>Maintenabilité moyenne</StatLabel>
          <StatNumber>{aggregatedStats.avgMaintainability.toFixed(2)}</StatNumber>
          <StatHelpText>
            {trends.length > 1 && (
              <>
                <StatArrow 
                  type={trends[0].avg_maintainability > trends[1].avg_maintainability ? 'increase' : 'decrease'} 
                />
                {Math.abs(trends[0].avg_maintainability - trends[1].avg_maintainability).toFixed(2)} depuis la période précédente
              </>
            )}
          </StatHelpText>
        </Stat>
        
        <Stat 
          p={4} 
          borderRadius="lg" 
          boxShadow="md" 
          bg="white"
          flex="1"
          minW="200px"
        >
          <StatLabel>Problèmes détectés</StatLabel>
          <StatNumber>{aggregatedStats.totalIssues}</StatNumber>
          <StatHelpText>
            {trends.length > 1 && (
              <>
                <StatArrow 
                  type={trends[0].total_issues > trends[1].total_issues ? 'increase' : 'decrease'} 
                />
                {Math.abs(trends[0].total_issues - trends[1].total_issues)} depuis la période précédente
              </>
            )}
          </StatHelpText>
        </Stat>
      </StatGroup>
      
      {/* Onglets pour les différentes visualisations */}
      <Tabs variant="enclosed" mb={8}>
        <TabList>
          <Tab>Vue d'ensemble</Tab>
          <Tab>Tendances</Tab>
          <Tab>Fonctions complexes</Tab>
          <Tab>Détails des fichiers</Tab>
          <Tab>Métriques globales</Tab>
          <Tab>Supabase RLS</Tab>
        </TabList>
        
        <TabPanels>
          {/* Onglet Vue d'ensemble */}
          <TabPanel>
            <Flex direction={{ base: "column", lg: "row" }} gap={6}>
              {/* Graphique de distribution de la complexité */}
              <Box 
                flex="1" 
                p={4} 
                bg="white" 
                borderRadius="lg" 
                boxShadow="md"
                minH="350px"
              >
                <Heading as="h3" size="md" mb={4}>Distribution de la complexité</Heading>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={aggregatedStats.complexityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {aggregatedStats.complexityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COMPLEXITY_COLORS)[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Nombre de fichiers']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              {/* Top 5 des fichiers les plus complexes */}
              <Box 
                flex="1" 
                p={4} 
                bg="white" 
                borderRadius="lg" 
                boxShadow="md"
              >
                <Heading as="h3" size="md" mb={4}>Top 5 des fichiers complexes</Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Fichier</Th>
                      <Th isNumeric>Complexité</Th>
                      <Th isNumeric>Maintenabilité</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredFiles.slice(0, 5).map((file) => (
                      <Tr key={file.id}>
                        <Td>{file.filename}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={getComplexityColor(file.complexity)}>
                            {file.complexity.toFixed(1)}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme={getMaintainabilityColor(file.maintainability)}>
                            {file.maintainability.toFixed(1)}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Flex>
          </TabPanel>
          
          {/* Onglet Tendances */}
          <TabPanel>
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md" mb={6}>
              <Heading as="h3" size="md" mb={4}>Évolution de la complexité et de la maintenabilité</Heading>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [value.toFixed(2), name === 'avg_complexity' ? 'Complexité moyenne' : 'Maintenabilité moyenne']}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('fr-FR');
                    }}
                  />
                  <Legend 
                    formatter={(value) => value === 'avg_complexity' ? 'Complexité moyenne' : 'Maintenabilité moyenne'} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_complexity" 
                    stroke="#FF8042" 
                    yAxisId="left"
                    name="avg_complexity"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_maintainability" 
                    stroke="#0088FE" 
                    yAxisId="right"
                    name="avg_maintainability"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
              <Heading as="h3" size="md" mb={4}>Nombre de problèmes détectés par jour</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Problèmes']}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('fr-FR');
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total_issues" fill="#8884d8" name="Problèmes" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>
          
          {/* Onglet Fonctions complexes */}
          <TabPanel>
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
              <Heading as="h3" size="md" mb={4}>Top 20 des fonctions les plus complexes</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Fichier</Th>
                    <Th>Fonction</Th>
                    <Th isNumeric>Complexité</Th>
                    <Th isNumeric>Lignes</Th>
                    <Th>Dernière analyse</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topComplexFunctions.map((func) => (
                    <Tr key={func.id}>
                      <Td>{func.filename}</Td>
                      <Td>
                        <Flex align="center">
                          <Text fontFamily="monospace">{func.function_name}</Text>
                          {func.complexity > 15 && (
                            <WarningIcon ml={2} color="red.500" />
                          )}
                        </Flex>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme={getComplexityColor(func.complexity)}>
                          {func.complexity.toFixed(1)}
                        </Badge>
                      </Td>
                      <Td isNumeric>{func.lines_of_code}</Td>
                      <Td>
                        <Flex align="center">
                          <TimeIcon mr={2} />
                          {new Date(func.analyzed_at).toLocaleDateString('fr-FR')}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          {/* Onglet Détails des fichiers */}
          <TabPanel>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th cursor="pointer" onClick={() => requestSort('filename')}>
                      Fichier {sortConfig.key === 'filename' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                    <Th cursor="pointer" onClick={() => requestSort('complexity')} isNumeric>
                      Complexité {sortConfig.key === 'complexity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                    <Th cursor="pointer" onClick={() => requestSort('maintainability')} isNumeric>
                      Maintenabilité {sortConfig.key === 'maintainability' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                    <Th cursor="pointer" onClick={() => requestSort('issues_count')} isNumeric>
                      Problèmes {sortConfig.key === 'issues_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                    <Th cursor="pointer" onClick={() => requestSort('lines_of_code')} isNumeric>
                      Lignes {sortConfig.key === 'lines_of_code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                    <Th cursor="pointer" onClick={() => requestSort('analyzed_at')}>
                      Analysé le {sortConfig.key === 'analyzed_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredFiles.map((file) => (
                    <Tr key={file.id}>
                      <Td>
                        <Flex align="center">
                          {file.complexity > 20 && <WarningIcon mr={2} color="red.500" />}
                          <Text>{file.filename}</Text>
                        </Flex>
                        <Text fontSize="xs" color="gray.500">{file.path}</Text>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme={getComplexityColor(file.complexity)}>
                          {file.complexity.toFixed(1)}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme={getMaintainabilityColor(file.maintainability)}>
                          {file.maintainability.toFixed(1)}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Badge colorScheme={file.issues_count > 10 ? 'red' : file.issues_count > 5 ? 'yellow' : 'green'}>
                          {file.issues_count}
                        </Badge>
                      </Td>
                      <Td isNumeric>{file.lines_of_code}</Td>
                      <Td>{new Date(file.analyzed_at).toLocaleString('fr-FR')}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {filteredFiles.length === 0 && (
                <Flex justify="center" p={8}>
                  <Text>Aucun fichier ne correspond aux critères de recherche</Text>
                </Flex>
              )}
            </Box>
          </TabPanel>

          {/* Onglet pour les métriques globales */}
          <TabPanel>
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md" mb={6}>
              <Heading as="h3" size="md" mb={4}>Analyse comparative des métriques PHP</Heading>
              <Text mb={4}>
                Ce graphique montre la comparaison des métriques anonymisées de votre base de code PHP.
                Les données sont collectées via notre base Supabase avec sécurité RLS.
              </Text>
              
              <Flex direction={{ base: "column", lg: "row" }} gap={6}>
                {/* Radar Chart des catégories de métriques */}
                <Box flex="1">
                  <Heading as="h4" size="sm" mb={2} textAlign="center">Radar des catégories</Heading>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart outerRadius={150} data={[
                      {
                        category: 'Complexité',
                        value: categorizedMetrics.complexity.length > 0 
                          ? categorizedMetrics.complexity.reduce((sum, item) => sum + item.avg_value, 0) / categorizedMetrics.complexity.length
                          : 0,
                        fullMark: 100
                      },
                      {
                        category: 'Qualité',
                        value: categorizedMetrics.quality.length > 0 
                          ? categorizedMetrics.quality.reduce((sum, item) => sum + item.avg_value, 0) / categorizedMetrics.quality.length
                          : 0,
                        fullMark: 100
                      },
                      {
                        category: 'Performance',
                        value: categorizedMetrics.performance.length > 0 
                          ? categorizedMetrics.performance.reduce((sum, item) => sum + item.avg_value, 0) / categorizedMetrics.performance.length
                          : 0,
                        fullMark: 100
                      },
                      {
                        category: 'Sécurité',
                        value: categorizedMetrics.security.length > 0 
                          ? categorizedMetrics.security.reduce((sum, item) => sum + item.avg_value, 0) / categorizedMetrics.security.length
                          : 0,
                        fullMark: 100
                      }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Valeur moyenne" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
                
                {/* Distribution des valeurs métriques */}
                <Box flex="1">
                  <Heading as="h4" size="sm" mb={2} textAlign="center">Distribution des valeurs</Heading>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis 
                        type="category" 
                        dataKey="metric_name" 
                        name="Métrique" 
                        tickFormatter={(value) => value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      />
                      <YAxis type="number" dataKey="avg_value" name="Valeur moyenne" />
                      <ZAxis type="number" dataKey="total_files" range={[20, 200]} name="Nombre de fichiers" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name, props) => {
                          if (name === 'avg_value') return [value.toFixed(2), 'Valeur moyenne'];
                          if (name === 'total_files') return [value, 'Nombre de fichiers'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Scatter 
                        name="Métriques PHP" 
                        data={anonymousMetrics} 
                        fill="#8884d8" 
                        shape="circle"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </Flex>
            </Box>
            
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
              <Heading as="h3" size="md" mb={4}>Tableau des métriques anonymisées</Heading>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Métrique</Th>
                    <Th isNumeric>Valeur moyenne</Th>
                    <Th isNumeric>Valeur maximale</Th>
                    <Th isNumeric>Valeur minimale</Th>
                    <Th isNumeric>Nombre de fichiers</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {anonymousMetrics.map((metric, index) => (
                    <Tr key={index}>
                      <Td>{metric.metric_name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Td>
                      <Td isNumeric>{metric.avg_value.toFixed(2)}</Td>
                      <Td isNumeric>{metric.max_value.toFixed(2)}</Td>
                      <Td isNumeric>{metric.min_value.toFixed(2)}</Td>
                      <Td isNumeric>{metric.total_files}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          
          {/* Nouvel onglet pour les données Supabase avec RLS */}
          <TabPanel>
            <Box p={4} mb={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg">Tableau de bord Supabase RLS</Heading>
                <Tag size="lg" colorScheme="purple" borderRadius="full">
                  <TagLeftIcon boxSize="12px" as={LockIcon} />
                  <TagLabel>
                    {canViewAlerts ? "Accès complet" : "Accès limité (RLS)"}
                  </TagLabel>
                </Tag>
              </Flex>
              
              <Text mb={6}>
                Ce tableau de bord utilise les données protégées par Row Level Security (RLS) dans Supabase. 
                Votre niveau d'accès détermine les informations que vous pouvez voir.
              </Text>
              
              <FormControl display="flex" alignItems="center" mb={6}>
                <FormLabel htmlFor="filtered-view" mb="0">
                  Afficher la vue filtrée par RLS:
                </FormLabel>
                <Switch id="filtered-view" isChecked={showFilteredView} onChange={(e) => setShowFilteredView(e.target.checked)} />
              </FormControl>
            </Box>
            
            {/* Statistiques de complexité */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md" color="red.500">Fichiers critiques</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="3xl" fontWeight="bold">{supabaseComplexityStats.critical}</Text>
                  <Text>Complexité ≥ 25</Text>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md" color="orange.500">Fichiers à risque élevé</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="3xl" fontWeight="bold">{supabaseComplexityStats.high}</Text>
                  <Text>Complexité ≥ 15</Text>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md" color="yellow.500">Complexité moyenne</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="3xl" fontWeight="bold">{supabaseComplexityStats.medium}</Text>
                  <Text>Complexité ≥ 10</Text>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md" color="green.500">Fichiers sains</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="3xl" fontWeight="bold">{supabaseComplexityStats.low}</Text>
                  <Text>Complexité < 10</Text>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            {/* Section des alertes - visible selon les droits RLS */}
            {canViewAlerts ? (
              <Box p={4} bg="white" borderRadius="lg" boxShadow="md" mb={6}>
                <Heading as="h3" size="md" mb={4}>
                  Alertes récentes
                  {showFilteredView && (
                    <Tag size="sm" ml={2} colorScheme="purple">
                      <TagLeftIcon boxSize="12px" as={LockIcon} />
                      <TagLabel>Accès protégé par RLS</TagLabel>
                    </Tag>
                  )}
                </Heading>
                
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Sévérité</Th>
                      <Th>Message</Th>
                      <Th>Date</Th>
                      <Th>Statut</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {supabaseAlerts.slice(0, 10).map((alert) => (
                      <Tr key={alert.id}>
                        <Td>
                          <Tag size="sm" colorScheme={alert.alert_type === 'security' ? 'red' : alert.alert_type === 'quality' ? 'blue' : 'purple'}>
                            {alert.alert_type}
                          </Tag>
                        </Td>
                        <Td>
                          <Badge colorScheme={getSeverityLevel(alert.severity).color}>
                            {getSeverityLevel(alert.severity).text}
                          </Badge>
                        </Td>
                        <Td>{alert.message}</Td>
                        <Td>{formatDate(alert.created_at)}</Td>
                        <Td>
                          <Tag size="sm" colorScheme={alert.resolved ? 'green' : 'orange'}>
                            <TagLeftIcon boxSize="12px" as={alert.resolved ? CheckCircleIcon : WarningIcon} />
                            <TagLabel>{alert.resolved ? 'Résolu' : 'Actif'}</TagLabel>
                          </Tag>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                
                {supabaseAlerts.length === 0 && (
                  <Flex justify="center" p={4}>
                    <Text>Aucune alerte récente</Text>
                  </Flex>
                )}
              </Box>
            ) : (
              <Box p={4} bg="gray.50" borderRadius="lg" boxShadow="md" mb={6}>
                <Flex direction="column" align="center" justify="center" p={6}>
                  <LockIcon boxSize="3em" color="gray.400" mb={4} />
                  <Heading as="h3" size="md" textAlign="center" mb={2}>
                    Accès restreint aux alertes
                  </Heading>
                  <Text textAlign="center">
                    Les politiques de Row Level Security (RLS) de Supabase limitent votre accès à ces données.
                    Contactez votre administrateur pour obtenir le rôle 'php_analyst' ou 'dashboard_viewer'.
                  </Text>
                </Flex>
              </Box>
            )}
            
            {/* Analyse par répertoire */}
            <Box p={4} bg="white" borderRadius="lg" boxShadow="md" mb={6}>
              <Heading as="h3" size="md" mb={4}>Analyse par répertoire</Heading>
              
              <Accordion allowToggle mb={4}>
                {directoryAnalysis.map((dir, index) => (
                  <AccordionItem key={index}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Flex align="center">
                            <Text fontWeight="bold">{dir.name}</Text>
                            <Badge ml={2} colorScheme={getComplexityColor(dir.avgComplexity)}>
                              Complexité moyenne: {dir.avgComplexity.toFixed(2)}
                            </Badge>
                            <Text ml={4} fontSize="sm" color="gray.500">
                              {dir.totalFiles} fichiers
                            </Text>
                          </Flex>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Fichier</Th>
                            <Th isNumeric>Complexité</Th>
                            <Th isNumeric>Maintenabilité</Th>
                            <Th isNumeric>Lignes</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {dir.files.slice(0, 5).map((file) => (
                            <Tr key={file.id}>
                              <Td>{file.file_path.split('/').pop()}</Td>
                              <Td isNumeric>
                                <Badge colorScheme={getComplexityColor(file.complexity_score)}>
                                  {file.complexity_score.toFixed(1)}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme={getMaintainabilityColor(file.maintainability_index)}>
                                  {file.maintainability_index ? file.maintainability_index.toFixed(1) : 'N/A'}
                                </Badge>
                              </Td>
                              <Td isNumeric>{file.loc}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                      
                      {dir.files.length > 5 && (
                        <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                          + {dir.files.length - 5} autres fichiers
                        </Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {/* Graphique Treemap des répertoires par complexité */}
              <Box mt={6}>
                <Heading as="h4" size="sm" mb={4}>Complexité par répertoire</Heading>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={directoryAnalysis.map(dir => ({
                      name: dir.name,
                      size: dir.avgComplexity * dir.totalFiles, // Surface proportionnelle à la complexité totale
                      avgComplexity: dir.avgComplexity,
                      totalFiles: dir.totalFiles
                    }))}
                    dataKey="size"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="#8884d8"
                  >
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === 'size') return [props.payload.avgComplexity.toFixed(2), 'Complexité moyenne'];
                        return [value, name];
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <Box bg="white" p={2} border="1px solid" borderColor="gray.200" borderRadius="md">
                              <Text fontWeight="bold">{data.name}</Text>
                              <Text>Complexité moyenne: {data.avgComplexity.toFixed(2)}</Text>
                              <Text>Fichiers: {data.totalFiles}</Text>
                            </Box>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </Box>
            </Box>
            
            {/* Comparaison historique - Tendances sur 90 jours */}
            {supabaseAnalysis.loaded && (
              <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
                <Heading as="h3" size="md" mb={4}>Tendances sur les 90 derniers jours</Heading>
                
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={supabaseAnalysis.trendData.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        switch (name) {
                          case 'avg_complexity': return [value.toFixed(2), 'Complexité moyenne'];
                          case 'avg_maintainability': return [value.toFixed(2), 'Maintenabilité moyenne'];
                          case 'total_files': return [value, 'Fichiers analysés'];
                          case 'total_issues': return [value, 'Problèmes détectés'];
                          default: return [value, name];
                        }
                      }}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('fr-FR');
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total_files" 
                      fillOpacity={0.3}
                      fill="#82ca9d" 
                      stroke="#82ca9d" 
                      yAxisId="right"
                      name="total_files"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_complexity" 
                      stroke="#FF8042" 
                      yAxisId="left"
                      name="avg_complexity"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_maintainability" 
                      stroke="#0088FE" 
                      yAxisId="left"
                      name="avg_maintainability"
                    />
                    <Bar 
                      dataKey="total_issues" 
                      barSize={20} 
                      fill="#8884d8" 
                      yAxisId="right"
                      name="total_issues"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal pour afficher les métriques détaillées d'un fichier */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Métriques détaillées: {selectedFile?.filename}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {fileMetrics.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Métrique</Th>
                    <Th>Valeur</Th>
                    <Th>Description</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {fileMetrics.map((metric) => (
                    <Tr key={metric.id}>
                      <Td>{metric.metric_name}</Td>
                      <Td>
                        <Code>{JSON.stringify(metric.metric_value, null, 2)}</Code>
                      </Td>
                      <Td>
                        <Flex align="center">
                          <InfoIcon mr={2} />
                          <Text fontSize="sm">{metric.metric_value.description || 'Aucune description disponible'}</Text>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text>Aucune métrique détaillée disponible pour ce fichier.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PhpAnalysisDashboard;