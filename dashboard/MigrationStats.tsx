import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Types pour les données de migration
interface MigrationSummary {
  totalFiles: number;
  migratedFiles: number;
  pendingFiles: number;
  errorFiles: number;
  averageCompletionTime: number; // en minutes
  completionRate: number; // pourcentage
  lastMigration: string; // ISO date string
}

interface MigrationTrend {
  date: string;
  filesProcessed: number;
  successRate: number;
}

interface ComponentTypeData {
  type: string;
  count: number;
  migratedCount: number;
  errorCount: number;
}

interface WaveData {
  waveName: string;
  totalFiles: number;
  completedFiles: number;
  status: 'completed' | 'in-progress' | 'planned';
  startDate?: string;
  endDate?: string;
}

// Types pour les props du composant
interface MigrationStatsProps {
  summary?: MigrationSummary;
  trends?: MigrationTrend[];
  componentTypes?: ComponentTypeData[];
  waves?: WaveData[];
  isLoading?: boolean;
}

// Formatage de dates et nombres pour l'affichage
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');
const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);
const formatPercentage = (num: number) => `${Math.round(num * 100) / 100}%`;

// Données démo en cas de données non fournies
const demoSummary: MigrationSummary = {
  totalFiles: 1245,
  migratedFiles: 867,
  pendingFiles: 298,
  errorFiles: 80,
  averageCompletionTime: 12.5,
  completionRate: 69.6,
  lastMigration: new Date().toISOString()
};

const demoTrends: MigrationTrend[] = [
  { date: '2025-03-01', filesProcessed: 45, successRate: 82 },
  { date: '2025-03-08', filesProcessed: 62, successRate: 85 },
  { date: '2025-03-15', filesProcessed: 78, successRate: 88 },
  { date: '2025-03-22', filesProcessed: 95, successRate: 91 },
  { date: '2025-03-29', filesProcessed: 110, successRate: 93 },
  { date: '2025-04-05', filesProcessed: 125, successRate: 94 },
  { date: '2025-04-11', filesProcessed: 89, successRate: 92 }
];

const demoComponentTypes: ComponentTypeData[] = [
  { type: 'Controller', count: 234, migratedCount: 187, errorCount: 12 },
  { type: 'View', count: 456, migratedCount: 342, errorCount: 28 },
  { type: 'Model', count: 178, migratedCount: 145, errorCount: 9 },
  { type: 'Service', count: 132, migratedCount: 89, errorCount: 15 },
  { type: 'Helper', count: 245, migratedCount: 104, errorCount: 16 }
];

const demoWaves: WaveData[] = [
  { waveName: 'Wave 1: Core Authentication', totalFiles: 120, completedFiles: 120, status: 'completed', startDate: '2025-01-10', endDate: '2025-02-15' },
  { waveName: 'Wave 2: Product Catalog', totalFiles: 245, completedFiles: 232, status: 'in-progress', startDate: '2025-02-20', endDate: '2025-04-25' },
  { waveName: 'Wave 3: Order Management', totalFiles: 310, completedFiles: 180, status: 'in-progress', startDate: '2025-03-15', endDate: '2025-05-30' },
  { waveName: 'Wave 4: Reporting', totalFiles: 175, completedFiles: 0, status: 'planned', startDate: '2025-05-10' }
];

