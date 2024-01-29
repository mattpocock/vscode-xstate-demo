import {
  createConnection,
  createServer,
  createTypeScriptProjectProvider,
} from '@volar/language-server/node.js';
import { XStateProject, createProject } from '@xstate/ts-project';
import type { Program } from 'typescript';
import {
  Provide,
  create as createTypeScriptService,
} from 'volar-service-typescript';
import { getMachineAtIndex } from './protocol';

const projectCache = new WeakMap<Program, XStateProject>();

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  return server.initialize(params, createTypeScriptProjectProvider, {
    watchFileExtensions: [
      'cjs',
      'cts',
      'js',
      'jsx',
      'json',
      'mjs',
      'mts',
      'ts',
      'tsx',
    ],
    getServicePlugins: () => {
      const service = createTypeScriptService(getTsLib());
      return [
        service,
        {
          create: () => {
            return {
              provideCodeLenses: async (textDocument) => {
                const xstateProject = await getXStateProject(textDocument.uri);
                if (!xstateProject) {
                  return [];
                }

                // TODO: a range is returned here regardless of the extraction status (extraction could error)
                // DX has to account for this somehow or results with errors have to be ignored (this would be slower but it might be a good tradeoff)
                return xstateProject
                  .findMachines(server.env.uriToFileName(textDocument.uri))
                  .map((range, index) => ({
                    command: {
                      title: 'Open Visual Editor',
                      command: 'stately-xstate/edit-machine',
                      arguments: [textDocument.uri, index],
                    },
                    range,
                  }));
              },
            };
          },
        },
      ];
    },
    getLanguagePlugins: () => [],
  });
});

connection.onRequest(getMachineAtIndex, async ({ uri, machineIndex }) => {
  const xstateProject = await getXStateProject(uri);

  if (!xstateProject) {
    return;
  }

  // TODO: it would be faster to extract a single machine instead of all of them
  const [digraph] = xstateProject.extractMachines(
    server.env.uriToFileName(uri),
  )[machineIndex];

  return digraph;
});

connection.onInitialized(() => {
  server.initialized();
});

connection.onShutdown(() => {
  server.shutdown();
});

function getTsLib() {
  const ts = server.modules.typescript;
  if (!ts) {
    throw new Error('TypeScript module is missing');
  }
  return ts;
}

async function getTypeScriptModule(uri: string) {
  return (await server.projects.getProject(uri))
    .getLanguageService()
    .context.inject<Provide, 'typescript/typescript'>('typescript/typescript');
}

async function getTypeScriptLanguageService(uri: string) {
  return (await server.projects.getProject(uri))
    .getLanguageService()
    .context.inject<Provide, 'typescript/languageService'>(
      'typescript/languageService',
    );
}

async function getXStateProject(uri: string) {
  const tsProgram = (await getTypeScriptLanguageService(uri)).getProgram();

  if (!tsProgram) {
    return;
  }

  const existing = projectCache.get(tsProgram);
  if (existing) {
    return existing;
  }
  const xstateProject = createProject(
    await getTypeScriptModule(uri),
    tsProgram,
  );
  projectCache.set(tsProgram, xstateProject);
  return xstateProject;
}
