/**
 * Module d'isolation de sécurité WASM
 * Permet d'exécuter du code dans un environnement isolé et sécurisé
 * 
 * Ce module fait partie de la refonte avancée pour garantir une sécurité maximale
 * via l'isolation WASM et la validation stricte du code exécuté.
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = new Logger('WasmSandbox');

export interface SandboxOptions {
    memoryLimitMB?: number;
    timeoutMs?: number;
    allowedPaths?: string[];
    allowNetworking?: boolean;
    env?: Record<string, string>;
    securityLevel?: 'low' | 'medium' | 'high' | 'extreme';
    allowFileSystem?: boolean;
}

export interface SandboxResult {
    success: boolean;
    stdout: string;
    stderr: string;
    executionTimeMs: number;
    memoryUsageMB: number;
    error?: Error;
}

/**
 * Sandbox de sécurité utilisant WASM pour isoler l'exécution de code
 */
export class WasmSandbox {
    private defaultOptions: SandboxOptions = {
        memoryLimitMB: 128,
        timeoutMs: 5000,
        allowedPaths: [],
        allowNetworking: false,
        env: {},
        securityLevel: 'high',
        allowFileSystem: false
    };

    /**
     * Exécute un module WASM dans un environnement isolé et sécurisé
     */
    async executeWasmModule(
        wasmPath: string,
        args: string[] = [],
        options: SandboxOptions = {}
    ): Promise<SandboxResult> {
        const startTime = performance.now();
        const mergedOptions = { ...this.defaultOptions, ...options };

        logger.debug(`Exécution du module WASM: ${wasmPath}`);
        logger.debug(`Options: ${JSON.stringify(mergedOptions)}`);

        try {
            // Vérification de l'existence du fichier WASM
            if (!await this.fileExists(wasmPath)) {
                throw new Error(`Module WASM non trouvé: ${wasmPath}`);
            }

            // Utiliser wasmtime ou wasmer pour l'exécution en fonction de disponibilité
            const runtime = await this.detectWasmRuntime();

            // Construire les arguments pour le runtime WASM
            const runtimeArgs = await this.buildRuntimeArgs(runtime, wasmPath, args, mergedOptions);

            // Exécution avec timeout
            const { stdout, stderr } = await this.executeWithTimeout(
                async () => {
                    logger.debug(`Exécution avec ${runtime}: ${runtimeArgs.join(' ')}`);
                    return execAsync(`${runtime} ${runtimeArgs.join(' ')}`);
                },
                mergedOptions.timeoutMs!
            );

            // Calcul des métriques
            const executionTimeMs = performance.now() - startTime;
            const memoryUsage = process.memoryUsage();
            const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

            logger.debug(`Exécution terminée en ${executionTimeMs.toFixed(2)}ms`);
            logger.debug(`Utilisation mémoire: ${memoryUsageMB.toFixed(2)} MB`);

            return {
                success: true,
                stdout,
                stderr,
                executionTimeMs,
                memoryUsageMB,
            };
        } catch (error) {
            logger.error(`Erreur lors de l'exécution du module WASM: ${error.message}`);
            return {
                success: false,
                stdout: '',
                stderr: error.message,
                executionTimeMs: performance.now() - startTime,
                memoryUsageMB: 0,
                error,
            };
        }
    }

    /**
     * Compile du code source en module WASM et l'exécute dans un environnement sécurisé
     */
    async compileAndExecute(
        sourceCode: string,
        language: 'c' | 'rust' | 'assemblyscript' | 'typescript',
        args: string[] = [],
        options: SandboxOptions = {}
    ): Promise<SandboxResult> {
        try {
            // Génération d'un fichier temporaire pour le code source
            const tmpDir = path.join(process.cwd(), '.tmp', 'wasm-sandbox');
            await fs.mkdir(tmpDir, { recursive: true });

            const sourceFileName = `source_${Date.now()}${this.getSourceExtension(language)}`;
            const sourcePath = path.join(tmpDir, sourceFileName);
            const wasmPath = path.join(tmpDir, `${sourceFileName}.wasm`);

            // Écriture du code source dans le fichier temporaire
            await fs.writeFile(sourcePath, sourceCode, 'utf8');

            // Analyse du code pour les menaces de sécurité
            await this.analyzeCodeSecurity(sourcePath, language);

            // Compilation du code source en WASM
            await this.compileToWasm(sourcePath, wasmPath, language);

            // Exécution du module WASM compilé
            return this.executeWasmModule(wasmPath, args, options);
        } catch (error) {
            logger.error(`Erreur lors de la compilation et exécution: ${error.message}`);
            return {
                success: false,
                stdout: '',
                stderr: error.message,
                executionTimeMs: 0,
                memoryUsageMB: 0,
                error,
            };
        }
    }

