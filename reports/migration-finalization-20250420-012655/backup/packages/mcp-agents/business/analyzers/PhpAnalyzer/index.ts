import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PhpFile {
  path: string;
  classes: string[];
  functions: string[];
  dependencies: string[];
  linesOfCode: number;
  complexity: number;
}

interface AnalysisResult {
  files: PhpFile[];
  moduleStructure: Record<string, string[]>;
  entityRelationships: Record<string, string[]>;
  totalLinesOfCode: number;
}

class PhpAnalyzer {
  private sourceDir: string;
  private outputDir: string;

  constructor(sourceDir: string, outputDir: string) {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public async analyze(): Promise<AnalysisResult> {
    console.log('Starting PHP codebase analysis...');

    const phpFiles = this.findPhpFiles();
    console.log(`Found ${phpFiles.length} PHP files`);

    const result: AnalysisResult = {
      files: [],
      moduleStructure: {},
      entityRelationships: {},
      totalLinesOfCode: 0,
    };

    for (const file of phpFiles) {
      const fileAnalysis = await this.analyzeFile(file);
      result.files.push(fileAnalysis);
      result.totalLinesOfCode += fileAnalysis.linesOfCode;

      // Group by modules based on directory structure
      const moduleName = this.getModuleName(file);
      if (!result.moduleStructure[moduleName]) {
        result.moduleStructure[moduleName] = [];
      }
      result.moduleStructure[moduleName].push(file);
    }

    // Analyze relationships between entities
    this.analyzeEntityRelationships(result);

    // Write results to output files
    this.writeResults(result);

    return result;
  }

  private findPhpFiles(): string[] {
    try {
      // Use find command for better performance with large codebases
      const output = execSync(`find ${this.sourceDir} -name "*.php" -type f`).toString();
      return output.split('\n').filter(Boolean);
    } catch (error) {
      console.error('Error finding PHP files:', error);
      return [];
    }
  }

  private async analyzeFile(filePath: string): Promise<PhpFile> {
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic analysis
    const classes = this.extractClasses(content);
    const functions = this.extractFunctions(content);
    const dependencies = this.extractDependencies(content);
    const linesOfCode = content.split('\n').length;
    const complexity = this.calculateComplexity(content);

    return {
      path: filePath,
      classes,
      functions,
      dependencies,
      linesOfCode,
      complexity,
    };
  }

  private extractClasses(content: string): string[] {
    const classRegex = /class\s+([a-zA-Z0-9_]+)/g;
    return this.extractMatches(content, classRegex);
  }

  private extractFunctions(content: string): string[] {
    const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
    return this.extractMatches(content, functionRegex);
  }

  private extractDependencies(content: string): string[] {
    const requireRegex = /require(_once)?\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const includeRegex = /include(_once)?\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const useRegex = /use\s+([^;]+);/g;

    const dependencies = [
      ...this.extractMatches(content, requireRegex, 2),
      ...this.extractMatches(content, includeRegex, 2),
      ...this.extractMatches(content, useRegex),
    ];

    return [...new Set(dependencies)]; // Remove duplicates
  }

  private extractMatches(content: string, regex: RegExp, group = 1): string[] {
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[group]) {
        matches.push(match[group]);
      }
    }
    return matches;
  }

  private calculateComplexity(content: string): number {
    // Simple complexity metric based on control structures
    const controlStructures = [
      'if',
      'else',
      'elseif',
      'for',
      'foreach',
      'while',
      'do',
      'switch',
      'case',
      'try',
      'catch',
      'finally',
    ];

    let complexity = 0;
    for (const structure of controlStructures) {
      const regex = new RegExp(`\\b${structure}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private getModuleName(filePath: string): string {
    // Extract module name from file path
    const relativePath = path.relative(this.sourceDir, filePath);
    const parts = relativePath.split(path.sep);

    // Assuming first directory is the module name
    return parts[0] || 'core';
  }

  private analyzeEntityRelationships(result: AnalysisResult): void {
    // Here we would analyze relationships between entities
    // For simplicity, this is a placeholder
    console.log('Analyzing entity relationships...');

    // Find entity classes and their relationships
    for (const file of result.files) {
      for (const className of file.classes) {
        // Check if this looks like an entity class
        if (className.endsWith('Entity') || className.endsWith('Model')) {
          // For now, just create an empty array
          result.entityRelationships[className] = [];
        }
      }
    }
  }

  private writeResults(result: AnalysisResult): void {
    // Write analysis results to JSON files
    fs.writeFileSync(
      path.join(this.outputDir, 'analysis-result.json'),
      JSON.stringify(result, null, 2)
    );

    fs.writeFileSync(
      path.join(this.outputDir, 'modules.json'),
      JSON.stringify(result.moduleStructure, null, 2)
    );

    fs.writeFileSync(
      path.join(this.outputDir, 'entities.json'),
      JSON.stringify(result.entityRelationships, null, 2)
    );

    console.log(`Analysis results written to ${this.outputDir}`);
  }
}

// Example usage
// const analyzer = new PhpAnalyzer('/path/to/php/source', '/path/to/output');
// analyzer.analyze().then(result => {
//   console.log(`Analysis complete. Found ${result.files.length} PHP files.`);
// });

export { PhpAnalyzer, AnalysisResult, PhpFile };

import { BaseAgent } from '@workspaces/cahier-des-charge/src/core/interfaces/BaseAgent';
import {
  AnalyzerAgent,
  BusinessAgent,
} from '@workspaces/cahier-des-charge/src/core/interfaces/business';
