import chalk from 'chalk';
import { existsSync, readFileSync } from './fsstructure-agent';
import { basename, extname, join } from './pathstructure-agent';

interface VerificationResult {
  fileType: string;
  file: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export class ConsistencyVerifier {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async verify(
    mdFiles: string[],
    jsonFiles: string[],
    tsFiles: string[]
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    // Vérifier les correspondances entre fichiers d'audit et leurs ressources associées
    results.push(...this.checkAuditFileCorrespondence(mdFiles, jsonFiles));

    // Vérifier les références croisées entre les fichiers
    results.push(...this.checkCrossReferences(mdFiles, jsonFiles, tsFiles));

    // Vérifier la cohérence des noms de fichiers
    results.push(...this.checkNamingConsistency(mdFiles, jsonFiles, tsFiles));

    return results;
  }

  private checkAuditFileCorrespondence(
    mdFiles: string[],
    jsonFiles: string[]
  ): VerificationResult[] {
    const results: VerificationResult[] = [];

    // Trouver les fichiers .audit.md
    const auditFiles = mdFiles.filter((file) => basename(file).includes('.audit.md'));

    for (const auditFile of auditFiles) {
      const baseName = basename(auditFile, '.audit.md');

      // Vérifier si un fichier .backlog.json existe
      const backlogFile = jsonFiles.find((file) => basename(file) === `${baseName}.backlog.json`);

      if (!backlogFile) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'warning',
          message: `Le fichier ${baseName}.backlog.json n'existe pas pour cet audit`,
          details: ['Créez un fichier backlog correspondant ou vérifiez le nommage'],
        });
      }

      // Vérifier si un fichier .impact_graph.json existe
      const impactGraphFile = jsonFiles.find(
        (file) => basename(file) === `${baseName}.impact_graph.json`
      );

      if (!impactGraphFile) {
        results.push({
          fileType: 'md',
          file: auditFile,
          status: 'warning',
          message: `Le fichier ${baseName}.impact_graph.json n'existe pas pour cet audit`,
          details: ['Créez un fichier impact_graph correspondant ou vérifiez le nommage'],
        });
      }
    }

    // Vérifier si tous les fichiers .backlog.json ont un .audit.md correspondant
    const backlogFiles = jsonFiles.filter((file) => basename(file).includes('.backlog.json'));

    for (const backlogFile of backlogFiles) {
      const baseName = basename(backlogFile, '.backlog.json');

      const auditFile = mdFiles.find((file) => basename(file) === `${baseName}.audit.md`);

      if (!auditFile && this.config.rules.requireAuditMd) {
        results.push({
          fileType: 'json',
          file: backlogFile,
          status: 'error',
          message: `Le fichier ${baseName}.audit.md n'existe pas pour ce backlog`,
          details: ['Créez un fichier audit correspondant ou supprimez ce backlog'],
        });
      }
    }

    return results;
  }

  private checkCrossReferences(
    mdFiles: string[],
    jsonFiles: string[],
    _tsFiles: string[]
  ): VerificationResult[] {
    const results: VerificationResult[] = [];

    // Vérifier les références dans les fichiers MD
    for (const mdFile of mdFiles) {
      const content = readFileSync(mdFile, 'utf-8');

      // Trouver les liens internes
      const linkMatches = content.match(/\[.+?\]\((.+?)\)/g) || [];

      for (const linkMatch of linkMatches) {
        const linkPathMatch = linkMatch.match(/\[.+?\]\((.+?)\)/);
        if (!linkPathMatch) continue;

        const linkPath = linkPathMatch[1];

        // Ignorer les liens externes et les ancres
        if (linkPath.startsWith('http') || linkPath.startsWith('#')) continue;

        // Vérifier si le fichier référencé existe
        const resolvedPath = join(mdFiles[0].substring(0, mdFiles[0].lastIndexOf('/')), linkPath);

        if (!existsSync(resolvedPath)) {
          results.push({
            fileType: 'md',
            file: mdFile,
            status: 'warning',
            message: `Lien cassé: ${linkPath}`,
            details: [`Le fichier référencé n'existe pas: ${resolvedPath}`],
          });
        }
      }
    }

    // Vérifier les références dans discovery_map.json si existant
    const discoveryMapFile = jsonFiles.find((file) => basename(file) === 'discovery_map.json');

    if (discoveryMapFile) {
      try {
        const discoveryMap = JSON.parse(readFileSync(discoveryMapFile, 'utf-8'));

        // Vérifier chaque entrée dans la discovery map
        for (const item of discoveryMap) {
          if (item.path) {
            const pathExists = existsSync(item.path);

            if (!pathExists) {
              results.push({
                fileType: 'json',
                file: discoveryMapFile,
                status: 'warning',
                message: `Chemin invalide dans discovery_map.json: ${item.path}`,
                details: [`L'entrée avec id=${item.id} référence un chemin qui n'existe pas`],
              });
            }
          }
        }
      } catch (error) {
        results.push({
          fileType: 'json',
          file: discoveryMapFile,
          status: 'error',
          message: `Erreur d'analyse de discovery_map.json`,
          details: [`${error.message}`],
        });
      }
    }

    return results;
  }

  private checkNamingConsistency(
    mdFiles: string[],
    _jsonFiles: string[],
    _tsFiles: string[]
  ): VerificationResult[] {
    const results: VerificationResult[] = [];

    // Vérifier la cohérence des préfixes numériques dans les fichiers md
    const numberedMdFiles = mdFiles.filter((file) => /^\d+-.+\.md$/.test(basename(file)));

    // Vérifier si les numéros sont séquentiels
    const fileNumbers = numberedMdFiles
      .map((file) => parseInt(basename(file).split('-')[0], 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < fileNumbers.length; i++) {
      if (fileNumbers[i] !== fileNumbers[i - 1] + 1) {
        results.push({
          fileType: 'md',
          file: 'multiple',
          status: 'warning',
          message: `Numérotation non séquentielle entre les fichiers ${fileNumbers[i - 1]} et ${
            fileNumbers[i]
          }`,
          details: ["Vérifiez l'ordre des fichiers dans le cahier des charges"],
        });
      }
    }

    return results;
  }
}
