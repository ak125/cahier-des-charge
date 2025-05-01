import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import {
  Button,
  Card,
  Divider,
  Grid,
  Select,
  SelectItem,
  Switch,
  Text,
  TextInput,
  Title,
} from '@tremor/react';

interface PluginSetting {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  options: Record<string, any>;
}

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export const loader = async () => {
  // Simuler des paramètres pour la démonstration
  // Dans un environnement réel, ces données seraient chargées depuis la base de données ou la configuration
  const pluginSettings: PluginSetting[] = [
    {
      id: 'metrics-collector',
      name: 'Collecteur de Métriques',
      enabled: true,
      priority: 1,
      options: {
        collectSystemMetrics: true,
        collectAgentMetrics: true,
        retentionDays: 30,
        detailedLogs: false,
      },
    },
    {
      id: 'agent-health-checker',
      name: 'Vérificateur de Santé des Agents',
      enabled: true,
      priority: 2,
      options: {
        checkInterval: 60,
        alertThreshold: 3,
        autoRestart: true,
      },
    },
    {
      id: 'auto-scaling',
      name: "Mise à l'échelle Automatique",
      enabled: false,
      priority: 3,
      options: {
        minInstances: 1,
        maxInstances: 5,
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
      },
    },
  ];

  const systemSettings: SystemSetting[] = [
    {
      id: 'migrationConcurrency',
      name: 'Concurrence des Migrations',
      description: "Nombre maximum de migrations pouvant s'exécuter en parallèle",
      value: 4,
      type: 'number',
    },
    {
      id: 'defaultTimeout',
      name: "Délai d'expiration par défaut",
      description: "Délai d'expiration par défaut pour les opérations (en secondes)",
      value: 300,
      type: 'number',
    },
    {
      id: 'notificationsEnabled',
      name: 'Notifications',
      description: "Activer les notifications d'événements",
      value: true,
      type: 'boolean',
    },
    {
      id: 'loggingLevel',
      name: 'Niveau de journalisation',
      description: 'Niveau de détail des logs du système',
      value: 'info',
      type: 'select',
      options: ['error', 'warn', 'info', 'debug', 'trace'],
    },
    {
      id: 'apiEndpoint',
      name: 'Point de terminaison API',
      description: "URL de l'API MCP",
      value: 'http://localhost:3001/api',
      type: 'string',
    },
  ];

  return json({ pluginSettings, systemSettings });
};

export default function SettingsPage() {
  const { pluginSettings, systemSettings } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Paramètres du Système</h1>
        <p className="text-gray-600">Configurez les paramètres du pipeline MCP et des plugins</p>
      </div>

      {/* Paramètres système */}
      <Card className="mb-8">
        <Title className="mb-4">Paramètres Généraux</Title>

        <Form method="post" className="space-y-6">
          <Grid numItemsMd={2} className="gap-6">
            {systemSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Text>{setting.name}</Text>
                <div className="text-xs text-gray-500 mb-1">{setting.description}</div>

                {setting.type === 'string' && (
                  <TextInput
                    name={setting.id}
                    defaultValue={setting.value as string}
                    placeholder={`Entrez ${setting.name.toLowerCase()}`}
                  />
                )}

                {setting.type === 'number' && (
                  <TextInput
                    name={setting.id}
                    type="number"
                    defaultValue={setting.value as number}
                  />
                )}

                {setting.type === 'boolean' && (
                  <Switch name={setting.id} defaultChecked={setting.value as boolean} />
                )}

                {setting.type === 'select' && setting.options && (
                  <Select name={setting.id} defaultValue={setting.value as string}>
                    {setting.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            ))}
          </Grid>

          <div className="flex justify-end">
            <Button variant="secondary" className="mr-2">
              Réinitialiser
            </Button>
            <Button type="submit" color="blue">
              Enregistrer
            </Button>
          </div>
        </Form>
      </Card>

      {/* Paramètres des plugins */}
      <Title className="mb-4">Configuration des Plugins</Title>

      {pluginSettings.map((plugin) => (
        <Card key={plugin.id} className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title>{plugin.name}</Title>
              <Text className="text-sm text-gray-500">ID: {plugin.id}</Text>
            </div>

            <Switch defaultChecked={plugin.enabled} name={`plugin_${plugin.id}_enabled`} />
          </div>

          <Divider />

          <div className="mt-4">
            <Form method="post" className="space-y-4">
              <Grid numItemsMd={2} className="gap-4">
                <div>
                  <Text className="mb-1">Priorité</Text>
                  <TextInput
                    type="number"
                    name={`plugin_${plugin.id}_priority`}
                    defaultValue={plugin.priority}
                  />
                </div>

                {Object.entries(plugin.options).map(([key, value]) => (
                  <div key={key}>
                    <Text className="mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Text>

                    {typeof value === 'boolean' ? (
                      <Switch name={`plugin_${plugin.id}_${key}`} defaultChecked={value} />
                    ) : typeof value === 'number' ? (
                      <TextInput
                        type="number"
                        name={`plugin_${plugin.id}_${key}`}
                        defaultValue={value}
                      />
                    ) : (
                      <TextInput
                        name={`plugin_${plugin.id}_${key}`}
                        defaultValue={value as string}
                      />
                    )}
                  </div>
                ))}
              </Grid>

              <div className="flex justify-end">
                <Button type="submit" size="sm" color="blue">
                  Mettre à jour
                </Button>
              </div>
            </Form>
          </div>
        </Card>
      ))}

      {/* Actions supplémentaires */}
      <Card className="mt-6">
        <Title className="mb-4">Actions Système</Title>

        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <Button color="red" variant="secondary" className="w-full">
            Purger les Caches
          </Button>

          <Button color="amber" variant="secondary" className="w-full">
            Redémarrer les Agents
          </Button>

          <Button color="indigo" variant="secondary" className="w-full">
            Reconfigurer les Plugins
          </Button>

          <Button color="green" variant="secondary" className="w-full">
            Tester la Configuration
          </Button>
        </Grid>
      </Card>
    </div>
  );
}
