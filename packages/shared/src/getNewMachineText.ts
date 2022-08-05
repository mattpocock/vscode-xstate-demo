import type { MachineParseResult } from "@xstate/machine-extractor";
import * as prettier from "prettier";
import { MachineConfig } from "xstate";
import { getRawTextFromNode } from "./getRawTextFromNode";
import { ImplementationsMetadata } from "./types";

const prettierStartRegex = /^([^{]){1,}/;
const prettierEndRegex = /([^}]){1,}$/;

/**
 * We use these crazy @UNWRAP_START@ and @UNWRAP_END@ markers to
 * delineate the start and end of the text that we want to unwrap.
 *
 * We then use the regex to unwrap them later
 *
 * This is pretty quick and dirty - it works fairly robustly
 * but I'm open to offers to improve it.
 */
const UNWRAP_START = `@UNWRAP_START@`;
const UNWRAP_END = `@UNWRAP_END@`;
const markAsUnwrap = (str: string) => {
  return `${UNWRAP_START}${str}${UNWRAP_END}`;
};
const UNWRAPPER_REGEX = /"@UNWRAP_START@(.{1,})@UNWRAP_END@"/g;

const STATE_KEYS_TO_PRESERVE = [
  "context",
  "tsTypes",
  "schema",
  "meta",
  "data",
  "delimiter",
  "preserveActionOrder",
  "predictableActionArguments",
] as const;

// those keys shouldn't be part of the `MachineConfig` type
type PublicMachineConfig = Omit<
  MachineConfig<any, any, any>,
  "parent" | "order"
>;

export const getNewMachineText = async ({
  text,
  fileName,
  newConfig,
  machine,
  implementations,
}: {
  text: string;
  newConfig: PublicMachineConfig;
  fileName: string;
  machine: MachineParseResult;
  implementations: ImplementationsMetadata;
}): Promise<string> => {
  const nodesToPreserve: string[] = STATE_KEYS_TO_PRESERVE.map((nodeKey) => {
    const node =
      machine.ast.definition?.[nodeKey]?._valueNode ||
      machine.ast.definition?.[nodeKey]?.node;
    return node
      ? `\n${nodeKey}: ${getRawTextFromNode(text, node!).replace("\n", " ")},`
      : "";
  });

  const config: PublicMachineConfig = {};

  const getKeyStart = (key: keyof typeof config): number => {
    const value = machine.ast.definition?.[key];

    if (value && "node" in value) {
      return value.node.start!;
    }
    return 0;
  };

  (Object.keys(newConfig) as Array<keyof typeof config>)
    .sort((a, b) => {
      return getKeyStart(a) - getKeyStart(b);
    })
    .forEach((key) => {
      config[key] = newConfig[key];
    });

  const json = JSON.stringify(
    config,
    (key, value) => {
      if (
        key === "cond" &&
        implementations?.guards?.[value]?.jsImplementation
      ) {
        return markAsUnwrap(
          implementations?.guards?.[value]?.jsImplementation!
        );
      }
      if (
        key === "src" &&
        implementations?.services?.[value]?.jsImplementation
      ) {
        return markAsUnwrap(
          implementations?.services?.[value]?.jsImplementation!
        );
      }

      if (["actions", "entry", "exit"].includes(key)) {
        if (Array.isArray(value)) {
          return value.map((action) => {
            if (implementations?.actions?.[action]?.jsImplementation) {
              return markAsUnwrap(
                implementations?.actions?.[action]?.jsImplementation!
              );
            }
            return action;
          });
        }
        if (implementations?.actions?.[value]?.jsImplementation) {
          return markAsUnwrap(
            implementations?.actions?.[value]?.jsImplementation!
          );
        }
      }

      return value;
    },
    2
  );

  const prettierConfig = await prettier.resolveConfig(fileName);

  let finalTextToInput = `{${nodesToPreserve.join("")}${json.slice(1)}`.replace(
    UNWRAPPER_REGEX,
    (str) => {
      return (
        str
          // +1 and -1 for the quotes
          .slice(UNWRAP_START.length + 1, -UNWRAP_END.length - 1)
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\t/g, "\t")
      );
    }
  );

  try {
    const result = await prettier.format(`(${finalTextToInput})`, {
      ...prettierConfig,
      parser: "typescript",
    });

    finalTextToInput = result
      .replace(prettierStartRegex, "")
      .replace(prettierEndRegex, "");
  } catch (e) {
    console.log(e);
  }

  return finalTextToInput;
};
