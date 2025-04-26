import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Action qui déclenche l'exécution de l'audit du pipeline
 * 
 * Cette API peut être appelée avec une requête POST pour lancer manuellement
 * l'audit du pipeline MCP via le workflow GitHub Actions.
 */
export const action: ActionFunction = async ({ request }) => {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        // Option 1: Utiliser l'API GitHub pour déclencher le workflow (nécessite un token)
        // const response = await fetch(
        //   `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions/workflows/pipeline-mcp-audit.yml/dispatches`,
        //   {
        //     method: 'POST',
        //     headers: {
        //       'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        //       'Accept': 'application/vnd.github.v3+json',
        //       'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //       ref: 'main',
        //       inputs: {
        //         notification_level: 'normal'
        //       }
        //     })
        //   }
        // );

        // if (!response.ok) {
        //   throw new Error(`Échec du déclenchement du workflow: ${response.statusText}`);
        // }

        // Option 2: Exécuter localement les scripts d'audit (pour développement ou déploiements personnalisés)
        const { stdout, stderr } = await execAsync(
            "cd ../.. && npx ts-node agents/status-auditor.ts && npx ts-node agents/trace-verifier.ts"
        );

        // Copier les rapports vers le dossier public pour que le front-end puisse y accéder
        await execAsync(
            "mkdir -p public/data/pipeline-audit && " +
            "cp ../../status-audit-report.json public/data/pipeline-audit/ && " +
            "cp ../../trace-verification-report.json public/data/pipeline-audit/ && " +
            `echo '{"lastUpdated":"${new Date().toISOString()}"}' > public/data/pipeline-audit/last-update.json`
        );

        return json({
            success: true,
            message: "Audit du pipeline déclenché avec succès",
            stdout,
            stderr
        });
    } catch (error) {
        console.error("Erreur lors du déclenchement de l'audit:", error);

        return json({
            success: false,
            message: "Échec du déclenchement de l'audit du pipeline",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};