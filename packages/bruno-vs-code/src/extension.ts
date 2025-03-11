// Simple extension.ts that will compile without VS Code types
// We'll use 'any' types for now to make the compilation pass

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BrunoFileDecorationProvider } from './decorationProvider';
import { RequestRunner } from './requestRunner';
import { parseBruFileFromPath } from './brunoParser';
import { BrunoRequestEditorProvider } from './requestEditorProvider';

// Output channel for debugging
let outputChannel: vscode.OutputChannel;

/**
 * This is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  // Create our output channel
  outputChannel = vscode.window.createOutputChannel('Bruno Extension');
  outputChannel.show(true);
  outputChannel.appendLine('Bruno VS Code extension is now active');
  
  // Log important info for debugging
  outputChannel.appendLine(`Extension path: ${context.extensionPath}`);
  
  // Ensure our resources directory exists
  const resourcesPath = path.join(context.extensionPath, 'resources');
  outputChannel.appendLine(`Resources path: ${resourcesPath}`);
  outputChannel.appendLine(`Resources exist: ${fs.existsSync(resourcesPath)}`);
  
  // Create instances of our main components
  const decorationProvider = new BrunoFileDecorationProvider(outputChannel);
  const requestRunner = new RequestRunner(outputChannel);

  // Register the decoration provider to decorate .bru files with HTTP method badges
  const decorationDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
  context.subscriptions.push(decorationDisposable);
  outputChannel.appendLine('File decoration provider registered');

  // Register the custom editor provider
  const editorDisposable = BrunoRequestEditorProvider.register(context, outputChannel);
  context.subscriptions.push(editorDisposable);
  outputChannel.appendLine('Custom editor provider registered');

  // Register the command to run a Bruno request
  const runRequestDisposable = vscode.commands.registerCommand('bruno.runRequest', async (uri?: vscode.Uri) => {
    try {
      outputChannel.appendLine(`Run request command triggered for: ${uri?.fsPath || 'active editor'}`);
      
      // If URI is not provided, get the active editor's document
      if (!uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document.fileName.endsWith('.bru')) {
          vscode.window.showErrorMessage('No .bru file is currently active');
          outputChannel.appendLine('No .bru file is active');
          return;
        }
        uri = activeEditor.document.uri;
      }
      
      const fileName = path.basename(uri.fsPath);
      if (fileName === 'folder.bru' || fileName === 'collection.bru') {
        vscode.window.showErrorMessage('Cannot run folder.bru or collection.bru files as they are not API requests');
        outputChannel.appendLine('Attempted to run folder.bru or collection.bru file');
        return;
      }
      
      await requestRunner.runRequest(uri);
    } catch (error) {
      outputChannel.appendLine(`Error: ${error instanceof Error ? error.message : String(error)}`);
      vscode.window.showErrorMessage(`Failed to run request: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  context.subscriptions.push(runRequestDisposable);
  outputChannel.appendLine('Run request command registered');

  // Register commands to switch between editor modes
  const openInTextEditorDisposable = vscode.commands.registerCommand('bruno.openInTextEditor', async (uri?: vscode.Uri) => {
    try {
      // If URI is not provided, get the active editor's document
      if (!uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document.fileName.endsWith('.bru')) {
          vscode.window.showErrorMessage('No .bru file is currently active');
          return;
        }
        uri = activeEditor.document.uri;
      }

      // Close any custom editor instances of this document
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

      // Open in text editor
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
      outputChannel.appendLine(`Opened ${uri.fsPath} in text editor`);
    } catch (error) {
      outputChannel.appendLine(`Error opening in text editor: ${error}`);
      vscode.window.showErrorMessage(`Failed to open in text editor: ${error}`);
    }
  });
  context.subscriptions.push(openInTextEditorDisposable);
  outputChannel.appendLine('Open in text editor command registered');

  const openInUIEditorDisposable = vscode.commands.registerCommand('bruno.openInUIEditor', async (uri?: vscode.Uri) => {
    try {
      // If URI is not provided, get the active editor's document
      if (!uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document.fileName.endsWith('.bru')) {
          vscode.window.showErrorMessage('No .bru file is currently active');
          return;
        }
        uri = activeEditor.document.uri;
      }

      // Check if this is a folder.bru or collection.bru file
      const fileName = path.basename(uri.fsPath);
      if (fileName === 'folder.bru' || fileName === 'collection.bru') {
        vscode.window.showErrorMessage('Cannot open folder.bru or collection.bru files in UI editor');
        return;
      }

      // Close any text editor instances of this document
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

      // Open in custom editor
      await vscode.commands.executeCommand('vscode.openWith', uri, 'bruno.requestEditor');
      outputChannel.appendLine(`Opened ${uri.fsPath} in UI editor`);
    } catch (error) {
      outputChannel.appendLine(`Error opening in UI editor: ${error}`);
      vscode.window.showErrorMessage(`Failed to open in UI editor: ${error}`);
    }
  });
  context.subscriptions.push(openInUIEditorDisposable);
  outputChannel.appendLine('Open in UI editor command registered');

  // Listen for configuration changes
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('bruno.editor.defaultMode')) {
      outputChannel.appendLine('Bruno editor mode preference changed');
    }
  });

  // Set up file system watcher to automatically apply decorations
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.bru');
  fileSystemWatcher.onDidCreate((uri) => {
    outputChannel.appendLine(`File created: ${uri.fsPath}`);
    decorationProvider.updateDecoration(uri);
  });
  fileSystemWatcher.onDidChange((uri) => {
    outputChannel.appendLine(`File changed: ${uri.fsPath}`);
    decorationProvider.updateDecoration(uri);
  });
  fileSystemWatcher.onDidDelete((uri) => {
    outputChannel.appendLine(`File deleted: ${uri.fsPath}`);
    decorationProvider.updateDecoration(uri);
  });
  context.subscriptions.push(fileSystemWatcher);
  outputChannel.appendLine('File system watcher registered');

  // Find all .bru files in workspace and apply decorations on startup
  findAndDecorateAllBruFiles(decorationProvider);

  // Force immediate decoration of visible files
  if (vscode.window.activeTextEditor?.document.fileName.endsWith('.bru')) {
    decorationProvider.updateDecoration(vscode.window.activeTextEditor.document.uri);
    outputChannel.appendLine(`Applied decoration to active editor: ${vscode.window.activeTextEditor.document.uri.fsPath}`);
  }

  outputChannel.appendLine('Extension activation complete');
  return {
    decorationProvider,
    requestRunner
  };
}

/**
 * Find all .bru files in the workspace and apply decorations
 */
async function findAndDecorateAllBruFiles(decorationProvider: BrunoFileDecorationProvider) {
  try {
    // Get all .bru files in the workspace
    outputChannel.appendLine('Searching for .bru files in workspace...');
    const files = await vscode.workspace.findFiles('**/*.bru', '**/node_modules/**');
    outputChannel.appendLine(`Found ${files.length} .bru files`);
    
    // Trigger decoration update for each file
    files.forEach(fileUri => {
      decorationProvider.updateDecoration(fileUri);
    });
  } catch (error) {
    outputChannel.appendLine(`Error finding .bru files: ${error}`);
  }
}

export function deactivate() {
  outputChannel.appendLine('Bruno VS Code extension deactivated');
} 