/**
 * Composant de base pour les tableaux de bord à 3 couches
 * Fournit la structure commune et les fonctionnalités de base pour tous les tableaux de bord
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Heading,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  ButtonGroup,
  Select,
  FormControl,
  FormLabel,
  useColorModeValue,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Stack,
  HStack,
  VStack,
  Icon,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Skeleton,
  Grid,
  GridItem
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiSettings,
  FiLayers,
  FiChevronDown,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';

// Types for charts
type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'radar';

// Chart component
interface ChartProps {
  id: string;
  title: string;
  type: ChartType;
  data: any;
  height?: string;
  width?: string;
}

// Widget size options
type WidgetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Status for metrics
type MetricStatus = 'success' | 'warning' | 'error' | 'info';

// Metric item in a widget
interface Metric {
  id: string;
  name: string;
  value: string | number;
  status?: MetricStatus;
  trend?: number;
  unit?: string;
  description?: string;
  dataSourceId?: string;
}

// Chart definition for a widget
interface WidgetChart {
  id: string;
  title: string;
  type: ChartType;
  data: any;
  dataSourceId?: string;
  refreshInterval?: number;
}

// Types of widgets
type WidgetType = 'status' | 'chart' | 'list' | 'metric' | 'table' | 'custom';

// Widget definition
interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  description?: string;
  size: WidgetSize;
  metrics?: Metric[];
  chart?: WidgetChart;
  dataSourceId?: string;
}

// Section of the dashboard
interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  widgets: Widget[];
}

// Configuration for data sources
interface DataSource {
  id: string;
  name: string;
  url: string;
  refreshInterval?: number;
}

// Filter option
interface FilterOption {
  value: string;
  label: string;
}

// Filter definition
interface DashboardFilter {
  id: string;
  name: string;
  options: FilterOption[];
  defaultValue: string;
}

// Action definition
interface DashboardAction {
  id: string;
  name: string;
  handler: () => Promise<void>;
  colorScheme?: string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

// Complete dashboard configuration
export interface DashboardConfig {
  title: string;
  description?: string;
  layer: 'orchestration' | 'agents' | 'business' | 'all';
  refreshInterval?: number; // in seconds
  dataSources?: DataSource[];
  sections: DashboardSection[];
  filters?: DashboardFilter[];
  actions?: DashboardAction[];
}

// Props for the BaseDashboard component
interface BaseDashboardProps {
  config: DashboardConfig;
  onLayerChange?: (layer: 'orchestration' | 'agents' | 'business' | 'all') => void;
  debug?: boolean;
  className?: string;
}

/**
 * Composant Chart factice pour simuler les graphiques
 */
const Chart: React.FC<ChartProps> = ({ id, title, type, data, height = '200px', width = '100%' }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      id={id}
      height={height}
      width={width}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      position="relative"
    >
      <Text fontWeight="bold" mb={2}>{title}</Text>
      <Text fontSize="sm" color="gray.500">Chart Type: {type}</Text>
      <Flex 
        alignItems="center" 
        justifyContent="center" 
        height="calc(100% - 50px)"
        fontSize="sm"
        color="gray.500"
        textAlign="center"
      >
        <Text>
          [Simulation de graphique {type}]<br />
          {JSON.stringify(data).length > 2 
            ? 'Données chargées' 
            : 'En attente des données...'}
        </Text>
      </Flex>
    </Box>
  );
};

/**
 * Composant principal BaseDashboard
 */
