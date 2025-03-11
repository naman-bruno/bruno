/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 3:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 16:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrunoFileDecorationProvider = void 0;
const vscode = __importStar(__webpack_require__(398));
const path = __importStar(__webpack_require__(3));
const brunoParser_1 = __webpack_require__(40);
/**
 * This class provides file decorations for .bru files in VS Code's explorer
 * It adds HTTP method badges (GET, POST, etc.) to Bruno request files
 */
class BrunoFileDecorationProvider {
    constructor(outputChannel) {
        this._onDidChangeFileDecorations = new vscode.EventEmitter();
        this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
        this.fileCache = new Map();
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno');
        this.outputChannel.appendLine('BrunoFileDecorationProvider initialized');
        // Refresh badges when files are saved
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.fileName.endsWith('.bru')) {
                this.outputChannel.appendLine(`File saved: ${document.fileName}`);
                this.updateDecoration(document.uri);
            }
        });
    }
    /**
     * Update decoration for a specific file
     */
    updateDecoration(uri) {
        try {
            // Clear cache for this URI to ensure fresh data
            this.fileCache.delete(uri.fsPath);
            // Trigger decoration update
            this._onDidChangeFileDecorations.fire(uri);
        }
        catch (error) {
            this.outputChannel?.appendLine(`Error updating decoration for ${uri.fsPath}: ${error}`);
        }
    }
    /**
     * Refresh decorations for all known files
     */
    refreshDecorations(uri) {
        if (uri) {
            this.updateDecoration(uri);
        }
        else {
            this._onDidChangeFileDecorations.fire(undefined);
        }
    }
    /**
     * Get decoration for a specific Uri (file)
     */
    provideFileDecoration(uri) {
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
                const cached = this.fileCache.get(uri.fsPath);
                return this.createDecoration(cached.method, cached.color);
            }
            // Parse the .bru file to get the HTTP method
            const brunoRequest = (0, brunoParser_1.parseBruFileFromPath)(uri.fsPath);
            if (!brunoRequest || !brunoRequest.method) {
                return undefined;
            }
            const method = brunoRequest.method.toUpperCase();
            const color = this.getColorForMethod(method);
            // Cache the result
            this.fileCache.set(uri.fsPath, { method, color });
            return this.createDecoration(method, color);
        }
        catch (error) {
            this.outputChannel?.appendLine(`Error providing decoration for ${uri.fsPath}: ${error}`);
            return undefined;
        }
    }
    /**
     * Create a FileDecoration object for the given method
     */
    createDecoration(method, color) {
        // Return both badge and suffix to show the method more prominently
        return {
            badge: method.charAt(0),
            color: color,
            tooltip: `HTTP ${method}`,
            propagate: false
        };
    }
    /**
     * Get color for HTTP method
     */
    getColorForMethod(method) {
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
exports.BrunoFileDecorationProvider = BrunoFileDecorationProvider;


/***/ }),

/***/ 40:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isBrunoCollection = exports.parseBruFileFromPath = exports.parseBruFile = void 0;
const fs = __importStar(__webpack_require__(383));
const path = __importStar(__webpack_require__(3));
/**
 * Parse a Bruno .bru file to extract HTTP method and other metadata
 *
 * @param content The content of the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
function parseBruFile(content) {
    try {
        // Extract HTTP method by looking for HTTP method blocks (get, post, put, etc.)
        const httpMethodRegex = /(get|post|put|delete|patch|options|head|connect|trace)\s*{/i;
        const httpMethodMatch = content.match(httpMethodRegex);
        if (httpMethodMatch && httpMethodMatch[1]) {
            const method = httpMethodMatch[1].toLowerCase();
            // Extract basic metadata
            const result = {
                method
            };
            // Extract URL if present
            const urlRegex = /url:\s*([^\n]+)/i;
            const urlMatch = content.match(urlRegex);
            if (urlMatch && urlMatch[1]) {
                result.url = urlMatch[1].trim();
            }
            // Extract name from meta block if present
            const metaNameRegex = /meta\s*{[^}]*name:\s*([^\n,]+)/i;
            const metaNameMatch = content.match(metaNameRegex);
            if (metaNameMatch && metaNameMatch[1]) {
                result.name = metaNameMatch[1].trim();
            }
            // Extract type from meta block if present
            const metaTypeRegex = /meta\s*{[^}]*type:\s*([^\n,]+)/i;
            const metaTypeMatch = content.match(metaTypeRegex);
            if (metaTypeMatch && metaTypeMatch[1]) {
                result.type = metaTypeMatch[1].trim();
            }
            return result;
        }
        // Check if this is a GraphQL request, which may not have a standard HTTP method block
        const graphqlTypeRegex = /meta\s*{[^}]*type:\s*graphql/i;
        if (content.match(graphqlTypeRegex)) {
            return {
                method: 'post',
                name: extractMetaName(content),
                type: 'graphql'
            };
        }
        return undefined;
    }
    catch (error) {
        console.error('Error parsing .bru file:', error);
        return undefined;
    }
}
exports.parseBruFile = parseBruFile;
/**
 * Extract the name from a meta block
 */
