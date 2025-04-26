import { Trigger, customEvent } from @trigger.dev/sdkstructure-agent";
import { Github, GithubWorkflow } from @trigger.devDoDoDoDoDoDotgithubstructure-agent";
import { Client as TemporalClient } from @temporalio/clientstructure-agent";
import Redis from ioredisstructure-agent";

// Configuration du client Temporal
const getTemporalClient = async () => {
  return await TemporalClient.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
  });
};

// Configuration du client Redis
const getRedisClient = () => {
  return new Redis(process.env.REDIS_URL || "redis://localhost:6379");
};

// Configuration GitHub
constDoDoDoDoDoDotgithub = new Github({
  id: DoDoDoDoDoDotgithubDoDotmcp-integration",
  token: process.env.GITHUB_TOKEN || "yourDoDoDoDoDoDotgithub-token",
});

// Définition du workflow Trigger.dev
export constDoDoDoDoDoDotgithubToMcpTrigger = new Trigger({
  id: DoDoDoDoDoDotgithub-PhpToRemix-migration",
  name: "GitHub PHP to Remix Migration",
  on:DoDoDoDoDoDotgithub.events.repo.push,
  run: async (event, ctx) => {
    // Filtrer pour ne prendre en compte que les commits sur la branche principale
    if (event.payload.ref !== "refs/heads/main" && event.payload.ref !== "refs/heads/master") {
      return {
        status: "skipped",
        reason: "Only run on main/master branch pushes",
      };
    }

    // Récupérer les fichiers PHP ajoutés ou modifiés
    const phpFiles = event.payload.commits
      .flatMap((commit: any) => [
        ...(commit.added || []),
        ...(commit.modified || []),
      ])
      .filter((file: string) => file.endsWith(".php"));

    if (phpFiles.length === 0) {
      return {
        status: "skipped",
        reason: "No PHP files were added or modified",
      };
    }

    // Journaliser les fichiers détectés
    await ctx.logger.info(`Detected ${phpFiles.length} PHP files to migrate`);
    await ctx.logger.info("Files:", { files: phpFiles });

    // Initialiser le client Temporal
    const temporalClient = await getTemporalClient();
    const redisClient = getRedisClient();

    // Traiter chaque fichier PHP
    const migrationResults = [];
    for (const file of phpFiles) {
      try {
        // Vérifier si le fichier est déjà en cours de migration
        const isProcessing = await redisClient.get(`processing:${file}`);
        if (isProcessing) {
          await ctx.logger.info(`File ${file} is already being processed, skipping`);
          continue;
        }

        // Marquer le fichier comme en cours de traitement
        await redisClient.set(`processing:${file}`, "true", "EX", 3600); // expire après 1h

        // Lancer le workflow Temporal
        const handle = await temporalClient.workflow.start("phpToRemixMigrationWorkflow", {
          args: [{ file, createPR: true, generateTests: true, qaThreshold: 90 }],
          taskQueue: "migration-queue",
          workflowId: `migrate-${file.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}`,
        });

        await ctx.logger.info(`Started migration workflow for ${file}`, {
          workflowId: handle.workflowId,
          runId: handle.firstExecutionRunId,
        });

        // Stocker l'ID du workflow dans Redis pour la traçabilité
        await redisClient.set(
          `migration:${file}`,
          JSON.stringify({
            workflowId: handle.workflowId,
            runId: handle.firstExecutionRunId,
            startTime: new Date().toISOString(),
          }),
          "EX",
          86400 // expire après 24h
        );

        migrationResults.push({
          file,
          workflowId: handle.workflowId,
          status: "started",
        });
      } catch (error) {
        await ctx.logger.error(`Error starting workflow for ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Libérer le marqueur de traitement en cas d'erreur
        await redisClient.del(`processing:${file}`);

        migrationResults.push({
          file,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fermer la connexion Redis
    await redisClient.quit();

    return {
      status: "success",
      migrations: migrationResults,
    };
  },
});

// Workflow pour la migration en CI/CD
export const ciTrigger = new Trigger({
  id: "ci-migration-verification",
  name: "CI Migration Verification",
  on:DoDoDoDoDoDotgithub.events.pullRequest.opened,
  run: async (event, ctx) => {
    // Vérifier si c'est une PR de migration
    const prTitle = event.payload.pull_request.title.toLowerCase();
    if (!prTitle.includes("migration") && !prTitle.includes("php to remix")) {
      return {
        status: "skipped",
        reason: "Not a migration PR",
      };
    }

    // Récupérer les fichiers modifiés dans la PR
    const changedFiles = awaitDoDoDoDoDoDotgithub
      .withClient({
        owner: event.payload.repository.owner.login,
        repo: event.payload.repository.name,
        headers: {
          accept: "application/vndDoDoDoDoDoDotgithub.v3+json",
        },
      })
      .request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
        owner: event.payload.repository.owner.login,
        repo: event.payload.repository.name,
        pull_number: event.payload.pull_request.number,
      });

    // Filtrer pour ne garder que les fichiers Remix (TSX)
    const remixFiles = changedFiles.data
      .filter((file: any) => file.filename.endsWith(".tsx"))
      .map((file: any) => file.filename);

    if (remixFiles.length === 0) {
      return {
        status: "skipped",
        reason: "No Remix files found in PR",
      };
    }

    await ctx.logger.info(`Detected ${remixFiles.length} Remix files to validate`);

    // Lancer la validation CI pour chaque fichier
    const validationResults = [];
    const redisClient = getRedisClient();

    for (const file of remixFiles) {
      try {
        // Chercher le fichier QA correspondant
        const baseFileName = file.replace(/.*\//, "").replace(".tsx", "");
        const qaFile = `${baseFileName}.php.qa.json`;

        // Publier un événement de validation
        await customEvent("migration.validate").publish({
          file,
          qaFile,
          prNumber: event.payload.pull_request.number,
          repository: {
            owner: event.payload.repository.owner.login,
            name: event.payload.repository.name,
          },
        });

        validationResults.push({
          file,
          status: "validation_started",
        });
      } catch (error) {
        await ctx.logger.error(`Error triggering validation for ${file}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        validationResults.push({
          file,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fermer la connexion Redis
    await redisClient.quit();

    return {
      status: "success",
      validations: validationResults,
    };
  },
});

// Trigger sur l'événement personnalisé de validation
export const migrationValidationTrigger = new Trigger({
  id: "migration-validation-trigger",
  name: "Migration Validation Trigger",
  on: customEvent("migration.validate"),
  run: async (event, ctx) => {
    const { file, qaFile, prNumber, repository } = event;

    await ctx.logger.info(`Validating migration for ${file}`);

    try {
      // Créer un commentaire sur la PR avec les détails de validation
      awaitDoDoDoDoDoDotgithub.withClient({
        owner: repository.owner,
        repo: repository.name,
      }).request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner: repository.owner,
        repo: repository.name,
        issue_number: prNumber,
        body: `## Validation en cours pour ${file}\n\nLes résultats de validation seront ajoutés à ce commentaire.`,
      });

      // Initialiser le client Temporal pour lancer la validation
      const temporalClient = await getTemporalClient();

      // Lancer le workflow de validation
      const handle = await temporalClient.workflow.start("validateMigrationWorkflow", {
        args: [{ file, qaFile, prNumber, repository }],
        taskQueue: "validation-queue",
        workflowId: `validate-${file.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}`,
      });

      await ctx.logger.info(`Started validation workflow for ${file}`, {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
      });

      return {
        status: "success",
        validation: {
          file,
          workflowId: handle.workflowId,
          status: "started",
        },
      };
    } catch (error) {
      await ctx.logger.error(`Error during validation for ${file}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});