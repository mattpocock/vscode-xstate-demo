# @xstate/cli

## 0.1.2

### Patch Changes

- [#84](https://github.com/statelyai/xstate-tools/pull/84) [`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug where transition targets would not be parsed correctly if they were declared using a template literal.

- Updated dependencies [[`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed)]:
  - @xstate/machine-extractor@0.6.1
  - @xstate/tools-shared@1.1.1

## 0.1.1

### Patch Changes

- [#79](https://github.com/statelyai/xstate-tools/pull/79) [`db1f2c0`](https://github.com/statelyai/xstate-tools/commit/db1f2c0005ce21adbfce82406754a98a3bcb3680) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an error where `@babel/core` needed to be installed as a peer dependency in order for the CLI to be usable.

## 0.1.0

### Minor Changes

- [#68](https://github.com/statelyai/xstate-tools/pull/68) [`9eadb14`](https://github.com/statelyai/xstate-tools/commit/9eadb143bc16e0a023c89272f5c5cc066f382d3e) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a typegen command which allows for running XState's typegen in CLI.

  `xstate typegen "src/**/*.tsx?"`

  Run the typegen against a glob. This will scan every file targeted, and generate a typegen file accompanying it. It will also import the typegen into your file, as described in [our typegen documentation](https://xstate.js.org/docs/guides/typescript.html#typegen-with-the-vscode-extension).

  > Ensure you wrap your glob in quotes so that it executes correctly. If it isn't wrapped in quotes, it will be interpreted as a list of files, not a glob. This will give unexpected results.

* [#68](https://github.com/statelyai/xstate-tools/pull/68) [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a watch flag to to allow for re-running typegen on file change.

  `xstate typegen "src/**/*.tsx?" --watch`

  Runs the task on a watch, monitoring for changed files and running the typegen script against them.

### Patch Changes

- Updated dependencies [[`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3), [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3), [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818)]:
  - @xstate/machine-extractor@0.6.0
  - @xstate/tools-shared@1.1.0
