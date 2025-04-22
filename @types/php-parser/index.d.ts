declare module 'php-parser' {
  export class Parser {
    constructor(options?: any);
    parse(code: string, filename?: string): any;
  }
  
  export const parse: (code: string, options?: any) => any;
  export const tokenizer: any;
  export const tokens: any;
  
  export interface Location {
    start: {
      line: number;
      column: number;
      offset: number;
    };
    end: {
      line: number;
      column: number;
      offset: number;
    };
  }
  
  // Types de base pour les nœuds AST
  export interface Node {
    kind: string;
    loc?: Location;
  }
  
  // Types spécifiques
  export interface Program extends Node {
    kind: 'program';
    children: Node[];
  }
  
  export interface Namespace extends Node {
    kind: 'namespace';
    name: string;
    children: Node[];
  }
  
  export interface Class extends Node {
    kind: 'class';
    name: string | Identifier;
    extends: Name | null;
    implements: Name[] | null;
    body: ClassStatement[];
  }
  
  export interface Method extends Node {
    kind: 'method';
    name: string | Identifier;
    body: Block;
    arguments: Parameter[];
    type: Node | null;
    visibility: 'public' | 'protected' | 'private';
    static: boolean;
  }
  
  export interface Property extends Node {
    kind: 'property';
    name: string | Identifier;
    value: Node | null;
    visibility: 'public' | 'protected' | 'private';
    static: boolean;
  }
  
  export interface ClassStatement extends Node {
    kind: string;
  }
  
  export interface Block extends Node {
    kind: 'block';
    children: Node[];
  }
  
  export interface Parameter extends Node {
    kind: 'parameter';
    name: string;
    type: Node | null;
    value: Node | null;
    byref: boolean;
    variadic: boolean;
  }
  
  export interface Identifier extends Node {
    kind: 'identifier';
    name: string;
  }
  
  export interface Name extends Node {
    kind: 'name';
    name: string;
    resolution: 'uqn' | 'fqn' | 'rn';
  }
}
