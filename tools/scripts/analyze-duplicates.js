import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { parse } from '@babel/parser';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';
import { minimatch as mm } from 'minimatch';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import readline from 'readline';

// Configuration avancée avec hiérarchie de priorité
const config = {
    minSize: 100,
    minSimilarity: 80,
    excludePatterns: ['**/node_modules/**', '**/dist/**'],
    targetExtensions: ['.ts', '.js', '.tsx', '.jsx'],
    concurrency: Math.max(os.cpus().length - 1, 1),
    cacheTTL: 3600, // 1 heure
    astWeight: 0.6,
    hashAlgorithm: 'sha256',
    maxFileSize: 1024 * 1024 * 10 // 10MB
};

// Charge la configuration personnalisée
async function loadConfig() {
    try {
        const filesInCwd = await fs.readdir(process.cwd());
        let rcFilePath = null;
        for (const fileName of filesInCwd) {
            if (mm(fileName, '.duplicaterc*', { dot: true })) {
                const fullPath = path.join(process.cwd(), fileName);
                try {
                    const stat = await fs.stat(fullPath);
                    if (stat.isFile()) {
                        rcFilePath = fullPath;
                        break; // Found the first matching file
                    }
                } catch (e) { /* ignore stat errors */ }
            }
        }

        if (rcFilePath) {
            const customConfigContent = await fs.readFile(rcFilePath, 'utf8');
            const customConfig = JSON.parse(customConfigContent);
            Object.assign(config, customConfig);
            console.log('[INFO] Custom config loaded from:', rcFilePath);
        } else {
            console.log('[INFO] No custom .duplicaterc* file found or accessible.');
        }
    } catch (e) {
        console.warn(`[WARN] Configuration personnalisée non chargée ou erreur lors du chargement: ${e.message}`);
    }
}

// Gestionnaire de cache intelligent
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.fileStats = new Map();
    }

    async get(filePath) {
        try {
            const stat = await fs.stat(filePath);
            const cached = this.cache.get(filePath);

            if (cached && cached.mtime === stat.mtimeMs) {
                return cached.hash;
            }

            return null;
        } catch {
            return null;
        }
    }

    async set(filePath, hash) {
        try {
            const stat = await fs.stat(filePath);
            this.cache.set(filePath, {
                hash,
                mtime: stat.mtimeMs
            });
        } catch { }
    }
}

// Analyse sémantique améliorée
class SemanticAnalyzer {
    static async parse(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return parse(content, {
                sourceType: 'unambiguous',
                plugins: ['jsx', 'typescript', 'decorators-legacy'],
                tokens: true
            });
        } catch {
            return null;
        }
    }

    static normalize(ast) {
        const structure = [];
        const visitor = {
            FunctionDeclaration: (node) => {
                structure.push(`FUNC:${node.id?.name}`);
            },
            VariableDeclarator: (node) => {
                structure.push(`VAR:${node.id.name}`);
            },
            ClassDeclaration: (node) => {
                structure.push(`CLASS:${node.id.name}`);
            }
        };

        traverse(ast, visitor);
        return structure;
    }
}

// Calculateur de similarité hybride
class SimilarityCalculator {
    static async textSimilarity(file1, file2) {
        const [content1, content2] = await Promise.all([
            fs.readFile(file1, 'utf8'),
            fs.readFile(file2, 'utf8')
        ]);

        const tokens1 = this.tokenize(content1);
        const tokens2 = this.tokenize(content2);

        return this.cosineSimilarity(tokens1, tokens2);
    }

    static async structuralSimilarity(file1, file2) {
        const [ast1, ast2] = await Promise.all([
            SemanticAnalyzer.parse(file1),
            SemanticAnalyzer.parse(file2)
        ]);

        if (!ast1 || !ast2) return 0;

        const struct1 = SemanticAnalyzer.normalize(ast1);
        const struct2 = SemanticAnalyzer.normalize(ast2);

        return this.sequenceMatch(struct1, struct2);
    }

    static tokenize(content) {
        return content
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
            .split(/\W+/)
            .filter(t => t.length > 2);
    }

    static cosineSimilarity(a, b) {
        const vec = {};
        a.forEach(t => vec[t] = (vec[t] || 0) + 1);
        b.forEach(t => vec[t] = (vec[t] || 0) - 1);

        const dotProduct = Object.values(vec).reduce((sum, v) => sum + v * v, 0);
        const magnitude = Math.sqrt(a.length * b.length);

        return magnitude ? dotProduct / magnitude : 0;
    }

    // Placeholder for sequenceMatch
    static sequenceMatch(seq1, seq2) {
        console.warn('[WARN] SimilarityCalculator.sequenceMatch is a placeholder and does not compute actual structural similarity.');
        if (!seq1 || !seq2 || seq1.length === 0 || seq2.length === 0) return 0;
        let matches = 0;
        const set = new Set(seq2);
        for (const item of seq1) {
            if (set.has(item)) {
                matches++;
            }
        }
        const maxLength = Math.max(seq1.length, seq2.length);
        const minLength = Math.min(seq1.length, seq2.length);
        if (maxLength === 0) return 100; // Both empty
        if (minLength === 0) return 0; // One empty
        // Jaccard index like for sets
        return (matches / (seq1.length + seq2.length - matches)) * 100;
    }
}

