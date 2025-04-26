import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { MigrationAgentGeneratorSchema } from './schema';

interface NormalizedSchema extends MigrationAgentGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: MigrationAgentGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

export default async function (
  tree: Tree,
  options: MigrationAgentGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const { projectRoot } = normalizedOptions;
  
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    {
      ...normalizedOptions,
      ...names(normalizedOptions.name),
      offsetFromRoot: offsetFromRoot(projectRoot),
      template: ''
    }
  );

  await formatFiles(tree);
}