function extractMetaName(content) {
    const metaNameRegex = /meta\s*{[^}]*name:\s*([^\n,]+)/i;
    const metaNameMatch = content.match(metaNameRegex);
    return metaNameMatch && metaNameMatch[1] ? metaNameMatch[1].trim() : 'Unnamed Request';
}
/**
 * Parse a Bruno .bru file from filesystem
 *
 * @param filePath Path to the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
function parseBruFileFromPath(filePath) {
    try {
        if (!fs.existsSync(filePath) || !filePath.endsWith('.bru')) {
            return undefined;
        }
        // Skip folder.bru files which define collection structure, not requests
        if (path.basename(filePath) === 'folder.bru') {
            return undefined;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return parseBruFile(content);
    }
    catch (error) {
        console.error(`Error parsing .bru file at ${filePath}:`, error);
        return undefined;
    }
}
exports.parseBruFileFromPath = parseBruFileFromPath;
/**
 * Check if a directory contains a Bruno collection
 * A Bruno collection contains either a bruno.json file or .bru files
 *
 * @param directoryPath Path to check
 * @returns true if directory is a Bruno collection
 */
function isBrunoCollection(directoryPath) {
    try {
        if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
            return false;
        }
        // Check for bruno.json
        if (fs.existsSync(path.join(directoryPath, 'bruno.json'))) {
            return true;
        }
        // Check for .bru files
        const files = fs.readdirSync(directoryPath);
        return files.some(file => file.endsWith('.bru'));
    }
    catch (error) {
        console.error(`Error checking for Bruno collection at ${directoryPath}:`, error);
        return false;
    }
}
exports.isBrunoCollection = isBrunoCollection;


/***/ }),

/***/ 57:
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ 94:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrunoRequestEditorProvider = void 0;
const vscode = __importStar(__webpack_require__(398));
const brunoParser_1 = __webpack_require__(40);
const requestRunner_1 = __webpack_require__(348);
// Try to import bruno-lang if available
let brunoLang;
try {
    brunoLang = __webpack_require__(458);
}
catch (error) {
    console.warn('Bruno Lang module not available, will use basic parsing');
}
/**
 * Provider for Bruno Request Editor
 */
