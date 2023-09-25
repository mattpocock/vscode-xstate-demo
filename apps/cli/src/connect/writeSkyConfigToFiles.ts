import {
  extractSkyConfigFromFile,
  modifySkyConfigSource,
} from '@xstate/machine-extractor';
import {
  SkyConfig,
  doesSkyConfigExist,
  writeSkyConfig,
} from '@xstate/tools-shared';
import 'dotenv/config';
import * as fs from 'fs/promises';
import { fetch } from 'undici';
import { writeToFiles } from '../typegen/writeToFiles';
import { fetchSkyConfig } from './skyUrlUtils';

export const writeSkyConfigToFiles = async (opts: {
  uri: string;
  apiKey: string | undefined;
  writeToFiles: typeof writeToFiles;
}) => {
  try {
    if (doesSkyConfigExist(opts.uri)) {
      console.log('SkyConfig for machine already exists, skipping');
      return;
    }
    const fileContents = await fs.readFile(opts.uri, 'utf8');
    const parseResult = extractSkyConfigFromFile(fileContents);
    if (!parseResult) return;
    await Promise.all(
      parseResult.skyConfigs.map(async (config) => {
        const skyUrl = config?.url?.value;
        const xstateVersion = config?.xstateVersion?.value ?? '5';
        const runTypeGen = xstateVersion === '4';
        const skyInfo = await fetchSkyConfig(skyUrl);
        const apiKey = config?.apiKey?.value ?? opts.apiKey;
        if (!apiKey) {
          console.error(
            'Error: API key is required to connect to Stately, but none was found. Read more here https://stately.ai/docs/sky.',
          );
          return;
        }
        if (skyInfo) {
          const url = new URL(
            `${skyInfo.origin}/registry/api/sky/actor-config`,
          );
          url.searchParams.set('actorId', skyInfo.actorId);
          url.searchParams.set('addTsTypes', runTypeGen ? 'true' : 'false');
          url.searchParams.set('addSchema', 'true');
          url.searchParams.set('wrapInCreateMachine', 'true');
          url.searchParams.set('xstateVersion', xstateVersion);
          const configResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const responseText = await configResponse.text();
          try {
            const skyConfig = JSON.parse(responseText) as SkyConfig;
            await writeSkyConfig({
              filePath: opts.uri,
              skyConfig,
              createTypeGenFile: runTypeGen ? writeToFiles : undefined,
            });

            await modifySkyConfigSource({ filePath: opts.uri });
          } catch (error) {
            // If we couldn't parse the JSON it's likely an error
            console.error(responseText);
          }
        }
      }),
    );
  } catch (e: any) {
    if (e?.code === 'BABEL_PARSER_SYNTAX_ERROR') {
      console.error(`${opts.uri} - syntax error, skipping`);
    } else {
      console.error(`${opts.uri} - error, `, e);
    }
    throw e;
  }
};
