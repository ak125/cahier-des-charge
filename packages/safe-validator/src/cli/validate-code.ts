#!/usr/bin/env node
/**
 * Outil en ligne de commande pour valider et signer du code généré par IA
 */
import { safeMigrationValidator } from '../core/SafeMigrationValidator';
import { validateAndSignFile, validateAndSignCode } from '../utils/validate-and-sign';
import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Configuration du CLI
program
    .name('ai-safe-validator')
    .description('Valide et signe du code généré par IA pour garantir sa sécurité et conformité')
    .version('1.0.0');

// Commande pour valider un fichier
program
    .command('validate-file')
    .description('Valide un fichier selon les critères de sécurité, conformité et sémantique')
    .argument('<file-path>', 'Chemin du fichier à valider')
    .option('--fileType <type>', 'Type de fichier (ts, js, json, prisma, etc.)')
    .option('--report', 'Génère un rapport de validation détaillé')
    .option('--output-dir <path>', 'Répertoire de sortie pour les rapports')
    .option('--sign', 'Signe le fichier après validation réussie')
    .option('--agent-id <id>', 'ID de l\'agent qui a généré le code (requis pour la signature)', 'unknown-agent')
    .option('--run-id <id>', 'ID unique de l\'exécution (requis pour la signature)', `run-${Date.now()}`)
    .option('--skip-semantic', 'Saute la validation sémantique')
    .action(async (filePath, options) => {
        try {
            console.log(`🔍 Validation du fichier: ${filePath}`);

            if (options.sign) {
                // Valider et signer
                const result = await validateAndSignFile(filePath, {
                    agentId: options.agentId,
                    runId: options.runId,
                    outputDir: options.outputDir,
                    generateReport: options.report,
                    fileType: options.fileType
                });

                if (result.valid && result.signed) {
                    console.log('✅ Fichier validé et signé avec succès!');
                    console.log(`📝 Signature: ${result.signatureInfo?.signaturePath}`);

                    if (result.reportPath) {
                        console.log(`📋 Rapport généré: ${result.reportPath}`);
                    }

                    process.exit(0);
                } else if (result.valid) {
                    console.log('✅ Fichier validé avec succès, mais la signature a échoué');
                    process.exit(0);
                } else {
                    console.error('❌ La validation du fichier a échoué');
                    process.exit(1);
                }
            } else {
                // Validation simple
                const validationReport = await safeMigrationValidator.getValidationReport(
                    fs.readFileSync(filePath, 'utf8'),
                    {
                        path: filePath,
                        fileType: options.fileType
                    }
                );

                if (validationReport.success) {
                    console.log('✅ Fichier validé avec succès!');

                    if (options.report) {
                        const reportPath = path.join(
                            options.outputDir || process.cwd(),
                            `validation-report-${path.basename(filePath)}.md`
                        );

                        // Sauvegarder le rapport
                        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
                        fs.writeFileSync(reportPath, validationReport.report, 'utf8');

                        console.log(`📋 Rapport généré: ${reportPath}`);
                    }

                    process.exit(0);
                } else {
                    console.error('❌ La validation du fichier a échoué');

                    // Afficher un résumé des problèmes
                    console.error(validationReport.report.split('\n').slice(0, 20).join('\n') + '\n...');

                    process.exit(1);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            process.exit(1);
        }
    });

// Commande pour valider du code depuis stdin
program
    .command('validate')
    .description('Valide du code source depuis stdin')
    .option('--fileType <type>', 'Type de fichier (ts, js, json, prisma, etc.)', 'ts')
    .option('--report', 'Génère un rapport de validation détaillé')
    .option('--output-dir <path>', 'Répertoire de sortie pour les rapports')
    .option('--sign', 'Signe le code après validation réussie')
    .option('--agent-id <id>', 'ID de l\'agent qui a généré le code (requis pour la signature)', 'unknown-agent')
    .option('--run-id <id>', 'ID unique de l\'exécution (requis pour la signature)', `run-${Date.now()}`)
    .action(async (options) => {
        // Lire le code depuis stdin
        let code = '';
        process.stdin.setEncoding('utf8');

        process.stdin.on('readable', () => {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                code += chunk;
            }
        });

        process.stdin.on('end', async () => {
            try {
                console.log(`🔍 Validation du code (${code.length} caractères)`);

                if (options.sign) {
                    // Valider et signer
                    const result = await validateAndSignCode(code, {
                        agentId: options.agentId,
                        runId: options.runId,
                        outputDir: options.outputDir,
                        generateReport: options.report,
                        fileType: options.fileType
                    });

                    if (result.valid && result.signed) {
                        console.log('✅ Code validé et signé avec succès!');
                        console.log(`📝 Signature: ${result.signatureInfo?.signaturePath}`);

                        if (result.reportPath) {
                            console.log(`📋 Rapport généré: ${result.reportPath}`);
                        }

                        process.exit(0);
                    } else if (result.valid) {
                        console.log('✅ Code validé avec succès, mais la signature a échoué');
                        process.exit(0);
                    } else {
                        console.error('❌ La validation du code a échoué');
                        process.exit(1);
                    }
                } else {
                    // Validation simple
                    const validationReport = await safeMigrationValidator.getValidationReport(
                        code,
                        { fileType: options.fileType }
                    );

                    if (validationReport.success) {
                        console.log('✅ Code validé avec succès!');

                        if (options.report) {
                            const reportPath = path.join(
                                options.outputDir || process.cwd(),
                                `validation-report-${validationReport.codeHash.substring(0, 8)}.md`
                            );

                            // Sauvegarder le rapport
                            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
                            fs.writeFileSync(reportPath, validationReport.report, 'utf8');

                            console.log(`📋 Rapport généré: ${reportPath}`);
                        }

                        process.exit(0);
                    } else {
                        console.error('❌ La validation du code a échoué');
                        console.log(validationReport.report);
                        process.exit(1);
                    }
                }
            } catch (error) {
                console.error('❌ Erreur lors de la validation:', error);
                process.exit(1);
            }
        });
    });

// Exécuter le programme
program.parse(process.argv);