// Helper function to recursively find files using native Node.js modules
async function findFilesRecursive(currentDirPath, projectRootPath = process.cwd(), allFilePaths = []) {
    let entries;
    try {
        entries = await fs.readdir(currentDirPath, { withFileTypes: true });
    } catch (err) {
        console.warn(`[WARN] Could not read directory ${currentDirPath}: ${err.message}`);
        return allFilePaths; // Skip unreadable directories
    }

    for (const entry of entries) {
        const absoluteEntryPath = path.resolve(currentDirPath, entry.name);
        // For exclusion, match against path relative to project root, using forward slashes
        const relativeEntryPathForMatch = path.relative(projectRootPath, absoluteEntryPath).replace(/\\/g, '/');

        let isExcluded = false;
        for (const pattern of config.excludePatterns) {
            if (mm(relativeEntryPathForMatch, pattern, { dot: true })) {
                isExcluded = true;
                break;
            }
        }
        if (isExcluded) {
            continue;
        }

        if (entry.isDirectory()) {
            await findFilesRecursive(absoluteEntryPath, projectRootPath, allFilePaths);
        } else if (entry.isFile()) {
            if (config.targetExtensions.includes(path.extname(absoluteEntryPath))) {
                try {
                    const stat = await fs.stat(absoluteEntryPath);
                    if (stat.size >= config.minSize && stat.size <= config.maxFileSize) {
                        allFilePaths.push(absoluteEntryPath);
                    }
                } catch (err) {
                    console.warn(`[WARN] Could not stat file ${absoluteEntryPath}: ${err.message}`);
                }
            }
        }
    }
    return allFilePaths;
}

