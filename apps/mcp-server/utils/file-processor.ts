// appsDoDotmcp-server/utils/file-processor.ts

import fs from 'fs';
import { Transform, Readable, pipeline } from 'stream';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';

const pipelineAsync = promisify(pipeline);
const numCPUs = os.cpus().length;

/**
 * Interface pour les options de traitement de fichier
 */
export interface FileProcessingOptions {
  chunkSize?: number;
  maxWorkers?: number;
  includeExtensions?: string[];
}

/**
 * Fonction qui lit un fichier volumineux sous forme de flux
 * et traite son contenu par morceaux
 */
export async function processLargeFile(
  filePath: string,
  processor: (chunk: string) => Promise<string>,
  options: FileProcessingOptions = {}
): Promise<string> {
  const { chunkSize = 1024 * 1024 } = options; // 1MB par défaut
  let result = '';

  // Créer un flux de lecture
  const readStream = fs.createReadStream(filePath, { 
    encoding: 'utf-8',
    highWaterMark: chunkSize
  });

  // Transformer qui traite chaque morceau
  const transformStream = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      try {
        const processed = await processor(chunk.toString());
        callback(null, processed);
      } catch (error) {
        callback(error);
      }
    }
  });

  // Configurer un collecteur pour assembler le résultat
  const chunks: string[] = [];
  transformStream.on('data', (chunk) => {
    chunks.push(chunk);
  });

  // Traiter le flux
  await pipelineAsync(readStream, transformStream);
  
  // Assembler le résultat final
  result = chunks.join('');
  
  return result;
}

/**
 * Fonction qui traite plusieurs fichiers en parallèle
 */
export async function processFilesInParallel(
  sourceDir: string,
  processor: (file: { name: string; content: string }) => Promise<any>,
  options: FileProcessingOptions = {}
): Promise<any[]> {
  const { maxWorkers = Math.max(1, numCPUs - 1), includeExtensions = ['.php'] } = options;
  
  // Lire les fichiers du répertoire source
  const files = fs.readdirSync(sourceDir)
    .filter(file => includeExtensions.some(ext => file.endsWith(ext)))
    .map(file => path.join(sourceDir, file));
  
  if (files.length === 0) {
    return [];
  }
  
  console.log(`Traitement de ${files.length} fichiers avec ${maxWorkers} workers...`);
  
  // Diviser les fichiers en lots pour chaque worker
  const chunkSize = Math.ceil(files.length / maxWorkers);
  const chunks = Array(Math.ceil(files.length / chunkSize))
    .fill(0)
    .map((_, index) => files.slice(index * chunkSize, (index + 1) * chunkSize));
  
  // Fonction pour traiter un lot de fichiers
  const processChunk = async (fileChunk: string[]): Promise<any[]> => {
    const results = [];
    
    for (const filePath of fileChunk) {
      const fileName = path.basename(filePath);
      let content: string;
      
      // Pour les fichiers volumineux, utiliser le processeur de flux
      const stats = fs.statSync(filePath);
      if (stats.size > 5 * 1024 * 1024) { // > 5MB
        content = await processLargeFile(
          filePath,
          async (chunk) => chunk, // Ici on ne fait que lire, pas de traitement
          { chunkSize: 1024 * 1024 }
        );
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
      }
      
      const result = await processor({ name: fileName, content });
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };
  
  // Traiter les lots en parallèle
  const allResults = await Promise.all(chunks.map(processChunk));
  
  // Aplatir les résultats
  return allResults.flat();
}

/**
 * Version utilisant les worker threads pour un traitement encore plus parallèle
 * (Expérimental - à utiliser pour des workloads très intensifs)
 */
export function processWithWorkerThreads(
  sourceDir: string,
  workerFilePath: string,
  options: FileProcessingOptions = {}
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { maxWorkers = Math.max(1, numCPUs - 1), includeExtensions = ['.php'] } = options;
    
    // Lire les fichiers du répertoire source
    const files = fs.readdirSync(sourceDir)
      .filter(file => includeExtensions.some(ext => file.endsWith(ext)))
      .map(file => path.join(sourceDir, file));
    
    if (files.length === 0) {
      resolve([]);
      return;
    }
    
    console.log(`Traitement de ${files.length} fichiers avec ${maxWorkers} worker threads...`);
    
    // Diviser les fichiers en lots pour chaque worker
    const chunkSize = Math.ceil(files.length / maxWorkers);
    const chunks = Array(Math.ceil(files.length / chunkSize))
      .fill(0)
      .map((_, index) => files.slice(index * chunkSize, (index + 1) * chunkSize));
    
    const results: any[] = [];
    let completedWorkers = 0;
    let hasError = false;
    
    // Créer et démarrer les workers
    chunks.forEach((chunk, index) => {
      const worker = new Worker(workerFilePath, {
        workerData: { files: chunk, index }
      });
      
      worker.on('message', (data) => {
        if (data.results) {
          results.push(...data.results);
        }
      });
      
      worker.on('error', (err) => {
        console.error(`Worker ${index} error:`, err);
        hasError = true;
        reject(err);
      });
      
      worker.on('exit', (code) => {
        completedWorkers++;
        
        if (completedWorkers === chunks.length && !hasError) {
          resolve(results);
        }
      });
    });
  });
}