declare module 'glob' {
    export function glob(pattern: string, options?: any): Promise<string[]>;
    export function globSync(pattern: string, options?: any): string[];
    export function Glob(pattern: string, options?: any): any;
}