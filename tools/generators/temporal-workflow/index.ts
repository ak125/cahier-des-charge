import {
    formatFiles,
    generateFiles,
    names,
    offsetFromRoot,
    Tree,
} from '@nx/devkit';
import * as path from 'path';
import { TemporalWorkflowGeneratorSchema } from './schema';

interface NormalizedSchema extends TemporalWorkflowGeneratorSchema {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    fileName: string;
    className: string;
}

function normalizeOptions(
    options: TemporalWorkflowGeneratorSchema
): NormalizedSchema {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory
        ? `${options.directory}/${name}`
        : `src/temporal/workflows/${name}`;

    const projectName = projectDirectory.replace(/\//g, '-');
    const projectRoot = projectDirectory;
    const fileName = name;
    const className = names(options.name).className + 'Workflow';

    return {
        ...options,
        projectName,
        projectRoot,
        projectDirectory,
        fileName,
        className,
    };
}

export default async function (
    tree: Tree,
    options: TemporalWorkflowGeneratorSchema
) {
    const normalizedOptions = normalizeOptions(options);

    // Vérifie si le répertoire existe, si non, le crée
    if (!tree.exists(normalizedOptions.projectDirectory)) {
        tree.mkdir(normalizedOptions.projectDirectory);
    }

    // Génère les fichiers à partir des templates
    generateFiles(
        tree,
        path.join(__dirname, 'files'),
        normalizedOptions.projectDirectory,
        {
            ...normalizedOptions,
            template: ''
        }
    );

    await formatFiles(tree);
}