// Composant principal
const MigrationStats: React.FC<MigrationStatsProps> = ({ 
  summary = demoSummary, 
  trends = demoTrends, 
  componentTypes = demoComponentTypes, 
  waves = demoWaves, 
  isLoading = false 
}) => {
  const [progressChartData, setProgressChartData] = useState<any>(null);
  const [componentChartData, setComponentChartData] = useState<any>(null);
  const [trendChartData, setTrendChartData] = useState<any>(null);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Préparation des données de graphiques quand les props changent
  useEffect(() => {
    // Graphique pour les types de composants
    if (componentTypes.length > 0) {
      setComponentChartData({
        labels: componentTypes.map(item => item.type),
        datasets: [
          {
            label: 'Total',
            data: componentTypes.map(item => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Migrés',
            data: componentTypes.map(item => item.migratedCount),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Erreurs',
            data: componentTypes.map(item => item.errorCount),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ],
      });
    }

    // Graphique pour l'état général de la migration
    setProgressChartData({
      labels: ['Migrés', 'En attente', 'Erreurs'],
      datasets: [
        {
          data: [summary.migratedFiles, summary.pendingFiles, summary.errorFiles],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });

    // Graphique pour les tendances
    if (trends.length > 0) {
      setTrendChartData({
        labels: trends.map(trend => formatDate(trend.date)),
        datasets: [
          {
            label: 'Fichiers traités',
            data: trends.map(trend => trend.filesProcessed),
            backgroundColor: 'rgba(54, 162, 235, 0.4)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Taux de réussite (%)',
            data: trends.map(trend => trend.successRate),
            backgroundColor: 'rgba(75, 192, 192, 0.4)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      });
    }
  }, [summary, trends, componentTypes]);

  // Options pour les graphiques
  const trendOptions = {
    responsive: true,
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Fichiers traités'
        },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Taux de réussite (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tendance de migration (7 derniers jours)',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Répartition de l\'état des fichiers',
      },
    },
  };

  const barOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Migration par type de composant',
      },
    },
  };

  // Rendu du statut pour la vague de migration
  const renderWaveStatus = (status: WaveData['status']) => {
    switch (status) {
      case 'completed':
        return <Badge colorScheme="green">Terminé</Badge>;
      case 'in-progress':
        return <Badge colorScheme="blue">En cours</Badge>;
      case 'planned':
        return <Badge colorScheme="yellow">Planifié</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  // Calcul des indicateurs depuis le résumé
  const completionPercentage = (summary.migratedFiles / summary.totalFiles) * 100;
  const errorPercentage = (summary.errorFiles / summary.totalFiles) * 100;
  
  // Tendance par rapport à la semaine précédente (simulation)
  const trendPercentage = trends.length >= 2 
    ? ((trends[trends.length - 1].filesProcessed - trends[trends.length - 2].filesProcessed) 
       / trends[trends.length - 2].filesProcessed) * 100
    : 0;

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Statistiques de Migration</Heading>

      {/* Résumé */}
      <StatGroup 
        mb={8} 
        p={4} 
        bg={cardBg} 
        borderRadius="lg" 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
      >
        <Stat p={3}>
          <StatLabel fontSize="md">Fichiers migrés</StatLabel>
          <StatNumber>{formatNumber(summary.migratedFiles)}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            {formatPercentage(completionPercentage)}
          </StatHelpText>
        </Stat>
        
        <Stat p={3}>
          <StatLabel fontSize="md">En attente</StatLabel>
          <StatNumber>{formatNumber(summary.pendingFiles)}</StatNumber>
          <StatHelpText>
            {formatPercentage((summary.pendingFiles / summary.totalFiles) * 100)} du total
          </StatHelpText>
        </Stat>
        
        <Stat p={3}>
          <StatLabel fontSize="md">Erreurs</StatLabel>
          <StatNumber>{formatNumber(summary.errorFiles)}</StatNumber>
          <StatHelpText>
            <StatArrow type={errorPercentage > 5 ? "increase" : "decrease"} />
            {formatPercentage(errorPercentage)}
          </StatHelpText>
        </Stat>
        
        <Stat p={3}>
          <StatLabel fontSize="md">Temps moyen</StatLabel>
          <StatNumber>{summary.averageCompletionTime} min</StatNumber>
          <StatHelpText>
            <StatArrow type={trendPercentage >= 0 ? "increase" : "decrease"} />
            {Math.abs(Math.round(trendPercentage))}% cette semaine
          </StatHelpText>
        </Stat>
      </StatGroup>

      {/* Graphiques */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        <Box 
          p={4} 
          bg={cardBg} 
          borderRadius="lg" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          height="300px"
        >
          {progressChartData && <Pie data={progressChartData} options={pieOptions} />}
        </Box>
        
        <Box 
          p={4} 
          bg={cardBg} 
          borderRadius="lg" 
          boxShadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          height="300px"
        >
          {trendChartData && <Line data={trendChartData} options={trendOptions} />}
        </Box>
      </SimpleGrid>

      <Box 
        p={4} 
        mb={8} 
        bg={cardBg} 
        borderRadius="lg" 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        height="350px"
      >
        {componentChartData && <Bar data={componentChartData} options={barOptions} />}
      </Box>

      {/* Tableau des vagues de migration */}
      <Box 
        p={4} 
        mb={8} 
        bg={cardBg} 
        borderRadius="lg" 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
      >
        <Heading size="md" mb={4}>Progrès des Vagues de Migration</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Vague</Th>
              <Th>Statut</Th>
              <Th>Progression</Th>
              <Th>Dates</Th>
            </Tr>
          </Thead>
          <Tbody>
            {waves.map((wave, index) => (
              <Tr key={index}>
                <Td fontWeight="medium">{wave.waveName}</Td>
                <Td>{renderWaveStatus(wave.status)}</Td>
                <Td>
                  <Flex align="center">
                    <Box flex="1" mr={4}>
                      <Progress 
                        value={(wave.completedFiles / wave.totalFiles) * 100} 
                        size="sm" 
                        colorScheme={
                          wave.status === 'completed' ? 'green' : 
                          wave.status === 'in-progress' ? 'blue' : 
                          'yellow'
                        } 
                        borderRadius="md"
                      />
                    </Box>
                    <Text fontWeight="medium">
                      {Math.round((wave.completedFiles / wave.totalFiles) * 100)}%
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color="gray.500">
                    {wave.completedFiles}/{wave.totalFiles} fichiers
                  </Text>
                </Td>
                <Td>
                  {wave.startDate && (
                    <>
                      <Text>Début: {formatDate(wave.startDate)}</Text>
                      {wave.endDate && <Text>Fin: {formatDate(wave.endDate)}</Text>}
                    </>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Dernière mise à jour */}
      <Text fontSize="sm" color="gray.500" textAlign="right">
        Dernière mise à jour: {formatDate(summary.lastMigration)}
      </Text>
    </Box>
  );
};

export default MigrationStats;