const BaseDashboard: React.FC<BaseDashboardProps> = ({
  config,
  onLayerChange,
  debug = false,
  className
}) => {
  // États
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    // Initialiser les filtres avec leurs valeurs par défaut
    const initialFilters: Record<string, string> = {};
    config.filters?.forEach(filter => {
      initialFilters[filter.id] = filter.defaultValue;
    });
    return initialFilters;
  });

  // Couleurs pour le thème
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simuler un chargement de données depuis les sources
      const newData: Record<string, any> = {};
      
      // Pour la démo, on génère des données aléatoires
      if (config.dataSources) {
        for (const source of config.dataSources) {
          // Dans un cas réel, on ferait un fetch ici
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (Math.random() > 0.95) {
            throw new Error(`Erreur de chargement pour la source: ${source.name}`);
          }

          newData[source.id] = {
            timestamp: new Date(),
            values: Array(5).fill(0).map(() => ({
              id: Math.random().toString(36).substring(7),
              value: Math.floor(Math.random() * 100),
              label: `Item ${Math.floor(Math.random() * 1000)}`,
              status: Math.random() > 0.7 ? 'success' : Math.random() > 0.4 ? 'warning' : 'error'
            }))
          };
        }
      }

      setData(newData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [config.dataSources]);

  // Effet pour charger les données au chargement initial et périodiquement
  useEffect(() => {
    refreshData();

    // Configurer le rafraîchissement périodique si un intervalle est défini
    let intervalId: NodeJS.Timeout | null = null;
    if (config.refreshInterval && config.refreshInterval > 0) {
      intervalId = setInterval(refreshData, config.refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshData, config.refreshInterval]);

  // Handler pour changer les filtres
  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value
    }));

    // Dans un cas réel, on rafraîchirait les données avec les nouveaux filtres
    refreshData();
  };

  // Rendu du header du tableau de bord
  const renderHeader = () => {
    return (
      <Box 
        bg={headerBgColor} 
        p={4} 
        borderRadius="md" 
        mb={4}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Flex justifyContent="space-between" alignItems="center" mb={config.description ? 2 : 0}>
          <Heading size="lg" color={textColor}>{config.title}</Heading>
          
          <ButtonGroup size="sm">
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={refreshData}
              isLoading={loading}
            >
              Actualiser
            </Button>
            
            {/* Filtres */}
            {config.filters && config.filters.length > 0 && (
              <Menu>
                <MenuButton as={Button} rightIcon={<Icon as={FiChevronDown} />} leftIcon={<Icon as={FiFilter} />}>
                  Filtres
                </MenuButton>
                <MenuList>
                  {config.filters.map(filter => (
                    <Box key={filter.id} p={3}>
                      <FormControl size="sm">
                        <FormLabel fontSize="sm">{filter.name}</FormLabel>
                        <Select
                          size="sm"
                          value={activeFilters[filter.id] || filter.defaultValue}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        >
                          {filter.options.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </MenuList>
              </Menu>
            )}
            
            {/* Actions */}
            {config.actions && config.actions.length > 0 && (
              <Menu>
                <MenuButton as={Button} rightIcon={<Icon as={FiChevronDown} />} leftIcon={<Icon as={FiSettings} />}>
                  Actions
                </MenuButton>
                <MenuList>
                  {config.actions.map(action => (
                    <MenuItem
                      key={action.id}
                      onClick={() => action.handler().catch(err => console.error(`Error executing action ${action.id}:`, err))}
                      isDisabled={action.disabled}
                      icon={action.icon || undefined}
                    >
                      {action.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            )}
            
            {/* Navigation entre couches */}
            {onLayerChange && (
              <Menu>
                <MenuButton as={Button} rightIcon={<Icon as={FiChevronDown} />} leftIcon={<Icon as={FiLayers} />}>
                  Couches
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => onLayerChange('all')}>
                    Toutes les couches
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={() => onLayerChange('orchestration')}>
                    Orchestration
                  </MenuItem>
                  <MenuItem onClick={() => onLayerChange('agents')}>
                    Agents
                  </MenuItem>
                  <MenuItem onClick={() => onLayerChange('business')}>
                    Métier
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </ButtonGroup>
        </Flex>
        
        {/* Description */}
        {config.description && (
          <Text color={subtitleColor}>{config.description}</Text>
        )}
        
        {/* Info sur le dernier rafraîchissement */}
        <Text fontSize="xs" color={subtitleColor} mt={2}>
          Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
        </Text>
      </Box>
    );
  };

  // Rendu des messages d'erreur
  const renderErrors = () => {
    if (!error) return null;
    
    return (
      <Alert status="error" borderRadius="md" mb={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  };

  // Rendu d'un widget métrique simple
  const renderMetricsWidget = (widget: Widget) => {
    if (!widget.metrics || widget.metrics.length === 0) {
      return (
        <Box p={4} textAlign="center">
          <Text color={subtitleColor}>Aucune métrique disponible</Text>
        </Box>
      );
    }

    const metrics = widget.metrics;
    const numMetrics = metrics.length;
    const columns = numMetrics <= 3 ? numMetrics : numMetrics <= 6 ? 3 : 4;

    return (
      <SimpleGrid columns={columns} spacing={4} p={4}>
        {metrics.map(metric => {
          const statusColor = metric.status 
            ? metric.status === 'success' 
              ? 'green.500' 
              : metric.status === 'warning' 
                ? 'orange.500' 
                : metric.status === 'error' 
                  ? 'red.500' 
                  : 'blue.500'
            : undefined;

          return (
            <Box key={metric.id}>
              <Stat>
                <StatLabel color={statusColor || textColor}>
                  {metric.name}
                </StatLabel>
                <StatNumber color={statusColor || textColor} fontSize="2xl">
                  {loading ? <Skeleton height="30px" width="80%" /> : metric.value}
                  {metric.unit ? ` ${metric.unit}` : ''}
                </StatNumber>
                {metric.trend !== undefined && (
                  <StatHelpText color={metric.trend > 0 ? 'green.500' : metric.trend < 0 ? 'red.500' : undefined}>
                    {metric.trend > 0 ? `↑ ${metric.trend}%` : metric.trend < 0 ? `↓ ${Math.abs(metric.trend)}%` : '−'}
                  </StatHelpText>
                )}
              </Stat>
            </Box>
          );
        })}
      </SimpleGrid>
    );
  };

  // Rendu d'un widget graphique
  const renderChartWidget = (widget: Widget) => {
    if (!widget.chart) {
      return (
        <Box p={4} textAlign="center">
          <Text color={subtitleColor}>Aucun graphique configuré</Text>
        </Box>
      );
    }

    const height = 
      widget.size === 'xs' ? '100px' :
      widget.size === 'sm' ? '150px' :
      widget.size === 'md' ? '200px' :
      widget.size === 'lg' ? '300px' : '400px';

    return (
      <Box p={4}>
        <Chart
          id={widget.chart.id}
          title={widget.chart.title}
          type={widget.chart.type}
          data={widget.chart.dataSourceId && data[widget.chart.dataSourceId] ? data[widget.chart.dataSourceId] : {}}
          height={height}
        />
      </Box>
    );
  };

  // Rendu d'un widget liste
  const renderListWidget = (widget: Widget) => {
    // À implémenter dans une version réelle
    return (
      <Box p={4}>
        <Text color={subtitleColor}>Widget liste (à implémenter)</Text>
      </Box>
    );
  };

  // Rendu d'un widget
  const renderWidget = (widget: Widget) => {
    let widgetContent;

    switch (widget.type) {
      case 'status':
        widgetContent = renderMetricsWidget(widget);
        break;
      case 'chart':
        widgetContent = renderChartWidget(widget);
        break;
      case 'list':
        widgetContent = renderListWidget(widget);
        break;
      default:
        widgetContent = (
          <Box p={4} textAlign="center">
            <Text color={subtitleColor}>Type de widget non supporté: {widget.type}</Text>
          </Box>
        );
    }

    // Taille du widget
    const colSpan = 
      widget.size === 'xs' ? 1 :
      widget.size === 'sm' ? 2 :
      widget.size === 'md' ? 3 :
      widget.size === 'lg' ? 4 : 6;
    
    const rowSpan =
      widget.size === 'xs' ? 1 :
      widget.size === 'sm' ? 1 :
      widget.size === 'md' ? widget.type === 'chart' ? 2 : 1 :
      widget.size === 'lg' ? 2 : 3;

    return (
      <GridItem colSpan={colSpan} rowSpan={rowSpan}>
        <Card
          bg={cardBg}
          boxShadow="sm"
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          height="100%"
          display="flex"
          flexDirection="column"
        >
          <CardHeader p={4} pb={0}>
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="sm" color={textColor}>{widget.title}</Heading>
              
              {widget.description && (
                <Tooltip label={widget.description} placement="top">
                  <Box as="span">
                    <Icon as={FiInfo} color={subtitleColor} />
                  </Box>
                </Tooltip>
              )}
            </Flex>
          </CardHeader>
          
          <CardBody p={0} flex="1">
            {loading && (
              <Box position="absolute" top="0" left="0" right="0" bottom="0" zIndex="1">
                <Flex height="100%" alignItems="center" justifyContent="center" bg="rgba(255,255,255,0.5)">
                  <Spinner size="sm" />
                </Flex>
              </Box>
            )}
            {widgetContent}
          </CardBody>
          
          {debug && widget.dataSourceId && (
            <CardFooter p={2} bg={headerBgColor} fontSize="xs" color={subtitleColor}>
              <Text>Source: {widget.dataSourceId}</Text>
            </CardFooter>
          )}
        </Card>
      </GridItem>
    );
  };

  // Rendu d'une section
  const renderSection = (section: DashboardSection, index: number) => {
    return (
      <Box key={section.id} mb={index < config.sections.length - 1 ? 6 : 0}>
        <Flex mb={4} alignItems="center">
          <Box>
            <Heading size="md" color={textColor}>{section.title}</Heading>
            {section.description && (
              <Text color={subtitleColor} fontSize="sm">
                {section.description}
              </Text>
            )}
          </Box>
        </Flex>

        <Grid
          templateColumns="repeat(6, 1fr)"
          gap={4}
          autoRows="minmax(100px, auto)"
        >
          {section.widgets.map(widget => renderWidget(widget))}
        </Grid>
      </Box>
    );
  };

  // Rendu principal
  return (
    <Box className={className} bg={bgColor} p={4} borderRadius="lg">
      {renderHeader()}
      {renderErrors()}
      
      <VStack spacing={6} align="stretch">
        {config.sections.map((section, index) => renderSection(section, index))}
      </VStack>
    </Box>
  );
};

export default BaseDashboard;