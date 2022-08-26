import { parseMachinesFromFile } from '@xstate/machine-extractor';
import {
  filterOutIgnoredMachines,
  getInlineImplementations,
  ImplementationsMetadata,
  isCursorInPosition,
  resolveUriToFilePrefix,
} from '@xstate/tools-shared';
import * as path from 'path';
import * as vscode from 'vscode';
import { ColorThemeKind } from 'vscode';
import { MachineConfig } from 'xstate';
import { getBaseUrl } from './constants';
import { EditorWebviewScriptEvent } from './editorWebviewScript';
import { handleDefinitionUpdate } from './handleDefinitionUpdate';
import { handleNodeSelected } from './handleNodeSelected';

export const initiateEditor = (context: vscode.ExtensionContext) => {
  const baseUrl = getBaseUrl();

  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const sendMessage = (event: EditorWebviewScriptEvent) => {
    currentPanel?.webview.postMessage(JSON.stringify(event));
  };

  const startService = async (
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    layoutString: string | undefined,
    implementations: ImplementationsMetadata,
  ) => {
    const settingsTheme =
      vscode.workspace
        .getConfiguration('xstate')
        .get<'auto' | 'dark' | 'light'>('theme') ?? 'auto';
    const themeKind =
      settingsTheme === 'auto'
        ? vscode.window.activeColorTheme.kind === ColorThemeKind.Dark
          ? 'dark'
          : 'light'
        : settingsTheme;
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);

      sendMessage({
        type: 'RECEIVE_SERVICE',
        config,
        index: machineIndex,
        uri: resolveUriToFilePrefix(uri),
        layoutString,
        implementations,
        baseUrl,
        themeKind,
      });
    } else {
      const bundledEditorRootUri = vscode.Uri.file(
        path.join(context.extensionPath, 'bundled-editor'),
      );
      const htmlContent = new TextDecoder().decode(
        await vscode.workspace.fs.readFile(
          vscode.Uri.joinPath(bundledEditorRootUri, 'index.html'),
        ),
      );

      currentPanel = vscode.window.createWebviewPanel(
        'editor',
        'XState Editor',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      );

      const baseTag = `<base href="${currentPanel.webview.asWebviewUri(
        bundledEditorRootUri,
      )}/">`;

      const initialDataScript = `<script>window.__params = ${JSON.stringify({
        themeKind,
        config,
        layoutString,
        implementations,
      })}</script>`;

      currentPanel.webview.html = htmlContent.replace(
        '<head>',
        `<head>${baseTag}${initialDataScript}`,
      );

      sendMessage({
        type: 'RECEIVE_SERVICE',
        config,
        index: machineIndex,
        uri: resolveUriToFilePrefix(uri),
        layoutString,
        implementations,
        baseUrl,
        themeKind,
      });

      currentPanel.webview.onDidReceiveMessage(
        async (event: EditorWebviewScriptEvent) => {
          if (event.type === 'vscode.updateDefinition') {
            await handleDefinitionUpdate(event);
          } else if (event.type === 'vscode.selectNode') {
            await handleNodeSelected(event);
          } else if (event.type === 'vscode.openLink') {
            vscode.env.openExternal(vscode.Uri.parse(event.url));
          }
        },
        undefined,
        context.subscriptions,
      );

      // Handle disposing the current XState Editor
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions,
      );
    }
  };

  let lastSentPathAndText: string | undefined;
  context.subscriptions.push(
    // We use onDidChange over onDidSave to catch changes made to the document outside of VS Code
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      // Only send the text if it isn't dirty, which should be the case after a save
      if (document.isDirty) return;

      const text = document.getText();

      /*
       * If we already sent the text, don't send it again.
       * We need this because onDidChangeTextDocument gets called multiple times on a save.
       * In theory multiple documents could have the same text content, so we prepend the path to the text to make it unique.
       */
      if (document.uri.path + text === lastSentPathAndText) return;

      const parsed = parseMachinesFromFile(text);
      if (parsed.machines.length > 0) {
        lastSentPathAndText = document.uri.path + text;

        parsed.machines.forEach((machine, index) => {
          sendMessage({
            type: 'RECEIVE_CONFIG_UPDATE_FROM_VSCODE',
            config: machine.toConfig({ hashInlineImplementations: true })!,
            index: index,
            uri: resolveUriToFilePrefix(document.uri.path),
            layoutString: machine.getLayoutComment()?.value || '',
            implementations: getInlineImplementations(machine, text),
          });
        });
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'stately-xstate.edit-code-lens',
      async (
        config: MachineConfig<any, any, any>,
        machineIndex: number,
        uri: string,
        layoutString?: string,
      ) => {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const currentText = activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText),
        );

        const machine = result.machines[machineIndex];

        const implementations = getInlineImplementations(machine, currentText);

        startService(
          config,
          machineIndex,
          resolveUriToFilePrefix(activeTextEditor.document.uri.path),
          layoutString,
          implementations,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('stately-xstate.edit', () => {
      try {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const currentSelection = activeTextEditor.selection;
        const currentText = activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText),
        );

        let foundIndex: number | null = null;

        const machine = result.machines.find((machine, index) => {
          if (
            machine?.ast?.definition?.node?.loc ||
            machine?.ast?.options?.node?.loc
          ) {
            const isInPosition =
              isCursorInPosition(
                machine?.ast?.definition?.node?.loc!,
                currentSelection.start,
              ) ||
              isCursorInPosition(
                machine?.ast?.options?.node?.loc!,
                currentSelection.start,
              );

            if (isInPosition) {
              foundIndex = index;
              return true;
            }
          }
          return false;
        });
        if (!machine) {
          vscode.window.showErrorMessage(
            'Could not find a machine at the current cursor.',
          );
          return;
        }

        const implementations = getInlineImplementations(machine, currentText);

        startService(
          machine.toConfig({ hashInlineImplementations: true })!,
          foundIndex!,
          resolveUriToFilePrefix(
            vscode.window.activeTextEditor!.document.uri.path,
          ),
          machine.getLayoutComment()?.value,
          implementations,
        );
      } catch (e) {
        vscode.window.showErrorMessage(
          'Could not find a machine at the current cursor.',
        );
      }
    }),
  );
};
