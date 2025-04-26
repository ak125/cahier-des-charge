/**
 * Configuration de l'agent CI-Tester
 */
module.exports = {
  // Personnalisation des chemins de sortie
  outputWorkflowPath: '.github/workflows/ci-migration.yml',
  outputReportPath: 'reports/ci_check_report.md',
  outputLastRunPath: 'reports/ci_last_run.json',
  
  // Tests personnalisés à ajouter au pipeline CI
  customTests: [
    {
      name: "Vérification des secrets",
      command: "npx detect-secrets scan --baseline .secrets.baseline",
      description: "Détection de secrets exposés dans le code",
      required: false,
      category: "security"
    },
    {
      name: "Test d'accessibilité",
      command: "npx pa11y-ci",
      description: "Vérification de l'accessibilité web",
      required: false,
      category: "quality"
    },
    {
      name: "Analyse de bundle",
      command: "npx webpack-bundle-analyzer stats.json --mode static --report report.html",
      description: "Analyse de la taille du bundle JavaScript",
      required: false,
      category: "performance"
    }
  ],
  
  // Configuration des services pour GitHub Actions
  services: {
    postgres: {
      enabled: true,
      version: "14",
      user: "postgres",
      password: "postgres",
      database: "test"
    },
    redis: {
      enabled: true,
      version: "6"
    }
  },
  
  // Branches sur lesquelles exécuter le workflow
  branches: {
    push: ["main", "develop", "release/*"],
    pullRequest: ["main", "develop"]
  },
  
  // Configuration des notifications
  notifications: {
    pullRequest: {
      enabled: true,
      successMessage: "✅ CI Pipeline a réussi! Tous les tests et vérifications sont passés.",
      failureMessage: "❌ CI Pipeline a échoué! Veuillez consulter les logs pour plus de détails.",
      labels: {
        success: ["ci:passed"],
        failure: ["ci:failed"]
      }
    },
    slack: {
      enabled: true,
      webhook: "SLACK_WEBHOOK_URL",
      channel: "#ci-notifications"
    }
  }
};