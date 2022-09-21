import { MachineParseResult } from '@xstate/machine-extractor';
import { createIntrospectableMachine } from './createIntrospectableMachine';
import { introspectMachine } from './introspectMachine';

export interface TypegenData extends ReturnType<typeof getTypegenData> {}

export const getTypegenData = (
  relativePath: string,
  machineIndex: number,
  machineResult: MachineParseResult,
) => {
  const introspectResult = introspectMachine(
    createIntrospectableMachine(machineResult) as any,
  );
  const tsTypes = machineResult.ast.definition?.tsTypes?.node!;

  const providedImplementations = getProvidedImplementations(machineResult);

  const actions = introspectResult.actions.lines.filter(
    (line) => !line.name.startsWith('xstate.'),
  );
  const delays = introspectResult.delays.lines.filter(
    (line) => !line.name.startsWith('xstate.'),
  );
  const guards = introspectResult.guards.lines.filter(
    (line) => !line.name.startsWith('xstate.'),
  );
  const services = introspectResult.services.lines.filter(
    (line) => !line.name.startsWith('xstate.'),
  );

  const allServices =
    machineResult
      .getAllServices(['named'])
      .map((elem) => ({ src: elem.src, id: elem.id })) || [];

  return {
    typesNode: {
      range: [
        {
          line: tsTypes.loc!.start.line,
          column: tsTypes.loc!.start.column,
          index: tsTypes.start!,
        },
        {
          line: tsTypes.loc!.end.line,
          column: tsTypes.loc!.end.column,
          index: tsTypes.end!,
        },
      ] as const,
      value:
        tsTypes.type === 'TSAsExpression' &&
        tsTypes.typeAnnotation.type === 'TSImportType' &&
        tsTypes.typeAnnotation.qualifier?.type === 'Identifier'
          ? {
              argument: tsTypes.typeAnnotation.argument.value,
              qualifier: tsTypes.typeAnnotation.qualifier.name,
            }
          : null,
    },
    // we sort strings here because we use deep comparison to detect a change in the output of this function
    data: {
      tsTypesValue: {
        argument: `./${relativePath}.typegen`,
        qualifier: `Typegen${machineIndex}`,
      },
      internalEvents: collectPotentialInternalEvents(
        [
          introspectResult.actions.lines,
          introspectResult.services.lines,
          introspectResult.guards.lines,
          introspectResult.delays.lines,
        ],
        allServices,
      ),
      serviceSrcToIdMap: Object.fromEntries(
        Array.from(introspectResult.serviceSrcToIdMap)
          .filter(([src]) => allServices.some((service) => service.src === src))
          .sort(([srcA], [srcB]) => (srcA < srcB ? -1 : 1))
          .map(([src, ids]) => [src, Array.from(ids).sort()]),
      ),
      missingImplementations: {
        actions: getMissingImplementationsForType(
          actions,
          providedImplementations.actions,
        ),
        delays: getMissingImplementationsForType(
          delays,
          providedImplementations.delays,
        ),
        guards: getMissingImplementationsForType(
          guards,
          providedImplementations.guards,
        ),
        services: getMissingImplementationsForType(
          services,
          providedImplementations.services,
        ),
      },
      eventsCausingActions: getEventsCausing(actions),
      eventsCausingDelays: getEventsCausing(delays),
      eventsCausingGuards: getEventsCausing(guards),
      eventsCausingServices: getEventsCausing(services),
      // this is an object so it's not worth sorting it here
      stateSchema: introspectResult.stateSchema,
      tags: Array.from(
        new Set(
          machineResult
            ?.getAllStateNodes()
            .flatMap((node) => node.ast.tags?.map((tag) => tag.value) || []) ||
            [],
        ),
      ).sort(),
    },
  };
};

const getProvidedImplementations = (machine: MachineParseResult) => {
  return {
    actions: new Set(
      machine.ast.options?.actions?.properties.map(
        (property) => property.key,
      ) || [],
    ),
    delays: new Set(
      machine.ast.options?.delays?.properties.map((property) => property.key) ||
        [],
    ),
    guards: new Set(
      machine.ast.options?.guards?.properties.map((property) => property.key) ||
        [],
    ),
    services: new Set(
      machine.ast.options?.services?.properties.map(
        (property) => property.key,
      ) || [],
    ),
  };
};

const collectPotentialInternalEvents = (
  lineArrays: { events: string[] }[][],
  services: Array<{ id?: string }>,
) =>
  unique(
    lineArrays
      .flatMap((lines) => lines.flatMap((line) => line.events))
      .filter(
        (event) =>
          event === '' ||
          // TODO: we should source those from the machine config properties like after, invoke, etc
          // OTOH, maybe for the the optimized output we should actually rely on the events that can be given to available implementations
          // in such a case though the `services.flatMap(...)` below would be redundant
          /^(xstate|done\.invoke|error\.platform)\./.test(event),
      )
      .concat(
        'xstate.init',
        services.flatMap((service) =>
          // TODO: is this correct? shouldn't we also generate events for services without an id?
          service.id
            ? [`done.invoke.${service.id}`, `error.platform.${service.id}`]
            : [],
        ),
      ),
  ).sort();

const getMissingImplementationsForType = (
  usedImplementations: Array<{ name: string }>,
  providedImplementations: Set<string>,
) => {
  return usedImplementations
    .map((usedImplementation) => usedImplementation.name)
    .filter(
      (usedImplementation) => !providedImplementations.has(usedImplementation),
    )
    .sort();
};

const getEventsCausing = (lines: { name: string; events: string[] }[]) => {
  return Object.fromEntries(
    lines
      .sort((lineA, lineB) => (lineA.name < lineB.name ? -1 : 1))
      .map((line) => [line.name, unique(line.events).sort()]),
  );
};

const unique = <T>(array: T[]) => Array.from(new Set(array));