// packages/mcp-agents/orchestration/cleanup/disk-watcher.ts

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface DiskInfo {
    filesystem: string;
    size: string;
    used: string;
    avail: string;
    usePercentage: number; // Pourcentage d'utilisation du disque
    mountPoint: string;
}

export async function run() {
    console.log("🔍 MCP Trigger: Disk Space Watcher...");

    try {
        // Récupération des informations d'espace disque
        const diskInfo = getDiskInfo();

        // Filtrer les systèmes de fichiers réels (exclure les systèmes virtuels)
        const realFilesystems = diskInfo.filter(
            info => !info.filesystem.includes("tmpfs") &&
                !info.filesystem.includes("devtmpfs") &&
                !info.mountPoint.startsWith("/dev") &&
                !info.mountPoint.startsWith("/sys") &&
                !info.mountPoint.startsWith("/proc")
        );

        // Trouver les points de montage critiques (>95% d'utilisation)
        const criticalMounts = realFilesystems.filter(info => info.usePercentage > 95);

        // Trouver les points de montage avec avertissement (>85% d'utilisation)
        const warningMounts = realFilesystems.filter(info => info.usePercentage > 85 && info.usePercentage <= 95);

        // Générer le rapport
        const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
        const reportDir = path.resolve("audit");

        // S'assurer que le répertoire d'audit existe
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportPath = path.join(reportDir, `disk-usage-report-${timestamp}.json`);

        const report = {
            timestamp: new Date().toISOString(),
            totalFilesystems: realFilesystems.length,
            criticalCount: criticalMounts.length,
            warningCount: warningMounts.length,
            criticalMounts,
            warningMounts,
            allFilesystems: realFilesystems
        };

        // Écrire le rapport dans le fichier
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Afficher les résultats
        if (criticalMounts.length > 0) {
            console.log(`⚠️ ALERTE CRITIQUE: ${criticalMounts.length} point(s) de montage avec espace disque critique:`);
            criticalMounts.forEach(mount => {
                console.log(`  - ${mount.mountPoint}: ${mount.usePercentage}% utilisé (${mount.used} sur ${mount.size})`);
            });

            // Retourner un code qui indique une action nécessaire
            return {
                status: "critical",
                needsAction: true,
                mountPoints: criticalMounts.map(m => m.mountPoint),
                report: reportPath
            };
        } else if (warningMounts.length > 0) {
            console.log(`⚠️ AVERTISSEMENT: ${warningMounts.length} point(s) de montage avec espace disque limité:`);
            warningMounts.forEach(mount => {
                console.log(`  - ${mount.mountPoint}: ${mount.usePercentage}% utilisé (${mount.used} sur ${mount.size})`);
            });

            return {
                status: "warning",
                needsAction: false,
                mountPoints: warningMounts.map(m => m.mountPoint),
                report: reportPath
            };
        } else {
            console.log("✅ Tous les systèmes de fichiers ont un espace disque suffisant.");
            return {
                status: "ok",
                needsAction: false,
                report: reportPath
            };
        }
    } catch (error) {
        console.error("❌ Erreur lors de la vérification de l'espace disque:", error);
        return {
            status: "error",
            error: String(error),
            needsAction: false
        };
    }
}

function getDiskInfo(): DiskInfo[] {
    // Exécuter la commande df pour obtenir l'utilisation du disque
    const output = execSync("df -h", { encoding: "utf-8" });
    const lines = output.split("\n").filter(Boolean);

    // Sauter la ligne d'en-tête
    const dataLines = lines.slice(1);

    return dataLines.map(line => {
        const parts = line.split(/\s+/);

        // df -h output format: Filesystem Size Used Avail Use% Mounted on
        const filesystem = parts[0];
        const size = parts[1];
        const used = parts[2];
        const avail = parts[3];

        // Convertir le pourcentage d'utilisation en nombre (enlever le '%')
        const usePercentage = parseInt(parts[4].replace("%", ""));

        const mountPoint = parts[5];

        return {
            filesystem,
            size,
            used,
            avail,
            usePercentage,
            mountPoint
        };
    });
}