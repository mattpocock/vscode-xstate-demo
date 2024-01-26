import * as vscode from 'vscode';
import { ActorRef, EventObject, Snapshot, fromCallback } from 'xstate';
import { LanguageClientEvent } from './languageClient';

// this should not be an async function, it should return `webviewPanel` synchronously
// to allow the consumer to start listening to events from the webview immediately
function createWebviewPanel() {
  const viewColumn = vscode.workspace
    .getConfiguration('xstate')
    .get('viewColumn');
  // TODO: this should have more strict CSP rules
  return vscode.window.createWebviewPanel(
    'editor',
    'XState Editor',
    viewColumn === 'active'
      ? vscode.ViewColumn.Active
      : vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );
}

async function getWebviewHtml(
  extensionContext: vscode.ExtensionContext,
  webviewPanel: vscode.WebviewPanel,
) {
  const bundledEditorRootUri = vscode.Uri.joinPath(
    vscode.Uri.file(extensionContext.extensionPath),
    'bundled-editor',
  );
  const htmlContent = new TextDecoder().decode(
    await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(bundledEditorRootUri, 'index.html'),
    ),
  );
  const baseTag = `<base href="${webviewPanel.webview.asWebviewUri(
    bundledEditorRootUri,
  )}/">`;

  // TODO: atm this is not refreshed with the theme changes
  const theme =
    vscode.workspace.getConfiguration('xstate').get('theme') ?? 'dark';

  const initialDataScript = `<script>window.__params = ${JSON.stringify({
    themeKind:
      theme === 'auto'
        ? vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
          ? 'dark'
          : 'light'
        : theme,
    distinctId: `vscode:${vscode.env.machineId}`,
  })}</script>`;

  return htmlContent.replace('<head>', `<head>${baseTag}${initialDataScript}`);
}

export const webviewLogic = fromCallback<
  EventObject,
  {
    extensionContext: vscode.ExtensionContext;
    parent: ActorRef<Snapshot<unknown>, LanguageClientEvent>;
  }
>(({ input: { extensionContext, parent }, receive }) => {
  let canceled = false;
  const webviewPanel = createWebviewPanel();

  receive((event) => {
    // handle events for the webview
  });

  const disposable = vscode.Disposable.from(
    webviewPanel.webview.onDidReceiveMessage((event: LanguageClientEvent) =>
      parent.send(event),
    ),
    webviewPanel.onDidDispose(() => {
      parent.send({ type: 'WEBVIEW_CLOSED' });
    }),
  );

  (async () => {
    const html = await getWebviewHtml(extensionContext, webviewPanel);
    if (canceled) {
      return;
    }
    webviewPanel.webview.html = html;
  })();

  return () => {
    canceled = true;
    disposable.dispose();
  };
});
