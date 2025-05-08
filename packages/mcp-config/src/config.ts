import { join } from 'path';
// Configuration extraite de l'ancien mcp-core
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

export interface ConfigOptions {
  env: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  supabaseUrl: string;
  supabaseKey: string;
  basePath: string;
}

const defaultConfig: ConfigOptions = {
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  basePath: process.env.BASE_PATH || join(process.cwd(), 'data'),
};

let config = { ...defaultConfig };

export function getConfig(): ConfigOptions {
  return config;
}

export function setConfig(newConfig: Partial<ConfigOptions>): void {
  config = { ...config, ...newConfig };
}

export function resetConfig(): void {
  config = { ...defaultConfig };
}
