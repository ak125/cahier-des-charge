import { Box, Center, ChakraProvider, Spinner, Text, extendTheme } from '@chakra-ui/react';
/**
 * Point d'entrée pour l'application des tableaux de bord en couches
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { TraceabilityService } from ..@cahier-des-charge/coordination/src/utils/traceability/traceability-service';
import UnifiedLayeredDashboard from './unified-layered-dashboard';

// Configuration du thème Chakra UI avec des couleurs personnalisées pour les tableaux de bord
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f6ff',
      100: '#b3e0ff',
      200: '#80cbff',
      300: '#4db5ff',
      400: '#1aa0ff',
      500: '#0091ff',
      600: '#0077cc',
      700: '#005c9e',
      800: '#004270',
      900: '#002843',
    },
    // Couleurs pour les différentes couches d'architecture
    orchestration: {
      50: '#e6f9f7',
      100: '#ccf3ef',
      500: '#1dbfb3',
      700: '#16968c',
      900: '#0f6d65',
    },
    agents: {
      50: '#f3e6ff',
      100: '#e6ccff',
      500: '#8c33ff',
      700: '#7029cc',
      900: '#4d1c8c',
    },
    business: {
      50: '#fff2e6',
      100: '#ffe6cc',
      500: '#ff8c33',
      700: '#cc7029',
      900: '#8c4d1c',
    },
  },
  components: {
    Badge: {
      variants: {
        'circuit-open': {
          bg: 'red.100',
          color: 'red.800',
        },
        'circuit-closed': {
          bg: 'green.100',
          color: 'green.800',
        },
        'circuit-half': {
          bg: 'yellow.100',
          color: 'yellow.800',
        },
      },
    },
    // Styles personnalisés pour des composants spécifiques
    Button: {
      variants: {
        'layer-switch': {
          borderRadius: 'full',
          fontWeight: 'normal',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

/**
 * Application principale des tableaux de bord
 */
const DashboardApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [_config, setConfig] = useState<any>(null);

  // Effet pour charger la configuration du tableau de bord
  useEffect(() => {
    const loadDashboardConfig = async () => {
      try {
        setIsLoading(true);

        // Tenter de charger la configuration depuis le fichier
        let dashboardConfig;
        try {
          const response = await fetch('/config/dashboards/dashboard-config.json');
          if (response.ok) {
            dashboardConfig = await response.json();
          } else {
            throw new Error(`Erreur lors du chargement de la configuration: ${response.status}`);
          }
        } catch (fetchError) {
          console.warn(
            'Impossible de charger la configuration, utilisation des valeurs par défaut',
            fetchError
          );
          // Configuration par défaut si le fichier n'est pas disponible
          dashboardConfig = {
            api: {
              baseUrl: '/api',
              timeout: 30000,
              retryAttempts: 3,
            },
            dashboards: {
              refreshInterval: 30,
              traceability: {
                enabled: true,
                storageType: 'memory',
              },
              circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                resetTimeout: 30000,
              },
              governance: {
                enabled: true,
                conflictResolution: 'majority',
              },
            },
            layers: {
              orchestration: { enabled: true },
              agents: { enabled: true },
              business: { enabled: true },
            },
          };
        }

        // Initialiser le service de traçabilité
        const traceabilityService = new TraceabilityService({
          layer: 'all',
          enabled: dashboardConfig.dashboards.traceability.enabled,
          idFormat: 'dashboard-{timestamp}-{random}',
          storageStrategy: dashboardConfig.dashboards.traceability.storageType,
        });

        // Journaliser le démarrage de l'application
        await traceabilityService.logTrace({
          traceId: await traceabilityService.generateTraceId(),
          event: 'dashboard:app:started',
          context: { config: dashboardConfig },
          timestamp: new Date(),
          success: true,
        });

        // Mettre à jour l'état avec la configuration chargée
        setConfig(dashboardConfig);
        setIsLoading(false);
      } catch (err) {
        console.error("Erreur lors de l'initialisation de l'application:", err);
        setError(
          `Erreur lors de l'initialisation: ${err instanceof Error ? err.message : String(err)}`
        );
        setIsLoading(false);
      }
    };

    loadDashboardConfig();
  }, []);

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <Center height="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s" />
          <Text mt={4} fontSize="lg">
            Chargement des tableaux de bord...
          </Text>
        </Box>
      </Center>
    );
  }

  // Afficher l'erreur si elle existe
  if (error) {
    return (
      <Center height="100vh">
        <Box textAlign="center" p={6} bg="red.50" borderRadius="md" maxW="md">
          <Text color="red.500" fontSize="lg" fontWeight="bold">
            Erreur lors du chargement des tableaux de bord
          </Text>
          <Text mt={2}>{error}</Text>
          <Text mt={4} fontSize="sm">
            Veuillez vérifier la configuration et réessayer.
          </Text>
        </Box>
      </Center>
    );
  }

  // Rendu principal de l'application
  return (
    <Box p={4}>
      <UnifiedLayeredDashboard initialLayer="all" />
    </Box>
  );
};

// Rendu de l'application dans le DOM
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Élément racine non trouvé dans le DOM');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <DashboardApp />
    </ChakraProvider>
  </React.StrictMode>
);
