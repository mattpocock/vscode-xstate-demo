import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
import { SkyConfig } from './skyTypes';

const getPathToSave = (filePath: string) =>
  filePath.slice(0, -path.extname(filePath).length) + '.sky.ts';

export const doesSkyConfigExist = (filePath: string) => {
  const pathToSave = getPathToSave(filePath);
  return existsSync(pathToSave);
};

function removeLeadingExport(code: string) {
  const regex = /export (const machine = createMachine)/;
  return code.replace(regex, '$1');
}

export const writeSkyConfig = async (opts: {
  filePath: string;
  skyConfig: SkyConfig;
  createTypeGenFile:
    | ((uriArray: string[], { cwd }: { cwd: string }) => Promise<void>)
    | undefined;
}) => {
  const { filePath, skyConfig } = opts;
  const prettierConfig = await prettier.resolveConfig(filePath);
  const pathToSave = getPathToSave(filePath);
  const code = removeLeadingExport(skyConfig.prettyConfigString);

  const machineFile = `// This file was generated by the XState CLI, please do not edit it manually.
${code};

export const skyConfig = { actorId:'${skyConfig.actor.id}', machine };`;

  await fs.writeFile(
    pathToSave,
    prettier.format(machineFile, {
      ...prettierConfig,
      parser: 'typescript',
    }),
  );

  // Run typegen if it's provided
  if (opts.createTypeGenFile)
    await opts.createTypeGenFile([pathToSave], { cwd: __dirname });
};