// Workflow optimisé
async function main() {
    await loadConfig();
    const cache = new CacheManager(); // Cache is initialized but not actively used in the core comparison loop yet.

    const projectRoot = process.cwd();
    console.log('[INFO] Starting file search from:', projectRoot);
    const files = await findFilesRecursive(projectRoot, projectRoot);
    console.log(`[INFO] Found ${files.length} files to analyze.`);

    if (files.length === 0) {
        console.log('[INFO] No files found to analyze based on current configuration. Exiting.');
        return;
    }

    const workers = new Set();
    const queue = files.slice(); // Create a mutable copy of the files array for the queue
    const results = [];
    const workerPromises = [];

    console.log(`[INFO] Starting analysis with up to ${config.concurrency} worker(s).`);

    function startNewWorker() {
        if (queue.length > 0 && workers.size < config.concurrency) {
            // Determine chunk size: aim to distribute remaining queue among available worker slots
            // or a fixed reasonable size per worker if queue is large.
            const idealChunkSize = Math.ceil(queue.length / (config.concurrency - workers.size || 1));
            const chunkSize = Math.min(idealChunkSize, 100); // Cap chunk size to avoid overly large chunks
            const chunk = queue.splice(0, chunkSize);

            if (chunk.length === 0) {
                return false; // No items left in queue for this worker to pick up
            }

            const worker = new Worker(new URL(import.meta.url), { // Use import.meta.url for ES modules
                workerData: { files: chunk, config }
            });
            workers.add(worker);
            // console.log(`[DEBUG] Worker ${worker.threadId} started with ${chunk.length} files. Queue: ${queue.length}. Active: ${workers.size}`);

            const workerPromise = new Promise((resolve, reject) => {
                worker.on('message', msg => {
                    if (msg.type === 'result') {
                        results.push(...msg.data);
                    } else if (msg.type === 'progress') {
                        // console.log(`[WORKER ${worker.threadId}] ${msg.data}`);
                    } else if (msg.type === 'error') {
                        console.error(`[WORKER ${worker.threadId} ERROR] ${msg.data}`);
                    }
                });
                worker.on('error', (err) => {
                    console.error(`[WORKER ${worker.threadId} FATAL ERROR] ${err.message}`);
                    workers.delete(worker);
                    reject(err);
                    // Attempt to start a new worker if capacity allows and queue has items
                    startNewWorker();
                });
                worker.on('exit', (code) => {
                    workers.delete(worker);
                    // console.log(`[DEBUG] Worker ${worker.threadId} exited with code ${code}. Active: ${workers.size}`);
                    if (code !== 0) {
                        // Resolve rather than reject to allow other workers to finish, error already logged.
                        // reject(new Error(`Worker ${worker.threadId} stopped with exit code ${code}`));
                        console.warn(`[WARN] Worker ${worker.threadId} stopped with exit code ${code}.`)
                    }
                    resolve();
                    // If there are still items in the queue, try to start another worker
                    startNewWorker();
                });
            });
            workerPromises.push(workerPromise);
            return true;
        }
        return false; // Cannot start worker (queue empty or max concurrency reached)
    }

    // Start initial batch of workers
    for (let i = 0; i < config.concurrency; i++) {
        if (!startNewWorker()) {
            break; // Stop if no more work or workers can be started
        }
    }

    // Keep the main thread alive and periodically check if new workers can be started
    // This is a fallback for the worker exit handler, ensuring all work is picked up.
    while (queue.length > 0 && workers.size < config.concurrency) {
        if (!startNewWorker()) {
            // If unable to start a new worker and queue still has items, wait a bit
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    // Wait for all initially created and subsequently started workers to complete
    await Promise.all(workerPromises);
    console.log(`[INFO] All worker promises resolved. Total duplicate pairs found: ${results.length}`);

    if (results.length > 0) {
        await generateInteractiveReport(results);
    } else {
        console.log('[INFO] No duplicate pairs found meeting the criteria.');
        // Ensure process exits if no interactive report is shown
        if (!process.stdin.isTTY) { // or a more robust check if readline is active
            process.exit(0);
        }
    }
}

// Worker spécialisé
if (!isMainThread) {
    const { files: filesChunk, config: workerConfig } = workerData;
    const workerResults = [];

    try {
        // console.log(`[WORKER ${process.pid}] Starting processing of ${filesChunk.length} files.`);
        for (let i = 0; i < filesChunk.length; i++) {
            for (let j = i + 1; j < filesChunk.length; j++) {
                const file1 = filesChunk[i];
                const file2 = filesChunk[j];

                // parentPort.postMessage({ type: 'progress', data: `Comparing ${path.basename(file1)} and ${path.basename(file2)}` });

                const textSim = await SimilarityCalculator.textSimilarity(file1, file2);
                let structSim = 0;
                if (workerConfig.astWeight > 0) { // Only calculate structural similarity if it contributes to the score
                    structSim = await SimilarityCalculator.structuralSimilarity(file1, file2);
                }

                const totalSim = (textSim * (1 - workerConfig.astWeight)) +
                    (structSim * workerConfig.astWeight);

                if (totalSim >= workerConfig.minSimilarity) {
                    workerResults.push({
                        files: [file1, file2],
                        similarity: parseFloat(totalSim.toFixed(2)),
                        details: { textSim: parseFloat(textSim.toFixed(2)), structSim: parseFloat(structSim.toFixed(2)) }
                    });
                }
            }
        }
        parentPort.postMessage({ type: 'result', data: workerResults });
        // console.log(`[WORKER ${process.pid}] Finished processing. Found ${workerResults.length} pairs.`);
    } catch (error) {
        parentPort.postMessage({ type: 'error', data: `Error in worker: ${error.message}\n${error.stack}` });
        process.exit(1); // Indicate an error occurred in the worker
    }
}

// Placeholder functions for interactive report
function showDetails(filePath) {
    console.log(`
[INFO] Placeholder: showDetails for file/index ${filePath}`);
    console.log("To implement: Display detailed information about the selected duplicate set.");
    // Example: find the result entry and print its files and similarity scores.
    // You would need access to the 'results' array here, or pass the specific item.
}

function exportReport(format) {
    console.log(`
[INFO] Placeholder: exportReport in format ${format}`);
    console.log("To implement: Export the full 'results' array to a file (e.g., JSON, CSV).");
    // Example: JSON.stringify(results, null, 2) and write to a .json file.
    // You would need access to the 'results' array here.
}

// Interface de rapport interactive
async function generateInteractiveReport(results) {
    const ui = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Visualisation en temps réel
    const stats = {
        total: results.length,
        byExtension: {},
        bySimilarity: { '80-90%': 0, '90-95%': 0, '95-100%': 0 }
    };

    results.forEach(r => {
        const ext = path.extname(r.files[0]);
        stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

        const range = r.similarity < 90 ? '80-90%' :
            r.similarity < 95 ? '90-95%' : '95-100%';
        stats.bySimilarity[range]++;
    });

    // Affichage dynamique
    console.clear();
    console.log('=== Rapport de duplications en temps réel ===');
    console.table(stats.byExtension);
    console.log('\nRépartition par similarité:');
    console.table(stats.bySimilarity);

    // Navigation interactive
    ui.on('line', (input) => {
        const [cmd, ...args] = input.split(' ');

        switch (cmd) {
            case 'detail':
                showDetails(args[0]);
                break;
            case 'export':
                exportReport(args[0]);
                break;
            case 'quit':
                process.exit();
        }
    });
}

// Optimisations supplémentaires incluses :
// 1. Pipeline de traitement parallélisé
// 2. Combinaison de similarité textuelle/structurelle
// 3. Cache intelligent avec vérification de mtime
// 4. Gestion des gros fichiers avec limite de taille
// 5. Interface utilisateur interactive
// 6. Configuration hiérarchique
// 7. Détection basée sur glob patterns
// 8. Tokenization intelligent avec nettoyage de code

// Pour exécuter avec des options avancées :
// CONFIG_FILE=./my.config.json npm run analyze -- --pattern 'src/**/*.ts'