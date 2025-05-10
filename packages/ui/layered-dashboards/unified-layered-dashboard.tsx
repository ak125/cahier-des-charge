import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
/**
 * Tableau de bord unifié pour l'architecture à 3 couches
 * Intègre les 3 tableaux de bord spécifiques et permet de naviguer entre eux
 */
import React, { useEffect, useState } from 'react';
import {
  FiActivity,
  FiBriefcase,
  FiLayers,
  FiLink,
  FiRefreshCw,
  FiSearch,
  FiServer,
  FiUsers,
  FiZap,
} from 'react-icons/fi';

import {
  DecisionSeverity,
  DecisionType,
  governanceMesh,
} from ..@cahier-des-charge/coordination/src/utils/governance/governance-mesh';
import { TraceabilityService } from ..@cahier-des-charge/coordination/src/utils/traceability/traceability-service';
import AgentsDashboard from './agents-dashboard';
import BusinessDashboard from './business-dashboard';
// Importer les tableaux de bord spécifiques à chaque couche
import OrchestrationDashboard from './orchestration-dashboard';

// Interface pour les props du composant
interface UnifiedLayeredDashboardProps {
  className?: string;
  initialLayer?: 'orchestration' | 'agents' | 'business' | 'all';
}

// Tableau de bord unifié pour l'architecture à 3 couches
const UnifiedLayeredDashboard: React.FC<UnifiedLayeredDashboardProps> = ({
  className,
  initialLayer = 'all',
}) => {
  // États
  const [activeLayer, setActiveLayer] = useState<'orchestration' | 'agents' | 'business' | 'all'>(
    initialLayer
  );
  const [traceId, setTraceId] = useState<string>('');
  const [layerStatuses, setLayerStatuses] = useState({
    orchestration: { status: 'healthy', issues: 0 },
    agents: { status: 'healthy', issues: 0 },
    business: { status: 'healthy', issues: 0 },
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [connectionStats, setConnectionStats] = useState({
    orchestrationToAgents: { status: 'active', latency: '45ms' },
    agentsToBusiness: { status: 'active', latency: '67ms' },
    businessToOrchestration: { status: 'active', latency: '72ms' },
  });

  // Hooks pour les modales
  const traceModal = useDisclosure();
  const governanceModal = useDisclosure();

  // Couleurs
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const _textColor = useColorModeValue('gray.800', 'white');
  const headerBgColor = useColorModeValue('gray.50', 'gray.900');

  // Initialisation des services
  useEffect(() => {
    const initializeServices = async () => {
      // Initialiser le service de traçabilité
      const traceabilityService = new TraceabilityService({
        layer: 'all',
        enabled: true,
        idFormat: 'dashboard-{timestamp}-{random}',
        storageStrategy: 'hybrid',
      });

      // Générer un ID de traçabilité pour cette session de tableau de bord
      const newTraceId = await traceabilityService.generateTraceId();
      setTraceId(newTraceId);

      // Journaliser l'initialisation du tableau de bord
      await traceabilityService.logTrace({
        traceId: newTraceId,
        event: 'dashboard:initialized',
        context: { initialLayer },
        timestamp: new Date(),
        success: true,
      });

      // Initialiser le mesh de gouvernance
      await governanceMesh.initialize();
    };

    initializeServices();

    // Simuler des mises à jour périodiques de l'état des couches
    const intervalId = setInterval(refreshLayerStatuses, 10000);

    return () => clearInterval(intervalId);
  }, [initialLayer]);

  // Handler pour changer de couche active
  const handleLayerChange = async (layer: 'orchestration' | 'agents' | 'business' | 'all') => {
    setActiveLayer(layer);

    // Journaliser le changement de couche
    const traceabilityService = new TraceabilityService({
      layer: 'all',
      enabled: true,
    });

    await traceabilityService.logTrace({
      traceId,
      event: 'dashboard:layer:changed',
      context: { previousLayer: activeLayer, newLayer: layer },
      timestamp: new Date(),
      success: true,
    });

    // Prendre une décision de gouvernance lors du changement de couche
    const decision = await governanceMesh.makeDecision({
      type: DecisionType.DOMAIN_ROUTING,
      context: {
        previousLayer: activeLayer,
        targetLayer: layer,
        traceId,
      },
      severity: DecisionSeverity.LOW,
      layer: 'orchestration', // La décision est prise au niveau de l'orchestration
      requestedBy: 'unified-dashboard',
    });

    console.log('Layer change governance decision:', decision);
  };

  // Simuler une mise à jour des statuts des couches
  const refreshLayerStatuses = () => {
    // Dans un environnement réel, ces données proviendraient des API
    setLayerStatuses({
      orchestration: {
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        issues: Math.floor(Math.random() * 3),
      },
      agents: {
        status: Math.random() > 0.85 ? 'degraded' : 'healthy',
        issues: Math.floor(Math.random() * 4),
      },
      business: {
        status: Math.random() > 0.95 ? 'degraded' : 'healthy',
        issues: Math.floor(Math.random() * 2),
      },
    });

    // Mettre à jour les statistiques de connexion entre couches
    setConnectionStats({
      orchestrationToAgents: {
        status: Math.random() > 0.92 ? 'degraded' : 'active',
        latency: `${Math.floor(Math.random() * 100) + 10}ms`,
      },
      agentsToBusiness: {
        status: Math.random() > 0.95 ? 'degraded' : 'active',
        latency: `${Math.floor(Math.random() * 150) + 20}ms`,
      },
      businessToOrchestration: {
        status: Math.random() > 0.97 ? 'degraded' : 'active',
        latency: `${Math.floor(Math.random() * 120) + 30}ms`,
      },
    });

    setLastRefresh(new Date());
  };

  // Handler pour rafraîchir manuellement les données
  const handleRefresh = () => {
    refreshLayerStatuses();
  };

  // Formater le temps écoulé depuis le dernier rafraîchissement
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `il y a ${seconds} seconde${seconds !== 1 ? 's' : ''}`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} minute${minutes !== 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} heure${hours !== 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    return `il y a ${days} jour${days !== 1 ? 's' : ''}`;
  };

  // Afficher le statut d'une couche
  const renderLayerStatus = (layer: 'orchestration' | 'agents' | 'business') => {
    const status = layerStatuses[layer];
    const color = status.status === 'healthy' ? 'green' : 'orange';

    return (
      <Flex alignItems="center">
        <Badge colorScheme={color} mr={2}>
          {status.status.toUpperCase()}
        </Badge>
        {status.issues > 0 && (
          <Text fontSize="sm" color="orange.500">
            {status.issues} problème{status.issues > 1 ? 's' : ''}
          </Text>
        )}
      </Flex>
    );
  };

  // Rendu du header avec les indicateurs de statut par couche
  const renderHeader = () => {
    return (
      <Box bg={headerBgColor} p={4} borderRadius="md" mb={4} boxShadow="sm">
        <Flex justifyContent="space-between" alignItems="center" mb={3}>
          <Heading size="lg" display="flex" alignItems="center">
            <Icon as={FiLayers} mr={2} />
            Tableau de bord à 3 couches
            <Tag size="sm" colorScheme="blue" ml={3} borderRadius="full">
              <TagLeftIcon as={FiActivity} />
              <TagLabel>Version 1.0</TagLabel>
            </Tag>
          </Heading>

          <ButtonGroup size="sm" variant="outline">
            <Tooltip label="Afficher les traces d'exécution">
              <Button leftIcon={<FiSearch />} onClick={traceModal.onOpen}>
                Traces
              </Button>
            </Tooltip>
            <Tooltip label="Configurer la gouvernance">
              <Button leftIcon={<FiLink />} onClick={governanceModal.onOpen}>
                Gouvernance
              </Button>
            </Tooltip>
            <Tooltip label="Actualiser les données">
              <Button leftIcon={<FiRefreshCw />} onClick={handleRefresh}>
                Actualiser
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Flex>

        <Text color="gray.500" mb={4}>
          Supervision unifiée des 3 couches de l'architecture avec circuit breaker multicouche et
          traçabilité centralisée.
        </Text>

        <Divider mb={4} />

        <HStack spacing={8} justifyContent="space-between">
          <Flex align="center">
            <Icon as={FiServer} fontSize="xl" color="teal.500" mr={2} />
            <Box>
              <Text fontWeight="bold">Orchestration</Text>
              {renderLayerStatus('orchestration')}
            </Box>
          </Flex>

          <Flex align="center">
            <Icon as={FiUsers} fontSize="xl" color="purple.500" mr={2} />
            <Box>
              <Text fontWeight="bold">Agents</Text>
              {renderLayerStatus('agents')}
            </Box>
          </Flex>

          <Flex align="center">
            <Icon as={FiBriefcase} fontSize="xl" color="orange.500" mr={2} />
            <Box>
              <Text fontWeight="bold">Métier</Text>
              {renderLayerStatus('business')}
            </Box>
          </Flex>

          <Box>
            <Text fontSize="xs" color="gray.500">
              Dernière mise à jour: {formatTimeAgo(lastRefresh)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Trace ID: {traceId.substring(0, 8)}...
            </Text>
          </Box>
        </HStack>
      </Box>
    );
  };

  // Rendu des interconnexions entre couches
  const renderLayerConnections = () => {
    return (
      <Box
        bg={bgColor}
        p={4}
        borderRadius="md"
        mb={4}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={3}>
          Interconnexions entre couches
        </Heading>

        <HStack spacing={4} justifyContent="space-between" mb={2}>
          <Box flex="1">
            <Flex align="center">
              <Icon as={FiZap} mr={2} color="blue.500" />
              <Text fontWeight="medium">Orchestration → Agents</Text>
            </Flex>
            <Flex justify="space-between" mt={1}>
              <Badge
                colorScheme={
                  connectionStats.orchestrationToAgents.status === 'active' ? 'green' : 'orange'
                }
              >
                {connectionStats.orchestrationToAgents.status.toUpperCase()}
              </Badge>
              <Text fontSize="sm">Latence: {connectionStats.orchestrationToAgents.latency}</Text>
            </Flex>
          </Box>

          <Box flex="1">
            <Flex align="center">
              <Icon as={FiZap} mr={2} color="blue.500" />
              <Text fontWeight="medium">Agents → Métier</Text>
            </Flex>
            <Flex justify="space-between" mt={1}>
              <Badge
                colorScheme={
                  connectionStats.agentsToBusiness.status === 'active' ? 'green' : 'orange'
                }
              >
                {connectionStats.agentsToBusiness.status.toUpperCase()}
              </Badge>
              <Text fontSize="sm">Latence: {connectionStats.agentsToBusiness.latency}</Text>
            </Flex>
          </Box>

          <Box flex="1">
            <Flex align="center">
              <Icon as={FiZap} mr={2} color="blue.500" />
              <Text fontWeight="medium">Métier → Orchestration</Text>
            </Flex>
            <Flex justify="space-between" mt={1}>
              <Badge
                colorScheme={
                  connectionStats.businessToOrchestration.status === 'active' ? 'green' : 'orange'
                }
              >
                {connectionStats.businessToOrchestration.status.toUpperCase()}
              </Badge>
              <Text fontSize="sm">Latence: {connectionStats.businessToOrchestration.latency}</Text>
            </Flex>
          </Box>
        </HStack>
      </Box>
    );
  };

  // Rendu du contenu principal en fonction de la couche active
  const renderContent = () => {
    if (activeLayer === 'all') {
      return (
        <Tabs
          variant="enclosed"
          colorScheme="blue"
          isFitted
          onChange={(index) => {
            const layers: Array<'orchestration' | 'agents' | 'business'> = [
              'orchestration',
              'agents',
              'business',
            ];
            if (index >= 0 && index < layers.length) {
              handleLayerChange(layers[index]);
            }
          }}
        >
          <TabList mb={4}>
            <Tab>
              <Flex align="center">
                <Icon as={FiServer} mr={2} />
                Orchestration
              </Flex>
            </Tab>
            <Tab>
              <Flex align="center">
                <Icon as={FiUsers} mr={2} />
                Agents
              </Flex>
            </Tab>
            <Tab>
              <Flex align="center">
                <Icon as={FiBriefcase} mr={2} />
                Métier
              </Flex>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <OrchestrationDashboard onLayerChange={handleLayerChange} />
            </TabPanel>
            <TabPanel p={0}>
              <AgentsDashboard onLayerChange={handleLayerChange} />
            </TabPanel>
            <TabPanel p={0}>
              <BusinessDashboard onLayerChange={handleLayerChange} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      );
    }

    // Afficher un tableau de bord spécifique
    switch (activeLayer) {
      case 'orchestration':
        return <OrchestrationDashboard onLayerChange={handleLayerChange} />;
      case 'agents':
        return <AgentsDashboard onLayerChange={handleLayerChange} />;
      case 'business':
        return <BusinessDashboard onLayerChange={handleLayerChange} />;
      default:
        return null;
    }
  };

  // Rendu de la modale de traces
  const renderTraceModal = () => {
    return (
      <Modal isOpen={traceModal.isOpen} onClose={traceModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex" alignItems="center">
            <Icon as={FiSearch} mr={2} />
            Traces d'exécution
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              ID de traçabilité actuel: <Code>{traceId}</Code>
            </Text>

            <Box bg="gray.50" p={4} borderRadius="md" maxHeight="400px" overflowY="auto">
              <pre style={{ fontSize: '12px' }}>
                {/* Remplacer par des données réelles de traces */}
                {JSON.stringify(
                  [
                    {
                      traceId,
                      event: 'dashboard:initialized',
                      timestamp: new Date().toISOString(),
                      layer: 'all',
                      context: { initialLayer },
                    },
                    {
                      traceId,
                      event: 'dashboard:layer:changed',
                      timestamp: new Date().toISOString(),
                      layer: 'orchestration',
                      context: { previousLayer: 'all', newLayer: 'orchestration' },
                    },
                  ],
                  null,
                  2
                )}
              </pre>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={traceModal.onClose}>
              Fermer
            </Button>
            <Button variant="ghost">Télécharger les traces</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // Rendu de la modale de gouvernance
  const renderGovernanceModal = () => {
    return (
      <Modal isOpen={governanceModal.isOpen} onClose={governanceModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex" alignItems="center">
            <Icon as={FiLink} mr={2} />
            Configuration de la gouvernance
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Configuration du mesh de gouvernance reliant les 3 couches de l'architecture.
            </Text>

            <Box mb={4}>
              <Heading size="sm" mb={2}>
                Règles de décision actives
              </Heading>
              <Box bg="gray.50" p={4} borderRadius="md" maxHeight="200px" overflowY="auto">
                <pre style={{ fontSize: '12px' }}>
                  {/* Remplacer par des données réelles de gouvernance */}
                  {JSON.stringify(
                    [
                      {
                        id: 'rule-1',
                        name: 'Isolation des workflows défaillants',
                        type: 'circuit-breaker-action',
                        priority: 10,
                        scope: { layers: ['orchestration'] },
                      },
                      {
                        id: 'rule-2',
                        name: 'Limitation de débit des agents',
                        type: 'resource-allocation',
                        priority: 8,
                        scope: { layers: ['agents'] },
                      },
                      {
                        id: 'rule-3',
                        name: 'Validation des migrations de domaine',
                        type: 'quality-gate',
                        priority: 9,
                        scope: { layers: ['business', 'orchestration'] },
                      },
                    ],
                    null,
                    2
                  )}
                </pre>
              </Box>
            </Box>

            <Box>
              <Heading size="sm" mb={2}>
                Conflits de gouvernance
              </Heading>
              <Box bg="gray.50" p={4} borderRadius="md" maxHeight="200px" overflowY="auto">
                <pre style={{ fontSize: '12px' }}>
                  {/* Remplacer par des données réelles de conflits */}
                  {JSON.stringify(
                    [
                      {
                        id: 'conflict-1',
                        conflictType: 'contradictory',
                        decisions: [
                          { decision: 'proceed', layer: 'agents' },
                          { decision: 'abort', layer: 'orchestration' },
                        ],
                        status: 'detected',
                        severity: 'high',
                      },
                    ],
                    null,
                    2
                  )}
                </pre>
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={governanceModal.onClose}>
              Fermer
            </Button>
            <Button variant="ghost">Configurer les règles</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // Import du composant Code pour la modale de traces
  const Code = ({ children }: { children: React.ReactNode }) => (
    <Box as="span" bg="gray.100" p={1} borderRadius="md" fontFamily="mono" fontSize="sm">
      {children}
    </Box>
  );

  // Rendu principal
  return (
    <Box className={className}>
      {renderHeader()}
      {renderLayerConnections()}
      {renderContent()}
      {renderTraceModal()}
      {renderGovernanceModal()}
    </Box>
  );
};

export default UnifiedLayeredDashboard;