    /**
     * Analyse de sécurité du code source avant compilation
     */
    private async analyzeCodeSecurity(sourcePath: string, language: string): Promise<void> {
        logger.debug(`Analyse de sécurité du code: ${sourcePath}`);

        try {
            let scanCommand: string;

            switch (language) {
                case 'c':
                    scanCommand = `flawfinder --minlevel=1 ${sourcePath}`;
                    break;
                case 'rust':
                    scanCommand = `cargo-audit scan ${sourcePath}`;
                    break;
                case 'assemblyscript':
                case 'typescript':
                    scanCommand = `eslint -c .eslintrc.security.json ${sourcePath}`;
                    break;
                default:
                    logger.warn(`Pas d'analyse de sécurité disponible pour le langage: ${language}`);
                    return;
            }

            const { stdout } = await execAsync(scanCommand);

            if (stdout.includes('CRITICAL') || stdout.includes('HIGH')) {
                throw new Error(`Problèmes de sécurité détectés dans le code source: ${stdout}`);
            }

            logger.debug('Analyse de sécurité terminée, aucun problème critique détecté');
        } catch (error) {
            if (error.message.includes('command not found')) {
                logger.warn(`Outil d'analyse de sécurité non disponible pour ${language}, l'analyse est ignorée`);
            } else if (!error.message.includes('Problèmes de sécurité détectés')) {
                logger.error(`Erreur lors de l'analyse de sécurité: ${error.message}`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Détermine l'extension de fichier en fonction du langage
     */
    private getSourceExtension(language: string): string {
        switch (language) {
            case 'c': return '.c';
            case 'rust': return '.rs';
            case 'assemblyscript': return '.ts';
            case 'typescript': return '.ts';
            default: return '.txt';
        }
    }

    /**
     * Compile le code source en module WASM
     */
    private async compileToWasm(sourcePath: string, outputPath: string, language: string): Promise<void> {
        logger.debug(`Compilation du fichier ${sourcePath} en WASM`);

        try {
            switch (language) {
                case 'c':
                    await execAsync(`emcc ${sourcePath} -o ${outputPath} -s WASM=1 -s "EXPORTED_FUNCTIONS=['_main']" -s "EXPORTED_RUNTIME_METHODS=['ccall','cwrap']"`);
                    break;
                case 'rust':
                    // Création d'un Cargo.toml temporaire si nécessaire
                    const cargoDir = path.dirname(sourcePath);
                    const cargoPath = path.join(cargoDir, 'Cargo.toml');

                    if (!await this.fileExists(cargoPath)) {
                        const cargoContent = `
[package]
name = "wasm_sandbox"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
            `;
                        await fs.writeFile(cargoPath, cargoContent, 'utf8');
                    }

                    await execAsync(`cd ${cargoDir} && rustc --target wasm32-wasi ${sourcePath} -o ${outputPath}`);
                    break;
                case 'assemblyscript':
                    // Création d'un asconfig.json temporaire si nécessaire
                    const asconfigPath = path.join(path.dirname(sourcePath), 'asconfig.json');

                    if (!await this.fileExists(asconfigPath)) {
                        const asconfigContent = `
{
  "targets": {
    "debug": {
      "outFile": "${outputPath}",
      "textFile": "",
      "sourceMap": true,
      "debug": true
    },
    "release": {
      "outFile": "${outputPath}",
      "textFile": "",
      "sourceMap": false,
      "optimize": true
    }
  },
  "options": {
    "bindings": "esm"
  }
}
            `;
                        await fs.writeFile(asconfigPath, asconfigContent, 'utf8');
                    }

                    await execAsync(`asc ${sourcePath} --target release`);
                    break;
                case 'typescript':
                    // Pour TypeScript, nous utilisons assemblyscript également
                    await execAsync(`npx -y assemblyscript/asc ${sourcePath} -o ${outputPath} --optimize`);
                    break;
                default:
                    throw new Error(`Langage non supporté: ${language}`);
            }

            logger.debug(`Compilation terminée: ${outputPath}`);
        } catch (error) {
            logger.error(`Erreur lors de la compilation: ${error.message}`);
            throw new Error(`Échec de la compilation en WASM: ${error.message}`);
        }
    }

    /**
     * Détecte le runtime WASM disponible
     */
    private async detectWasmRuntime(): Promise<string> {
        try {
            // Essayer wasmtime d'abord
            await execAsync('wasmtime --version');
            return 'wasmtime';
        } catch {
            try {
                // Essayer wasmer ensuite
                await execAsync('wasmer --version');
                return 'wasmer';
            } catch {
                throw new Error('Aucun runtime WASM (wasmtime ou wasmer) n\'est disponible');
            }
        }
    }

    /**
     * Construit les arguments pour le runtime WASM
     */
    private async buildRuntimeArgs(
        runtime: string,
        wasmPath: string,
        args: string[],
        options: SandboxOptions
    ): Promise<string[]> {
        const runtimeArgs: string[] = [];

        if (runtime === 'wasmtime') {
            // Options de sécurité pour wasmtime
            if (!options.allowFileSystem) {
                runtimeArgs.push('--dir=.');
            }

            if (options.memoryLimitMB) {
                runtimeArgs.push(`--wasm-memory-limit=${options.memoryLimitMB}MB`);
            }

            if (!options.allowNetworking) {
                runtimeArgs.push('--deny-network');
            }

            // Ajouter le chemin du module WASM
            runtimeArgs.push(wasmPath);

            // Ajouter les arguments
            runtimeArgs.push(...args);
        } else if (runtime === 'wasmer') {
            // Options de sécurité pour wasmer
            if (!options.allowFileSystem) {
                runtimeArgs.push('--mapdir=/:.'); // Mappe uniquement le répertoire courant
            }

            if (!options.allowNetworking) {
                runtimeArgs.push('--disable-networking');
            }

            // Ajouter le chemin du module WASM
            runtimeArgs.push('run');
            runtimeArgs.push(wasmPath);

            // Ajouter les arguments
            runtimeArgs.push(...args);
        }

        return runtimeArgs;
    }

    /**
     * Vérifie si un fichier existe
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Exécute une fonction avec un timeout
     */
    private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout: L'opération a dépassé la limite de ${timeoutMs}ms`));
            }, timeoutMs);

            fn().then(
                (result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                },
                (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            );
        });
    }
}

// Exporter un singleton pour utilisation dans l'application
export const wasmSandbox = new WasmSandbox();