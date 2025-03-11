import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { parseBruFile } from './brunoParser';
import { EventEmitter } from 'events';

// Create an event emitter for responses
export const responseEventEmitter = new EventEmitter();
export const onResponseReceived = (callback: (event: { uri: vscode.Uri, response: { statusCode: number, headers: any, body: string } }) => void) => {
  responseEventEmitter.on('response', callback);
  return { dispose: () => responseEventEmitter.removeListener('response', callback) };
};

/**
 * Class to run API requests from .bru files
 */
export class RequestRunner {
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel?: vscode.OutputChannel) {
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno');
  }

  /**
   * Run a request from a .bru file
   */
  public async runRequest(fileUri: vscode.Uri): Promise<void> {
    try {
      this.outputChannel.appendLine(`Running request from: ${fileUri.fsPath}`);
      this.outputChannel.show(true);

      // Read the file content
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString('utf8');

      // Parse the Bruno file
      const request = parseBruFile(content);
      if (!request) {
        this.outputChannel.appendLine('❌ Failed to parse the Bruno file');
        vscode.window.showErrorMessage('Failed to parse the Bruno file');
        return;
      }

      this.outputChannel.appendLine(`Method: ${request.method}`);
      this.outputChannel.appendLine(`URL: ${request.url}`);

      if (!request.url) {
        this.outputChannel.appendLine('❌ URL is missing in the Bruno file');
        vscode.window.showErrorMessage('URL is missing in the Bruno file');
        return;
      }

      // Parse the URL
      const parsedUrl = new URL(request.url);
      
      // Extract headers from the request
      const headers: Record<string, string> = {};
      
      // Extract headers from the file content
      const headersMatch = content.match(/headers\s*{([^}]*)}/s);
      if (headersMatch && headersMatch[1]) {
        const headerLines = headersMatch[1].trim().split('\n');
        for (const line of headerLines) {
          const headerParts = line.trim().split(':');
          if (headerParts.length >= 2) {
            const key = headerParts[0].trim();
            const value = headerParts.slice(1).join(':').trim();
            headers[key] = value;
          }
        }
      }

      // Create the request options
      const options = {
        method: request.method || 'GET',
        headers: headers,
        timeout: 30000
      };

      // Make the request
      this.outputChannel.appendLine(`🚀 Sending ${options.method} request to ${request.url}...`);
      
      const httpModule = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = httpModule.request(request.url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          this.outputChannel.appendLine(`✅ Response received: ${res.statusCode}`);
          this.outputChannel.appendLine('Headers:');
          this.outputChannel.appendLine(JSON.stringify(res.headers, null, 2));
          this.outputChannel.appendLine('Body:');
          
          // Properly handle JSON responses
          let responseBody = data;
          const contentType = res.headers['content-type'] || '';
          const isJson = contentType.includes('application/json') || contentType.includes('json');
          
          if (isJson) {
            try {
              // Try to parse the JSON to ensure it's valid, but keep the original string for display
              JSON.parse(data);
              // If we get here, it's valid JSON
              this.outputChannel.appendLine(data);
            } catch (e: any) {
              this.outputChannel.appendLine(`Warning: Response claims to be JSON but could not be parsed: ${e.message}`);
              this.outputChannel.appendLine(data);
            }
          } else {
            this.outputChannel.appendLine(data);
          }
          
          // Emit the response event
          responseEventEmitter.emit('response', {
            uri: fileUri,
            response: {
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: data,
              time: {
                // Mock time metrics for now
                total: Math.floor(Math.random() * 1000) + 50,
                dns: Math.floor(Math.random() * 10) + 1,
                tcp: Math.floor(Math.random() * 15) + 5,
                tls: Math.floor(Math.random() * 20) + 10,
                request: Math.floor(Math.random() * 30) + 20,
                firstByte: Math.floor(Math.random() * 40) + 30,
                download: Math.floor(Math.random() * 50) + 40
              }
            }
          });
        });
      });
      
      req.on('error', (error) => {
        this.outputChannel.appendLine(`❌ Error: ${error.message}`);
        vscode.window.showErrorMessage(`Request failed: ${error.message}`);
      });
      
      // Add request body if it exists and method is not GET
      if (options.method !== 'GET') {
        // Extract body from the file content
        const bodyMatch = content.match(/body(?::json|:text|:xml|:graphql)?\s*{([^}]*)}/s);
        if (bodyMatch && bodyMatch[1]) {
          const bodyContent = bodyMatch[1].trim();
          req.write(bodyContent);
        }
      }
      
      req.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`❌ Error: ${errorMessage}`);
      vscode.window.showErrorMessage(`Failed to run request: ${errorMessage}`);
    }
  }
} 