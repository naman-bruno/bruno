import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseBruFile, parseBruFileFromPath } from './brunoParser';

/**
 * This class provides file decorations for .bru files in VS Code's explorer
 * It adds HTTP method badges (GET, POST, etc.) to Bruno request files
 */
export class BrunoFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
  private fileCache = new Map<string, { method: string, color: vscode.ThemeColor }>();
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel?: vscode.OutputChannel) {
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno');
    this.outputChannel.appendLine('BrunoFileDecorationProvider initialized');
    
    // Refresh badges when files are saved
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      if (document.fileName.endsWith('.bru')) {
        this.outputChannel.appendLine(`File saved: ${document.fileName}`);
        this.updateDecoration(document.uri);
      }
    });
  }

  /**
   * Update decoration for a specific file
   */
  updateDecoration(uri: vscode.Uri): void {
    try {
      // Clear cache for this URI to ensure fresh data
      this.fileCache.delete(uri.fsPath);
      
      // Trigger decoration update
      this._onDidChangeFileDecorations.fire(uri);
    } catch (error) {
      this.outputChannel?.appendLine(`Error updating decoration for ${uri.fsPath}: ${error}`);
    }
  }

  /**
   * Refresh decorations for all known files
   */
  refreshDecorations(uri?: vscode.Uri): void {
    if (uri) {
      this.updateDecoration(uri);
    } else {
      this._onDidChangeFileDecorations.fire(undefined);
    }
  }

  /**
   * Get decoration for a specific Uri (file)
   */
  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    try {
      if (!uri.fsPath.endsWith('.bru')) {
        return undefined;
      }

      const fileName = path.basename(uri.fsPath);
      
      // Skip decoration for collection.bru and folder.bru files
      if (fileName === 'collection.bru' || fileName === 'folder.bru') {
        return undefined;
      }

      // Check cache first
      if (this.fileCache.has(uri.fsPath)) {
        const cached = this.fileCache.get(uri.fsPath)!;
        return this.createDecoration(cached.method, cached.color);
      }

      // Parse the .bru file to get the HTTP method
      const brunoRequest = parseBruFileFromPath(uri.fsPath);
      
      if (!brunoRequest || !brunoRequest.method) {
        return undefined;
      }

      const method = brunoRequest.method.toUpperCase();
      const color = this.getColorForMethod(method);
      
      // Cache the result
      this.fileCache.set(uri.fsPath, { method, color });
      
      return this.createDecoration(method, color);
    } catch (error) {
      this.outputChannel?.appendLine(`Error providing decoration for ${uri.fsPath}: ${error}`);
      return undefined;
    }
  }

  /**
   * Create a FileDecoration object for the given method
   */
  private createDecoration(method: string, color: vscode.ThemeColor): vscode.FileDecoration {
    // Return both badge and suffix to show the method more prominently
    return {
      badge: method.charAt(0), // First letter of the method (G, P, etc.)
      color: color,
      tooltip: `HTTP ${method}`,
      propagate: false
    };
  }

  /**
   * Get color for HTTP method
   */
  private getColorForMethod(method: string): vscode.ThemeColor {
    switch (method.toUpperCase()) {
      case 'GET':
        return new vscode.ThemeColor('charts.blue');
      case 'POST':
        return new vscode.ThemeColor('charts.green');
      case 'PUT':
        return new vscode.ThemeColor('charts.orange');
      case 'DELETE':
        return new vscode.ThemeColor('charts.red');
      case 'PATCH':
        return new vscode.ThemeColor('charts.purple');
      case 'HEAD':
        return new vscode.ThemeColor('charts.violet');
      case 'OPTIONS':
        return new vscode.ThemeColor('charts.cyan');
      default:
        return new vscode.ThemeColor('charts.gray');
    }
  }
} 