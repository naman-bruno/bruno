import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseBruFile, BrunoRequestFile } from './brunoParser';
import { onResponseReceived } from './requestRunner';

// Try to import bruno-lang if available
let brunoLang: any;
try {
  brunoLang = require('@usebruno/lang');
} catch (error) {
  console.warn('Bruno Lang module not available, will use basic parsing');
}

/**
 * Interface for request params
 */
interface RequestParam {
  name: string;
  value: string;
  enabled?: boolean;
}

/**
 * Provider for Bruno Request Editor
 */
export class BrunoRequestEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'bruno.requestEditor';
  private readonly outputChannel: vscode.OutputChannel;
  private readonly webviewPanels = new Map<string, vscode.WebviewPanel>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    outputChannel?: vscode.OutputChannel
  ) {
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno Editor');
    this.outputChannel.appendLine('Bruno Request Editor Provider initialized');

    // Listen for responses from the request runner
    onResponseReceived(({ uri, response }) => {
      this.handleApiResponse(uri, response);
    });
  }

  /**
   * Register the custom editor provider
   */
  public static register(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel): vscode.Disposable {
    const provider = new BrunoRequestEditorProvider(context, outputChannel);
    return vscode.window.registerCustomEditorProvider(
      BrunoRequestEditorProvider.viewType, 
      provider, 
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }

  /**
   * Handle API responses from the request runner
   */
  private handleApiResponse(uri: vscode.Uri, response: { statusCode: number, headers: any, body: string }): void {
    const uriString = uri.toString();
    const panel = this.webviewPanels.get(uriString);
    
    if (panel) {
      this.outputChannel.appendLine(`Updating webview with response for: ${uri.fsPath}`);
      
      // Format the response body if it's JSON
      let formattedBody = response.body;
      let prettyBody = false;
      let isJson = false;
      
      try {
        if (response.headers['content-type']?.includes('application/json')) {
          isJson = true;
          // Use a more reliable method to parse and format JSON
          const parsedJson = JSON.parse(response.body);
          // Use safe stringification to ensure all braces are preserved
          formattedBody = JSON.stringify(parsedJson, null, 2);
          prettyBody = true;
        }
      } catch (error) {
        this.outputChannel.appendLine(`Error formatting JSON response: ${error}`);
        // If JSON parsing failed but content-type is JSON, still mark as JSON but don't format
        if (response.headers['content-type']?.includes('application/json')) {
          isJson = true;
          // Try to preserve the original content for raw display
          formattedBody = response.body;
        }
      }
      
      // Format headers as a more structured object
      const formattedHeaders = Object.entries(response.headers).map(([key, value]) => {
        return { name: key, value: String(value) };
      });
      
      // Calculate response time (mocked for now)
      const responseTime = Math.floor(Math.random() * 1000) + 50; // Between 50-1050ms
      
      // Create timeline data
      const timelineData = {
        dns: 2,
        tcp: 3,
        tls: 5,
        request: 10,
        firstByte: 15,
        download: responseTime - 35,
        total: responseTime
      };
      
      // Send the response to the webview
      panel.webview.postMessage({
        command: 'responseReceived',
        statusCode: response.statusCode,
        statusText: this.getStatusText(response.statusCode),
        headers: formattedHeaders,
        body: formattedBody,
        prettyBody,
        isJson,
        responseTime,
        timelineData
      });
    }
  }

  /**
   * Get status text for a status code
   */
  private getStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[statusCode] || '';
  }

  /**
   * Called when a document is opened in the custom editor
   */
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      // Store the webview panel for later updates
      this.webviewPanels.set(document.uri.toString(), webviewPanel);
      
      // Configure the webview
      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
        ]
      };

      // Initial load of the content
      this.updateWebview(document, webviewPanel.webview);

      // Setup event handlers
      // When the document changes, update the webview
      const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
          this.updateWebview(document, webviewPanel.webview);
        }
      });

      // When the webview is closed, clean up resources
      webviewPanel.onDidDispose(() => {
        this.webviewPanels.delete(document.uri.toString());
        changeDocumentSubscription.dispose();
      });

      // Handle messages from the webview
      webviewPanel.webview.onDidReceiveMessage(message => {
        this.handleMessage(document, message);
      });
    } catch (error) {
      this.outputChannel.appendLine(`Error resolving custom editor: ${error}`);
      vscode.window.showErrorMessage(`Error opening Bruno request: ${error}`);
    }
  }

  /**
   * Update the webview content with the document content
   */
  private updateWebview(document: vscode.TextDocument, webview: vscode.Webview): void {
    try {
      const content = document.getText();
      const parsedRequest = parseBruFile(content);
      
      if (!parsedRequest) {
        webview.html = this.getErrorHtml('Invalid Bruno request file');
        return;
      }

      webview.html = this.getHtmlForWebview(webview, parsedRequest, content);
    } catch (error) {
      this.outputChannel.appendLine(`Error updating webview: ${error}`);
      webview.html = this.getErrorHtml(`Error parsing the request: ${error}`);
    }
  }

  /**
   * Parse query parameters from content
   */
  private parseQueryParams(content: string): RequestParam[] {
    const params: RequestParam[] = [];
    const paramsQueryMatch = content.match(/params:query\s*{([^}]*)}/s);
    
    if (paramsQueryMatch && paramsQueryMatch[1]) {
      const paramsContent = paramsQueryMatch[1].trim();
      const paramLines = paramsContent.split('\n');
      
      for (const line of paramLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check if parameter is commented out/disabled
        const enabled = !trimmedLine.startsWith('//');
        const paramLine = enabled ? trimmedLine : trimmedLine.substring(2).trim();
        
        // Split by first colon to separate name and value
        const colonIndex = paramLine.indexOf(':');
        if (colonIndex !== -1) {
          const name = paramLine.substring(0, colonIndex).trim();
          const value = paramLine.substring(colonIndex + 1).trim();
          
          params.push({ name, value, enabled });
        }
      }
    }
    
    return params;
  }

  /**
   * Parse headers from content
   */
  private parseHeaders(content: string): RequestParam[] {
    const headers: RequestParam[] = [];
    const headersMatch = content.match(/headers\s*{([^}]*)}/s);
    
    if (headersMatch && headersMatch[1]) {
      const headersContent = headersMatch[1].trim();
      const headerLines = headersContent.split('\n');
      
      for (const line of headerLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check if header is commented out/disabled
        const enabled = !trimmedLine.startsWith('//');
        const headerLine = enabled ? trimmedLine : trimmedLine.substring(2).trim();
        
        // Split by first colon to separate name and value
        const colonIndex = headerLine.indexOf(':');
        if (colonIndex !== -1) {
          const name = headerLine.substring(0, colonIndex).trim();
          const value = headerLine.substring(colonIndex + 1).trim();
          
          headers.push({ name, value, enabled });
        }
      }
    }
    
    return headers;
  }

  /**
   * Handle messages from the webview
   */
  private handleMessage(document: vscode.TextDocument, message: any): void {
    try {
      this.outputChannel.appendLine(`Received message: ${JSON.stringify(message)}`);
      
      switch (message.command) {
        case 'sendRequest':
          // Execute the run request command
          vscode.commands.executeCommand('bruno.runRequest', document.uri);
          break;
          
        case 'updateRequest':
          this.updateDocument(document, message);
          break;
          
        case 'updateUrl':
          this.updateUrlInDocument(document, message.url);
          break;
          
        case 'updateQueryParams':
          this.updateQueryParamsInDocument(document, message.params);
          break;
          
        case 'updateHeaders':
          this.updateHeadersInDocument(document, message.headers);
          break;
          
        case 'updateBody':
          this.updateBodyInDocument(document, message.body);
          break;
          
        case 'saveDocument':
          // Explicitly save the document
          document.save();
          break;
      }
    } catch (error) {
      this.outputChannel.appendLine(`Error handling message: ${error}`);
    }
  }

  /**
   * Update the document with changes from the webview
   */
  private updateDocument(document: vscode.TextDocument, message: any): void {
    // If bruno-lang is available, we could use it here for proper formatting
    // For now, using simple string replacements
    this.outputChannel.appendLine(`Updating document with changes: ${JSON.stringify(message)}`);
    
    const edit = new vscode.WorkspaceEdit();
    
    // Apply the edits
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      message.content
    );
    
    vscode.workspace.applyEdit(edit).then(success => {
      if (success) {
        this.outputChannel.appendLine('Document updated successfully');
      } else {
        this.outputChannel.appendLine('Failed to update document');
        vscode.window.showErrorMessage('Failed to update the Bruno request file');
      }
    });
  }

  /**
   * Update URL in the document
   */
  private updateUrlInDocument(document: vscode.TextDocument, url: string): void {
    const content = document.getText();
    const urlRegex = /url:\s*([^\n]+)/i;
    const urlMatch = content.match(urlRegex);
    
    if (urlMatch) {
      const edit = new vscode.WorkspaceEdit();
      const startPos = document.positionAt(urlMatch.index!);
      const endPos = document.positionAt(urlMatch.index! + urlMatch[0].length);
      
      edit.replace(document.uri, new vscode.Range(startPos, endPos), `url: ${url}`);
      vscode.workspace.applyEdit(edit).then(() => {
        // Notify the webview that the document was updated
        this.notifyDocumentChanged(document.uri);
      });
    }
  }

  /**
   * Update query parameters in the document
   */
  private updateQueryParamsInDocument(document: vscode.TextDocument, params: RequestParam[]): void {
    const content = document.getText();
    const paramsQueryMatch = content.match(/params:query\s*{([^}]*)}/s);
    
    if (paramsQueryMatch) {
      const edit = new vscode.WorkspaceEdit();
      const startPos = document.positionAt(paramsQueryMatch.index! + 'params:query {'.length);
      const endPos = document.positionAt(paramsQueryMatch.index! + paramsQueryMatch[0].length - 1);
      
      const paramsText = params.map(p => 
        `${p.enabled ? '' : '//'}${p.name}: ${p.value}`
      ).join('\n  ');
      
      edit.replace(document.uri, new vscode.Range(startPos, endPos), '\n  ' + paramsText + '\n');
      vscode.workspace.applyEdit(edit).then(() => {
        // Notify the webview that the document was updated
        this.notifyDocumentChanged(document.uri);
      });
    }
  }

  /**
   * Update headers in the document
   */
  private updateHeadersInDocument(document: vscode.TextDocument, headers: RequestParam[]): void {
    const content = document.getText();
    const headersMatch = content.match(/headers\s*{([^}]*)}/s);
    
    if (headersMatch) {
      const edit = new vscode.WorkspaceEdit();
      const startPos = document.positionAt(headersMatch.index! + 'headers {'.length);
      const endPos = document.positionAt(headersMatch.index! + headersMatch[0].length - 1);
      
      const headersText = headers.map(h => 
        `${h.enabled ? '' : '//'}${h.name}: ${h.value}`
      ).join('\n  ');
      
      edit.replace(document.uri, new vscode.Range(startPos, endPos), '\n  ' + headersText + '\n');
      vscode.workspace.applyEdit(edit).then(() => {
        // Notify the webview that the document was updated
        this.notifyDocumentChanged(document.uri);
      });
    }
  }

  /**
   * Update request body in the document
   */
  private updateBodyInDocument(document: vscode.TextDocument, body: string): void {
    const content = document.getText();
    const bodyMatch = content.match(/body(?::json|:text|:xml|:graphql)?\s*{([^}]*)}/s);
    
    if (bodyMatch) {
      const edit = new vscode.WorkspaceEdit();
      
      // Extract the body type (json, text, etc.)
      const bodyTypeMatch = bodyMatch[0].match(/body(?::(\w+))?\s*{/);
      const bodyType = bodyTypeMatch && bodyTypeMatch[1] ? `:${bodyTypeMatch[1]}` : '';
      
      const startPos = document.positionAt(bodyMatch.index! + `body${bodyType} {`.length);
      const endPos = document.positionAt(bodyMatch.index! + bodyMatch[0].length - 1);
      
      edit.replace(document.uri, new vscode.Range(startPos, endPos), '\n  ' + body + '\n');
      vscode.workspace.applyEdit(edit).then(() => {
        // Notify the webview that the document was updated
        this.notifyDocumentChanged(document.uri);
      });
    }
  }

  /**
   * Notify webview that the document has changed
   */
  private notifyDocumentChanged(uri: vscode.Uri): void {
    const uriString = uri.toString();
    const panel = this.webviewPanels.get(uriString);
    
    if (panel) {
      panel.webview.postMessage({
        command: 'documentChanged'
      });
    }
  }

  /**
   * Generate HTML for the webview based on the parsed request
   */
  private getHtmlForWebview(webview: vscode.Webview, request: BrunoRequestFile, rawContent: string): string {
    // Get URI for styles for the webview
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'styles.css')
    );

    const method = request.method?.toUpperCase() || 'GET';
    const url = request.url || '';
    
    // Parse query params and headers
    const queryParams = this.parseQueryParams(rawContent);
    const headers = this.parseHeaders(rawContent);
    
    // Extract body and other components from raw content
    let bodyType = 'text';
    const bodyTypeMatch = rawContent.match(/body:(\w+)\s*{/);
    if (bodyTypeMatch && bodyTypeMatch[1]) {
      bodyType = bodyTypeMatch[1];
    }
    
    const bodyMatch = rawContent.match(/body(?::json|:text|:xml|:graphql)?\s*{([^}]*)}/s);
    const body = bodyMatch ? bodyMatch[1].trim() : '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bruno Request</title>
        <link rel="stylesheet" href="${stylesUri}">
      </head>
      <body>
        <div class="container">
          <div class="url-bar">
            <div class="method ${method}">${method}</div>
            <input type="text" class="url-input" id="url-input" value="${url}">
            <button class="run-button" id="send-request">Send</button>
          </div>
          
          <div class="tabs-container">
            <div class="main-tabs">
              <button class="tab active" data-main-tab="request">Request</button>
              <button class="tab" data-main-tab="response">Response</button>
            </div>
            
            <div class="main-content">
              <div class="request-section active" id="request-section">
                <div class="tabs">
                  <button class="tab active" data-tab="params">Params<span class="tab-superscript">${queryParams.length}</span></button>
                  <button class="tab" data-tab="body">Body<span class="tab-superscript">*</span></button>
                  <button class="tab" data-tab="headers">Headers<span class="tab-superscript">${headers.length}</span></button>
                  <button class="tab" data-tab="auth">Auth</button>
                  <button class="tab" data-tab="vars">Vars</button>
                  <button class="tab" data-tab="script">Script</button>
                  <button class="tab" data-tab="assert">Assert</button>
                  <button class="tab" data-tab="tests">Tests</button>
                  <button class="tab" data-tab="docs">Docs</button>
                  <button class="tab" data-tab="file">File</button>
                </div>
                
                <div id="params" class="tab-content active">
                  <table class="params-table">
                    <thead>
                      <tr>
                        <th width="40%">Name</th>
                        <th width="60%">Value</th>
                      </tr>
                    </thead>
                    <tbody id="params-body">
                      ${queryParams.map((param, idx) => `
                        <tr>
                          <td><input type="text" class="param-name" data-idx="${idx}" value="${param.name}"></td>
                          <td><input type="text" class="param-value" data-idx="${idx}" value="${param.value}"></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <button class="add-row-button" id="add-param">+ Add Param</button>
                </div>
                
                <div id="body" class="tab-content">
                  <textarea class="body-editor" id="body-editor" data-type="${bodyType}">${body}</textarea>
                </div>
                
                <div id="headers" class="tab-content">
                  <table class="headers-table">
                    <thead>
                      <tr>
                        <th width="40%">Name</th>
                        <th width="60%">Value</th>
                      </tr>
                    </thead>
                    <tbody id="headers-body">
                      ${headers.map((header, idx) => `
                        <tr>
                          <td><input type="text" class="header-name" data-idx="${idx}" value="${header.name}"></td>
                          <td><input type="text" class="header-value" data-idx="${idx}" value="${header.value}"></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <button class="add-row-button" id="add-header">+ Add Header</button>
                </div>
                
                <div id="auth" class="tab-content">
                  <div class="empty-state">Authentication settings not implemented in this extension version.</div>
                </div>
                
                <div id="vars" class="tab-content">
                  <div class="empty-state">Variables not implemented in this extension version.</div>
                </div>
                
                <div id="script" class="tab-content">
                  <div class="empty-state">Scripts not implemented in this extension version.</div>
                </div>
                
                <div id="assert" class="tab-content">
                  <div class="empty-state">Assertions not implemented in this extension version.</div>
                </div>
                
                <div id="tests" class="tab-content">
                  <div class="empty-state">Tests not implemented in this extension version.</div>
                </div>
                
                <div id="docs" class="tab-content">
                  <div class="empty-state">Documentation not implemented in this extension version.</div>
                </div>
                
                <div id="file" class="tab-content">
                  <div class="empty-state">File properties not implemented in this extension version.</div>
                </div>
              </div>
              
              <div class="response-section" id="response-section">
                <div class="tabs">
                  <button class="tab active" data-tab="response">Response</button>
                  <button class="tab" data-tab="headers">Headers</button>
                  <button class="tab" data-tab="timeline">Timeline</button>
                  <button class="tab" data-tab="tests">Tests</button>
                </div>
                
                <div id="response-body" class="tab-content active">
                  <div class="empty-state" id="response">
                    Send a request to see the response.
                  </div>
                </div>
                
                <div id="response-headers" class="tab-content">
                  <div class="empty-state">
                    Send a request to see the response headers.
                  </div>
                </div>
                
                <div id="response-timeline" class="tab-content">
                  <div class="empty-state">
                    Send a request to see the timeline.
                  </div>
                </div>
                
                <div id="response-tests" class="tab-content">
                  <div class="empty-state">
                    Tests results not implemented in this extension version.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            let activeMainTab = 'request';
            
            // Store state
            const state = {
              url: "${url}",
              queryParams: ${JSON.stringify(queryParams)},
              headers: ${JSON.stringify(headers)},
              body: ${JSON.stringify(body)},
              bodyType: "${bodyType}"
            };
            
            // Main tab switching
            document.querySelectorAll('[data-main-tab]').forEach(tab => {
              tab.addEventListener('click', () => {
                // Hide all sections
                document.querySelectorAll('.request-section, .response-section').forEach(section => {
                  section.classList.remove('active');
                });
                
                // Deactivate all main tabs
                document.querySelectorAll('[data-main-tab]').forEach(t => {
                  t.classList.remove('active');
                });
                
                // Activate clicked tab
                tab.classList.add('active');
                activeMainTab = tab.getAttribute('data-main-tab');
                
                // Show corresponding section
                document.getElementById(activeMainTab + '-section').classList.add('active');
              });
            });
            
            // Tab switching within sections
            document.querySelectorAll('.tab:not([data-main-tab])').forEach(tab => {
              tab.addEventListener('click', () => {
                // Get the parent tabs container to only affect tabs in the same section
                const tabsContainer = tab.closest('.tabs');
                const section = tabsContainer.parentElement;
                
                // Hide all tab contents in this section
                section.querySelectorAll('.tab-content').forEach(content => {
                  content.classList.remove('active');
                });
                
                // Deactivate all tabs in this section
                tabsContainer.querySelectorAll('.tab').forEach(t => {
                  t.classList.remove('active');
                });
                
                // Activate clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabId = tab.getAttribute('data-tab');
                const tabContent = section.querySelector('#' + tabId) || 
                                   section.querySelector('#' + activeMainTab + '-' + tabId);
                if (tabContent) {
                  tabContent.classList.add('active');
                }
              });
            });
            
            // URL input handling
            const urlInput = document.getElementById('url-input');
            urlInput.addEventListener('change', () => {
              state.url = urlInput.value;
              vscode.postMessage({
                command: 'updateUrl',
                url: urlInput.value
              });
            });
            
            // Body editor handling
            const bodyEditor = document.getElementById('body-editor');
            bodyEditor.addEventListener('change', () => {
              state.body = bodyEditor.value;
              vscode.postMessage({
                command: 'updateBody',
                body: bodyEditor.value
              });
            });
            
            // Query params handling
            function setupParamHandlers() {
              document.querySelectorAll('.param-name, .param-value').forEach(input => {
                input.addEventListener('change', () => {
                  const idx = parseInt(input.getAttribute('data-idx'));
                  const isName = input.classList.contains('param-name');
                  
                  if (isName) {
                    state.queryParams[idx].name = input.value;
                  } else {
                    state.queryParams[idx].value = input.value;
                  }
                  
                  vscode.postMessage({
                    command: 'updateQueryParams',
                    params: state.queryParams
                  });
                });
              });
            }
            
            // Headers handling
            function setupHeaderHandlers() {
              document.querySelectorAll('.header-name, .header-value').forEach(input => {
                input.addEventListener('change', () => {
                  const idx = parseInt(input.getAttribute('data-idx'));
                  const isName = input.classList.contains('header-name');
                  
                  if (isName) {
                    state.headers[idx].name = input.value;
                  } else {
                    state.headers[idx].value = input.value;
                  }
                  
                  vscode.postMessage({
                    command: 'updateHeaders',
                    headers: state.headers
                  });
                });
              });
            }
            
            // Add param button
            document.getElementById('add-param').addEventListener('click', () => {
              const paramsBody = document.getElementById('params-body');
              const newIdx = state.queryParams.length;
              
              state.queryParams.push({ name: '', value: '', enabled: true });
              
              const newRow = document.createElement('tr');
              newRow.innerHTML = \`
                <td><input type="text" class="param-name" data-idx="\${newIdx}" value=""></td>
                <td><input type="text" class="param-value" data-idx="\${newIdx}" value=""></td>
              \`;
              
              paramsBody.appendChild(newRow);
              setupParamHandlers();
            });
            
            // Add header button
            document.getElementById('add-header').addEventListener('click', () => {
              const headersBody = document.getElementById('headers-body');
              const newIdx = state.headers.length;
              
              state.headers.push({ name: '', value: '', enabled: true });
              
              const newRow = document.createElement('tr');
              newRow.innerHTML = \`
                <td><input type="text" class="header-name" data-idx="\${newIdx}" value=""></td>
                <td><input type="text" class="header-value" data-idx="\${newIdx}" value=""></td>
              \`;
              
              headersBody.appendChild(newRow);
              setupHeaderHandlers();
            });
            
            // Initialize handlers
            setupParamHandlers();
            setupHeaderHandlers();
            
            // Send request button
            document.getElementById('send-request').addEventListener('click', () => {
              vscode.postMessage({
                command: 'sendRequest'
              });
              
              // Switch to response tab
              document.querySelector('[data-main-tab="response"]').click();
              document.getElementById('response').innerHTML = '<div class="empty-state">Sending request...</div>';
            });
            
            // Listen for messages from the extension
            window.addEventListener('message', event => {
              const message = event.data;
              
              switch (message.command) {
                case 'responseReceived':
                  // Update the response section
                  const statusColorClass = message.statusCode >= 200 && message.statusCode < 300 
                    ? 'success' 
                    : message.statusCode >= 400 ? 'error' : 'warning';
                  
                  // Handle JSON content more carefully
                  let displayBody = message.body;
                  if (message.isJson) {
                    try {
                      // Ensure we have a proper JSON string representation
                      if (typeof message.body === 'string') {
                        // Try to parse and then re-stringify to ensure proper formatting
                        const parsedJson = JSON.parse(message.body);
                        displayBody = JSON.stringify(parsedJson, null, 2);
                      } else if (typeof message.body === 'object') {
                        displayBody = JSON.stringify(message.body, null, 2);
                      }
                    } catch (e) {
                      console.error('Error formatting JSON response:', e);
                      // Keep original content if parsing fails
                      displayBody = message.body;
                    }
                  }
                  
                  // Update response body tab
                  document.getElementById('response').innerHTML = \`
                    <div class="response-status">
                      <span class="status-badge \${statusColorClass}">\${message.statusCode}</span>
                      <span>\${message.statusText}</span>
                      <span class="response-time">\${message.responseTime}ms</span>
                    </div>
                    <div class="response-content">
                      <pre>\${message.isJson ? formatJsonSyntax(displayBody) : displayBody}</pre>
                    </div>
                  \`;
                  
                  // Update headers tab with a table
                  let headersHtml = '<table class="headers-table"><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>';
                  message.headers.forEach(header => {
                    headersHtml += \`<tr><td>\${header.name}</td><td>\${header.value}</td></tr>\`;
                  });
                  headersHtml += '</tbody></table>';
                  
                  document.getElementById('response-headers').innerHTML = headersHtml;
                  
                  // Update timeline tab with a more structured table
                  const timelineData = message.timelineData;
                  const timelineHtml = \`
                    <table class="timeline-table">
                      <thead>
                        <tr>
                          <th>Phase</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>DNS Lookup</td><td>\${timelineData.dns}ms</td></tr>
                        <tr><td>TCP Handshake</td><td>\${timelineData.tcp}ms</td></tr>
                        <tr><td>TLS Setup</td><td>\${timelineData.tls}ms</td></tr>
                        <tr><td>Request</td><td>\${timelineData.request}ms</td></tr>
                        <tr><td>Time to First Byte</td><td>\${timelineData.firstByte}ms</td></tr>
                        <tr><td>Content Download</td><td>\${timelineData.download}ms</td></tr>
                        <tr><td><strong>Total</strong></td><td><strong>\${timelineData.total}ms</strong></td></tr>
                      </tbody>
                    </table>
                  \`;
                  
                  document.getElementById('response-timeline').innerHTML = timelineHtml;
                  break;
              }
            });

            // Keyboard shortcut handling
            document.addEventListener('keydown', (e) => {
              // Handle Cmd+S or Ctrl+S for saving
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                vscode.postMessage({
                  command: 'saveDocument'
                });
              }
            });

            // Add these utility functions for JSON syntax highlighting

            // Function to safely format JSON with syntax highlighting
            function formatJsonSyntax(json) {
              if (!json) return '';
              
              try {
                // If json is a string but not properly formatted, try to parse and re-stringify it
                if (typeof json !== 'string') {
                  json = JSON.stringify(json, null, 2);
                } else {
                  // Try to parse and re-stringify to ensure proper formatting
                  // But only if it looks like valid JSON
                  if (json.trim().startsWith('{') || json.trim().startsWith('[')) {
                    try {
                      const parsed = JSON.parse(json);
                      json = JSON.stringify(parsed, null, 2);
                    } catch (e) {
                      // If parsing fails, keep the original string
                      console.log('Failed to parse JSON for highlighting:', e);
                    }
                  }
                }
                
                // Escape HTML to prevent XSS
                const escaped = json.replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;');
                
                // Apply syntax highlighting without modifying the structure
                // This regex carefully preserves all braces and structural elements
                return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
                  function (match) {
                    let cls = 'json-number';
                    if (/^"/.test(match)) {
                      if (/:$/.test(match)) {
                        cls = 'json-key';
                      } else {
                        cls = 'json-string';
                      }
                    } else if (/true|false/.test(match)) {
                      cls = 'json-boolean';
                    } else if (/null/.test(match)) {
                      cls = 'json-null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                  }
                );
              } catch (error) {
                console.error('Error in formatJsonSyntax:', error);
                // If anything goes wrong, return the original content safely escaped
                return json.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;');
              }
            }
          }())
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for error display
   */
  private getErrorHtml(errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
          }
          .error {
            color: var(--vscode-errorForeground);
            border: 1px solid var(--vscode-errorForeground);
            padding: 15px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="error">
          <h3>Error Opening Bruno Request</h3>
          <p>${errorMessage}</p>
          <p>Please check if this is a valid Bruno request file.</p>
        </div>
      </body>
      </html>
    `;
  }
} 