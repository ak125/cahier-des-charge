import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Title, Grid, Text } from "@tremor/react";

export const loader = async () => {
  // Ici vous pourriez charger des données réelles dans un environnement de production
  return json({
    stats: {
      totalMigrations: 124,
      activeMigrations: 8,
      successRate: 92,
      completedToday: 15
    }
  });
};

export default function Index() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Tableau de Bord MCP</h1>
        <p className="text-gray-600">
          Bienvenue sur le tableau de bord d'administration du pipeline MCP
        </p>
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card>
          <Text className="text-gray-500">Migrations Totales</Text>
          <Title className="text-2xl">{stats.totalMigrations}</Title>
        </Card>

        <Card>
          <Text className="text-gray-500">Migrations Actives</Text>
          <Title className="text-2xl">{stats.activeMigrations}</Title>
        </Card>

        <Card>
          <Text className="text-gray-500">Taux de Succès</Text>
          <Title className="text-2xl">{stats.successRate}%</Title>
        </Card>

        <Card>
          <Text className="text-gray-500">Terminées aujourd'hui</Text>
          <Title className="text-2xl">{stats.completedToday}</Title>
        </Card>
      </Grid>

      <div className="mb-6">
        <Card>
          <div className="p-4 text-center">
            <Title>Bienvenue dans le Tableau de Bord MCP</Title>
            <p className="mt-2 text-gray-600">
              Utilisez la navigation pour accéder aux différentes sections, notamment la page de métriques
              que nous venons de créer.
            </p>
            <div className="mt-4">
              <a href="/metrics" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Voir les Métriques
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}