class BrunoRequestEditorProvider {
    constructor(context, outputChannel) {
        this.context = context;
        this.webviewPanels = new Map();
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno Editor');
        this.outputChannel.appendLine('Bruno Request Editor Provider initialized');
        // Listen for responses from the request runner
        (0, requestRunner_1.onResponseReceived)(({ uri, response }) => {
            this.handleApiResponse(uri, response);
        });
    }
    /**
     * Register the custom editor provider
     */
    static register(context, outputChannel) {
        const provider = new BrunoRequestEditorProvider(context, outputChannel);
        return vscode.window.registerCustomEditorProvider(BrunoRequestEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false
        });
    }
    /**
     * Handle API responses from the request runner
     */
    handleApiResponse(uri, response) {
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
            }
            catch (error) {
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
    getStatusText(statusCode) {
        const statusTexts = {
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
    async resolveCustomTextEditor(document, webviewPanel, _token) {
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
        }
        catch (error) {
            this.outputChannel.appendLine(`Error resolving custom editor: ${error}`);
            vscode.window.showErrorMessage(`Error opening Bruno request: ${error}`);
        }
    }
    /**
     * Update the webview content with the document content
     */
    updateWebview(document, webview) {
        try {
            const content = document.getText();
            const parsedRequest = (0, brunoParser_1.parseBruFile)(content);
            if (!parsedRequest) {
                webview.html = this.getErrorHtml('Invalid Bruno request file');
                return;
            }
            webview.html = this.getHtmlForWebview(webview, parsedRequest, content);
        }
        catch (error) {
            this.outputChannel.appendLine(`Error updating webview: ${error}`);
            webview.html = this.getErrorHtml(`Error parsing the request: ${error}`);
        }
    }
    /**
     * Parse query parameters from content
     */
    parseQueryParams(content) {
        const params = [];
        const paramsQueryMatch = content.match(/params:query\s*{([^}]*)}/s);
        if (paramsQueryMatch && paramsQueryMatch[1]) {
            const paramsContent = paramsQueryMatch[1].trim();
            const paramLines = paramsContent.split('\n');
            for (const line of paramLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine)
                    continue;
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
    parseHeaders(content) {
        const headers = [];
        const headersMatch = content.match(/headers\s*{([^}]*)}/s);
        if (headersMatch && headersMatch[1]) {
            const headersContent = headersMatch[1].trim();
            const headerLines = headersContent.split('\n');
            for (const line of headerLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine)
                    continue;
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
    handleMessage(document, message) {
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
        }
        catch (error) {
            this.outputChannel.appendLine(`Error handling message: ${error}`);
        }
    }
    /**
     * Update the document with changes from the webview
     */
    updateDocument(document, message) {
        // If bruno-lang is available, we could use it here for proper formatting
        // For now, using simple string replacements
        this.outputChannel.appendLine(`Updating document with changes: ${JSON.stringify(message)}`);
        const edit = new vscode.WorkspaceEdit();
        // Apply the edits
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), message.content);
        vscode.workspace.applyEdit(edit).then(success => {
            if (success) {
                this.outputChannel.appendLine('Document updated successfully');
            }
            else {
                this.outputChannel.appendLine('Failed to update document');
                vscode.window.showErrorMessage('Failed to update the Bruno request file');
            }
        });
    }
    /**
     * Update URL in the document
     */
    updateUrlInDocument(document, url) {
        const content = document.getText();
        const urlRegex = /url:\s*([^\n]+)/i;
        const urlMatch = content.match(urlRegex);
        if (urlMatch) {
            const edit = new vscode.WorkspaceEdit();
            const startPos = document.positionAt(urlMatch.index);
            const endPos = document.positionAt(urlMatch.index + urlMatch[0].length);
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
    updateQueryParamsInDocument(document, params) {
        const content = document.getText();
        const paramsQueryMatch = content.match(/params:query\s*{([^}]*)}/s);
        if (paramsQueryMatch) {
            const edit = new vscode.WorkspaceEdit();
            const startPos = document.positionAt(paramsQueryMatch.index + 'params:query {'.length);
            const endPos = document.positionAt(paramsQueryMatch.index + paramsQueryMatch[0].length - 1);
            const paramsText = params.map(p => `${p.enabled ? '' : '//'}${p.name}: ${p.value}`).join('\n  ');
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
    updateHeadersInDocument(document, headers) {
        const content = document.getText();
        const headersMatch = content.match(/headers\s*{([^}]*)}/s);
        if (headersMatch) {
            const edit = new vscode.WorkspaceEdit();
            const startPos = document.positionAt(headersMatch.index + 'headers {'.length);
            const endPos = document.positionAt(headersMatch.index + headersMatch[0].length - 1);
            const headersText = headers.map(h => `${h.enabled ? '' : '//'}${h.name}: ${h.value}`).join('\n  ');
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
    updateBodyInDocument(document, body) {
        const content = document.getText();
        const bodyMatch = content.match(/body(?::json|:text|:xml|:graphql)?\s*{([^}]*)}/s);
        if (bodyMatch) {
            const edit = new vscode.WorkspaceEdit();
            // Extract the body type (json, text, etc.)
            const bodyTypeMatch = bodyMatch[0].match(/body(?::(\w+))?\s*{/);
            const bodyType = bodyTypeMatch && bodyTypeMatch[1] ? `:${bodyTypeMatch[1]}` : '';
            const startPos = document.positionAt(bodyMatch.index + `body${bodyType} {`.length);
            const endPos = document.positionAt(bodyMatch.index + bodyMatch[0].length - 1);
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
    notifyDocumentChanged(uri) {
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
    getHtmlForWebview(webview, request, rawContent) {
        // Get URI for styles for the webview
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'styles.css'));
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
    getErrorHtml(errorMessage) {
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
exports.BrunoRequestEditorProvider = BrunoRequestEditorProvider;
BrunoRequestEditorProvider.viewType = 'bruno.requestEditor';


/***/ }),

/***/ 261:
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ 348:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RequestRunner = exports.onResponseReceived = exports.responseEventEmitter = void 0;
const vscode = __importStar(__webpack_require__(398));
const http = __importStar(__webpack_require__(856));
const https = __importStar(__webpack_require__(57));
const url_1 = __webpack_require__(857);
const brunoParser_1 = __webpack_require__(40);
const events_1 = __webpack_require__(261);
// Create an event emitter for responses
exports.responseEventEmitter = new events_1.EventEmitter();
const onResponseReceived = (callback) => {
    exports.responseEventEmitter.on('response', callback);
    return { dispose: () => exports.responseEventEmitter.removeListener('response', callback) };
};
exports.onResponseReceived = onResponseReceived;
/**
 * Class to run API requests from .bru files
 */
class RequestRunner {
    constructor(outputChannel) {
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('Bruno');
    }
    /**
     * Run a request from a .bru file
     */
    async runRequest(fileUri) {
        try {
            this.outputChannel.appendLine(`Running request from: ${fileUri.fsPath}`);
            this.outputChannel.show(true);
            // Read the file content
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(fileContent).toString('utf8');
            // Parse the Bruno file
            const request = (0, brunoParser_1.parseBruFile)(content);
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
            const parsedUrl = new url_1.URL(request.url);
            // Extract headers from the request
            const headers = {};
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
                        }
                        catch (e) {
                            this.outputChannel.appendLine(`Warning: Response claims to be JSON but could not be parsed: ${e.message}`);
                            this.outputChannel.appendLine(data);
                        }
                    }
                    else {
                        this.outputChannel.appendLine(data);
                    }
                    // Emit the response event
                    exports.responseEventEmitter.emit('response', {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`❌ Error: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to run request: ${errorMessage}`);
        }
    }
}
exports.RequestRunner = RequestRunner;


/***/ }),

/***/ 383:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 398:
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),

/***/ 458:
/***/ ((module) => {

module.exports = require("@usebruno/lang");

/***/ }),

/***/ 690:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// Simple extension.ts that will compile without VS Code types
// We'll use 'any' types for now to make the compilation pass
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(__webpack_require__(398));
const fs = __importStar(__webpack_require__(383));
const path = __importStar(__webpack_require__(3));
const decorationProvider_1 = __webpack_require__(16);
const requestRunner_1 = __webpack_require__(348);
const requestEditorProvider_1 = __webpack_require__(94);
// Output channel for debugging
let outputChannel;
/**
 * This is called when the extension is activated
 */
function activate(context) {
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
    const decorationProvider = new decorationProvider_1.BrunoFileDecorationProvider(outputChannel);
    const requestRunner = new requestRunner_1.RequestRunner(outputChannel);
    // Register the decoration provider to decorate .bru files with HTTP method badges
    const decorationDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
    context.subscriptions.push(decorationDisposable);
    outputChannel.appendLine('File decoration provider registered');
    // Register the custom editor provider
    const editorDisposable = requestEditorProvider_1.BrunoRequestEditorProvider.register(context, outputChannel);
    context.subscriptions.push(editorDisposable);
    outputChannel.appendLine('Custom editor provider registered');
    // Register the command to run a Bruno request
    const runRequestDisposable = vscode.commands.registerCommand('bruno.runRequest', async (uri) => {
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
        }
        catch (error) {
            outputChannel.appendLine(`Error: ${error instanceof Error ? error.message : String(error)}`);
            vscode.window.showErrorMessage(`Failed to run request: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    context.subscriptions.push(runRequestDisposable);
    outputChannel.appendLine('Run request command registered');
    // Register commands to switch between editor modes
    const openInTextEditorDisposable = vscode.commands.registerCommand('bruno.openInTextEditor', async (uri) => {
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
        }
        catch (error) {
            outputChannel.appendLine(`Error opening in text editor: ${error}`);
            vscode.window.showErrorMessage(`Failed to open in text editor: ${error}`);
        }
    });
    context.subscriptions.push(openInTextEditorDisposable);
    outputChannel.appendLine('Open in text editor command registered');
    const openInUIEditorDisposable = vscode.commands.registerCommand('bruno.openInUIEditor', async (uri) => {
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
        }
        catch (error) {
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
exports.activate = activate;
/**
 * Find all .bru files in the workspace and apply decorations
 */
async function findAndDecorateAllBruFiles(decorationProvider) {
    try {
        // Get all .bru files in the workspace
        outputChannel.appendLine('Searching for .bru files in workspace...');
        const files = await vscode.workspace.findFiles('**/*.bru', '**/node_modules/**');
        outputChannel.appendLine(`Found ${files.length} .bru files`);
        // Trigger decoration update for each file
        files.forEach(fileUri => {
            decorationProvider.updateDecoration(fileUri);
        });
    }
    catch (error) {
        outputChannel.appendLine(`Error finding .bru files: ${error}`);
    }
}
function deactivate() {
    outputChannel.appendLine('Bruno VS Code extension deactivated');
}
exports.deactivate = deactivate;


/***/ }),

/***/ 856:
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ 857:
/***/ ((module) => {

module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(690);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map